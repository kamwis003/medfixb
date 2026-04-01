import { PrismaClient } from '../../../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '../../../config/env'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('PrismaClient')

// Best practice to ensure a single instance of Prisma Client is used across the application.
const prismaClientSingleton = (): PrismaClient => {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  })
  const client = new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  logger.info('Prisma client initialized', { nodeEnv: env.NODE_ENV })
  return client
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

if (globalForPrisma.prisma && env.NODE_ENV === 'development') {
  logger.debug('Using existing Prisma client instance')
}
