import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Creating tables...");
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."Ambiguity" (
        "id" UUID NOT NULL,
        "projectId" UUID NOT NULL,
        "question" TEXT NOT NULL,
        "answer" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Ambiguity_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."ContextNote" (
        "id" UUID NOT NULL,
        "projectId" UUID NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ContextNote_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Ambiguity_projectId_fkey'
      ) THEN
        ALTER TABLE "public"."Ambiguity" ADD CONSTRAINT "Ambiguity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ContextNote_projectId_fkey'
      ) THEN
        ALTER TABLE "public"."ContextNote" ADD CONSTRAINT "ContextNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  console.log("Tables created successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
