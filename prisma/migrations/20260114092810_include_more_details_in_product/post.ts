import { PrismaClient } from '../../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'prisma/config'
import dotenv from 'dotenv'

// * Load environment variables from .env file for Prisma CLI commands
dotenv.config()

const prismaClientSingleton = (): PrismaClient => {
  if (!env('DIRECT_URL')) {
    throw new Error(
      'DIRECT_URL environment variable is required. Make sure your .env file is configured.'
    )
  }

  const adapter = new PrismaPg({
    connectionString: env('DIRECT_URL'),
  })
  const client = new PrismaClient({
    adapter,
    log: env('NODE_ENV') === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  return client
}

const prisma = prismaClientSingleton()

const run = async (): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await tx.product.upsert({
      where: {
        slug: 'detekcja-raka-endometrium',
      },
      create: {
        slug: 'detekcja-raka-endometrium',
        name: {
          pl: 'Detekcja raka endometrium',
          en: 'Endometrial cancer detection',
          uk: 'Виявлення раку ендометрію',
        },
        description: {
          pl: 'Badanie umożliwiające detekcję raka endometrium.',
          en: 'A test that enables detection of endometrial cancer.',
          uk: 'Тест, що дозволяє виявити рак ендометрію.',
        },
        priceCents: 10000,
        // Stripe IDs are required & unique in schema; placeholders used until real IDs are provided.
        stripeProductId: 'prod_placeholder_detekcja_raka_endometrium',
        stripePriceId: 'price_placeholder_detekcja_raka_endometrium',
      },
      update: {
        name: {
          pl: 'Detekcja raka endometrium',
          en: 'Endometrial cancer detection',
          uk: 'Виявлення раку ендометрію',
        },
        description: {
          pl: 'Badanie umożliwiające detekcję raka endometrium.',
          en: 'A test that enables detection of endometrial cancer.',
          uk: 'Тест, що дозволяє виявити рак ендометрію.',
        },
        priceCents: 10000,
      },
    })
  })
}

run()
  .catch(async (error: unknown) => {
    await prisma.$disconnect()
    throw error
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
