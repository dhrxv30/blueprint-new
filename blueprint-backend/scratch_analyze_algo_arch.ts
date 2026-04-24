import { PrismaClient } from "@prisma/client";

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

  const architecture = analysis.architecture ? JSON.parse(analysis.architecture as string) : null;
  
  console.log("ALGOOPTIMA ARCHITECTURE ANALYSIS:");
  console.log(`Nodes: ${architecture?.nodes?.length || 0}`);
  console.log(`Edges: ${architecture?.edges?.length || 0}`);
  
  if (architecture?.nodes && architecture.nodes.length > 0) {
    console.log("\nSAMPLE NODE [0]:", JSON.stringify(architecture.nodes[0], null, 2));
    
    // Check for high-level details
    const nodesWithTech = architecture.nodes.filter((n: any) => n.tech || n.techStack);
    console.log(`Nodes with Tech Stack: ${nodesWithTech.length}`);
    
    const nodesWithTaskIds = architecture.nodes.filter((n: any) => n.relatedTaskIds && n.relatedTaskIds.length > 0);
    console.log(`Nodes with Traceability (Task IDs): ${nodesWithTaskIds.length}`);
  }
  
  if (architecture?.edges && architecture.edges.length > 0) {
    console.log("\nSAMPLE EDGE [0]:", JSON.stringify(architecture.edges[0], null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
