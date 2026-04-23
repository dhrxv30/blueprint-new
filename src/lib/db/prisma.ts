import { PrismaClient } from '@prisma/client'

// We pass the pooled DATABASE_URL directly into the client here
const prismaClientSingleton = () => new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export default prisma
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma