// src/types/prd.ts

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface UserStory {
  id: string;
  featureId: string;
  story: string;
  acceptanceCriteria: string[];
}

export interface Task {
  type: string;
  id: string;
  storyId: string;
  featureId?: string;
  title: string;
  description: string;
  priority?: string;
  complexity: number;
  dependencies: string[];
}

export interface Sprint {
  id: string;
  name: string;
  tasks: string[];
  storyPoints: number;
}

export interface CodeStructure {
  structure: string[];
}

export interface TaskTest {
  taskId: string;
  tests: string[];
}

export interface Ambiguity {
  id: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface ClarificationQuestion {
  id: string;
  ambiguityId: string;
  question: string;
  options: string[];
}

export interface PRDHealthScore {
  score: number;
  issues: string[];
}

export interface DevOpsArtifacts {
  dockerfile: string;
  githubActions: string;
  deploymentSteps: string[];
}

export interface ChangeImpactResult {
  changedFeatures: string[];
  changedStories: string[];
  changedTasks: string[];
  impactedCodeFiles: string[];
  impactedTests: string[];
}

export interface TraceabilityNode {
  id: string;
  type: "feature" | "story" | "task" | "code" | "test" | "gateway" | "service" | "database" | "cache" | "auth" | "payments" | "blueprint";
  data: { label: string; status?: "unchanged" | "changed" | "new"; type?: string; description?: string; tech?: string; badge?: string; };
  position: { x: number; y: number };
}

export interface TraceabilityEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface TraceabilityGraph {
  nodes: TraceabilityNode[];
  edges: TraceabilityEdge[];
}

export interface ChangeImpactResult {
  changedFeatures: string[]
  changedStories: string[]
  changedTasks: string[]
  impactedCodeFiles: string[]
  impactedTests: string[]
}

export interface PipelineResult {
  features: Feature[];
  stories: UserStory[];
  tasks: Task[];
  sprints: Sprint[];
  architecture: string;
  codeStructure: string[];
  tests: TaskTest[];
  traceability: TraceabilityGraph;
  ambiguities: Ambiguity[];
  clarifications: ClarificationQuestion[];
  healthScore: PRDHealthScore;
  devops: DevOpsArtifacts;
}