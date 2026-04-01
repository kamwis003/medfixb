import Stripe from 'stripe'
import { env } from '../config/env'
import { prisma } from '../data/data-sources/postgresql/prisma-client'
import { AppError, NotFoundError } from '../utils/errors/app-errors'
import {
  IPaymentService,
  ICreateCheckoutSessionArgs,
  ICreateCheckoutSessionResult,
  ICreateStripeProductArgs,
  ICreateStripeProductResult,
  IUpdateStripePriceArgs,
  IUpdateStripePriceResult,
  IUpdateStripeProductArgs,
  IUpdateStripeProductResult,
  IHandleWebhookEventArgs,
  IGetInvoicesForUserArgs,
  IGetInvoicesForUserResult,
  IInvoiceItem,
  IInvoicePaginationMetadata,
  IUpdateStripeCustomerArgs,
  IUpdateStripeCustomerResult,
} from './interfaces/i-stripe-payment-service'
import { CleanedSupabaseUser } from '@/middlewares/auth-handler'
import { createLogger } from '@/utils/functions/logger'

const logger = createLogger('StripePaymentService')

const stripe = new Stripe(env.STRIPE_API_KEY, {
  typescript: true,
})

type StripeMetadata = Stripe.Metadata | null | undefined

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStringValue = (value: unknown): string | null => (typeof value === 'string' ? value : null)

const getNestedStringValue = (root: unknown, path: readonly string[]): string | null => {
  let current: unknown = root

  for (const key of path) {
    if (!isRecord(current)) return null
    current = current[key]
  }

  return getStringValue(current)
}

