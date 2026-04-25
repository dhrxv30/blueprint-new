import { PrismaClient } from "@prisma/client";
import { getClickUpTokenForProfile } from "./clickupOAuthService.js";
import { logIntegration } from "./integrationLogger.js";

const prisma = new PrismaClient();
const CLICKUP_API = "https://api.clickup.com/api/v2";

// ── Status mapping ──────────────────────────────────────────

const STATUS_TO_CLICKUP: Record<string, string> = {
  todo: "to do",
  "in-progress": "in progress",
  done: "complete",
};

const STATUS_FROM_CLICKUP: Record<string, string> = {
  "to do": "todo",
  "in progress": "in-progress",
  complete: "done",
  closed: "done",
};

export function mapStatusToClickUp(localStatus: string): string {
  return STATUS_TO_CLICKUP[localStatus?.toLowerCase()] || localStatus;
}

export function mapStatusFromClickUp(clickupStatus: string): string {
  return STATUS_FROM_CLICKUP[clickupStatus?.toLowerCase()] || clickupStatus;
}

// ── ClickUp API helpers ─────────────────────────────────────

function headers(token: string) {
  return {
    Authorization: token,
    "Content-Type": "application/json",
  };
}

async function clickupGet(token: string, path: string) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ClickUp GET ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function clickupPost(token: string, path: string, body: any) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function clickupPut(token: string, path: string, body: any) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp PUT ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function clickupDelete(token: string, path: string) {
  const res = await fetch(`${CLICKUP_API}${path}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ClickUp DELETE ${path} failed (${res.status}): ${text}`);
  }
  // DELETE responses may be empty
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ── Structure browsing ──────────────────────────────────────

export async function fetchWorkspaces(token: string) {
  const data = await clickupGet(token, "/team");
  return (data.teams || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    members: t.members?.length || 0,
  }));
}

export async function fetchSpaces(token: string, workspaceId: string) {
  const data = await clickupGet(token, `/team/${workspaceId}/space?archived=false`);
  return (data.spaces || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    private: s.private,
  }));
}

export async function fetchFolders(token: string, spaceId: string) {
  const data = await clickupGet(token, `/space/${spaceId}/folder?archived=false`);
  return (data.folders || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    listCount: f.lists?.length || 0,
  }));
}

export async function fetchLists(token: string, spaceId: string, folderId?: string) {
  if (folderId) {
    const data = await clickupGet(token, `/folder/${folderId}/list?archived=false`);
    return (data.lists || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      taskCount: l.task_count,
    }));
  }
  // Folderless lists directly under the space
  const data = await clickupGet(token, `/space/${spaceId}/list?archived=false`);
  return (data.lists || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    taskCount: l.task_count,
  }));
}

export async function fetchTasks(token: string, listId: string) {
  const data = await clickupGet(token, `/list/${listId}/task?archived=false&include_closed=true`);
  return (data.tasks || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    status: t.status?.status || "to do",
    priority: t.priority?.priority || "normal",
    dateCreated: t.date_created,
    dateUpdated: t.date_updated,
  }));
}

// ── Task CRUD ───────────────────────────────────────────────

export async function createTaskInClickUp(
  token: string,
  listId: string,
  task: { name: string; description?: string; status?: string; priority?: number }
) {
  console.log("[ClickUp] Creating task in list:", listId, task.name);
  return clickupPost(token, `/list/${listId}/task`, {
    name: task.name,
    description: task.description || "",
    status: task.status || "to do",
    priority: task.priority,
  });
}

export async function updateTaskInClickUp(
  token: string,
  taskId: string,
  updates: { name?: string; description?: string; status?: string; priority?: number }
) {
  console.log("[ClickUp] Updating task:", taskId, updates);
  return clickupPut(token, `/task/${taskId}`, updates);
}

export async function deleteTaskInClickUp(token: string, taskId: string) {
  console.log("[ClickUp] Deleting task:", taskId);
  return clickupDelete(token, `/task/${taskId}`);
}

// ── List creation ───────────────────────────────────────────

