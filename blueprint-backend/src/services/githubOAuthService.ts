import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { encryptToken, decryptToken } from "./cryptoService.js";

const prisma = new PrismaClient();

export function buildGitHubOAuthStartUrl(profileId: string) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;
  const scope = "repo,user";
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=${scope}&state=${profileId}`;
}

export async function completeGitHubOAuth(code: string, state: string) {
  const profileId = state;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const res = await axios.post("https://github.com/login/oauth/access_token", {
    client_id: clientId,
    client_secret: clientSecret,
    code,
  }, {
    headers: { Accept: "application/json" }
  });

  const accessToken = res.data.access_token;
  if (!accessToken) {
    throw new Error("Failed to get access token from GitHub");
  }

  // Get user info
  const userRes = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const encryptedToken = encryptToken(accessToken);

  await prisma.gitHubConnection.upsert({
    where: { profileId },
    update: { 
      accessToken: encryptedToken,
      username: userRes.data.login
    },
    create: {
      profileId,
      accessToken: encryptedToken,
      username: userRes.data.login
    }
  });

  return { profileId, username: userRes.data.login };
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
