import { z } from 'zod'

/**
 * Base sort direction schema
 */
export const sortDirectionSchema = z.enum(['asc', 'desc'])

/**
 * Base pagination schema
 */
export const basePaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

/**
 * Base query parameters schema
 * Simplified to support only basic filtering, pagination, single sorting, and search
 */
export const baseQueryParamsSchema = z.object({
  // Pagination
  ...basePaginationSchema.shape,

  // Single sort field (string format: "field:direction" or just "field")
  sortBy: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined

      const parts = val.split(':')
      const field = parts[0]
      const direction = parts[1] === 'desc' ? 'desc' : 'asc'

      return { field, direction }
    }),

  // Search (full-text search across multiple fields)
  search: z.string().min(1).optional(),

  // Include related data (comma-separated string)
  include: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined
      return val.split(',').map((field) => field.trim())
    }),

  // Select specific fields (comma-separated string)
  select: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined
      return val.split(',').map((field) => field.trim())
    }),
})

/**
 * Extended query params schema for specific models
 * This allows models to extend the base schema with their own specific fields
 */
export const createExtendedQueryParamsSchema = <T extends z.ZodRawShape>(additionalFields: T) =>
  baseQueryParamsSchema.extend(additionalFields)

export type TBaseQueryParams = z.infer<typeof baseQueryParamsSchema>
export type TBasePagination = z.infer<typeof basePaginationSchema>
export type TSortDirection = z.infer<typeof sortDirectionSchema>
