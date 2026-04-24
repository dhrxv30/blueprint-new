import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { encryptToken, decryptToken } from "./cryptoService.js";

const prisma = new PrismaClient();

/**
 * Build the GitHub OAuth authorization URL.
 * Throws if required env vars are missing.
 */
export function buildGitHubOAuthStartUrl(state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID is not set in environment variables.");
  }
  if (!redirectUri) {
    throw new Error("GITHUB_REDIRECT_URI is not set in environment variables.");
  }

  const scope = "repo,user";

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`;

  console.log("[GitHub OAuth] Built authorization URL", { clientId, redirectUri, scope });

  return url;
}

/**
 * Complete the GitHub OAuth flow:
 *  1. Exchange the authorization code for an access token
 *  2. Fetch the authenticated user's profile
 *  3. Encrypt and upsert the token into GitHubConnection
 */
export async function completeGitHubOAuth(code: string, profileId: string) {
  console.log("[GitHub OAuth] completeGitHubOAuth called", { code: code.slice(0, 8) + "...", profileId });

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID is not set in environment variables.");
  }
  if (!clientSecret) {
    throw new Error("GITHUB_CLIENT_SECRET is not set in environment variables.");
  }

  // Step 1: Exchange code for access token
  console.log("[GitHub OAuth] Exchanging code for access token...");
  const tokenRes = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  const accessToken = tokenRes.data.access_token;

  if (!accessToken) {
    console.error("[GitHub OAuth] Token exchange failed:", tokenRes.data);
    throw new Error(`Failed to get access token from GitHub: ${tokenRes.data.error_description || tokenRes.data.error || "unknown error"}`);
  }

  console.log("[GitHub OAuth] Access token received successfully");

  // Step 2: Fetch GitHub user profile
  console.log("[GitHub OAuth] Fetching GitHub user profile...");
  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const username = userRes.data.login;
  console.log("[GitHub OAuth] GitHub user:", username);

  // Step 3: Encrypt token and save to DB
  const encryptedToken = encryptToken(accessToken);

  console.log("[GitHub OAuth] Saving GitHub connection for profileId:", profileId);
  await prisma.gitHubConnection.upsert({
    where: { profileId },
    update: {
      accessToken: encryptedToken,
      username,
    },
    create: {
      profileId,
      accessToken: encryptedToken,
      username,
    },
  });

  console.log("[GitHub OAuth] GitHubConnection saved successfully for profileId:", profileId);

  return { profileId, username };
}

export async function getGitHubConnection(profileId: string) {
  return prisma.gitHubConnection.findUnique({
    where: { profileId }
  });
}

export async function getGitHubAccessTokenForProfile(profileId: string): Promise<string> {
  const connection = await prisma.gitHubConnection.findUnique({
    where: { profileId }
  });

  if (!connection) {
    throw new Error("GitHub not connected for this profile.");
  }

  return decryptToken(connection.accessToken);
}

export async function listReposForProfile(profileId: string) {
  const token = await getGitHubAccessTokenForProfile(profileId);
  
  const res = await axios.get("https://api.github.com/user/repos", {
    headers: { Authorization: `Bearer ${token}` },
    params: { sort: "updated", per_page: 100 }
  });

  return res.data.map((repo: any) => ({
    fullName: repo.full_name,
    owner: repo.owner.login,
    name: repo.name
  }));
}
