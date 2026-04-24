import { Router } from "express";
import {
  buildClickUpOAuthUrl,
  completeClickUpOAuth,
  getClickUpConnection,
  getClickUpTokenForProfile,
  disconnectClickUp,
} from "../services/clickupOAuthService.js";
import {
  fetchWorkspaces,
  fetchSpaces,
  fetchFolders,
  fetchLists,
  fetchTasks,
  createTaskInClickUp,
  updateTaskInClickUp,
  deleteTaskInClickUp,
  pushSprintToClickUp,
  linkClickUpList,
  getClickUpMappingForProject,
  syncLocalTaskToClickUp,
  mapStatusToClickUp,
} from "../services/clickupService.js";
import { logIntegration } from "../services/integrationLogger.js";

const clickupRouter = Router();

// ── OAuth ───────────────────────────────────────────────────

clickupRouter.get("/oauth/start", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const projectId = String(req.query.projectId || "");

    console.log("[ClickUp OAuth] /oauth/start hit", { profileId, projectId });

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const state = JSON.stringify({ profileId });
    const url = buildClickUpOAuthUrl(state);

    logIntegration("clickup_oauth_start", { profileId, projectId });
    console.log("[ClickUp OAuth] Redirecting to:", url);

    return res.redirect(url);
  } catch (error) {
    console.error("[ClickUp OAuth] /oauth/start error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.get("/oauth/callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    console.log("[ClickUp OAuth] CALLBACK HIT", { code: code ? code.slice(0, 8) + "..." : "(empty)", state });

    if (!code) {
      console.error("[ClickUp OAuth] Missing code in callback");
      return res.status(400).json({ error: "Missing authorization code." });
    }

    // Parse state safely
    let profileId: string = "";
    let projectId: string | undefined;
    try {
      const parsed = JSON.parse(state);
      profileId = parsed.profileId;
      projectId = parsed.projectId;
    } catch {
      console.warn("[ClickUp OAuth] Could not parse state as JSON");
    }

    if (!profileId) {
      console.error("[ClickUp OAuth] profileId is empty after parsing state");
      return res.status(400).json({ error: "profileId missing from OAuth state." });
    }

    console.log("[ClickUp OAuth] Parsed state", { profileId, projectId });

    const result = await completeClickUpOAuth(code, profileId);

    console.log("[ClickUp OAuth] OAuth completed successfully", { profileId: result.profileId, workspaceName: result.workspaceName });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const redirect = new URL("/dashboard/automation", frontendUrl);
    redirect.searchParams.set("clickup", "connected");
    redirect.searchParams.set("profileId", result.profileId);
    if (projectId) {
      redirect.searchParams.set("projectId", projectId);
    }

    logIntegration("clickup_oauth_callback_success", {
      profileId: result.profileId,
      projectId,
      workspaceName: result.workspaceName,
    });

    console.log("[ClickUp OAuth] Redirecting to frontend:", redirect.toString());
    return res.redirect(redirect.toString());
  } catch (error) {
    console.error("[ClickUp OAuth] CALLBACK ERROR:", error);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const redirect = new URL("/dashboard/automation", frontendUrl);
    redirect.searchParams.set("clickup", "error");
    redirect.searchParams.set("message", error instanceof Error ? error.message : "Unknown error");

    logIntegration("clickup_oauth_callback_error", {
      message: error instanceof Error ? error.message : "Unknown error",
    }, "error");

    return res.redirect(redirect.toString());
  }
});

// ── Connection status ───────────────────────────────────────

