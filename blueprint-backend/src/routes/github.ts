import { Router } from "express";
import {
  buildGitHubOAuthStartUrl,
  completeGitHubOAuth,
  getGitHubConnection,
  listReposForProfile,
} from "../services/githubOAuthService.js";
import {
  createRepositoryForProfile,
  getProjectRepoMapping,
  githubIntegrationHealthCheck,
  linkProjectRepository,
  pushCodeToGitHub,
  pushProjectMappedRepo,
  registerWebhookForProject,
} from "../services/githubService.js";
import { logIntegration } from "../services/integrationLogger.js";

const githubRouter = Router();

githubRouter.get("/oauth/start", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const projectId = String(req.query.projectId || "");
    
    console.log("[GitHub OAuth] /oauth/start hit", { profileId, projectId });
    
    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const state = JSON.stringify({ profileId, projectId });

    logIntegration("oauth_start", { profileId, projectId });
    const url = buildGitHubOAuthStartUrl(state);
    console.log("[GitHub OAuth] Redirecting to:", url);
    return res.json({ url });
  } catch (error) {
    console.error("[GitHub OAuth] /oauth/start error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.get("/oauth/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    console.log("[GitHub OAuth] CALLBACK HIT", { code: code ? code.slice(0, 8) + "..." : "(empty)", state });

    if (!code || !state) {
      console.error("[GitHub OAuth] Missing code or state in callback");
      return res.status(400).json({ error: "Missing code or state in callback." });
    }

    // Parse state safely — it may be JSON or a plain profileId
    let profileId: string;
    let projectId: string | undefined;
    try {
      const parsed = JSON.parse(state);
      profileId = parsed.profileId;
      projectId = parsed.projectId;
    } catch {
      console.warn("[GitHub OAuth] Could not parse state as JSON, using as raw profileId");
      profileId = state;
    }

    console.log("[GitHub OAuth] Parsed state", { profileId, projectId });

    if (!profileId) {
      console.error("[GitHub OAuth] profileId is empty after parsing state");
      return res.status(400).json({ error: "profileId missing from OAuth state." });
    }

    const result = await completeGitHubOAuth(code, profileId);

    console.log("[GitHub OAuth] OAuth completed successfully", { profileId: result.profileId, username: result.username });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const redirect = new URL("/dashboard/automation", frontendUrl);
    redirect.searchParams.set("github", "connected");
    redirect.searchParams.set("profileId", result.profileId);
    if (projectId) {
      redirect.searchParams.set("projectId", projectId);
    }

    logIntegration("oauth_callback_success", {
      profileId: result.profileId,
      projectId,
      username: result.username,
    });

    console.log("[GitHub OAuth] Redirecting to frontend:", redirect.toString());
    return res.redirect(redirect.toString());
  } catch (error) {
    console.error("[GitHub OAuth] CALLBACK ERROR:", error);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const redirect = new URL("/dashboard/automation", frontendUrl);
    redirect.searchParams.set("github", "error");
    redirect.searchParams.set("message", error instanceof Error ? error.message : "Unknown error");
    logIntegration("oauth_callback_error", {
      message: error instanceof Error ? error.message : "Unknown error",
    }, "error");

    return res.redirect(redirect.toString());
  }
});

githubRouter.get("/health", async (_req, res) => {
  try {
    const health = await githubIntegrationHealthCheck();
    return res.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.get("/connection", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const connection = await getGitHubConnection(profileId);
    return res.json({ connected: Boolean(connection), connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.get("/repos", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const repos = await listReposForProfile(profileId);
    return res.json({ repos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.post("/repos/create", async (req, res) => {
  try {
    const profileId = String(req.body?.profileId || "");
    const name = String(req.body?.name || "");
    const description = typeof req.body?.description === "string" ? req.body.description : undefined;
    const isPrivate = typeof req.body?.isPrivate === "boolean" ? req.body.isPrivate : undefined;

    if (!profileId || !name) {
      return res.status(400).json({ error: "profileId and name are required." });
    }

    const repo = await createRepositoryForProfile({
      profileId,
      name,
      description,
      isPrivate,
    });

    return res.json({ success: true, repo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.post("/projects/:projectId/link-repo", async (req, res) => {
  try {
    const projectId = String(req.params.projectId || "");
    const profileId = String(req.body?.profileId || "");
    const owner = String(req.body?.owner || "");
    const repo = String(req.body?.repo || "");

    const allowRelink = Boolean(req.body?.allowRelink);

    if (!projectId || !profileId || !owner || !repo) {
      return res.status(400).json({ error: "projectId, profileId, owner, and repo are required." });
    }

    const mapping = await linkProjectRepository({
      projectId,
      profileId,
      owner,
      repo,
      allowRelink,
    });

    logIntegration("repo_link_route", {
      projectId,
      profileId,
      fullName: `${owner}/${repo}`,
      allowRelink,
      webhookId: mapping.webhookId,
    });

    return res.json({ success: true, mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.post("/projects/:projectId/webhook/register", async (req, res) => {
  try {
    const projectId = String(req.params.projectId || "");
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required." });
    }

    const result = await registerWebhookForProject(projectId);
    return res.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.get("/projects/:projectId/link-repo", async (req, res) => {
  try {
    const projectId = String(req.params.projectId || "");
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required." });
    }

    const mapping = await getProjectRepoMapping(projectId);
    return res.json({ mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.post("/push", async (req, res) => {
  try {
    const { owner, repo, files, branch, commitMessage, projectId, profileId, createWebhook } = req.body || {};

    const result = await pushCodeToGitHub({
      owner,
      repo,
      files,
      branch,
      commitMessage,
      projectId,
      profileId,
      createWebhook,
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

githubRouter.post("/projects/:projectId/push", async (req, res) => {
  try {
    const projectId = String(req.params.projectId || "");
    const files = req.body?.files;
    const branch = req.body?.branch;
    const commitMessage = req.body?.commitMessage;

    if (!projectId || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "projectId and files[] are required." });
    }

    const result = await pushProjectMappedRepo({
      projectId,
      files,
      branch,
      commitMessage,
    });

    logIntegration("project_push_route", {
      projectId,
      pushedFiles: files.length,
      commitSha: result.commitSha,
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default githubRouter;
