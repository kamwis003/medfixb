import { CleanedSupabaseUser } from '@/middlewares/auth-handler'

export interface ICreateCheckoutSessionArgs {
  userId: string
  userEmail?: string
  productSlug?: string
  productSlugs?: string[]
  priceId?: string
  subscription?: boolean
}

export interface ICreateCheckoutSessionResult {
  checkoutUrl: string
  sessionId: string
}

export interface ICreateStripeProductArgs {
  name: string
  description?: string
  price: number
}

export interface ICreateStripeProductResult {
  productId: string
  priceId: string
}

export interface IUpdateStripePriceArgs {
  productId: string
  priceId: string
  newPrice: number
}

export interface IUpdateStripePriceResult {
  newPriceId: string
}

export interface IUpdateStripeProductArgs {
  productId: string
  name: string
}

export interface IUpdateStripeProductResult {
  success: boolean
}

export interface IDeleteStripeProductArgs {
  productId: string
}

export interface IHandleWebhookEventArgs {
  signature: string
  body: Buffer
}

export interface IGetInvoicesForUserArgs {
  userId: string
  page?: number
  limit?: number
  // Optional cursor parameters for direct cursor-based navigation
  startingAfter?: string
  endingBefore?: string
}

export interface IInvoiceItem {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  invoicePdf?: string
  hostedInvoiceUrl?: string
  description?: string
  number?: string
  paidAt?: number
}

export interface IInvoicePaginationMetadata {
  page: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextPage: number | null
  previousPage: number | null
  // Cursor information for efficient navigation
  nextCursor?: string
  previousCursor?: string
  totalItemsEstimate?: number
}

export interface IGetInvoicesForUserResult {
  data: IInvoiceItem[]
  pagination: IInvoicePaginationMetadata
}

export interface IUpdateStripeCustomerArgs {
  customerId: string
  email?: string
  name?: string
}

export interface IUpdateStripeCustomerResult {
  success: boolean
}

export interface IPaymentService {
  createStripeProduct(args: ICreateStripeProductArgs): Promise<ICreateStripeProductResult>
  updateStripePrice(args: IUpdateStripePriceArgs): Promise<IUpdateStripePriceResult>
  updateStripeProduct(args: IUpdateStripeProductArgs): Promise<IUpdateStripeProductResult>
  deleteStripeProduct(args: IDeleteStripeProductArgs): Promise<void>
  createCheckoutSession(args: ICreateCheckoutSessionArgs): Promise<ICreateCheckoutSessionResult>
  handleWebhookEvent(args: IHandleWebhookEventArgs): Promise<void>
  getInvoicesForUser(args: IGetInvoicesForUserArgs): Promise<IGetInvoicesForUserResult>
  getCursorForPage(
    customerId: string,
    targetPage: number,
    limit: number
  ): Promise<string | undefined>
  updateStripeCustomer(args: IUpdateStripeCustomerArgs): Promise<IUpdateStripeCustomerResult>
  /**
   * Create a Stripe Billing Portal session for a customer.
   * returnUrl is optional; if provided, Stripe will redirect to it after portal actions.
   */
  createCustomerPortalSession(args: {
    userId: string
    supabaseUser: CleanedSupabaseUser
    returnUrl?: string
  }): Promise<{
    portalUrl: string
  }>
}
