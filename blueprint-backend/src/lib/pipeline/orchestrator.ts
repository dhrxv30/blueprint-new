// src/lib/pipeline/orchestrator.ts
import { PrismaClient } from "@prisma/client";
import type { PipelineJob, PipelineStageRun, PipelineArtifact } from "@prisma/client";
import { routeTask, type StageOutput } from "./modelRouter.js";
import { Type, type Schema } from "@google/genai";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { buildTraceability } from "./traceabilityGenerator.js";
import { generateSprints } from "./sprintPlanner.js";
import { runPythonPdfParser } from "./pythonBridge.js";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL as string
    }
  }
});

// Stage Output Types
interface NormalizedText { text: string; sections: string[] }
interface Feature { id: string; name: string; description: string; priority: "high" | "medium" | "low" }
interface UserStory { id: string; featureId: string; story: string; acceptanceCriteria: string[] }
interface Task { id: string; storyId: string; featureId: string; title: string; description: string; type: string; priority: string; complexity: number; dependencies: string[] }
interface Architecture { nodes: any[]; edges: any[] }
interface DevOps { dockerfile: string; githubActions: string; deploymentSteps: string[] }
interface CodeFile { path: string; name: string; language: string; content: string }
interface TaskTest { taskId: string; tests: string[] }
interface PRDHealth { healthScore: { score: number; issues: string[] }; ambiguities: string[] }

