import type { Prisma } from '../../../generated/prisma/client'
import { SUPPORTED_LOCALES } from '@/utils/constants/localization'

export type TSortOrder = 'asc' | 'desc'

export interface IPaginationArgs {
  page: number
  limit: number
}

export const buildPagination = (args: IPaginationArgs): { skip: number; take: number } => {
  const page = Number.isFinite(args.page) && args.page > 0 ? args.page : 1
  const limit = Number.isFinite(args.limit) && args.limit > 0 ? args.limit : 20

  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}

export type TSortBy = { field: string; direction: string } | undefined

export const buildOrderBy = <TAllowedField extends string, TOrderBy>(
  sortBy: TSortBy,
  allowedFields: readonly TAllowedField[],
  defaultOrderBy: readonly TOrderBy[],
  build: (field: TAllowedField, direction: TSortOrder) => TOrderBy
): TOrderBy[] => {
  if (!sortBy) {
    return [...defaultOrderBy]
  }

  const matchedField = allowedFields.find((field) => field === sortBy.field)
  if (!matchedField) {
    return [...defaultOrderBy]
  }

  const direction: TSortOrder = sortBy.direction === 'desc' ? 'desc' : 'asc'

  return [build(matchedField, direction)]
}

// /**
//  * Build order by clause that supports both regular fields and JSON fields with locale paths
//  */
// export const buildOrderByWithJsonFields = <
//   TAllowedField extends string,
//   TOrderBy extends Record<string, unknown>,
// >(
//   sortBy: TSortBy,
//   allowedFields: readonly TAllowedField[],
//   jsonFields: readonly TAllowedField[],
//   defaultOrderBy: readonly TOrderBy[],
//   locale: string,
//   build: (field: TAllowedField, direction: TSortOrder) => TOrderBy
// ): TOrderBy[] => {
//   if (!sortBy) {
//     return [...defaultOrderBy]
//   }

//   const matchedField = allowedFields.find((field) => field === sortBy.field)
//   if (!matchedField) {
//     return [...defaultOrderBy]
//   }

//   const direction: TSortOrder = sortBy.direction === 'desc' ? 'desc' : 'asc'

//   // Check if this is a JSON field (name, description)
//   const isJsonField = jsonFields.includes(matchedField)

//   if (isJsonField) {
//     // For JSON fields, use path-based sorting with locale
//     return [
//       {
//         [matchedField]: {
//           path: [locale],
//           sort: direction,
//         },
//       } as TOrderBy,
//     ]
//   }

//   // For regular fields, use standard sorting
//   return [build(matchedField, direction)]
// }

export const buildSearchWhere = <TWhere extends Record<string, unknown>>(
  search: string | undefined,
  fields: readonly (keyof TWhere)[]
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): { OR: TWhere[] } | {} => {
  if (!search || search.trim().length === 0 || fields.length === 0) {
    return {}
  }

  const searchValue = search.trim()

  const OR: TWhere[] = fields.map(
    (field) =>
      ({
        [field]: {
          contains: searchValue,
          mode: 'insensitive',
        },
      }) as TWhere
  )

  return { OR }
}

export const buildSearchWhereForJsonFields = <TWhere extends Record<string, unknown>>(
  search: string | undefined,
  fields: readonly (keyof TWhere)[],
  locale?: string,
  supportedLocales: readonly string[] = SUPPORTED_LOCALES
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
): { OR: TWhere[] } | {} => {
  if (!search || search.trim().length === 0 || fields.length === 0) {
    return {}
  }

  const searchValue = search.trim()

  // If locale is provided, only search within that locale
  const localesToSearch = locale ? [locale] : supportedLocales

  // Create OR conditions for each field x locale combination
  const OR: TWhere[] = []

  for (const field of fields) {
    for (const searchLocale of localesToSearch) {
      OR.push({
        [field]: {
          path: [searchLocale],
          string_contains: searchValue,
          mode: 'insensitive',
        },
      } as TWhere)
    }
  }

  return OR.length > 0 ? { OR } : {}
}

export const mergeWhere = <TWhere extends object>(...parts: readonly Partial<TWhere>[]): TWhere => {
  return Object.assign({}, ...parts)
}

export type TPrismaQueryMode = Prisma.QueryMode
