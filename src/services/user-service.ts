import { prisma } from '../data/data-sources/postgresql/prisma-client'
import { supabase } from '../data/data-sources/supabase/supabase-client'
import { AppError } from '../utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import { IUserService } from './interfaces/i-user-service'

const logger = createLogger('UserService')

export const userService: IUserService = {
  async getUser(userId: string) {
    logger.debug('Fetching user', { userId })

    const user = await prisma.profile.findUnique({
      where: { id: userId },
    })

    if (!user) {
      logger.warn('User not found', { userId })
      throw new AppError('User not found', 404, undefined, 'errors.user_not_found')
    }

    logger.info('User retrieved successfully', { userId })
    return user
  },

  async updateUserProfile(userId: string, firstName: string, lastName: string) {
    logger.debug('Updating user profile', { userId, firstName, lastName })

    try {
      logger.debug('Updating Supabase user metadata', { userId })

      // Update Supabase user metadata
      const { error: supabaseError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          firstName,
          lastName,
        },
      })

      if (supabaseError) {
        logger.error('Failed to update Supabase user metadata', {
          userId,
          error: supabaseError,
        })
        throw new AppError(
          'Failed to update user metadata',
          500,
          { error: supabaseError.message },
          'errors.supabase_update_failed'
        )
      }

      logger.debug('Supabase user metadata updated successfully', { userId })

      // Update Prisma profile
      logger.debug('Updating Prisma profile', { userId })

      const updatedUser = await prisma.profile.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
        },
      })

      logger.info('User profile updated successfully', {
        userId,
        firstName,
        lastName,
      })

      return updatedUser
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Failed to update user profile', {
        userId,
        error,
      })

      throw new AppError(
        'Failed to update user profile',
        500,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'errors.profile_update_failed'
      )
    }
  },

  async deleteUser(userId: string) {
    logger.debug('Starting user deletion', { userId })

    try {
      // First delete from Prisma database (cascade deletes UserProducts)
      logger.debug('Deleting user from Prisma database', { userId })

      try {
        await prisma.profile.delete({
          where: { id: userId },
        })

        logger.debug('User deleted from Prisma database', { userId })
      } catch (prismaError) {
        logger.error('Failed to delete user from Prisma database', {
          userId,
          error: prismaError,
        })
        throw new AppError(
          'Failed to delete user from database',
          500,
          { error: prismaError instanceof Error ? prismaError.message : 'Unknown error' },
          'errors.database_delete_failed'
        )
      }

      // Then delete from Supabase
      logger.debug('Deleting user from Supabase', { userId })

      const { error: supabaseError } = await supabase.auth.admin.deleteUser(userId)

      if (supabaseError) {
        logger.warn('Failed to delete user from Supabase (database already deleted)', {
          userId,
          error: supabaseError,
        })
        throw new AppError(
          'Failed to delete user from authentication service',
          500,
          { error: supabaseError.message },
          'errors.supabase_delete_failed'
        )
      }

      logger.info('User deleted successfully', { userId })
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      logger.error('Failed to delete user', {
        userId,
        error,
      })

      throw new AppError(
        'Failed to delete user',
        500,
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'errors.user_delete_failed'
      )
    }
  },
}