clickupRouter.get("/connection", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const connection = await getClickUpConnection(profileId);
    return res.json({
      connected: Boolean(connection),
      connection: connection
        ? {
            id: connection.id,
            workspaceName: connection.workspaceName,
            createdAt: connection.createdAt,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.post("/disconnect", async (req, res) => {
  try {
    const profileId = String(req.body?.profileId || "");
    if (!profileId) {
      return res.status(400).json({ error: "profileId is required." });
    }

    const result = await disconnectClickUp(profileId);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Structure browsing ──────────────────────────────────────

clickupRouter.get("/workspaces", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    if (!profileId) return res.status(400).json({ error: "profileId is required." });

    const token = await getClickUpTokenForProfile(profileId);
    const workspaces = await fetchWorkspaces(token);
    return res.json({ workspaces });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.get("/spaces", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const workspaceId = String(req.query.workspaceId || "");
    if (!profileId || !workspaceId) {
      return res.status(400).json({ error: "profileId and workspaceId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const spaces = await fetchSpaces(token, workspaceId);
    return res.json({ spaces });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.get("/folders", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const spaceId = String(req.query.spaceId || "");
    if (!profileId || !spaceId) {
      return res.status(400).json({ error: "profileId and spaceId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const folders = await fetchFolders(token, spaceId);
    return res.json({ folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.get("/lists", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const spaceId = String(req.query.spaceId || "");
    const folderId = req.query.folderId ? String(req.query.folderId) : undefined;

    if (!profileId || !spaceId) {
      return res.status(400).json({ error: "profileId and spaceId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const lists = await fetchLists(token, spaceId, folderId);
    return res.json({ lists });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.get("/tasks", async (req, res) => {
  try {
    const profileId = String(req.query.profileId || "");
    const listId = String(req.query.listId || "");

    if (!profileId || !listId) {
      return res.status(400).json({ error: "profileId and listId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const tasks = await fetchTasks(token, listId);
    return res.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Link list ───────────────────────────────────────────────

clickupRouter.post("/link", async (req, res) => {
  try {
    const { profileId, projectId, workspaceId, spaceId, folderId, listId, listName } = req.body || {};

    if (!profileId || !projectId || !workspaceId || !spaceId || !listId) {
      return res.status(400).json({
        error: "profileId, projectId, workspaceId, spaceId, and listId are required.",
      });
    }

    const mapping = await linkClickUpList({
      profileId,
      projectId,
      workspaceId,
      spaceId,
      folderId,
      listId,
      listName,
    });

    return res.json({ success: true, mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Get mapping ─────────────────────────────────────────────

clickupRouter.get("/mapping/:projectId", async (req, res) => {
  try {
    const projectId = String(req.params.projectId || "");
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required." });
    }

    const mapping = await getClickUpMappingForProject(projectId);
    return res.json({ mapping });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Task CRUD ───────────────────────────────────────────────

clickupRouter.post("/task", async (req, res) => {
  try {
    const { profileId, listId, name, description, status, priority } = req.body || {};

    if (!profileId || !listId || !name) {
      return res.status(400).json({ error: "profileId, listId, and name are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const taskPayload: { name: string; description?: string; status?: string; priority?: number } = {
      name,
      description,
      priority,
    };
    if (status) taskPayload.status = mapStatusToClickUp(status);

    const task = await createTaskInClickUp(token, listId, taskPayload);

    return res.json({ success: true, task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.put("/task/:taskId", async (req, res) => {
  try {
    const taskId = String(req.params.taskId || "");
    const { profileId, name, description, status, priority } = req.body || {};

    if (!profileId || !taskId) {
      return res.status(400).json({ error: "profileId and taskId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (status) updates.status = mapStatusToClickUp(status);
    if (priority !== undefined) updates.priority = priority;

    const result = await updateTaskInClickUp(token, taskId, updates);
    return res.json({ success: true, task: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

clickupRouter.delete("/task/:taskId", async (req, res) => {
  try {
    const taskId = String(req.params.taskId || "");
    const profileId = String(req.query.profileId || "");

    if (!profileId || !taskId) {
      return res.status(400).json({ error: "profileId and taskId are required." });
    }

    const token = await getClickUpTokenForProfile(profileId);
    await deleteTaskInClickUp(token, taskId);
    return res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Sync task status from local → ClickUp ───────────────────

clickupRouter.post("/sync-task", async (req, res) => {
  try {
    const { profileId, projectId, localTaskId, status, name, description } = req.body || {};

    if (!profileId || !projectId || !localTaskId) {
      return res.status(400).json({ error: "profileId, projectId, and localTaskId are required." });
    }

    const result = await syncLocalTaskToClickUp(profileId, projectId, localTaskId, {
      status,
      name,
      description,
    });

    return res.json({ success: true, synced: result !== null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

// ── Push sprint ─────────────────────────────────────────────

clickupRouter.post("/push-sprint", async (req, res) => {
  try {
    let { profileId, projectId, workspaceId, spaceId, folderId, sprintName } = req.body || {};

    if (!profileId || !projectId || !sprintName) {
      return res.status(400).json({
        error: "profileId, projectId, and sprintName are required.",
      });
    }

    // Auto-discovery for workspace and space if missing
    if (!workspaceId || !spaceId) {
      const token = await getClickUpTokenForProfile(profileId);
      
      if (!workspaceId) {
        const teams = await fetchWorkspaces(token);
        if (teams.length === 0) throw new Error("No ClickUp workspaces found for this account.");
        workspaceId = teams[0].id;
      }
      
      if (!spaceId) {
        const spaces = await fetchSpaces(token, workspaceId);
        if (spaces.length === 0) throw new Error("No spaces found in your ClickUp workspace.");
        spaceId = spaces[0].id;
      }
    }

    const result = await pushSprintToClickUp({
      profileId,
      projectId,
      workspaceId,
      spaceId,
      folderId,
      sprintName,
    });

    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default clickupRouter;
