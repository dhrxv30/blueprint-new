// server.ts - Reloaded for optimization

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";


import { processPrdJob } from "./src/lib/pipeline/orchestrator.js";
import { createRepo, pushFiles } from "./src/lib/integrations/github.js";
import githubRouter from "./src/routes/github.js";
import clickupRouter from "./src/routes/clickup.js";
import githubWebhookRouter from "./src/webhooks/githubWebhook.js";
import clickupWebhookRouter from "./src/webhooks/clickupWebhook.js";
dotenv.config({ debug: true, override: true });

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL as string
    }
  }
});

// ==========================================
// GLOBAL ERROR HANDLERS (DEBUGGING)
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('\n🔥 CRITICAL: UNCAUGHT EXCEPTION');
  console.error(err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️ CRITICAL: UNHANDLED REJECTION');
  console.error('Reason:', reason);
});
// ==========================================

app.use(cors());
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

const upload = multer({ storage: multer.memoryStorage() });

/* =========================================================
   API ROUTES
========================================================= */

// Workaround for ClickUp UI bug: intercept truncated redirect URLs at the root
app.get("/", (req, res) => {
  if (req.query.code && req.query.state) {
    const url = new URL("/api/clickup/oauth/callback", `http://localhost:${process.env.PORT || 5000}`);
    url.search = new URLSearchParams(req.query as any).toString();
    return res.redirect(url.toString());
  }
  return res.send("🚀 Modular Gemini Backend running...");
});

app.use("/api/github", githubRouter);
app.use("/api/clickup", clickupRouter);
app.use("/webhooks", githubWebhookRouter);
app.use("/webhooks", clickupWebhookRouter);

/**
 * 1. Upload PRD → Run AI pipeline → Save results
 */
app.post('/api/prd/upload', upload.single('prd'), async (req, res): Promise<any> => {
  try {
    console.log("\n=== INITIATING ASYNC UPLOAD PROCESS ===");
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded.' });

    const { profileId, projectName, email } = req.body; 

    if (!profileId) {
       return res.status(400).json({ error: 'User profileId is required.' });
    }

    let userProfile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!userProfile) {
      userProfile = await prisma.profile.create({
        data: { id: profileId, email: email || `${profileId}@no-email.com`, name: "Developer" }
      });
    }

    const savedProject = await prisma.project.create({
      data: {
        profileId: userProfile.id,
        name: projectName || req.file.originalname.replace(".pdf", ""),
        prdVersions: {
          create: {
            versionNumber: 1,
            pdfData: req.file.buffer,
            parsedText: "Asynchronously processing PRD...",
          },
        },
      },
      include: {
        prdVersions: true
      }
    });

    const prdVersionId = savedProject.prdVersions[0].id;

    const job = await prisma.pipelineJob.create({
      data: {
        projectId: savedProject.id,
        status: "PENDING"
      }
    });

    // Trigger background process
    processPrdJob(job.id, prdVersionId).catch(err => {
      console.error(`[Job ${job.id}] Background failure:`, err);
    });

    console.log(`=== JOB ${job.id} INITIATED ===\n`);

    return res.json({
      success: true,
      jobId: job.id,
      projectId: savedProject.id,
    });

  } catch (error: any) {
    console.error("\n❌ UPLOAD ERROR:");
    console.error(error.stack || error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 1.5. Fetch Job Status
 */
app.get("/api/prd/jobs/:jobId/status", async (req, res) => {
  try {
    const job = await prisma.pipelineJob.findUnique({
      where: { id: req.params.jobId },
      include: { 
        stages: { 
          orderBy: { startedAt: "asc" } 
        } 
      }
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1.6. Fetch Stage Artifacts
 */
app.get("/api/prd/jobs/:jobId/artifacts/:stageName", async (req, res) => {
  try {
    const stageRun = await prisma.pipelineStageRun.findFirst({
      where: { 
        jobId: req.params.jobId,
        stageName: req.params.stageName
      },
      include: { artifacts: true },
    });
    if (!stageRun) return res.status(404).json({ error: "Stage run not found" });
    res.json(stageRun.artifacts[0]?.data || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1.7. Fetch Project Analysis
 */
app.get("/api/projects/:projectId/analysis", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId
        }
      },
      include: {
        prdVersion: {
          include: { project: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (!analysis) return res.status(404).json({ error: "Analysis not found" });
    
    // Inject projectName directly into the response for the frontend
    const responseData = {
      ...analysis,
      projectName: analysis.prdVersion?.project?.name || "Untitled Project"
    };
    
    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



/**
 * 2. Fetch tasks
 */
app.get("/api/projects/:projectId/tasks", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: "No analysis found" });
    }

    res.json(analysis.tasks);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2.5 Update task status
 */
app.put("/api/projects/:projectId/tasks/:taskId/status", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { status } = req.body;

    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: projectId,
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!analysis) {
      return res.status(404).json({ error: "No analysis found" });
    }

    const tasks = Array.isArray(analysis.tasks) ? (analysis.tasks as any[]) : [];
    
    // Find and update the task
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId || t.taskId === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found in analysis" });
    }

    tasks[taskIndex].status = status;

    // Save back to DB
    await prisma.pipelineAnalysis.update({
      where: { id: analysis.id },
      data: { tasks: tasks as any }
    });

    res.json({ success: true, task: tasks[taskIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Fetch traceability graph
 */
app.get("/api/projects/:projectId/traceability", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis || !analysis.traceability) {
      return res.status(404).json({
        error: "No traceability found",
      });
    }

    res.json(analysis.traceability);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Fetch architecture graph
 */
app.get("/api/projects/:projectId/architecture", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis || !analysis.architecture) {
      return res.status(404).json({
        error: "No architecture found",
      });
    }

    res.json(JSON.parse(analysis.architecture));

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Fetch code structure
 */
app.get("/api/projects/:projectId/code-structure", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: "No code structure found",
      });
    }

    res.json(analysis.codeStructure);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Fetch tests
 */
app.get("/api/projects/:projectId/tests", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: "No tests found",
      });
    }

    res.json(analysis.tests);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Fetch DevOps configuration
 */
app.get("/api/projects/:projectId/devops", async (req, res) => {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: {
        prdVersion: {
          projectId: req.params.projectId,
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: "No DevOps configuration found",
      });
    }

    res.json(analysis.devops);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. Fetch all projects for a profile
 */
app.get("/api/projects", async (req, res) => {
  try {
    const { profileId } = req.query;
    if (!profileId) return res.status(400).json({ error: "profileId is required" });

    const projects = await prisma.project.findMany({
      where: { profileId: profileId as string },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 9. Delete a project
 */
app.delete("/api/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Prisma cascading delete will handle removing jobs, versions, etc. if set up correctly
    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Push generated code to GitHub
 */
app.post("/api/push-to-github", async (req, res) => {
  try {

    const { repoName, files } = req.body;

    const repo = await createRepo(
      repoName,
      "Generated by Architecture Assistant"
    );

    await pushFiles(
      process.env.GITHUB_USERNAME!,
      repo.name,
      files,
      "main"
    );

    res.json({ success: true, repo });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* ClickUp routes are now handled by clickupRouter mounted at /api/clickup */



/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Modular Gemini Backend running on http://localhost:${PORT}`
  );
});