export async function processPrdJob(jobId: string, prdVersionId: string) {
  console.log(`\n🧵 Starting background processing for Job: ${jobId}`);
  
  // Wait for the job record to be visible (handles eventual consistency/slow commits)
  let job = null;
  for (let i = 0; i < 5; i++) {
    job = await prisma.pipelineJob.findUnique({ where: { id: jobId } });
    if (job) break;
    console.warn(`[Job ${jobId}] Record not found yet, retrying in 500ms...`);
    await new Promise(r => setTimeout(r, 500));
  }

  if (!job) {
    console.error(`[Job ${jobId}] FATAL: Job record never appeared in DB.`);
    return;
  }

  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: { status: "IN_PROGRESS" }
  });

  try {
    // Stage 0: Ingest & Normalize (Using Python Parser)
    const ingestResult = await runStage<any>(jobId, "Ingest & Normalize", async () => {
        try {
            const prdVersion = await prisma.prdVersion.findUnique({ where: { id: prdVersionId } });
            if (!prdVersion || !(prdVersion as any).pdfData) {
                 return { status: "failed", errors: ["No PDF data found in database"] };
            }

            const parsedJson = await runPythonPdfParser((prdVersion as any).pdfData);
            
            // Save to DB
            const textContent = parsedJson.chunks.map((c: any) => c.content).join("\n");
            await prisma.prdVersion.update({
                where: { id: prdVersionId },
                data: { 
                   parsedJson: parsedJson as any,
                   parsedText: textContent 
                } as any
            });

            return { status: "success", data: parsedJson };
        } catch (e: any) {
            return { status: "failed", errors: [e.message] };
        }
    });
    if (ingestResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: ingestResult.errors?.[0] || "Ingest stage failed" }
        });
        return;
    }
    const normalizedText = ingestResult.data!.chunks.map((c: any) => c.content).join("\n\n");

    // Stage 1: Feature Extraction
    const featureResult = await runStage<{ features: Feature[] }>(jobId, "Feature Extraction", async () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          features: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING }
              },
              required: ["id", "name", "description", "priority"]
            }
          }
        },
        required: ["features"]
      };
      return await routeTask<{ features: Feature[] }>(
        "Features",
        SYSTEM_PROMPTS.FEATURE_EXTRACTOR,
        normalizedText,
        schema
      );
    });
    if (featureResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: featureResult.errors?.[0] || "Feature Extraction failed" }
        });
        return;
    }
    const features = featureResult.data!.features;

    // Stage 2: User Story Generation
    const storyResult = await runStage<{ stories: UserStory[] }>(jobId, "User Story Generation", async () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          stories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                featureId: { type: Type.STRING },
                story: { type: Type.STRING },
                acceptanceCriteria: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "featureId", "story", "acceptanceCriteria"]
            }
          }
        },
        required: ["stories"]
      };
      return await routeTask<{ stories: UserStory[] }>(
        "Stories",
        SYSTEM_PROMPTS.STORY_GENERATOR,
        features.map(f => `Feature: ${f.name}\nDescription: ${f.description}`).join("\n\n"),
        schema
      );
    });
    if (storyResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: storyResult.errors?.[0] || "Story Generation failed" }
        });
        return;
    }
    const stories = storyResult.data!.stories;

    // Stage 3: Technical Task Planning
    const taskResult = await runStage<{ tasks: Task[] }>(jobId, "Task Planning", async () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          tasks: {
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
                dependencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "IDs of other tasks this task depends on" }
              },
              required: ["id", "storyId", "featureId", "title", "description", "type", "priority", "complexity", "dependencies"]
            }
          }
        },
        required: ["tasks"]
      };
      return await routeTask<{ tasks: Task[] }>(
        "Tasks",
        SYSTEM_PROMPTS.TASK_GENERATOR,
        stories.map(s => `Story: ${s.story}\nCriteria: ${s.acceptanceCriteria.join(", ")}`).join("\n\n"),
        schema
      );
    });
    if (taskResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: taskResult.errors?.[0] || "Task Planning failed" }
        });
        return;
    }
    const tasks = taskResult.data!.tasks;

    // Parallel Stages: Architecture Synthesis, Implementation Details, Test Planning, Health Analysis
    console.log("-> Launching parallel generation for Architecture, Implementation, Testing, and Health Analysis...");
    // Parallel Stages: Architecture Synthesis, Implementation Details, Test Planning, Health Analysis
    console.log("-> Launching parallel generation for Architecture, Implementation, Testing, and Health Analysis...");
    
    // We use individual try-catch or handle failure gracefully to ensure partial success
    const results = await Promise.all([
      runStage<Architecture>(jobId, "Architecture Synthesis", async () => {
        const schema: Schema = {
          type: Type.OBJECT,
          properties: {
            nodes: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  label: { type: Type.STRING }, 
                  type: { type: Type.STRING }, 
                  description: { type: Type.STRING },
                  relatedTaskIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "IDs of TASK-XXX that this node implements" },
                  parentId: { type: Type.STRING },
                  style: { type: Type.OBJECT, properties: { backgroundColor: { type: Type.STRING } } }
                }, 
                required: ["id", "label", "type", "description", "relatedTaskIds"] 
              } 
            },
            edges: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  source: { type: Type.STRING }, 
                  target: { type: Type.STRING }, 
                  label: { type: Type.STRING },
                  animated: { type: Type.BOOLEAN }
                }, 
                required: ["id", "source", "target", "label", "animated"] 
              } 
            }
          },
          required: ["nodes", "edges"]
        };
        return await routeTask<Architecture>(
          "Architecture",
          SYSTEM_PROMPTS.ARCHITECTURE_GENERATOR,
          `
PROJECT CONTEXT FOR ARCHITECTURAL DESIGN:

FEATURES TO IMPLEMENT:
${features.map(f => `[${f.id}] ${f.name}: ${f.description}`).join("\n")}

TECHNICAL TASKS & REQUIREMENTS:
${tasks.map(t => `[${t.id}] ${t.title}: ${t.description} (Priority: ${t.priority}, Complexity: ${t.complexity})`).join("\n")}

INSTRUCTIONS:
Design a high-level system architecture that satisfies all feature requirements and provides a foundation for the listed tasks. 
Ensure every component in the architecture can be traced back to at least one TASK-ID.
          `,
          schema
        );
      }).catch(e => ({ status: "failed", errors: [e.message] } as StageOutput<Architecture>)),

      runStage<{ codeFiles: CodeFile[], devops: DevOps }>(jobId, "Implementation Details", async () => {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                codeFiles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { path: { type: Type.STRING }, name: { type: Type.STRING }, language: { type: Type.STRING }, content: { type: Type.STRING } }, required: ["path", "name", "language", "content"] } },
                devops: { type: Type.OBJECT, properties: { dockerfile: { type: Type.STRING }, githubActions: { type: Type.STRING }, deploymentSteps: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["dockerfile", "githubActions", "deploymentSteps"] }
            },
            required: ["codeFiles", "devops"]
        };
        return await routeTask<{ codeFiles: CodeFile[], devops: DevOps }>(
            "Implementation",
            `Generate production scaffold for these tasks:\n${tasks.map(t=>t.title).slice(0,5).join("\n")}`,
            normalizedText,
            schema
        );
      }).catch(e => ({ status: "failed", errors: [e.message] } as StageOutput<any>)),

      runStage<{ tests: any[], postmanCollection: any }>(jobId, "Test Planning", async () => {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                tests: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: { 
                            id: { type: Type.STRING },
                            taskId: { type: Type.STRING, description: "The TASK-XXX ID this test covers" },
                            method: { type: Type.STRING },
                            endpoint: { type: Type.STRING },
                            description: { type: Type.STRING },
                            expected: { type: Type.STRING },
                            status: { type: Type.STRING },
                            category: { type: Type.STRING }
                        }, 
                        required: ["id", "taskId", "method", "endpoint", "description", "expected", "status", "category"] 
                    } 
                },
                postmanCollection: { type: Type.OBJECT }
            },
            required: ["tests", "postmanCollection"]
        };
        return await routeTask<{ tests: any[], postmanCollection: any }>(
            "Testing",
            SYSTEM_PROMPTS.TEST_GENERATOR,
            tasks.map(t=>t.title + ": " + t.description).slice(0,5).join("\n\n"),
            schema
        );
      }).catch(e => ({ status: "failed", errors: [e.message] } as StageOutput<any>)),

      runStage<PRDHealth>(jobId, "Health & Ambiguity Analysis", async () => {
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                healthScore: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        issues: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["score", "issues"]
                },
                ambiguities: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["healthScore", "ambiguities"]
        };
        return await routeTask<PRDHealth>(
            "HealthAnalysis",
            SYSTEM_PROMPTS.PRD_HEALTH_ANALYZER,
            normalizedText,
            schema
        );
      }).catch(e => ({ status: "failed", errors: [e.message] } as StageOutput<PRDHealth>))
    ]);

    const [archResult, codeResult, testResult, healthResult] = results;

    // We no longer fail the whole job if parallel stages fail.
    // We proceed with whatever data we managed to get.
    const architecture: Architecture = archResult.status === "success" ? archResult.data! : { nodes: [], edges: [] };
    const codeFiles: CodeFile[] = codeResult.status === "success" ? codeResult.data!.codeFiles : [];
    const devops: DevOps = codeResult.status === "success" ? codeResult.data!.devops : { dockerfile: "", githubActions: "", deploymentSteps: [] };
    const tests: any[] = testResult.status === "success" ? testResult.data!.tests : [];
    const postmanCollection = testResult.status === "success" ? testResult.data!.postmanCollection : {};
    const healthData: PRDHealth = healthResult.status === "success" ? healthResult.data! : { healthScore: { score: 0, issues: ["Analysis failed"] }, ambiguities: [] };

    // Stage 7: Deterministic Post-Processing
    console.log("-> Running Deterministic Post-Processing...");
    const sprints = generateSprints(tasks || []);
    const traceability = buildTraceability(features || [], stories || [], tasks || [], architecture || null, codeFiles || []);
    const codeStructure = buildFileTree(codeFiles || []);

    // Persist final result to PipelineAnalysis (Compatibility layer)
    const job = await prisma.pipelineJob.findUnique({ where: { id: jobId } });
    if (job) {
        const prdVersion = await prisma.prdVersion.findFirst({
            where: { projectId: job.projectId },
            orderBy: { versionNumber: 'desc' }
        });
        if (prdVersion) {
            // Use a type cast to bypass stale Prisma Client types if generation is blocked by EPERM
            const analysisData: any = {
                prdVersionId: prdVersion.id,
                features: features as any,
                stories: stories as any,
                tasks: tasks as any,
                sprints: sprints as any,
                architecture: JSON.stringify(architecture),
                codeStructure: codeStructure as any,
                tests: tests as any,
                traceability: traceability as any,
                devops: devops as any,
                healthScore: healthData.healthScore as any,
                ambiguities: healthData.ambiguities as any,
                postmanCollection: postmanCollection as any
            };

            await prisma.pipelineAnalysis.create({
                data: analysisData
            });

                if (healthData.ambiguities && healthData.ambiguities.length > 0) {
                  const dataToInsert = healthData.ambiguities.map((a: any) => ({
                    projectId: job.projectId,
                    question: typeof a === 'string' ? a : a.description || a,
                    status: "PENDING"
                  }));
                  
                  await (prisma as any).ambiguity.createMany({
                    data: dataToInsert.map(d => ({
                      ...d,
                      updatedAt: new Date()
                    }))
                  });
                  console.log(`  📝 Seeded ${dataToInsert.length} ambiguity questions for chat resolution`);
                }
        }
    }

    await prisma.pipelineJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED" }
    });

    console.log(`\n✅ Job ${jobId} completed successfully!`);

  } catch (error: any) {
    console.error(`\n🔥 Fatal Job Error:`, error);
    await prisma.pipelineJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: error.message }
    });
  }
}

