import { defineConfig, env } from 'prisma/config'
import dotenv from 'dotenv'

// * Load environment variables from .env file for Prisma CLI commands
dotenv.config()

const databaseUrl = env('DATABASE_URL') || process.env.DATABASE_URL
const directUrl = env('DIRECT_URL') || process.env.DIRECT_URL
const finalDatabaseUrl = directUrl || databaseUrl

if (!finalDatabaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is required. Make sure your .env file is configured.'
  )
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: finalDatabaseUrl,
  },
})
