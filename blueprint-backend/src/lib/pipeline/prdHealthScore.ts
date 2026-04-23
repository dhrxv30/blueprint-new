// src/lib/pipeline/prdHealthScore.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";

export interface HealthScore {
  score: number;
  issues: string[];
}

const healthSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score from 0 to 100 based on technical readiness" },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["score", "issues"]
};

// FIXED: Accept documentPart (any) instead of string
export async function scorePRDHealth(documentPart: any): Promise<HealthScore> {
  console.log("-> Scoring PRD Health...");
  
  try {
    const res = await generateJSONResponse<HealthScore>(
      SYSTEM_PROMPTS.PRD_HEALTH_SCORE,
      documentPart, // FIXED: Pass the raw PDF object directly, do not stringify!
      healthSchema
    );
    
    return {
      score: res.score ?? 0,
      issues: res.issues?.length ? res.issues : ["Standard technical analysis applied."]
    };
  } catch (error) {
    console.error("Failed to score PRD:", error);
    return { score: 0, issues: ["Analysis pipeline failed to generate health score."] };
  }
}