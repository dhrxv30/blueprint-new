import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLatestArchitecture() {
  try {
    const analysis = await prisma.pipelineAnalysis.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!analysis) {
      console.log("No analysis found.");
      return;
    }

    console.log("Latest Analysis ID:", analysis.id);
    console.log("Created At:", analysis.createdAt);
    if (analysis.architecture) {
      const arch = JSON.parse(analysis.architecture);
      console.log("Architecture Nodes Count:", arch.nodes.length);
      console.log("First 3 Nodes Sample:", JSON.stringify(arch.nodes.slice(0, 3), null, 2));
    } else {
      console.log("No architecture data in latest analysis.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestArchitecture();
