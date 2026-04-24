import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.pipelineAnalysis.findFirst({
  where: { prdVersion: { projectId: "b71179b8-f5aa-49cf-a348-223828b3f2ac" } },
  orderBy: { createdAt: "desc" }
}).then(analysis => {
  console.log("Analysis Ambiguities:", JSON.stringify(analysis?.ambiguities, null, 2));
}).finally(() => prisma.$disconnect());
