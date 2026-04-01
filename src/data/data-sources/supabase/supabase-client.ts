import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('SupabaseClient')

// Best practice to ensure a single instance of Supabase Client is used across the application.
const supabaseClientSingleton = (): SupabaseClient => {
  const client: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  logger.info('Supabase client initialized', { nodeEnv: env.NODE_ENV })
  return client
}

type SupabaseClientSingleton = ReturnType<typeof supabaseClientSingleton>

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClientSingleton | undefined
}

export const supabase = globalForSupabase.supabase ?? supabaseClientSingleton()

if (env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}

if (globalForSupabase.supabase && env.NODE_ENV === 'development') {
  logger.debug('Using existing Supabase client instance')
}
