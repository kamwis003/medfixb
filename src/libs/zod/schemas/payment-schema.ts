import { z } from 'zod'

export const checkoutSessionBodySchema = z.object({
  productSlug: z.string().optional(),
  productSlugs: z.array(z.string()).optional(),
  priceId: z.string().optional(),
  subscription: z.boolean().optional(),
})

export const createPortalSessionBodySchema = z.object({
  returnUrl: z.url().optional(),
})

export type TCheckoutSessionBody = z.infer<typeof checkoutSessionBodySchema>
export type TCreatePortalSessionBody = z.infer<typeof createPortalSessionBodySchema>
