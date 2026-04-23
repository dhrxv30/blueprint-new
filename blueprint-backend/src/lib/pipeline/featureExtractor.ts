// src/lib/pipeline/featureExtractor.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Feature } from "../../types/prd.js";
import { Type, type Schema } from "@google/genai";

// 1. Define the strict schema for Gemini 3
const featureSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    features: {
      type: Type.ARRAY,
      description: "Extract the core high-level modules of the application. Group granular requirements into broad, cohesive features (e.g., 'User Authentication & Identity' instead of separate login/logout/signup features).",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "e.g., feat-1" },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: { type: Type.STRING, description: "Must be one of: high, medium, low" }
        },
        required: ["id", "name", "description", "priority"]
      }
    }
  },
  required: ["features"]
};

// 2. The module function
export async function extractFeatures(documentPart: any): Promise<Feature[]> {
  console.log("-> Running Feature Extractor...");
  
  // Call our Gemini helper with exactly 3 arguments
  const res = await generateJSONResponse<{ features: Feature[] }>(
    SYSTEM_PROMPTS.FEATURE_EXTRACTOR, // 1. System Prompt
    documentPart,                     // 2. Payload (The PDF document)
    featureSchema                     // 3. Strict Schema
  );
  
  return res.features || [];
}