// src/lib/pipeline/prdHealthScore.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";

// ── Output types ──────────────────────────────────────────────────────────────

export interface HealthScore {
  score: number;
  issues: string[];
}

export interface PRDEvaluation {
  healthScore: number;        // 0–100
  complexity: number;         // 1–10
  completeness: number;       // 0–100
  timelineWeeks: number;      // estimated dev weeks
  ambiguities: string[];      // top critical ambiguities (max 8)
  issues: string[];           // key issues (max 5)
}

// ── Gemini schema (strict, minimal ─ reduces output tokens) ──────────────────

const evalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    healthScore:    { type: Type.NUMBER,  description: "PRD quality score 0-100" },
    complexity:     { type: Type.NUMBER,  description: "Engineering complexity 1-10" },
    completeness:   { type: Type.NUMBER,  description: "Lifecycle coverage 0-100" },
    timelineWeeks:  { type: Type.NUMBER,  description: "Estimated delivery in weeks" },
    ambiguities:    { type: Type.ARRAY, items: { type: Type.STRING } },
    issues:         { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["healthScore", "complexity", "completeness", "timelineWeeks", "ambiguities", "issues"],
};

// ── Legacy simple scorer (kept for backward compat with orchestrator) ─────────

const legacySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score:  { type: Type.INTEGER, description: "Score 0-100" },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["score", "issues"],
};

export async function scorePRDHealth(documentPart: any): Promise<HealthScore> {
  console.log("-> Scoring PRD Health (legacy)...");
  try {
    const res = await generateJSONResponse<HealthScore>(
      SYSTEM_PROMPTS.PRD_HEALTH_SCORE,
      documentPart,
      legacySchema
    );
    return {
      score: res.score ?? 0,
      issues: res.issues?.length ? res.issues : ["Standard technical analysis applied."],
    };
  } catch (error) {
    console.error("Failed to score PRD:", error);
    return { score: 0, issues: ["Analysis pipeline failed to generate health score."] };
  }
}

// ── New comprehensive evaluator ───────────────────────────────────────────────

export async function evaluatePRD(documentPart: any): Promise<PRDEvaluation> {
  console.log("-> Running full PRD evaluation (health, complexity, completeness, timeline)...");
  try {
    const res = await generateJSONResponse<PRDEvaluation>(
      SYSTEM_PROMPTS.PRD_EVALUATOR,
      documentPart,
      evalSchema
    );

    return {
      healthScore:   clamp(res.healthScore   ?? 0,  0,  100),
      complexity:    clamp(res.complexity    ?? 1,  1,   10),
      completeness:  clamp(res.completeness  ?? 0,  0,  100),
      timelineWeeks: Math.max(1, Math.round(res.timelineWeeks ?? 4)),
      ambiguities:   (res.ambiguities ?? []).slice(0, 8),
      issues:        (res.issues      ?? []).slice(0, 5),
    };
  } catch (error) {
    console.error("PRD evaluation failed:", error);
    return {
      healthScore: 0, complexity: 1, completeness: 0,
      timelineWeeks: 4, ambiguities: [], issues: ["Evaluation pipeline failed."],
    };
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}