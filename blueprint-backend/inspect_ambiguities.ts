import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.ambiguity.findMany().then(a => {
  console.log("Total Ambiguities in DB:", a.length);
  console.log("Pending:", a.filter(x => x.status === 'PENDING').length);
  console.log("Resolved:", a.filter(x => x.status === 'RESOLVED').length);
}).finally(() => prisma.$disconnect());
