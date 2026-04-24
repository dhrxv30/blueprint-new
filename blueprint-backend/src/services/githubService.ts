import axios, { AxiosError } from "axios";
import { PrismaClient } from "@prisma/client";
import { getGitHubAccessTokenForProfile } from "./githubOAuthService.js";
import { decryptToken, encryptToken } from "./cryptoService.js";
import { logIntegration } from "./integrationLogger.js";

const prisma = new PrismaClient();

const githubClient = axios.create({
  baseURL: "https://api.github.com",
  timeout: 30000,
  headers: {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

type FileToPush = {
  path: string;
  content: string;
};

export type PushToGitHubInput = {
  owner: string;
  repo: string;
  profileId?: string;
  projectId?: string;
  files: FileToPush[];
  branch?: string;
  commitMessage?: string;
  createWebhook?: boolean;
};

type WebhookRegistrationResult = {
  created: boolean;
  webhookId?: number;
};

function getWebhookBaseUrl(): string {
  const baseUrl = process.env.WEBHOOK_BASE_URL;
  if (!baseUrl) {
    throw new Error("WEBHOOK_BASE_URL is missing. Set it in backend .env.");
  }
  return baseUrl;
}

function axiosMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return `${error.response?.status || 500}: ${JSON.stringify(error.response?.data || error.message)}`;
  }
  return error instanceof Error ? error.message : "Unknown error";
}

async function getTokenForInput(input: PushToGitHubInput): Promise<string> {
  if (!input.profileId) {
    throw new Error("profileId is required. User must connect GitHub via OAuth.");
  }

  return getGitHubAccessTokenForProfile(input.profileId);
}

async function getExistingFileSha(owner: string, repo: string, path: string, branch: string, token: string): Promise<string | undefined> {
  try {
    const res = await githubClient.get(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      params: { ref: branch },
      headers: { Authorization: `Bearer ${token}` },
    });

    return typeof res.data?.sha === "string" ? res.data.sha : undefined;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return undefined;
    }
    throw new Error(`Could not check existing file SHA for ${path}. ${axiosMessage(error)}`);
  }
}

