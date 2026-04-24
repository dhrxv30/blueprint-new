// src/lib/pipeline/orchestrator.ts
import { PrismaClient } from "@prisma/client";
import type { PipelineJob, PipelineStageRun, PipelineArtifact } from "@prisma/client";
import { routeTask, type StageOutput } from "./modelRouter.js";
import { Type, type Schema } from "@google/genai";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { buildTraceability } from "./traceabilityGenerator.js";
import { generateSprints } from "./sprintPlanner.js";

const prisma = new PrismaClient();

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

export async function processPrdJob(jobId: string, documentPart: any) {
  console.log(`\n🧵 Starting background processing for Job: ${jobId}`);
  
  await prisma.pipelineJob.update({
    where: { id: jobId },
    data: { status: "IN_PROGRESS" }
  });

  try {
    // Stage 0: Ingest & Normalize
    const ingestResult = await runStage<NormalizedText>(jobId, "Ingest & Normalize", async () => {
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          sections: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["text", "sections"]
      };
      return await routeTask<NormalizedText>(
        "Ingest",
        "Extract all text from the provided PRD PDF and format it as structured Markdown. Identify main sections (Goals, Requirements, NFRs, etc.).",
        documentPart,
        schema
      );
    });
    if (ingestResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: ingestResult.errors?.[0] || "Ingest stage failed" }
        });
        return;
    }
    const normalizedText = ingestResult.data!.text;

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
        JSON.stringify(features),
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
        JSON.stringify(stories),
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
                  parentId: { type: Type.STRING, description: "ID of the parent group node, if any" },
                  style: { type: Type.OBJECT, properties: { backgroundColor: { type: Type.STRING } } }
                }, 
                required: ["id", "label", "type", "description"] 
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
          JSON.stringify({ features, tasks }),
          schema
        );
      }),
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
            `Generate boilerplate code and DevOps configurations. 
             System Architecture Context: ${JSON.stringify(architecture)}
             Tasks to Implement: ${JSON.stringify(tasks)}`,
            normalizedText,
            schema
        );
      }),
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
                            method: { type: Type.STRING },
                            endpoint: { type: Type.STRING },
                            description: { type: Type.STRING },
                            expected: { type: Type.STRING },
                            status: { type: Type.STRING },
                            category: { type: Type.STRING }
                        }, 
                        required: ["id", "method", "endpoint", "description", "expected", "status", "category"] 
                    } 
                },
                postmanCollection: { type: Type.OBJECT }
            },
            required: ["tests", "postmanCollection"]
        };
        return await routeTask<{ tests: any[], postmanCollection: any }>(
            "Testing",
            SYSTEM_PROMPTS.TEST_GENERATOR,
            JSON.stringify(tasks),
            schema
        );
      }),
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
      })
    ]);

    const [archResult, codeResult, testResult, healthResult] = results;

    if (archResult.status === "failed" || codeResult.status === "failed" || testResult.status === "failed" || healthResult.status === "failed") {
        await prisma.pipelineJob.update({
            where: { id: jobId },
            data: { status: "FAILED", error: "One or more parallel stages failed" }
        });
        return;
    }

    const architecture: Architecture = archResult.data!;
    const codeFiles: CodeFile[] = codeResult.data!.codeFiles;
    const devops: DevOps = codeResult.data!.devops;
    const tests: any[] = testResult.data!.tests;
    const postmanCollection = testResult.data!.postmanCollection;
    const healthData: PRDHealth = healthResult.data!;

    // Stage 7: Deterministic Post-Processing
    console.log("-> Running Deterministic Post-Processing...");
    const sprints = generateSprints(tasks || []);
    const traceability = buildTraceability(
        features || [], 
        stories || [], 
        tasks || [], 
        architecture || null, 
        codeFiles || [],
        tests || []
    );
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
