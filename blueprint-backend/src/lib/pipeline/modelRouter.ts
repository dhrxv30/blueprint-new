// src/lib/pipeline/modelRouter.ts
import { generateJSONResponse } from "../ai/gemini.js";
import type { Schema } from "@google/genai";

export interface StageOutput<T> {
  status: "success" | "partial" | "failed";
  data?: T;
  errors?: string[];
  confidence?: number;
}

/**
 * Runs a task with Gemini and includes a structured repair loop if the JSON is malformed.
 */
export async function runWithRepair<T>(
  systemInstruction: string,
  userPromptOrFile: any,
  responseSchema: Schema,
  stageName: string,
  maxRepairs: number = 2
): Promise<StageOutput<T>> {
  let currentPrompt = userPromptOrFile;
  let errors: string[] = [];

  for (let repairAttempt = 0; repairAttempt <= maxRepairs; repairAttempt++) {
    try {
      if (repairAttempt > 0) {
        console.warn(`\n🔧 Repairing Stage: ${stageName} (Attempt ${repairAttempt}/${maxRepairs})`);
        
        const lastError = errors[errors.length - 1];
        const repairInstruction = `
          IMPORTANT: Your previous response was invalid. 
          Error: ${lastError}
          Please fix the JSON structure and ensure all fields match the schema.
          Return ONLY corrected JSON.
        `;

        if (Array.isArray(currentPrompt)) {
          currentPrompt = [...currentPrompt, { text: repairInstruction }];
        } else {
          currentPrompt = [{ text: currentPrompt }, { text: repairInstruction }];
        }
      }

      const result = await generateJSONResponse<T>(
        systemInstruction,
        currentPrompt,
        responseSchema
      );

      return {
        status: "success",
        data: result,
        confidence: 0.95
      };

    } catch (error: any) {
      const errorMessage = error.message || "Unknown engine error";
      errors.push(errorMessage);
      
      if (errorMessage.includes("API_KEY") || errorMessage.includes("not found")) {
        return { status: "failed", errors: [errorMessage] };
      }

      if (errorMessage.includes("429") || errorMessage.includes("Quota")) {
        console.warn(`⏳ Quota exceeded. Retrying in 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  return {
    status: "failed",
    errors: [`Pipeline failed at ${stageName} after ${maxRepairs} repairs. Last error: ${errors[errors.length - 1]}`]
  };
}

/**
 * Exclusively routes tasks to the Gemini 3 Flash engine.
 */
export async function routeTask<T>(
  stageName: string,
  systemInstruction: string,
  userPromptOrFile: any,
  responseSchema: Schema
): Promise<StageOutput<T>> {
  console.log(`\n🚀 Inference Stage: ${stageName}`);
  
  const result = await runWithRepair<T>(
    systemInstruction,
    userPromptOrFile,
    responseSchema,
    stageName
  );

  if (result.status === "success") return result;

  throw new Error(`\n❌ AI ENGINE FAILURE [${stageName}]: ${result.errors?.join(', ')}`);
}