const parseProductIdsFromMetadata = (metadata: StripeMetadata): string[] => {
  const productIdsValue = metadata?.productIds
  if (!productIdsValue) return []

  return productIdsValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

const parseUserIdFromMetadata = (metadata: StripeMetadata): string | null => {
  const userId = metadata?.userId
  if (!userId || userId.trim().length === 0) return null
  return userId.trim()
}

const getSubscriptionIdFromInvoiceEventObject = (eventObject: unknown): string | null => {
  // * Supports multiple Stripe invoice payload shapes (top-level subscription, nested parent/subscription_details, etc.)
  const topLevel = getNestedStringValue(eventObject, ['subscription'])
  if (topLevel) return topLevel

  const parentSubscription = getNestedStringValue(eventObject, [
    'parent',
    'subscription_details',
    'subscription',
  ])
  if (parentSubscription) return parentSubscription

  // * Fallback for cases where the subscription is only available on the first line item.
  const firstLineSubscription = getNestedStringValue(eventObject, [
    'lines',
    'data',
    '0',
    'parent',
    'subscription_item_details',
    'subscription',
  ])
  if (firstLineSubscription) return firstLineSubscription

  return null
}

const getSubscriptionIdFromSubscriptionDeletedEventObject = (
  eventObject: unknown
): string | null => {
  if (!isRecord(eventObject)) return null
  return getStringValue(eventObject.id)
}

export const paymentService: IPaymentService = {
  async createStripeProduct({
    name,
    description,
    price,
  }: ICreateStripeProductArgs): Promise<ICreateStripeProductResult> {
    try {
      const product = await stripe.products.create({
        name,
        description,
        metadata: {
          type: 'product',
        },
      })

      const stripePrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100),
        currency: 'pln',
        metadata: {
          type: 'product_price',
        },
      })

      return {
        productId: product.id,
        priceId: stripePrice.id,
      }
    } catch (error) {
      logger.error('Error creating Stripe product:', { error })
      throw new AppError(
        'Failed to create Stripe product',
        500,
        undefined,
        'errors.stripe_product_creation_failed'
      )
    }
  },

  async updateStripeProduct({
    productId,
    name,
  }: IUpdateStripeProductArgs): Promise<IUpdateStripeProductResult> {
    try {
      await stripe.products.update(productId, {
        name,
      })

      return {
        success: true,
      }
    } catch (error) {
      logger.error('Error updating Stripe product:', { error })
      throw new AppError(
        'Failed to update Stripe product',
        500,
        undefined,
        'errors.stripe_product_update_failed'
      )
    }
  },

  async deleteStripeProduct(args) {
    const { productId } = args

    try {
      // We deactivate instead of delete to comply with Stripe's requirements
      const allPrices: Stripe.Price[] = []
      let hasMore = true
      let startingAfter: string | undefined

      while (hasMore) {
        const pricesResponse = await stripe.prices.list({
          product: productId,
          limit: 50,
          starting_after: startingAfter,
        })

        allPrices.push(...pricesResponse.data)
        hasMore = pricesResponse.has_more

        if (hasMore && pricesResponse.data.length > 0) {
          startingAfter = pricesResponse.data[pricesResponse.data.length - 1].id
        }
      }

      if (allPrices.length > 0) {
        const deactivatePricePromises = allPrices.map((price) =>
          stripe.prices.update(price.id, { active: false })
        )

        await Promise.all(deactivatePricePromises)
      }

      await stripe.products.update(productId, { active: false })
    } catch (error) {
      logger.error('Error deactivating Stripe product:', { error })
      throw new AppError(
        'Failed to deactivate Stripe product',
        500,
        undefined,
        'errors.stripe_product_deactivation_failed'
      )
    }
  },

  async updateStripePrice({
    productId,
    priceId,
    newPrice,
  }: IUpdateStripePriceArgs): Promise<IUpdateStripePriceResult> {
    try {
      const newPriceAmount = Math.round(newPrice * 100)

      const existingPrices = await stripe.prices.list({
        product: productId,
        active: false,
      })

      const existingPrice = existingPrices.data.find(
        (price) => price.unit_amount === newPriceAmount && price.currency === 'pln'
      )

      if (existingPrice) {
        await stripe.prices.update(existingPrice.id, {
          active: true,
        })

        await stripe.prices.update(priceId, {
          active: false,
        })

        return {
          newPriceId: existingPrice.id,
        }
      } else {
        await stripe.prices.update(priceId, {
          active: false,
        })

        const newStripePrice = await stripe.prices.create({
          product: productId,
          unit_amount: newPriceAmount,
          currency: 'pln',
          metadata: {
            type: 'product_price',
          },
        })

        return {
          newPriceId: newStripePrice.id,
        }
      }
    } catch (error) {
      logger.error('Error updating Stripe price:', { error })
      throw new AppError(
        'Failed to update Stripe price',
        500,
        undefined,
        'errors.stripe_price_update_failed'
      )
    }
  },

  async createCheckoutSession({
    productSlug,
    productSlugs,
    priceId,
    subscription,
    userId,
    userEmail,
  }: ICreateCheckoutSessionArgs): Promise<ICreateCheckoutSessionResult> {
    const resolvedProductSlugs =
      productSlugs && productSlugs.length > 0 ? productSlugs : productSlug ? [productSlug] : []

    if (resolvedProductSlugs.length === 0) {
      throw new AppError('Missing productSlugs', 400, undefined, 'errors.missing_product_slugs')
    }

    // Validate that all products exist in the database
    const products = await prisma.product.findMany({
      where: {
        slug: {
          in: resolvedProductSlugs,
        },
      },
    })

    if (products.length !== resolvedProductSlugs.length) {
      const foundSlugs = products.map((p) => p.slug)
      const missingSlugs = resolvedProductSlugs.filter((slug) => !foundSlugs.includes(slug))
      throw new NotFoundError(
        `Product(s) with slug(s) not found: ${missingSlugs.join(', ')}`,
        'errors.product_not_found'
      )
    }

    // Extract product IDs for metadata and access control
    const resolvedProductIds = products.map((p) => p.id)

    // If no priceId is provided and we have a single product, use the product's stripePriceId
    let resolvedPriceId = priceId
    if (!resolvedPriceId && products.length === 1) {
      resolvedPriceId = products[0].stripePriceId
    }

    if (!resolvedPriceId) {
      throw new AppError('Missing priceId', 400, undefined, 'errors.missing_price_id')
    }

    let user = await prisma.profile.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('User not found', 404, undefined, 'errors.user_not_found')
    }

    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      user = await prisma.profile.update({
        where: { id: userId },
        data: { stripeCustomerId },
      })
    }

    const isSubscription = subscription === true

    const metadata: Stripe.MetadataParam = {
      userId,
      productIds: resolvedProductIds.join(','),
    }

    if (!isSubscription) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'blik', 'p24'],
        allow_promotion_codes: true,
        mode: 'payment',
        customer: stripeCustomerId,
        invoice_creation: {
          enabled: true,
        },
        line_items: [
          {
            price: resolvedPriceId,
            quantity: 1,
          },
        ],
        success_url: `${env.WEB_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.WEB_URL}/payment-cancelled`,
        metadata,
      })

      if (!session.url) {
        throw new AppError(
          'Could not create checkout session',
          500,
          undefined,
          'errors.checkout_session_creation_failed'
        )
      }

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      }
    }

    const subscriptionSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata,
      },
      success_url: `${env.WEB_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.WEB_URL}/payment-cancelled`,
      metadata,
      client_reference_id: userId,
    })

    if (!subscriptionSession.url) {
      throw new AppError(
        'Could not create checkout session',
        500,
        undefined,
        'errors.checkout_session_creation_failed'
      )
    }

    return {
      checkoutUrl: subscriptionSession.url,
      sessionId: subscriptionSession.id,
    }
  },

  async handleWebhookEvent({ signature, body }: IHandleWebhookEventArgs): Promise<void> {
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', { error })
      throw new AppError(
        'Invalid Stripe webhook signature',
        400,
        undefined,
        'errors.invalid_stripe_webhook_signature'
      )
    }

    if (event.type === 'checkout.session.completed') {
      const sessionEvent = event.data.object

      if (!sessionEvent.id) {
        throw new AppError(
          'Missing checkout session id',
          400,
          undefined,
          'errors.missing_webhook_metadata'
        )
      }

      const session = await stripe.checkout.sessions.retrieve(sessionEvent.id, {
        expand: ['subscription'],
      })

      const userId = parseUserIdFromMetadata(session.metadata)
      const parsedProductIds = parseProductIdsFromMetadata(session.metadata)

      if (!userId || parsedProductIds.length === 0) {
        throw new AppError(
          'Missing metadata in webhook event',
          400,
          undefined,
          'errors.missing_webhook_metadata'
        )
      }

      await grantUserProductAccess({ userId, productIds: parsedProductIds })

      logger.info(`Granted access to ${parsedProductIds.length} product(s) for user ${userId}`)
      return
    }

    if (event.type === 'invoice.payment_succeeded') {
      const eventObject = event.data.object
      const subscriptionId = getSubscriptionIdFromInvoiceEventObject(eventObject)

      if (!subscriptionId) {
        logger.info('invoice.payment_succeeded without subscription; ignoring')
        return
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = parseUserIdFromMetadata(subscription.metadata)
      const parsedProductIds = parseProductIdsFromMetadata(subscription.metadata)

      if (!userId || parsedProductIds.length === 0) {
        throw new AppError(
          'Missing metadata in subscription',
          400,
          undefined,
          'errors.missing_webhook_metadata'
        )
      }

      await grantUserProductAccess({ userId, productIds: parsedProductIds })

      logger.info(
        `invoice.payment_succeeded: ensured access to ${parsedProductIds.length} product(s) for user ${userId} (subscription ${subscription.id})`
      )
      return
    }

    if (event.type === 'customer.subscription.deleted') {
      const eventObject = event.data.object
      const subscriptionId = getSubscriptionIdFromSubscriptionDeletedEventObject(eventObject)

      if (!subscriptionId) {
        logger.info('customer.subscription.deleted without id; ignoring')
        return
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const userId = parseUserIdFromMetadata(subscription.metadata)
      const parsedProductIds = parseProductIdsFromMetadata(subscription.metadata)

      if (!userId || parsedProductIds.length === 0) {
        logger.info(
          `customer.subscription.deleted: missing metadata for subscription ${subscription.id}; nothing to revoke`
        )
        return
      }

      await revokeUserProductAccess({ userId, productIds: parsedProductIds })

      logger.info(
        `customer.subscription.deleted: revoked access to ${parsedProductIds.length} product(s) for user ${userId} (subscription ${subscription.id})`
      )
      return
    }

    logger.warn(`Unhandled event type: ${event.type}`)
  },

  async getInvoicesForUser({
    userId,
    page = 1,
    limit = 20,
    startingAfter,
    endingBefore,
  }: IGetInvoicesForUserArgs): Promise<IGetInvoicesForUserResult> {
    try {
      const user = await prisma.profile.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })

      if (!user) {
        throw new AppError('User not found', 404)
      }

      if (!user.stripeCustomerId) {
        const emptyPagination: IInvoicePaginationMetadata = {
          page,
          limit,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
          totalItemsEstimate: 0,
        }
        return {
          data: [],
          pagination: emptyPagination,
        }
      }

      let cursor: string | undefined
      let isForwardPagination = true

      if (startingAfter) {
        cursor = startingAfter
        isForwardPagination = true
      } else if (endingBefore) {
        cursor = endingBefore
        isForwardPagination = false
      } else if (page > 1) {
        cursor = await this.getCursorForPage(user.stripeCustomerId, page, limit)
        isForwardPagination = true
      }

      const stripeParams: Stripe.InvoiceListParams = {
        customer: user.stripeCustomerId,
        limit,
        ...(cursor && isForwardPagination && { starting_after: cursor }),
        ...(cursor && !isForwardPagination && { ending_before: cursor }),
      }

      const invoicesResponse = await stripe.invoices.list(stripeParams)

      const invoices: IInvoiceItem[] = invoicesResponse.data.map(
        (invoice): IInvoiceItem => ({
          id: invoice.id ?? '',
          amount: invoice.amount_paid || 0,
          currency: invoice.currency ?? 'pln',
          status: invoice.status ?? 'unknown',
          created: invoice.created,
          invoicePdf: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          description: invoice.description || undefined,
          number: invoice.number || undefined,
          paidAt: invoice.status_transitions?.paid_at || undefined,
        })
      )

      const pagination: IInvoicePaginationMetadata = {
        page,
        limit,
        hasNextPage: invoicesResponse.has_more,
        hasPreviousPage: page > 1,
        nextPage: invoicesResponse.has_more ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
        nextCursor:
          invoicesResponse.data.length > 0
            ? invoicesResponse.data[invoicesResponse.data.length - 1].id
            : undefined,
        previousCursor: invoicesResponse.data.length > 0 ? invoicesResponse.data[0].id : undefined,
      }

      return {
        data: invoices,
        pagination,
      }
    } catch (error) {
      logger.error('Error getting invoices for user:', { error })
      throw new AppError('Failed to get user invoices', 500)
    }
  },

  // Helper method to get cursor for a specific page
  async getCursorForPage(
    customerId: string,
    targetPage: number,
    limit: number
  ): Promise<string | undefined> {
    if (targetPage <= 1) return undefined

    const itemsToSkip = (targetPage - 1) * limit
    let currentCount = 0
    let cursor: string | undefined

    while (currentCount < itemsToSkip) {
      const response = await stripe.invoices.list({
        customer: customerId,
        limit: Math.min(100, itemsToSkip - currentCount),
        starting_after: cursor,
      })

      if (response.data.length === 0) break

      currentCount += response.data.length
      if (response.data.length > 0) {
        cursor = response.data[response.data.length - 1].id
      }

      if (!response.has_more) break
    }

    return cursor
  },

  async updateStripeCustomer({
    customerId,
    email,
    name,
  }: IUpdateStripeCustomerArgs): Promise<IUpdateStripeCustomerResult> {
    try {
      const updateData: Stripe.CustomerUpdateParams = {}

      if (email !== undefined) {
        updateData.email = email
      }

      if (name !== undefined) {
        updateData.name = name
      }

      // Only update if there are changes to make
      if (Object.keys(updateData).length === 0) {
        return { success: true }
      }

      await stripe.customers.update(customerId, updateData)

      return { success: true }
    } catch (error) {
      logger.error('Error updating Stripe customer:', { error })
      throw new AppError(
        'Failed to update Stripe customer',
        500,
        undefined,
        'errors.stripe_customer_update_failed'
      )
    }
  },
  async createCustomerPortalSession({
    userId,
    supabaseUser,
    returnUrl,
  }: {
    userId: string
    supabaseUser: CleanedSupabaseUser
    returnUrl?: string
  }): Promise<{ portalUrl: string }> {
    try {
      const user = await prisma.profile.findUnique({
        where: { id: userId },
        select: {
          id: true,
          stripeCustomerId: true,
          firstName: true,
          lastName: true,
        },
      })

      if (!user) {
        throw new AppError('User not found', 404, undefined, 'errors.user_not_found')
      }

      let stripeCustomerId = user.stripeCustomerId
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: supabaseUser.email ?? undefined,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          metadata: {
            userId: user.id,
          },
        })
        stripeCustomerId = customer.id

        await prisma.profile.update({
          where: { id: user.id },
          data: { stripeCustomerId },
        })
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl ?? env.WEB_URL,
      })

      if (!portalSession.url) {
        throw new AppError(
          'Could not create Stripe customer portal session',
          500,
          undefined,
          'errors.stripe_portal_session_creation_failed'
        )
      }

      return { portalUrl: portalSession.url }
    } catch (error) {
      logger.error('Error creating Stripe customer portal session:', { error })
      if (error instanceof AppError) throw error
      throw new AppError(
        'Failed to create Stripe customer portal session',
        500,
        undefined,
        'errors.stripe_portal_session_failed'
      )
    }
  },
}

/**
 * Grant user access to products by creating UserProduct records
 */
const grantUserProductAccess = async ({
  userId,
  productIds,
}: {
  userId: string
  productIds: string[]
}): Promise<void> => {
  if (productIds.length === 0) {
    return
  }

  const userProductRecords = productIds.map((productId) => ({
    userId,
    productId,
  }))

  await prisma.userProduct.createMany({
    data: userProductRecords,
    skipDuplicates: true,
  })
}

/**
 * Revoke user access to products by deleting UserProduct records
 */
const revokeUserProductAccess = async ({
  userId,
  productIds,
}: {
  userId: string
  productIds: string[]
}): Promise<void> => {
  if (productIds.length === 0) {
    return
  }

  await prisma.userProduct.deleteMany({
    where: {
      userId,
      productId: {
        in: productIds,
      },
    },
  })
}
