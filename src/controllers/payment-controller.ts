import { NextFunction, Request, Response } from 'express'
import { paymentService } from '../services/stripe-payment-service'
import { asyncHandler } from '../utils/functions/async-handler'
import { invoiceQueryParamsSchema } from '../libs/zod/schemas/invoice-schema'
import { AppError } from '../utils/errors/app-errors'
import {
  checkoutSessionBodySchema,
  createPortalSessionBodySchema,
} from '../libs/zod/schemas/payment-schema'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('PaymentController')

export const createCheckoutSessionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const bodyValidation = checkoutSessionBodySchema.safeParse(req.body)
    if (!bodyValidation.success) {
      throw new AppError('Invalid request body', 400)
    }

    const { productSlug, productSlugs, priceId, subscription } = bodyValidation.data

    const user = req.user
    const supabaseUser = req.supabaseUser
    if (!user || !supabaseUser) {
      throw new AppError('Unauthorized', 401)
    }

    logger.debug('Creating checkout session', { userId: user.id, productSlug, productSlugs })

    const result = await paymentService.createCheckoutSession({
      productSlug,
      productSlugs,
      priceId,
      subscription,
      userId: user.id,
      userEmail: supabaseUser.email,
    })

    res.status(200).json(result)
  }
)

export const handleWebhookController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const signatureHeader = req.headers['stripe-signature']
    if (typeof signatureHeader !== 'string') {
      throw new AppError('Missing Stripe signature header', 400)
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new AppError('Invalid Stripe webhook payload', 400)
    }

    logger.info('Webhook received')

    await paymentService.handleWebhookEvent({
      signature: signatureHeader,
      body: req.body,
    })
    res.status(200).json({ received: true })
  }
)

export const getUserInvoicesController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const queryValidation = invoiceQueryParamsSchema.safeParse(req.query)
    if (!queryValidation.success) {
      throw new AppError('Invalid query parameters', 400)
    }

    const queryParams = queryValidation.data

    const user = req.user

    if (!user) {
      throw new AppError('Unauthorized', 401)
    }

    const userId = user.id

    const result = await paymentService.getInvoicesForUser({
      userId,
      ...queryParams,
    })

    res.status(200).json(result)
  }
)

export const createPortalSessionController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const bodyValidation = createPortalSessionBodySchema.safeParse(req.body)
    if (!bodyValidation.success) {
      throw new AppError('Invalid request body', 400)
    }

    const { returnUrl } = bodyValidation.data

    const user = req.user
    const supabaseUser = req.supabaseUser
    if (!user || !supabaseUser) {
      throw new AppError('Unauthorized', 401)
    }

    logger.debug('Creating portal session', { userId: user.id })

    const result = await paymentService.createCustomerPortalSession({
      userId: user.id,
      supabaseUser,
      returnUrl,
    })

    res.status(200).json(result)
  }
)
