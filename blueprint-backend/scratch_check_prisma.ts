import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
console.log("PipelineJob:", prisma.pipelineJob);
console.log("PipelineStageRun:", prisma.pipelineStageRun);
console.log("PipelineArtifact:", prisma.pipelineArtifact);
process.exit(0);
