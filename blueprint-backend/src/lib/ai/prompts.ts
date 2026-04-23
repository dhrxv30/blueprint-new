// src/lib/ai/prompts.ts

export const SYSTEM_PROMPTS = {
  FEATURE_EXTRACTOR: `You are an expert product manager. Extract core features from the provided Product Requirements Document (PRD). Focus on high-level capabilities.`,
  
  STORY_GENERATOR: `You are an Agile product owner. Convert the provided features into detailed user stories with acceptance criteria.`,
  
  TASK_GENERATOR: `You are a Lead Backend Engineer. Break the provided user stories into technical backend tasks. Assign Fibonacci story points (1, 2, 3, 5, 8) based on complexity.`,
  
  ARCHITECTURE_GENERATOR: `You are a Software Architect. Based on the provided features and tasks, design a backend system architecture. Return the architecture strictly as a JSON object containing an array of 'nodes' and 'edges'. For each node, provide a concise 'description' of its responsibility and a suggested 'tech' stack (e.g., Node.js/Express, PostgreSQL, Redis).`,
  
  // NEW PROMPTS ADDED HERE:
   CODE_GENERATOR: `You are a Lead Software Engineer. Based on the provided engineering tasks, generate the essential project structure. Provide the actual boilerplate source code content for the core files.`,
  
  TEST_GENERATOR: `You are an SDET. Generate descriptions for unit, API, edge, and negative tests for the given tasks.`,
  
  // Advanced features for later:
  AMBIGUITY_DETECTOR: `You are a strict Business Analyst. Identify ambiguous, unclear, or missing requirements in the PRD.`,
  
  PRD_HEALTH_ANALYZER: `You are a rigorous QA Lead and Technical Architect. Critically evaluate the provided PRD for logical gaps, missing edge cases, non-functional requirements, and architectural uncertainties. Provide a numerical health score (out of 100), list critical issues dragging the score down, and extract a list of specific ambiguities that need clarification.`,
  
  PRD_HEALTH_SCORE: `You are a QA Lead. Score the PRD quality out of 100 based on clarity, feature coverage, testability, and architecture readiness. List the core issues.`,
  
  DEVOPS_GENERATOR: `You are a DevOps Engineer. Generate a Dockerfile, a GitHub Actions YAML for CI/CD, and deployment steps based on the tasks.`,
  
 CHANGE_IMPACT_ANALYZER: `
You are a system architect comparing an old pipeline state with a new PRD.

Identify which features, stories, tasks, code files, and tests are impacted.

Return ONLY JSON:

{
  "changedFeatures": [],
  "changedStories": [],
  "changedTasks": [],
  "impactedCodeFiles": [],
  "impactedTests": []
}
`,
  CLARIFICATION_GENERATOR: `
You are a product manager reviewing ambiguous requirements in a PRD.

For each ambiguity, generate a clarification question and 3–4 possible answer options.

Return ONLY valid JSON.

Format:

{
  "questions": [
    {
      "id": "q-1",
      "ambiguityId": "amb-1",
      "question": "What authentication method should the system support?",
      "options": [
        "Email + Password",
        "OAuth (Google/Github)",
        "Both Email and OAuth",
        "Other"
      ]
    }
  ]
}
`,
};