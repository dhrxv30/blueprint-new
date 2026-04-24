export interface TaskLike {
  complexity?: number | null;
  dependencies?: unknown[];
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
  postmanCollection?: unknown;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getTaskPoints(tasks: TaskLike[] = []): number {
  return tasks.reduce((sum, task) => {
    const points = Number(task?.complexity);
    return Number.isFinite(points) && points > 0 ? sum + points : sum + 3;
  }, 0);
}

function getDependencyCount(tasks: TaskLike[] = []): number {
  return tasks.reduce((sum, task) => {
    const deps = Array.isArray(task?.dependencies) ? task.dependencies.length : 0;
    return sum + deps;
  }, 0);
}

export function normalizeHealthScore(rawHealthScore: unknown, ambiguities: unknown[] = [], completeness = 0): number {
  const directScore = typeof rawHealthScore === "number"
    ? rawHealthScore
    : (rawHealthScore as { score?: number } | null)?.score;

  if (typeof directScore === "number" && Number.isFinite(directScore) && directScore > 0) {
    return clamp(Math.round(directScore), 0, 100);
  }

  const ambiguityPenalty = ambiguities.length * 4;
  const completenessBonus = Math.round(completeness * 0.12);
  return clamp(70 + completenessBonus - ambiguityPenalty, 10, 92);
}

export function calculateComplexity(tasks: TaskLike[] = [], ambiguities: unknown[] = []): "Low" | "Medium" | "High" {
  const totalPoints = getTaskPoints(tasks);
  const dependencyCount = getDependencyCount(tasks);
  const ambiguityPressure = ambiguities.length;

  const weightedScore = totalPoints + dependencyCount * 1.5 + ambiguityPressure * 2;

  if (weightedScore > 95) return "High";
  if (weightedScore > 40) return "Medium";
  return "Low";
}

export function calculateTimelineWeeks(
  tasks: TaskLike[] = [],
  opts?: { ambiguities?: unknown[]; plannedSprints?: number }
): number {
  const points = getTaskPoints(tasks);
  const dependencyCount = getDependencyCount(tasks);
  const ambiguityCount = opts?.ambiguities?.length ?? 0;
  const plannedSprints = opts?.plannedSprints ?? 0;

  const baseWeeklyCapacityPoints = 20;
  const riskMultiplier = 1 + Math.min(0.6, dependencyCount * 0.02 + ambiguityCount * 0.03);
  const pointDrivenEstimate = Math.ceil((points * riskMultiplier) / baseWeeklyCapacityPoints);

  return Math.max(1, plannedSprints, pointDrivenEstimate);
}

export function calculateCompleteness(analysis: AnalysisLike): number {
  const weightedChecks: Array<{ present: boolean; weight: number }> = [
    { present: Array.isArray(analysis.features) && analysis.features.length > 0, weight: 12 },
    { present: Array.isArray(analysis.stories) && analysis.stories.length > 0, weight: 10 },
    { present: Array.isArray(analysis.tasks) && analysis.tasks.length > 0, weight: 14 },
    { present: Array.isArray(analysis.sprints) && analysis.sprints.length > 0, weight: 10 },
    { present: !!analysis.architecture, weight: 14 },
    { present: !!analysis.codeStructure, weight: 10 },
    { present: Array.isArray(analysis.tests) && analysis.tests.length > 0, weight: 10 },
    { present: !!analysis.traceability, weight: 10 },
    { present: !!analysis.devops, weight: 5 },
    { present: !!analysis.postmanCollection, weight: 5 },
  ];

  const earned = weightedChecks.reduce((sum, check) => sum + (check.present ? check.weight : 0), 0);
  const total = weightedChecks.reduce((sum, check) => sum + check.weight, 0);

  return clamp(Math.round((earned / total) * 100), 0, 100);
}
