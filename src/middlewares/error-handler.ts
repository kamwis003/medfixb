import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('ErrorHandler')

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500

  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  })

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      translationKey: err.translationKey,
      data: err.data,
    })
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      status: 'error',
      message: 'Please check your input and try again.',
      translationKey: 'errors.validation_failed',
      data: { errors: err.issues },
    })
  }

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
    translationKey: 'errors.internal_server_error',
  })
}
