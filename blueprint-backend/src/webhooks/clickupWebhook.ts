import { Router } from "express";
import { logIntegration } from "../services/integrationLogger.js";

const clickupWebhookRouter = Router();

/**
 * ClickUp Webhook Handler (STUBBED)
 *
 * ClickUp sends webhooks to this endpoint when tasks are created, updated, or deleted.
 * This requires a publicly accessible URL (e.g., via ngrok for local dev).
 *
 * To activate:
 *   1. Set CLICKUP_WEBHOOK_URL in .env (e.g., https://your-ngrok.ngrok.io/webhooks/clickup)
 *   2. Register the webhook via ClickUp API: POST /api/v2/team/{team_id}/webhook
 *   3. Events: taskCreated, taskUpdated, taskDeleted
 *
 * This handler is ready for implementation — just uncomment and wire up the DB updates.
 */
clickupWebhookRouter.post("/clickup", async (req, res) => {
  try {
    const { event, task_id, history_items } = req.body || {};

    console.log("[ClickUp Webhook] Received event:", event, "taskId:", task_id);

    logIntegration("clickup_webhook_received", {
      event,
      taskId: task_id,
      historyItemCount: history_items?.length || 0,
    });

    // TODO: Implement when ngrok/public URL is available
    //
    // switch (event) {
    //   case "taskCreated":
    //     // Look up which ClickUpMapping this task belongs to
    //     // Create local task entry + ClickUpTaskMapping
    //     break;
    //
    //   case "taskUpdated":
    //     // Find ClickUpTaskMapping by clickupTaskId
    //     // Update local task status/title in PipelineAnalysis.tasks JSON
    //     // Guard: skip if this update originated from our own sync (prevent loops)
    //     break;
    //
    //   case "taskDeleted":
    //     // Find and remove ClickUpTaskMapping
    //     // Optionally mark local task as deleted
    //     break;
    // }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[ClickUp Webhook] Error:", error);
    return res.status(500).json({ error: "Webhook processing failed." });
  }
});

export default clickupWebhookRouter;
