// src/routes/ambiguity.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { generateJSONResponse } from "../lib/ai/gemini.js";
import { SYSTEM_PROMPTS, REFINEMENT_PROMPTS } from "../lib/ai/prompts.js";
import { Type, type Schema } from "@google/genai";

const router = Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL as string
    }
  }
});

/* =========================================================
   GET /api/ambiguities/next?projectId=...
   Returns the first PENDING ambiguity for a project.
========================================================= */
router.get("/ambiguities/next", async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    let ambiguity = await (prisma as any).ambiguity.findFirst({
      where: {
        projectId: projectId as string,
        status: "PENDING"
      },
      orderBy: { createdAt: "asc" }
    });

    if (!ambiguity) {
      // Check if we have ANY ambiguities at all (including RESOLVED)
      const totalCount = await (prisma as any).ambiguity.count({
        where: { projectId: projectId as string }
      });

      if (totalCount === 0) {
        // Fallback: PRD was analyzed before seeding logic was added. Seed now from PipelineAnalysis.
        const analysis = await prisma.pipelineAnalysis.findFirst({
          where: { prdVersion: { projectId: projectId as string } },
          orderBy: { createdAt: "desc" }
        });

        if (analysis && analysis.ambiguities && Array.isArray(analysis.ambiguities) && analysis.ambiguities.length > 0) {
          try {
            console.log(`[Fallback] Seeding ${analysis.ambiguities.length} ambiguities for project ${projectId}`);
            
            // Clear any existing PENDING ones to avoid duplicates during fallback
            await (prisma as any).ambiguity.deleteMany({
              where: { projectId: projectId as string, status: "PENDING" }
            });

            await (prisma as any).ambiguity.createMany({
              data: analysis.ambiguities.map((a: any) => ({
                projectId: projectId as string,
                question: typeof a === 'string' ? a : a.description || a,
                status: "PENDING",
                updatedAt: new Date()
              }))
            });

            // Fetch the newly seeded first pending ambiguity
            ambiguity = await (prisma as any).ambiguity.findFirst({
              where: {
                projectId: projectId as string,
                status: "PENDING"
              },
              orderBy: { createdAt: "asc" }
            });
          } catch (seedErr) {
            console.warn("Dynamic fallback seeding failed:", seedErr);
          }
        }
      }
    }

    if (!ambiguity) {
      return res.json({ done: true, ambiguity: null });
    }

    res.json({ done: false, ambiguity });
  } catch (err: any) {
    console.error("GET /ambiguities/next error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   POST /api/ambiguities/answer
   Stores the user's answer and marks it RESOLVED.
   Body: { ambiguityId: string, answer: string }
========================================================= */
router.post("/ambiguities/answer", async (req, res) => {
  try {
    const { ambiguityId, answer } = req.body;
    if (!ambiguityId || !answer) {
      return res.status(400).json({ error: "ambiguityId and answer are required" });
    }

    const updated = await (prisma as any).ambiguity.update({
      where: { id: ambiguityId },
      data: { answer, status: "RESOLVED" }
    });

    // Fetch the next pending ambiguity for convenience
    const next = await (prisma as any).ambiguity.findFirst({
      where: {
        projectId: updated.projectId,
        status: "PENDING"
      },
      orderBy: { createdAt: "asc" }
    });

    res.json({
      success: true,
      resolved: updated,
      next: next || null,
      done: !next
    });
  } catch (err: any) {
    console.error("POST /ambiguities/answer error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   GET /api/ambiguities/status?projectId=...
   Returns resolution progress.
========================================================= */
router.get("/ambiguities/status", async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    const total = await (prisma as any).ambiguity.count({
      where: { projectId: projectId as string }
    });
    const resolved = await (prisma as any).ambiguity.count({
      where: { projectId: projectId as string, status: "RESOLVED" }
    });

    res.json({
      total,
      resolved,
      pending: total - resolved,
      allResolved: total > 0 && resolved === total
    });
  } catch (err: any) {
    console.error("GET /ambiguities/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   POST /api/context/save
   Stores additional context from the user.
   Body: { projectId: string, content: string }
========================================================= */
router.post("/context/save", async (req, res) => {
  try {
    const { projectId, content } = req.body;
    if (!projectId || !content) {
      return res.status(400).json({ error: "projectId and content are required" });
    }

    const note = await (prisma as any).contextNote.create({
      data: { projectId, content }
    });

    res.json({ success: true, note });
  } catch (err: any) {
    console.error("POST /context/save error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
   POST /api/prd/finalize
   Calls Gemini to refine the PRD based on Q&A and context.
   Body: { projectId: string }
   
   Returns a jobId so the frontend can redirect to the
   processing/loading page and poll for completion.
========================================================= */
router.post("/prd/finalize", async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    // 1. Fetch original PRD text
    const latestVersion = await prisma.prdVersion.findFirst({
      where: { projectId },
      orderBy: { versionNumber: "desc" }
    });
    if (!latestVersion) {
      return res.status(404).json({ error: "No PRD version found for this project" });
    }
    const originalPrd = latestVersion.parsedText || "";

    // 2. Fetch all resolved Q&A
    const resolvedAmbiguities = await (prisma as any).ambiguity.findMany({
      where: { projectId, status: "RESOLVED" }
    });
    const qnaList = resolvedAmbiguities.map((a: any, i: number) => ({
      id: i + 1,
      question: a.question,
      answer: a.answer || ""
    }));

    // 3. Fetch context notes
    const contextNotes = await (prisma as any).contextNote.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" }
    });
    const contextText = contextNotes.map((n: any) => n.content).join("\n");

    // 4. Fetch existing analysis
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: { prdVersion: { projectId } },
      orderBy: { createdAt: "desc" }
    });
    const existingTasks = analysis ? (analysis.tasks as any[]) : [];
    const existingArchitecture = analysis?.architecture || "{}";
    const existingTraceability = analysis?.traceability || {};

    // 5. Create a new pipeline job for tracking
    const job = await prisma.pipelineJob.create({
      data: { projectId, status: "IN_PROGRESS" }
    });

    // 6. Create a stage run for visibility on the Processing page
    const stageRun = await prisma.pipelineStageRun.create({
      data: {
        jobId: job.id,
        stageName: "PRD Refinement",
        status: "IN_PROGRESS",
        startedAt: new Date()
      }
    });

    // Return the jobId immediately so the frontend can redirect
    res.json({ success: true, jobId: job.id, projectId });

    // 7. Run Gemini refinement in the background
    try {
      const userPrompt = `
INPUT:
1. Original PRD:
${originalPrd}

2. Clarifications:
${JSON.stringify(qnaList, null, 2)}

3. Additional Context:
${contextText || "None provided"}

4. Existing Tasks:
${JSON.stringify(existingTasks.slice(0, 30), null, 2)}
`;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          updated_prd: { type: Type.STRING },
          task_updates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task_id: { type: Type.STRING },
                action: { type: Type.STRING },
                updated_fields: { type: Type.OBJECT }
              },
              required: ["task_id", "action"]
            }
          },
          new_tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                storyId: { type: Type.STRING },
                featureId: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                priority: { type: Type.STRING },
                complexity: { type: Type.INTEGER },
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "title", "description", "type", "priority", "complexity"]
            }
          },
          architecture_updates: { type: Type.STRING },
          traceability_updates: { type: Type.ARRAY, items: { type: Type.OBJECT } }
        },
        required: ["updated_prd", "task_updates", "new_tasks"]
      };

      const refinementResult = await generateJSONResponse<{
        updated_prd: string;
        task_updates: Array<{ task_id: string; action: string; updated_fields?: any }>;
        new_tasks: any[];
        architecture_updates?: string;
        traceability_updates?: any[];
      }>(
        REFINEMENT_PROMPTS.PRD_REFINER,
        userPrompt,
        responseSchema
      );

      // 8. Create new PRD version
      const newVersionNumber = latestVersion.versionNumber + 1;
      await prisma.prdVersion.create({
        data: {
          projectId,
          versionNumber: newVersionNumber,
          parsedText: refinementResult.updated_prd,
        } as any
      });

      // 9. Apply task updates to existing analysis
      if (analysis) {
        let updatedTasks = [...existingTasks];

        // Apply updates to existing tasks
        for (const update of refinementResult.task_updates) {
          const idx = updatedTasks.findIndex(
            (t: any) => t.id === update.task_id || t.taskId === update.task_id
          );
          if (idx !== -1 && update.updated_fields) {
            updatedTasks[idx] = { ...updatedTasks[idx], ...update.updated_fields };
          }
        }

        // Add new tasks (with isNew flag, avoid duplicates)
        const existingIds = new Set(updatedTasks.map((t: any) => t.id));
        for (const newTask of refinementResult.new_tasks) {
          if (!existingIds.has(newTask.id)) {
            updatedTasks.push({ ...newTask, isNew: true, status: "todo" });
          }
        }

        // Update architecture if provided
        let updatedArchitecture = existingArchitecture;
        if (refinementResult.architecture_updates) {
          try {
            const oldArch = JSON.parse(existingArchitecture);
            const newArchChanges = JSON.parse(refinementResult.architecture_updates);
            // Merge: add new nodes with isNew flag
            if (newArchChanges.nodes) {
              const existingNodeIds = new Set((oldArch.nodes || []).map((n: any) => n.id));
              for (const node of newArchChanges.nodes) {
                if (!existingNodeIds.has(node.id)) {
                  oldArch.nodes = oldArch.nodes || [];
                  oldArch.nodes.push({ ...node, isNew: true });
                }
              }
            }
            if (newArchChanges.edges) {
              const existingEdgeIds = new Set((oldArch.edges || []).map((e: any) => e.id));
              for (const edge of newArchChanges.edges) {
                if (!existingEdgeIds.has(edge.id)) {
                  oldArch.edges = oldArch.edges || [];
                  oldArch.edges.push(edge);
                }
              }
            }
            updatedArchitecture = JSON.stringify(oldArch);
          } catch {
            // If parse fails, keep original architecture
          }
        }

        // Update traceability if provided
        let updatedTraceability = existingTraceability;
        if (refinementResult.traceability_updates && Array.isArray(refinementResult.traceability_updates)) {
          try {
            const oldTrace = existingTraceability as any;
            const newNodes = refinementResult.traceability_updates
              .filter((t: any) => t.id && t.type)
              .map((t: any) => ({ ...t, isNew: true }));
            if (oldTrace.nodes && newNodes.length > 0) {
              const existingNodeIds = new Set(oldTrace.nodes.map((n: any) => n.id));
              for (const node of newNodes) {
                if (!existingNodeIds.has(node.id)) {
                  oldTrace.nodes.push(node);
                }
              }
              updatedTraceability = oldTrace;
            }
          } catch {
            // Keep original on error
          }
        }

        // Persist updated analysis
        await prisma.pipelineAnalysis.update({
          where: { id: analysis.id },
          data: {
            tasks: updatedTasks as any,
            architecture: updatedArchitecture,
            traceability: updatedTraceability as any,
          }
        });
      }

      // 10. Mark job + stage as completed
      await prisma.pipelineStageRun.update({
        where: { id: stageRun.id },
        data: { status: "COMPLETED", completedAt: new Date() }
      });
      await prisma.pipelineJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED" }
      });

      console.log(`\n✅ PRD Refinement completed for project ${projectId}`);

    } catch (bgError: any) {
      console.error("PRD Refinement background error:", bgError);
      await prisma.pipelineStageRun.update({
        where: { id: stageRun.id },
        data: { status: "FAILED", completedAt: new Date(), error: bgError.message }
      });
      await prisma.pipelineJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: bgError.message }
      });
    }

  } catch (err: any) {
    console.error("POST /prd/finalize error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
