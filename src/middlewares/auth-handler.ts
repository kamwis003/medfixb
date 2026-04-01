import { NextFunction, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { asyncHandler } from '../utils/functions/async-handler'
import { AppError } from '../utils/errors/app-errors'
import { env } from '../config/env'
import { prisma } from '../data/data-sources/postgresql/prisma-client'
import { Profile } from '../../generated/prisma/client'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('AuthMiddleware')

// Define a cleaned version of Supabase user for security
export interface CleanedSupabaseUser {
  email?: string
}

// Augment the Express Request type to include our custom user property
declare module 'express' {
  interface Request {
    user?: Profile
    supabaseUser?: CleanedSupabaseUser
  }
}

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: No token provided', {
      path: req.path,
      method: req.method,
    })
    return next(new AppError('No token provided', 401))
  }

  const token = authHeader.split(' ')[1]

  logger.debug('Token validation attempt', {
    tokenPrefix: token.substring(0, 10),
    path: req.path,
    method: req.method,
  })

  // Create a standard Supabase client.
  // We will pass the user's token directly to the verification function.
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY)

  // Verify the user's token by passing it directly to getUser.
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !supabaseUser) {
    logger.warn('Authentication failed: Invalid token', {
      error: error?.message,
      path: req.path,
      method: req.method,
    })
    return next(new AppError('Invalid token or user does not exist', 401))
  }

  // If the token is valid, find the corresponding user in our own database
  const internalUser = await prisma.profile.findUnique({
    where: { id: supabaseUser.id },
  })

  if (!internalUser) {
    logger.warn('Authentication failed: User not found in database', {
      supabaseUserId: supabaseUser.id,
      path: req.path,
      method: req.method,
    })
    return next(new AppError('User not found in our system', 401))
  }

  // Attach cleaned Supabase user
  req.supabaseUser = {
    email: supabaseUser.email,
  }

  // Attach the user object from our database to the request object
  req.user = internalUser

  logger.info('Authentication successful', {
    userId: internalUser.id,
    role: internalUser.role,
    path: req.path,
    method: req.method,
  })

  next()
})
