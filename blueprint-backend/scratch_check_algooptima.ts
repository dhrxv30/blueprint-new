import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: "algooptima", mode: "insensitive" } }
  });
  
  if (project) {
    console.log(`FOUND PROJECT: ${project.name}`);
    console.log(`ID: ${project.id}`);
    
    const analysis = await prisma.pipelineAnalysis.findFirst({
      where: { prdVersion: { projectId: project.id } },
      orderBy: { createdAt: "desc" }
    });
    
    if (analysis) {
      console.log("\nANALYSIS METADATA:");
      console.log(`ID: ${analysis.id}`);
      console.log(`Features: ${Array.isArray(analysis.features) ? (analysis.features as any[]).length : 0}`);
      console.log(`Stories: ${Array.isArray(analysis.stories) ? (analysis.stories as any[]).length : 0}`);
      console.log(`Tasks: ${Array.isArray(analysis.tasks) ? (analysis.tasks as any[]).length : 0}`);
      console.log(`Architecture Present: ${!!analysis.architecture}`);
      console.log(`Code Structure Present: ${!!analysis.codeStructure}`);
      
      // Check traceability generation logic
      // This is a simplified version of buildTraceability
      const features = Array.isArray(analysis.features) ? (analysis.features as any[]) : [];
      const stories = Array.isArray(analysis.stories) ? (analysis.stories as any[]) : [];
      const tasks = Array.isArray(analysis.tasks) ? (analysis.tasks as any[]) : [];
      
      console.log("\nSAMPLE DATA:");
      console.log("FEATURE [0]:", JSON.stringify(features[0], null, 2));
      console.log("STORY [0]:", JSON.stringify(stories[0], null, 2));
      console.log("TASK [0]:", JSON.stringify(tasks[0], null, 2));
    } else {
      console.log("No analysis found for this project.");
    }
  } else {
    console.log("PROJECT NOT FOUND.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
