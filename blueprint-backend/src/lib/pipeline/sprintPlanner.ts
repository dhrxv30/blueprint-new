// src/lib/pipeline/sprintPlanner.ts

export function generateSprints(tasks: any[]) {
  console.log("-> Planning Sprints...");

  // 1. Safety check
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return [];

  const sprints = [];
  let currentSprintTasks = [];
  let currentPoints = 0;
  const SPRINT_CAPACITY = 20; // Arbitrary max story points per sprint
  let sprintCount = 1;

  // 2. Sanitize the tasks so .every() never crashes again!
  const safeTasks = tasks.map(t => ({
    ...t,
    dependencies: t.dependencies || [], // The magic fix
    complexity: t.complexity || 3
  }));

  // 3. Simple chunking logic to build Sprints
  for (const task of safeTasks) {
    if (currentPoints + task.complexity > SPRINT_CAPACITY && currentSprintTasks.length > 0) {
      sprints.push({
        id: `Sprint-${sprintCount}`,
        name: `Sprint ${sprintCount}`,
        tasks: currentSprintTasks, // Assign the grouped tasks to this sprint
      });
      sprintCount++;
      currentSprintTasks = [];
      currentPoints = 0;
    }
    
    currentSprintTasks.push(task.id);
    currentPoints += task.complexity;
  }

  // 4. Catch the remaining tasks
  if (currentSprintTasks.length > 0) {
    sprints.push({
      id: `Sprint-${sprintCount}`,
      name: `Sprint ${sprintCount}`,
      tasks: currentSprintTasks,
    });
  }

  return sprints;
}