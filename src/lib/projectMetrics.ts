export interface TaskLike {
  complexity?: number | null;
}

export interface AnalysisLike {
  features?: unknown[];
  stories?: unknown[];
  tasks?: TaskLike[];
  sprints?: unknown[];
  architecture?: unknown;
  codeStructure?: unknown;
  tests?: unknown[];
  traceability?: unknown;
  devops?: unknown;
  ambiguities?: unknown[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeHealthScore(rawHealthScore: unknown, ambiguities: unknown[] = []): number {
  const directScore = typeof rawHealthScore === "number"
    ? rawHealthScore
    : (rawHealthScore as { score?: number } | null)?.score;

  if (typeof directScore === "number" && Number.isFinite(directScore) && directScore > 0) {
    return clamp(Math.round(directScore), 0, 100);
  }

  const ambiguityPenalty = ambiguities.length * 5;
  return clamp(95 - ambiguityPenalty, 10, 95);
}

export function calculateComplexity(tasks: TaskLike[] = []): "Low" | "Medium" | "High" {
  const totalPoints = tasks.reduce((sum, task) => {
    const points = Number(task?.complexity);
    return Number.isFinite(points) && points > 0 ? sum + points : sum + 3;
  }, 0);

  if (totalPoints > 80) return "High";
  if (totalPoints > 30) return "Medium";
  return "Low";
}

export function calculateTimelineWeeks(tasks: TaskLike[] = []): number {
  const points = tasks.reduce((sum, task) => {
    const value = Number(task?.complexity);
    return Number.isFinite(value) && value > 0 ? sum + value : sum + 3;
  }, 0);

  const weeklyCapacityPoints = 20;
  return Math.max(1, Math.ceil(points / weeklyCapacityPoints));
}

export function calculateCompleteness(analysis: AnalysisLike): number {
  const checks = [
    Array.isArray(analysis.features) && analysis.features.length > 0,
    Array.isArray(analysis.stories) && analysis.stories.length > 0,
    Array.isArray(analysis.tasks) && analysis.tasks.length > 0,
    Array.isArray(analysis.sprints) && analysis.sprints.length > 0,
    !!analysis.architecture,
    !!analysis.codeStructure,
    Array.isArray(analysis.tests) && analysis.tests.length > 0,
    !!analysis.traceability,
    !!analysis.devops,
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}
