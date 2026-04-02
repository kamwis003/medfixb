import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { asyncHandler } from '@/utils/functions/async-handler'
import { AppError, BadRequestError, ForbiddenError } from '@/utils/errors/app-errors'
import {
  createConsultationRequest,
  getMyConsultationRequests,
  getAllConsultationRequests,
  acceptConsultationRequest,
  rejectConsultationRequest,
} from '../services/consultation-requests-service'
import {
  createConsultationRequestSchema,
  rejectConsultationRequestSchema,
} from '../libs/zod/schemas/consultation-request-schema'

export const createConsultationRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('Unauthorized', 401)
    }

    try {
      const validatedData = createConsultationRequestSchema.parse(req.body)
      const request = await createConsultationRequest(userId, validatedData)
      return res.status(201).json({ success: true, data: request })
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError('Validation failed', { errors: error.issues }, 'errors.validation_failed')
      }
      throw error
    }
  }
)

export const getMyConsultationRequestsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('Unauthorized', 401)
    }

    const requests = await getMyConsultationRequests(userId)
    return res.status(200).json({ success: true, data: requests })
  }
)

export const getAllConsultationRequestsController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user
    if (!user) {
      throw new AppError('Unauthorized', 401)
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied', 'errors.forbidden')
    }

    const requests = await getAllConsultationRequests()
    return res.status(200).json({ success: true, data: requests })
  }
)

export const acceptConsultationRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user
    if (!user) {
      throw new AppError('Unauthorized', 401)
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied', 'errors.forbidden')
    }

    const id = req.params['id'] as string
    const request = await acceptConsultationRequest(id)
    return res.status(200).json({ success: true, data: request })
  }
)

export const rejectConsultationRequestController = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user
    if (!user) {
      throw new AppError('Unauthorized', 401)
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenError('Access denied', 'errors.forbidden')
    }

    const id = req.params['id'] as string

    try {
      const validatedData = rejectConsultationRequestSchema.parse(req.body)
      const request = await rejectConsultationRequest(id, validatedData.rejectionReason)
      return res.status(200).json({ success: true, data: request })
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError('Validation failed', { errors: error.issues }, 'errors.validation_failed')
      }
      throw error
    }
  }
)
