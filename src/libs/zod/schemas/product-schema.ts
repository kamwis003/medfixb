import { z } from 'zod'

import { baseQueryParamsSchema } from './base-query-schema'
import { SUPPORTED_LOCALES } from '@/utils/constants/localization'

export const productQueryParamsSchema = baseQueryParamsSchema.extend({
  search: z.string().min(1).optional(),
  isPurchased: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),

  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  locale: z
    .string()
    .toLowerCase()
    .refine((val) => SUPPORTED_LOCALES.includes(val), {
      message: 'Unsupported locale',
    })
    .default('pl'),

  price: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined

      const parts = val.split(':')
      const min = parts[0] ? parseFloat(parts[0]) : undefined
      const max = parts[1] ? parseFloat(parts[1]) : undefined

      if (min === undefined && max === undefined) return undefined

      return { min, max }
    }),
})

export type TProductQueryParams = z.infer<typeof productQueryParamsSchema>
