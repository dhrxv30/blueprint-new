import { PrismaClient } from "@prisma/client";
import { buildTraceability } from "./src/lib/pipeline/traceabilityGenerator.js";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: "algooptima" }
  });
  
  if (!project) {
    console.log("algooptima not found");
    return;
  }

  const analysis = await prisma.pipelineAnalysis.findFirst({
    where: { prdVersion: { projectId: project.id } },
    orderBy: { createdAt: "desc" }
  });

  if (!analysis) {
    console.log("No analysis found");
    return;
  }

  const features = Array.isArray(analysis.features) ? (analysis.features as any[]) : [];
  const stories = Array.isArray(analysis.stories) ? (analysis.stories as any[]) : [];
  const tasks = Array.isArray(analysis.tasks) ? (analysis.tasks as any[]) : [];
  const architecture = analysis.architecture ? JSON.parse(analysis.architecture as string) : null;
  
  const flatten = (nodes: any[]): any[] => {
    const codeFiles: any[] = [];
    nodes.forEach(n => {
      if (n.type === "file") codeFiles.push(n);
      else if (n.children) codeFiles.push(...flatten(n.children));
    });
    return codeFiles;
  };
  const codeFiles = Array.isArray(analysis.codeStructure) ? flatten(analysis.codeStructure as any[]) : [];

  const traceability = buildTraceability(features, stories, tasks, architecture, codeFiles);
  
  console.log("TRACEABILITY GRAPH SUMMARY:");
  console.log(`Nodes: ${traceability.nodes.length}`);
  console.log(`Edges: ${traceability.edges.length}`);
  
  // Check for fallbacks vs real links
  const realEdges = traceability.edges.filter(e => !e.id.includes("fallback"));
  const fallbackEdges = traceability.edges.filter(e => e.id.includes("fallback"));
  
  console.log(`Real Edges: ${realEdges.length}`);
  console.log(`Fallback Edges: ${fallbackEdges.length}`);
  
  console.log("\nSAMPLE REAL EDGE:", JSON.stringify(realEdges[0], null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
