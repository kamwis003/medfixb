import { z } from 'zod'
import { basePaginationSchema } from './base-query-schema'

export const invoiceQueryParamsSchema = z.object({
  // Standard pagination
  ...basePaginationSchema.shape,

  // Cursor-based navigation for direct API usage
  startingAfter: z.string().optional().describe('Cursor for forward pagination'),
  endingBefore: z.string().optional().describe('Cursor for backward pagination'),
})

export type TInvoiceQueryParams = z.infer<typeof invoiceQueryParamsSchema>
