import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      prdVersions: {
        include: {
          analysis: true
        }
      },
      _count: {
        select: { ambiguities: true }
      }
    }
  });

  console.log("PROJECTS AND AMBIGUITIES:");
  for (const p of projects) {
    console.log(`\nProject: ${p.name} (${p.id})`);
    console.log(`Total Ambiguities in DB: ${p._count.ambiguities}`);
    
    if (p.prdVersions.length > 0) {
      const latest = p.prdVersions[0];
      console.log(`Latest Analysis Ambiguities Count: ${Array.isArray(latest.analysis?.ambiguities) ? latest.analysis.ambiguities.length : 0}`);
    }
    
    const ambiguities = await prisma.ambiguity.findMany({
        where: { projectId: p.id }
    });
    console.log("Ambiguity Statuses:", ambiguities.map(a => a.status));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