export async function pushCodeToGitHub(input: PushToGitHubInput) {
  const token = await getTokenForInput(input);
  const branch = input.branch || "main";
  const commitMessage = input.commitMessage || "chore: sync generated code";

  if (!input.owner || !input.repo) {
    throw new Error("owner and repo are required.");
  }

  if (!Array.isArray(input.files) || input.files.length === 0) {
    throw new Error("files[] is required and cannot be empty.");
  }

  try {
    let lastCommitSha: string | undefined;

    for (const file of input.files) {
      if (!file.path || typeof file.content !== "string") {
        throw new Error("Each file must include path and content.");
      }

      const sha = await getExistingFileSha(input.owner, input.repo, file.path, branch, token);

      const putRes = await githubClient.put(
        `/repos/${input.owner}/${input.repo}/contents/${encodeURIComponent(file.path)}`,
        {
          message: commitMessage,
          content: Buffer.from(file.content, "utf8").toString("base64"),
          branch,
          sha,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (typeof putRes.data?.commit?.sha === "string") {
        lastCommitSha = putRes.data.commit.sha;
      }
    }

    let webhookCreated = false;
    let webhookId: number | undefined;
    if (input.createWebhook) {
      const hook = await ensureGitHubPushWebhook(input.owner, input.repo, token);
      webhookCreated = hook.created;
      webhookId = hook.webhookId;
    }

    if (input.projectId && input.profileId) {
      const linkPayload: {
        projectId: string;
        profileId: string;
        owner: string;
        repo: string;
        webhookId?: number;
      } = {
        projectId: input.projectId,
        profileId: input.profileId,
        owner: input.owner,
        repo: input.repo,
      };

      if (typeof webhookId === "number") {
        linkPayload.webhookId = webhookId;
      }

      await linkProjectRepository(linkPayload);
    }

    logIntegration("push_completed", {
      owner: input.owner,
      repo: input.repo,
      projectId: input.projectId,
      profileId: input.profileId,
      pushedFiles: input.files.length,
      lastCommitSha,
    });

    return {
      success: true,
      repo: `${input.owner}/${input.repo}`,
      branch,
      pushedFiles: input.files.length,
      webhookCreated,
      commitSha: lastCommitSha,
    };
  } catch (error) {
    throw new Error(`GitHub push failed. ${axiosMessage(error)}`);
  }
}

export async function createRepositoryForProfile(input: {
  profileId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
}) {
  const token = await getGitHubAccessTokenForProfile(input.profileId);

  try {
    const res = await githubClient.post(
      "/user/repos",
      {
        name: input.name,
        description: input.description || "Repository created by Blueprint automation",
        private: input.isPrivate ?? true,
        auto_init: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      id: res.data?.id,
      name: res.data?.name,
      fullName: res.data?.full_name,
      owner: res.data?.owner?.login,
      defaultBranch: res.data?.default_branch,
      htmlUrl: res.data?.html_url,
      private: res.data?.private,
    };
  } catch (error) {
    throw new Error(`Could not create repository. ${axiosMessage(error)}`);
  }
}

export async function ensureGitHubPushWebhook(owner: string, repo: string, token: string): Promise<WebhookRegistrationResult> {
  const webhookBase = getWebhookBaseUrl();
  const url = `${webhookBase}/webhooks/github`;
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";

  try {
    const res = await githubClient.post(
      `/repos/${owner}/${repo}/hooks`,
      {
        name: "web",
        active: true,
        events: ["push", "pull_request"],
        config: {
          url,
          content_type: "json",
          secret,
          insecure_ssl: "0",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    logIntegration("webhook_registered", {
      owner,
      repo,
      webhookId: res.data?.id,
      events: ["push", "pull_request"],
    });

    return {
      created: true,
      webhookId: typeof res.data?.id === "number" ? res.data.id : undefined,
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 422) {
      const listRes = await githubClient.get(`/repos/${owner}/${repo}/hooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const existing = (listRes.data || []).find((hook: any) => hook?.config?.url === url);

      return {
        created: false,
        webhookId: typeof existing?.id === "number" ? existing.id : undefined,
      };
    }

    throw new Error(`Failed to register GitHub webhook. ${axiosMessage(error)}`);
  }
}

export async function linkProjectRepository(input: {
  projectId: string;
  profileId: string;
  owner: string;
  repo: string;
  allowRelink?: boolean;
  webhookId?: number;
}) {
  const connection = await prisma.gitHubConnection.findUnique({
    where: { profileId: input.profileId },
    select: { id: true },
  });

  if (!connection) {
    throw new Error("GitHub not connected for this profile.");
  }

  const fullName = `${input.owner}/${input.repo}`;
  const existingProjectMapping = await prisma.gitHubRepoMapping.findUnique({
    where: { projectId: input.projectId },
  });

  if (
    existingProjectMapping &&
    existingProjectMapping.fullName !== fullName &&
    !input.allowRelink
  ) {
    throw new Error("Project is already linked to a repository. Pass allowRelink=true to replace.");
  }

  const existingRepoMapping = await prisma.gitHubRepoMapping.findUnique({
    where: { fullName },
  });

  if (existingRepoMapping && existingRepoMapping.projectId !== input.projectId) {
    throw new Error("Repository is already linked to another project.");
  }

  const token = await getGitHubAccessTokenForProfile(input.profileId);
  const hook = await ensureGitHubPushWebhook(input.owner, input.repo, token);

  const mapping = await prisma.gitHubRepoMapping.upsert({
    where: { projectId: input.projectId },
    update: {
      githubConnectionId: connection.id,
      owner: input.owner,
      repo: input.repo,
      fullName,
      webhookId: hook.webhookId || input.webhookId,
    },
    create: {
      projectId: input.projectId,
      githubConnectionId: connection.id,
      owner: input.owner,
      repo: input.repo,
      fullName,
      webhookId: hook.webhookId || input.webhookId,
    },
  });

  logIntegration("repo_linked", {
    projectId: input.projectId,
    profileId: input.profileId,
    fullName,
    webhookId: mapping.webhookId,
  });

  return mapping;
}

export async function getProjectRepoMapping(projectId: string) {
  return prisma.gitHubRepoMapping.findUnique({
    where: { projectId },
    include: {
      githubConnection: {
        select: {
          profileId: true,
          username: true,
        },
      },
    },
  });
}

export async function pushProjectMappedRepo(input: {
  projectId: string;
  files: FileToPush[];
  branch?: string;
  commitMessage?: string;
}) {
  const mapping = await prisma.gitHubRepoMapping.findUnique({
    where: { projectId: input.projectId },
    include: { githubConnection: true },
  });

  if (!mapping) {
    throw new Error("No repository linked to this project.");
  }

  const token = await getGitHubAccessTokenForProfile(mapping.githubConnection.profileId);

  const payload: PushToGitHubInput = {
    owner: mapping.owner,
    repo: mapping.repo,
    profileId: mapping.githubConnection.profileId,
    projectId: input.projectId,
    files: input.files,
    createWebhook: true,
  };

  if (input.branch) {
    payload.branch = input.branch;
  }

  if (input.commitMessage) {
    payload.commitMessage = input.commitMessage;
  }

  return pushCodeToGitHub(payload);
}

export async function registerWebhookForProject(projectId: string) {
  const mapping = await prisma.gitHubRepoMapping.findUnique({
    where: { projectId },
    include: { githubConnection: true },
  });

  if (!mapping) {
    throw new Error("No repository linked to this project.");
  }

  const token = await getGitHubAccessTokenForProfile(mapping.githubConnection.profileId);
  const created = await ensureGitHubPushWebhook(mapping.owner, mapping.repo, token);

  if (created.webhookId) {
    await prisma.gitHubRepoMapping.update({
      where: { projectId },
      data: { webhookId: created.webhookId },
    });
  }

  return {
    created: created.created,
    webhookId: created.webhookId,
    owner: mapping.owner,
    repo: mapping.repo,
    fullName: mapping.fullName,
  };
}

export async function resolveProjectIdFromWebhookPayload(payload: any): Promise<string | null> {
  const fullName = payload?.repository?.full_name;
  if (!fullName || typeof fullName !== "string") {
    return null;
  }

  const mapping = await prisma.gitHubRepoMapping.findUnique({
    where: { fullName },
    select: { projectId: true },
  });

  return mapping?.projectId || null;
}

export async function githubIntegrationHealthCheck() {
  const oauthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_REDIRECT_URI
  );

  const webhookBaseUrl = (process.env.WEBHOOK_BASE_URL || "").trim();
  const webhookProbePath = (process.env.WEBHOOK_HEALTH_PATH || "/healthz").trim() || "/healthz";
  let webhookBaseReachable = false;
  try {
    if (webhookBaseUrl) {
      const probeUrl = new URL(webhookProbePath, webhookBaseUrl).toString();
      await axios.get(probeUrl, { timeout: 3000 });
      webhookBaseReachable = true;
    }
  } catch {
    webhookBaseReachable = false;
  }

  let tokenEncryptionWorking = false;
  try {
    const sample = "health-check-token";
    const encrypted = encryptToken(sample);
    const decrypted = decryptToken(encrypted);
    tokenEncryptionWorking = decrypted === sample;
  } catch {
    tokenEncryptionWorking = false;
  }

  let githubApiReachable = false;
  try {
    await githubClient.get("/meta", { timeout: 5000 });
    githubApiReachable = true;
  } catch {
    githubApiReachable = false;
  }

  return {
    oauthConfigured,
    webhookBaseUrlReachable: webhookBaseReachable,
    tokenEncryptionWorking,
    githubApiReachable,
  };
}