async function runStage<T>(jobId: string, stageName: string, stageFn: () => Promise<StageOutput<T>>): Promise<StageOutput<T>> {
  const stageRun = await prisma.pipelineStageRun.create({
    data: {
      jobId,
      stageName,
      status: "IN_PROGRESS",
      startedAt: new Date()
    }
  });

  try {
    const result = await stageFn();

    await prisma.pipelineStageRun.update({
      where: { id: stageRun.id },
      data: {
        status: result.status === "success" ? "COMPLETED" : "FAILED",
        completedAt: new Date(),
        error: result.errors?.join(", ") || null
      }
    });

    if (result.data) {
      await prisma.pipelineArtifact.create({
        data: {
          stageRunId: stageRun.id,
          data: result.data as any
        }
      });
    }

    return result;

  } catch (error: any) {
    await prisma.pipelineStageRun.update({
      where: { id: stageRun.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error.message
      }
    });
    return { status: "failed", errors: [error.message] };
  }
}

function buildFileTree(files: CodeFile[]): any[] {
  const root: any[] = [];
  if (!Array.isArray(files)) return root;
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    parts.forEach((part: string, index: number) => {
      const isFile = index === parts.length - 1;
      let existingNode = currentLevel.find(n => n.name === part);
      if (existingNode) {
        if (!isFile) currentLevel = existingNode.children;
      } else {
        const newNode: any = {
          path: parts.slice(0, index + 1).join('/'),
          name: part,
          type: isFile ? 'file' : 'folder'
        };
        if (isFile) {
          newNode.language = file.language;
          newNode.content = file.content;
        } else {
          newNode.children = [];
        }
        currentLevel.push(newNode);
        if (!isFile) currentLevel = newNode.children;
      }
    });
  });
  return root;
}
