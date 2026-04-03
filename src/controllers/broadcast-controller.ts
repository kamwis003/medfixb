import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { asyncHandler } from '@/utils/functions/async-handler'
import { AppError, BadRequestError, ForbiddenError } from '@/utils/errors/app-errors'
import { broadcastEmail } from '@/services/broadcast-service'
import { broadcastSchema } from '@/libs/zod/schemas/broadcast-schema'

export const broadcastController = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  if (!user) {
    throw new AppError('Unauthorized', 401)
  }
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Access denied', 'errors.forbidden')
  }

  try {
    const validatedData = broadcastSchema.parse(req.body)
    const result = await broadcastEmail(validatedData)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestError('Validation failed', { errors: error.issues }, 'errors.validation_failed')
    }
    throw error
  }
})
