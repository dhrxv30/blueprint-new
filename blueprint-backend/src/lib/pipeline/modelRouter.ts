// src/lib/pipeline/modelRouter.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { generateOllamaResponse } from "../ai/ollama.js";
import type { Schema } from "@google/genai";

export interface StageOutput<T> {
  status: "success" | "partial" | "failed";
  data?: T;
  errors?: string[];
  confidence?: number;
}

/**
 * Runs a task with Gemini and includes a structured repair loop if the JSON is malformed
 * or the model fails to follow the schema.
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
        console.warn(`\n🔧 Attempting Repair Loop for Stage: ${stageName} (Attempt ${repairAttempt}/${maxRepairs})`);
        
        const lastError = errors[errors.length - 1];
        const repairInstruction = `
IMPORTANT: Your previous response was invalid. 
Error: ${lastError}

Please fix the JSON structure and ensure all required fields are present according to the schema.
Return ONLY the corrected JSON.
        `;

        // If currentPrompt is already an array (multi-part), append the repair instruction
        if (Array.isArray(currentPrompt)) {
          currentPrompt = [...currentPrompt, { text: repairInstruction }];
        } else {
          currentPrompt = [currentPrompt, { text: repairInstruction }];
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
      const errorMessage = error.message || "Unknown generation error";
      errors.push(errorMessage);
      
      // If it's a fatal error (non-parse error), we might want to stop early, 
      // but let's try repairing anyway unless it's a clear auth/config error.
      if (errorMessage.includes("API_KEY") || errorMessage.includes("not found")) {
        return { status: "failed", errors: [errorMessage] };
      }

      // Intelligent backoff for rate limits
      if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("Too Many Requests")) {
        console.warn(`⏳ Rate limit hit. Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Standard 1s delay for other errors
      }
    }
  }

  return {
    status: "failed",
    errors: [`Failed after ${maxRepairs} repair attempts. Last error: ${errors[errors.length - 1]}`]
  };
}

/**
 * Routes the task to the appropriate model.
 * Currently defaults to Gemini as the primary cloud model.
 * Fallback to Ollama or other models can be implemented here later.
 */
export async function routeTask<T>(
  stageName: string,
  systemInstruction: string,
  userPromptOrFile: any,
  responseSchema: Schema
): Promise<StageOutput<T>> {
  console.log(`\n🚀 Routing Stage: ${stageName}`);
  
  const useOllamaPrimary = process.env.USE_OLLAMA_PRIMARY === "true";

  if (!useOllamaPrimary) {
    // Primary: Gemini
    const result = await runWithRepair<T>(
      systemInstruction,
      userPromptOrFile,
      responseSchema,
      stageName
    );

    if (result.status === "success") return result;
    console.warn(`\n⚠️ Stage ${stageName} failed on Gemini. Attempting Ollama Fallback...`);
  } else {
    console.log(`\n🦙 Using Ollama as primary model for stage ${stageName}`);
  }

  // FALLBACK: Ollama
  console.warn(`\n⚠️ Stage ${stageName} failed on Primary Model. Attempting Ollama Fallback...`);
  
  try {
    const ollamaResult = await generateOllamaResponse<T>(
        systemInstruction,
        userPromptOrFile,
        responseSchema
    );

    return {
        status: "success", // Mark as success since the fallback worked
        data: ollamaResult,
        confidence: 0.7 // Lower confidence for local model
    };
  } catch (ollamaError: any) {
    console.error(`\n❌ All models failed for stage ${stageName}.`);
    return {
        status: "failed",
        errors: [`Ollama Error: ${ollamaError.message}`]
    };
  }
}
