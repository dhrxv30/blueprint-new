import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking analysis data...");
  const analysis = await prisma.pipelineAnalysis.findMany({
    include: {
      prdVersion: {
        include: { project: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Analyses found: ${analysis.length}`);
  analysis.forEach(a => {
    const tests = a.tests;
    console.log(`- Project: ${a.prdVersion?.project?.name} (ID: ${a.prdVersion?.projectId})`);
    console.log(`  Tests field type: ${typeof tests}`);
    console.log(`  Tests data: ${JSON.stringify(tests).substring(0, 200)}...`);
    console.log(`  Postman data: ${JSON.stringify(a.postmanCollection).substring(0, 200)}...`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
