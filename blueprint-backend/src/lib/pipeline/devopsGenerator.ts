// src/lib/pipeline/devopsGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Task, DevOpsArtifacts } from "../../types/prd.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";

const devopsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dockerfile: { type: Type.STRING },
    githubActions: { type: Type.STRING },
    deploymentSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["dockerfile", "githubActions", "deploymentSteps"]
};

export async function generateDevOps(tasks: Task[]): Promise<DevOpsArtifacts> {
  console.log("-> Generating DevOps Artifacts...");
  return await generateJSONResponse<DevOpsArtifacts>(
    SYSTEM_PROMPTS.DEVOPS_GENERATOR,
    JSON.stringify(tasks),
    devopsSchema
  );
}