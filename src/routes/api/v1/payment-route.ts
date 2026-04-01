import { Router } from 'express'
import {
  createCheckoutSessionController,
  getUserInvoicesController,
  createPortalSessionController,
} from '../../../controllers/payment-controller'
import { requireAuth } from '../../../middlewares/auth-handler'

const router = Router()

/**
 * @swagger
 * /api/payments/create-checkout-session:
 *   post:
 *     summary: Create a Stripe checkout session
 *     description: |
 *       Create a checkout session for payment processing with Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product to purchase (single product)
 *                 example: "product-123"
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to purchase (multiple products)
 *                 example: ["product-123", "product-456"]
 *               priceId:
 *                 type: string
 *                 description: The Stripe price ID to use for the checkout session
 *                 example: "price_1234567890"
 *               subscription:
 *                 type: boolean
 *                 description: Whether this is a subscription purchase
 *                 example: false
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: Stripe checkout session ID
 *                       example: "cs_test_1234567890"
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: Stripe checkout URL
 *                       example: "https://checkout.stripe.com/c/pay/cs_test_1234567890"
 *       400:
 *         description: Bad request - Invalid or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-checkout-session', requireAuth, createCheckoutSessionController)

/**
 * @swagger
 * /api/payments/create-portal-session:
 *   post:
 *     summary: Create a Stripe Customer Portal session
 *     description: |
 *       Creates a Stripe Billing Portal session for the authenticated user so they can manage payment methods and subscriptions.
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL to return to after leaving the Stripe portal
 *                 example: "https://example.com/account"
 *     responses:
 *       200:
 *         description: Portal session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portalUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL to the Stripe customer portal session
 *                   example: "https://billing.stripe.com/session/test_123"
 *       400:
 *         description: Bad request - Invalid or missing parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
router.post('/create-portal-session', requireAuth, createPortalSessionController)

/**
 * @swagger
 * /api/payments/invoices:
 *   get:
 *     summary: Get user invoices
 *     description: Retrieve a paginated list of invoices for the authenticated user from Stripe
 *     tags:
 *       - Payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of invoices per page
 *         example: 20
 *       - in: query
 *         name: startingAfter
 *         schema:
 *           type: string
 *         description: Cursor for forward pagination (Stripe invoice ID)
 *         example: in_1234567890abcdef
 *       - in: query
 *         name: endingBefore
 *         schema:
 *           type: string
 *         description: Cursor for backward pagination (Stripe invoice ID)
 *         example: in_0987654321fedcba
 *     responses:
 *       200:
 *         description: Successfully retrieved user invoices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetUserInvoicesResponse'
 *             examples:
 *               success:
 *                 summary: Successful response with invoices
 *                 value:
 *                   data:
 *                     - id: "in_1234567890abcdef"
 *                       amount: 2999
 *                       currency: "pln"
 *                       status: "paid"
 *                       created: 1641024000
 *                       invoicePdf: "https://pay.stripe.com/invoice/acct_.../in_.../pdf"
 *                       hostedInvoiceUrl: "https://invoice.stripe.com/i/acct_.../in_..."
 *                       description: "Product purchase"
 *                       number: "INV-2023-0001"
 *                       paidAt: 1641110400
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     hasNextPage: true
 *                     hasPreviousPage: false
 *                     nextPage: 2
 *                     previousPage: null
 *                     nextCursor: "in_1234567890abcdef"
 *                     previousCursor: null
 *               empty:
 *                 summary: No invoices found
 *                 value:
 *                   data: []
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     hasNextPage: false
 *                     hasPreviousPage: false
 *                     nextPage: null
 *                     previousPage: null
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid query parameters"
 *       401:
 *         description: Unauthorized - missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - user cannot access invoices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: Cannot access other user invoices"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to get user invoices"
 */
router.get('/invoices', requireAuth, getUserInvoicesController)

export { router as paymentRoutes }
