import { NextFunction, Request, Response } from 'express'

import { productQueryParamsSchema } from '@/libs/zod/schemas/product-schema'
import { productService } from '@/services/product-service'
import { asyncHandler } from '@/utils/functions/async-handler'
import { BadRequestError, UnauthorizedError } from '@/utils/errors/app-errors'

export const listProductsController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('Please log in to access products.', 'errors.unauthorized')
    }

    const queryValidation = productQueryParamsSchema.safeParse(req.query)
    if (!queryValidation.success) {
      throw new BadRequestError(
        'Invalid query parameters',
        { errors: queryValidation.error.issues },
        'errors.validation_failed'
      )
    }

    const { products, pagination } = await productService.listProducts({
      queryParams: queryValidation.data,
      userId: user.id,
    })

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination,
      },
    })
  }
)

export const getProductBySlugController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('Please log in to access products.', 'errors.unauthorized')
    }
    const productSlug: string | undefined =
      typeof req.params.slug === 'string' ? req.params.slug : undefined

    if (!productSlug) {
      throw new BadRequestError(
        'Product slug is required',
        { field: 'slug' },
        'errors.product_slug_required'
      )
    }

    const product = await productService.getProductDetailsBySlug({
      productSlug,
      userId: user.id,
    })

    res.status(200).json({
      success: true,
      data: {
        product,
      },
    })
  }
)
