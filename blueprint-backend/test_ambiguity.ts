import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const totalCount = await prisma.ambiguity.count();
    console.log("Total Ambiguities in DB:", totalCount);
  } catch (err) {
    console.error("Error querying Ambiguity:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
