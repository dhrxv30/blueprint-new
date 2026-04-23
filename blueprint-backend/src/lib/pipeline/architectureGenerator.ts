// src/lib/pipeline/architectureGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";

const archSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          type: { type: Type.STRING, description: "e.g., database, service, frontend, api" },
          description: { type: Type.STRING },
          tech: { type: Type.STRING }
        },
        required: ["id", "label", "type", "description"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from: { type: Type.STRING },
          to: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["from", "to"]
      }
    }
  },
  required: ["nodes", "edges"]
};

export async function generateArchitecture(features: any[], tasks: any[]): Promise<any> {
  console.log("-> Generating Architecture Graph...");
  try {
    // We send the extracted features and tasks so the AI knows what to map
    const payload = JSON.stringify({ features, tasks });
    
    const res = await generateJSONResponse<any>(
      SYSTEM_PROMPTS.ARCHITECTURE_GENERATOR,
      payload,
      archSchema
    );
    
    return res;
  } catch (error) {
    console.error("Failed to generate architecture:", error);
    return { nodes: [], edges: [] };
  }
}