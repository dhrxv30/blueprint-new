// src/lib/integrations/clickup.ts
// DEPRECATED: ClickUp integration has been moved to:
//   - src/services/clickupOAuthService.ts (OAuth flow)
//   - src/services/clickupService.ts (API interactions)
//   - src/routes/clickup.ts (HTTP routes)
//
// This file is kept for backward compatibility only.

export { createTaskInClickUp as createClickupTask } from "../../services/clickupService.js";
export { updateTaskInClickUp as updateClickupTask } from "../../services/clickupService.js";

// syncSprint is no longer available from this file.
// Use pushSprintToClickUp from clickupService instead.
export async function syncSprint(_listId: string, _sprint: any, _token: string) {
  throw new Error(
    "syncSprint is deprecated. Use the /api/clickup/push-sprint endpoint or pushSprintToClickUp from clickupService."
  );
}