export async function createListInClickUp(
  token: string,
  name: string,
  spaceId: string,
  folderId?: string
) {
  if (folderId) {
    console.log("[ClickUp] Creating list in folder:", folderId);
    return clickupPost(token, `/folder/${folderId}/list`, { name });
  }
  console.log("[ClickUp] Creating folderless list in space:", spaceId);
  return clickupPost(token, `/space/${spaceId}/list`, { name });
}

// ── Push Sprint ─────────────────────────────────────────────

export async function pushSprintToClickUp(input: {
  profileId: string;
  projectId: string;
  workspaceId: string;
  spaceId: string;
  folderId?: string;
  sprintName: string;
}) {
  const { profileId, projectId, workspaceId, spaceId, folderId, sprintName } = input;

  console.log("[ClickUp] Push sprint starting", { profileId, projectId, sprintName });

  const token = await getClickUpTokenForProfile(profileId);

  // 1. Get or create a list in ClickUp
  const existingLists = await fetchLists(token, spaceId, folderId);
  const existingList = existingLists.find((l: any) => l.name === sprintName);

  let listId: string;
  let listName: string;

  if (existingList) {
    console.log("[ClickUp] Using existing list:", existingList.id, existingList.name);
    listId = existingList.id;
    listName = existingList.name;
  } else {
    const newList = await createListInClickUp(token, sprintName, spaceId, folderId);
    listId = newList.id;
    listName = newList.name;
    console.log("[ClickUp] Created list:", listId, listName);
  }

  // 2. Fetch sprint tasks from our DB
  const analysis = await prisma.pipelineAnalysis.findFirst({
    where: {
      prdVersion: { projectId },
    },
    orderBy: { createdAt: "desc" },
  });

  const localTasks: any[] = Array.isArray(analysis?.tasks) ? (analysis.tasks as any[]) : [];

  if (localTasks.length === 0) {
    console.warn("[ClickUp] No tasks found in project analysis to push.");
  }

  // 3. Get or create ClickUpConnection
  const connection = await prisma.clickUpConnection.findUnique({
    where: { profileId },
  });
  if (!connection) {
    throw new Error("ClickUp not connected for this profile.");
  }

  // 4. Create ClickUpMapping
  const mapping = await prisma.clickUpMapping.upsert({
    where: { projectId },
    update: {
      clickupConnectionId: connection.id,
      workspaceId,
      spaceId,
      folderId: folderId ?? null,
      listId,
      listName: listName ?? null,
    },
    create: {
      projectId,
      clickupConnectionId: connection.id,
      workspaceId,
      spaceId,
      folderId: folderId ?? null,
      listId,
      listName: listName ?? null,
    },
  });

  // 5. Create each task in ClickUp and save mappings
  let createdCount = 0;
  for (const task of localTasks) {
    try {
      const localTaskId = task.id || task.taskId;
      const taskName = task.title || task.name || task.task || "Untitled Task";
      const taskDesc = task.description || `Story: ${task.storyId || "N/A"}\nPriority: ${task.priority || "Medium"}`;
      const localStatus = task.status || "todo";
      const clickupStatus = mapStatusToClickUp(localStatus);

      // Check if task already mapped
      const existingMapping = await prisma.clickUpTaskMapping.findUnique({
        where: {
          clickupMappingId_localTaskId: {
            clickupMappingId: mapping.id,
            localTaskId: String(localTaskId),
          },
        },
      });

      let clickupTaskId: string;

      if (existingMapping) {
        console.log("[ClickUp] Task already mapped, updating:", existingMapping.clickupTaskId);
        await updateTaskInClickUp(token, existingMapping.clickupTaskId, {
          name: taskName,
          description: taskDesc,
          status: clickupStatus,
        });
        clickupTaskId = existingMapping.clickupTaskId;
      } else {
        const created = await createTaskInClickUp(token, listId, {
          name: taskName,
          description: taskDesc,
          status: clickupStatus,
        });
        clickupTaskId = created?.id;
      }

      // Save task mapping
      if (clickupTaskId && localTaskId) {
        await prisma.clickUpTaskMapping.upsert({
          where: {
            clickupMappingId_localTaskId: {
              clickupMappingId: mapping.id,
              localTaskId: String(localTaskId),
            },
          },
          update: { clickupTaskId },
          create: {
            clickupMappingId: mapping.id,
            localTaskId: String(localTaskId),
            clickupTaskId: clickupTaskId,
          },
        });
      }

      createdCount++;
    } catch (err) {
      console.error("[ClickUp] Failed to create task:", task.title || task.id, err);
      // Continue with remaining tasks
    }
  }

  logIntegration("clickup_push_sprint", {
    profileId,
    projectId,
    listId,
    listName,
    totalTasks: localTasks.length,
    createdTasks: createdCount,
  });

  console.log("[ClickUp] Push sprint complete:", { listId, createdCount });

  return {
    success: true,
    listId,
    listName,
    totalTasks: localTasks.length,
    createdTasks: createdCount,
  };
}

