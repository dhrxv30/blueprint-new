// src/lib/integrations/clickup.ts

const CLICKUP_API = "https://api.clickup.com/api/v2";

const getHeaders = (token: string) => ({
  Authorization: token,
  "Content-Type": "application/json"
});

export async function createClickupTask(listId: string, name: string, description: string, priority: number, token: string) {
  const res = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ name, description, priority })
  });
  return res.json();
}

export async function updateClickupTask(taskId: string, updates: any, token: string) {
  const res = await fetch(`${CLICKUP_API}/task/${taskId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function syncSprint(listId: string, sprint: any, token: string) {
  console.log(`-> Syncing Sprint ${sprint.name} to ClickUp...`);
  
  for (const taskId of sprint.tasks) {
    // We send a mock priority of 3 for the demo
    await createClickupTask(listId, `Task ${taskId}`, "Imported from Pipeline", 3, token);
  }
  
  return { success: true, message: `Synced ${sprint.tasks.length} tasks to ClickUp.` };
}