import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  SUPABASE_WEBHOOK_SECRET: z.string().min(32, {
    message: 'Supabase webhook secret must be at least 32 characters long',
  }),
  SUPABASE_URL: z.string(),
  SUPABASE_PUBLISHABLE_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),
  API_URL: z.string().default('https://virtual-campus-web-y2gn4.ondigitalocean.app'),
  WEB_URL: z.string().default('https://seashell-app-qfifl.ondigitalocean.app'),
  STRIPE_API_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  CACHE_TTL_DEFAULT: z.coerce.number().default(3600), // 1 hour in seconds
  CACHE_TTL_THUMBNAILS: z.coerce.number().default(86400), // 24 hours in seconds
  CACHE_TTL_EXAMS: z.coerce.number().default(7200), // 2 hours in seconds
  CACHE_TTL_MATERIALS: z.coerce.number().default(21600), // 6 hours in seconds
  LOG_LEVEL: z
    .enum(['DEBUG', 'INFO', 'WARN', 'ERROR'])
    .transform((val) => val.toUpperCase() as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR')
    .optional(),
  LOG_FORMAT: z.enum(['json', 'pretty']).optional(),

  DEFAULT_LOCALE: z.string().default('pl'),
  SUPPORTED_LOCALES: z
    .string()
    .default('en')
    .transform((val) =>
      val
        .split(',')
        .map((locale) => locale.trim())
        .filter(Boolean)
    ),
})

const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      process.stderr.write('❌ Environment validation failed:\n')
      error.issues.forEach((err) => {
        process.stderr.write(`  - ${err.path.join('.')}: ${err.message}\n`)
      })
      process.exit(1)
    }
    throw error
  }
}

export const env = parseEnv()
export type Env = z.infer<typeof envSchema>
