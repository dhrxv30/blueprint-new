import { PrismaClient } from "@prisma/client";
import { encryptToken, decryptToken } from "./cryptoService.js";

const prisma = new PrismaClient();
const CLICKUP_API = "https://api.clickup.com/api/v2";

/**
 * Build the ClickUp OAuth authorization URL.
 */
export function buildClickUpOAuthUrl(state: string): string {
  const clientId = process.env.CLICKUP_CLIENT_ID;
  const redirectUri = process.env.CLICKUP_REDIRECT_URI;

  if (!clientId) {
    throw new Error("CLICKUP_CLIENT_ID is not set in environment variables.");
  }
  if (!redirectUri) {
    throw new Error("CLICKUP_REDIRECT_URI is not set in environment variables.");
  }

  const url = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  console.log("[ClickUp OAuth] Built authorization URL", { clientId, redirectUri });

  return url;
}

/**
 * Complete the ClickUp OAuth flow:
 *  1. Exchange code for access token
 *  2. Fetch workspace info
 *  3. Encrypt and upsert into ClickUpConnection
 */
export async function completeClickUpOAuth(code: string, profileId: string) {
  console.log("[ClickUp OAuth] completeClickUpOAuth called", { profileId });

  const clientId = process.env.CLICKUP_CLIENT_ID;
  const clientSecret = process.env.CLICKUP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("ClickUp OAuth credentials not configured in environment.");
  }

  // Step 1: Exchange code for access token
  console.log("[ClickUp OAuth] Exchanging code for access token...");
  const tokenRes = await fetch(`${CLICKUP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("[ClickUp OAuth] Token exchange failed:", tokenData);
    throw new Error(tokenData.err || tokenData.error || "Failed to exchange code for ClickUp token");
  }

  const accessToken = tokenData.access_token;
  console.log("[ClickUp OAuth] Access token received successfully");

  // Step 2: Fetch workspace name
  let workspaceName: string | undefined;
  try {
    console.log("[ClickUp OAuth] Fetching workspace info...");
    const teamRes = await fetch(`${CLICKUP_API}/team`, {
      headers: { Authorization: accessToken },
    });
    const teamData = await teamRes.json();
    workspaceName = teamData?.teams?.[0]?.name;
    console.log("[ClickUp OAuth] Workspace:", workspaceName);
  } catch (err) {
    console.warn("[ClickUp OAuth] Could not fetch workspace name:", err);
  }

  // Step 3: Encrypt token and save
  const encryptedToken = encryptToken(accessToken);

  console.log("[ClickUp OAuth] Saving ClickUp connection for profileId:", profileId);
  await prisma.clickUpConnection.upsert({
    where: { profileId },
    update: {
      accessToken: encryptedToken,
      workspaceName: workspaceName ?? null,
    },
    create: {
      profileId,
      accessToken: encryptedToken,
      workspaceName: workspaceName ?? null,
    },
  });

  console.log("[ClickUp OAuth] ClickUpConnection saved successfully for profileId:", profileId);

  return { profileId, workspaceName };
}

/**
 * Get the ClickUp connection for a profile.
 */
export async function getClickUpConnection(profileId: string) {
  return prisma.clickUpConnection.findUnique({
    where: { profileId },
  });
}

/**
 * Get the decrypted ClickUp access token for a profile.
 */
export async function getClickUpTokenForProfile(profileId: string): Promise<string> {
  const connection = await prisma.clickUpConnection.findUnique({
    where: { profileId },
  });

  if (!connection) {
    throw new Error("ClickUp not connected for this profile.");
  }

  return decryptToken(connection.accessToken);
}

/**
 * Disconnect ClickUp — removes the connection row (cascades to mappings).
 */
export async function disconnectClickUp(profileId: string) {
  console.log("[ClickUp OAuth] Disconnecting ClickUp for profileId:", profileId);

  const connection = await prisma.clickUpConnection.findUnique({
    where: { profileId },
  });

  if (!connection) {
    console.warn("[ClickUp OAuth] No connection found to disconnect.");
    return { success: true, message: "Already disconnected." };
  }

  await prisma.clickUpConnection.delete({
    where: { profileId },
  });

  console.log("[ClickUp OAuth] ClickUp disconnected successfully.");
  return { success: true, message: "ClickUp disconnected." };
}
