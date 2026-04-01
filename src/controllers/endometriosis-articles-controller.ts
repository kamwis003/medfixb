import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { asyncHandler } from '../utils/functions/async-handler'
import { AppError, BadRequestError } from '../utils/errors/app-errors'
import {
  createEndometriosisArticle,
  listEndometriosisArticlesPresentation,
} from '@/services/endometriosis-articles-service'
import { endometriosisArticleSchema } from '../libs/zod/schemas/endometriosis-article-schema'

export const listArticlesController = asyncHandler(
  async (_req: Request, res: Response) => {
    const articles = await listEndometriosisArticlesPresentation()
    return res.status(200).json({
      success: true,
      data: articles,
    })
  }
)

export const createArticleController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new AppError('Authentication required', 401)
    }

    try {
      const validatedData = endometriosisArticleSchema.parse(req.body)

      const created = await createEndometriosisArticle(userId, {
        title: validatedData.title,
        content: validatedData.content,
      })

      return res.status(201).json({
        success: true,
        data: created,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          'Validation failed',
          { errors: error.issues },
          'errors.validation_failed'
        )
      }
      throw error
    }
  }
)
