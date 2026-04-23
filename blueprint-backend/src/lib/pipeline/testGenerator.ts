// src/lib/pipeline/testGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Task, TaskTest } from "../../types/prd.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";

const testSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          tests: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING, description: "Description of a specific test case" } 
          }
        },
        required: ["taskId", "tests"]
      }
    }
  },
  required: ["tests"]
};

export async function generateTests(tasks: Task[]): Promise<TaskTest[]> {
  console.log("-> Generating QA Test Plans...");
  
  const res = await generateJSONResponse<{ tests: TaskTest[] }>(
    SYSTEM_PROMPTS.TEST_GENERATOR,
    JSON.stringify(tasks),
    testSchema
  );
  
  return res.tests || [];
}