// ── Sync single task to ClickUp ─────────────────────────────

export async function syncLocalTaskToClickUp(
  profileId: string,
  projectId: string,
  localTaskId: string,
  updates: { status?: string; name?: string; description?: string }
) {
  const token = await getClickUpTokenForProfile(profileId);

  const mapping = await prisma.clickUpMapping.findUnique({
    where: { projectId },
  });
  if (!mapping) {
    console.log("[ClickUp Sync] No ClickUp mapping for project, skipping sync");
    return null;
  }

  const taskMapping = await prisma.clickUpTaskMapping.findUnique({
    where: {
      clickupMappingId_localTaskId: {
        clickupMappingId: mapping.id,
        localTaskId: String(localTaskId),
      },
    },
  });

  if (!taskMapping) {
    console.log("[ClickUp Sync] No task mapping found for local task:", localTaskId);
    return null;
  }

  const clickupUpdates: any = {};
  if (updates.status) {
    clickupUpdates.status = mapStatusToClickUp(updates.status);
  }
  if (updates.name) {
    clickupUpdates.name = updates.name;
  }
  if (updates.description) {
    clickupUpdates.description = updates.description;
  }

  console.log("[ClickUp Sync] Syncing task", localTaskId, "→", taskMapping.clickupTaskId, clickupUpdates);

  return updateTaskInClickUp(token, taskMapping.clickupTaskId, clickupUpdates);
}

// ── Link existing list ──────────────────────────────────────

export async function linkClickUpList(input: {
  profileId: string;
  projectId: string;
  workspaceId: string;
  spaceId: string;
  folderId?: string;
  listId: string;
  listName?: string;
}) {
  const connection = await prisma.clickUpConnection.findUnique({
    where: { profileId: input.profileId },
  });
  if (!connection) {
    throw new Error("ClickUp not connected for this profile.");
  }

  // Ensure the project exists to satisfy the foreign key constraint
  const existingProject = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!existingProject) {
    await prisma.project.create({
      data: {
        id: input.projectId,
        name: "Automation Workspace",
        profileId: input.profileId,
      }
    });
  }

  const mapping = await prisma.clickUpMapping.upsert({
    where: { projectId: input.projectId },
    update: {
      clickupConnectionId: connection.id,
      workspaceId: input.workspaceId,
      spaceId: input.spaceId,
      folderId: input.folderId ?? null,
      listId: input.listId,
      listName: input.listName ?? null,
    },
    create: {
      projectId: input.projectId,
      clickupConnectionId: connection.id,
      workspaceId: input.workspaceId,
      spaceId: input.spaceId,
      folderId: input.folderId ?? null,
      listId: input.listId,
      listName: input.listName ?? null,
    },
  });

  logIntegration("clickup_link_list", {
    profileId: input.profileId,
    projectId: input.projectId,
    listId: input.listId,
  });

  return mapping;
}

// ── Get mapping for a project ───────────────────────────────

export async function getClickUpMappingForProject(projectId: string) {
  return prisma.clickUpMapping.findUnique({
    where: { projectId },
    include: {
      taskMappings: true,
      clickupConnection: {
        select: { profileId: true, workspaceName: true },
      },
    },
  });
}
