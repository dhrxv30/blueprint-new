import crypto from "node:crypto";
import { Router } from "express";
import { processGithubPush } from "../core/syncEngine.js";
import { resolveProjectIdFromWebhookPayload } from "../services/githubService.js";
import { logIntegration } from "../services/integrationLogger.js";

const githubWebhookRouter = Router();

function verifyGitHubSignature(rawBody: string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const signature = signatureHeader.slice(7);
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

githubWebhookRouter.post("/github", async (req, res) => {
  try {
    const event = req.header("x-github-event");
    const fallbackProjectId = typeof req.query.projectId === "string" ? req.query.projectId : "";

    logIntegration("webhook_received", { event });

    if (event === "ping") {
      return res.json({ success: true, message: "GitHub webhook ping received." });
    }

    if (event !== "push") {
      logIntegration("webhook_ignored", { event });
      return res.json({ success: true, ignored: true, event });
    }

    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "GITHUB_WEBHOOK_SECRET is not configured." });
    }

    const signature = req.header("x-hub-signature-256") || undefined;
    if (!signature) {
      return res.status(401).json({ error: "Missing webhook signature." });
    }

    const rawBody = (req as any).rawBody?.toString("utf8") || JSON.stringify(req.body || {});

    const valid = verifyGitHubSignature(rawBody, signature, secret);
    if (!valid) {
      return res.status(401).json({ error: "Invalid webhook signature." });
    }

    const mappedProjectId = await resolveProjectIdFromWebhookPayload(req.body || {});
    const projectId = mappedProjectId || fallbackProjectId;

    if (!projectId) {
      return res.status(400).json({ error: "No project mapping found for webhook repository payload." });
    }

    const repositoryFullName = req.body?.repository?.full_name || "";
    const commits = Array.isArray(req.body?.commits) ? req.body.commits : [];
    const filesChanged = Array.from(
      new Set(
        commits.flatMap((c: any) => [
          ...(Array.isArray(c?.added) ? c.added : []),
          ...(Array.isArray(c?.modified) ? c.modified : []),
          ...(Array.isArray(c?.removed) ? c.removed : []),
        ])
      )
    ) as string[];

    const syncResult = await processGithubPush({
      projectId,
      repo: repositoryFullName,
      filesChanged,
      commitSha: req.body?.after,
      author: req.body?.pusher?.name,
      branch: typeof req.body?.ref === "string" ? req.body.ref.replace("refs/heads/", "") : undefined,
    });

    logIntegration("webhook_push_processed", {
      projectId,
      repo: repositoryFullName,
      filesChangedCount: filesChanged.length,
      commitSha: req.body?.after,
      author: req.body?.pusher?.name,
    });

    return res.json({ success: true, syncResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logIntegration("webhook_error", { message }, "error");
    return res.status(500).json({ error: message });
  }
});

export default githubWebhookRouter;
