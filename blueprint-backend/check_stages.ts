import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRecentArchStages() {
  try {
    const stages = await prisma.pipelineStageRun.findMany({
      where: { stageName: "Architecture Synthesis" },
      orderBy: { startedAt: "desc" },
      take: 5,
    });

    console.log("Recent Architecture Synthesis Stages:");
    stages.forEach(s => {
      console.log(`- ID: ${s.id}, Status: ${s.status}, Started: ${s.startedAt}, Error: ${s.error}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentArchStages();
