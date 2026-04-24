import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database...");
  const profiles = await prisma.profile.findMany();
  const projects = await prisma.project.findMany();
  
  console.log(`Profiles: ${profiles.length}`);
  profiles.forEach(p => console.log(`- ${p.email} (${p.id})`));
  
  console.log(`Projects: ${projects.length}`);
  projects.forEach(p => console.log(`- ${p.name} (ID: ${p.id}, ProfileID: ${p.profileId})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
