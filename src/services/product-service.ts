import type { Prisma } from '../../generated/prisma/client'
import { prisma } from '@/data/data-sources/postgresql/prisma-client'

import { NotFoundError } from '@/utils/errors/app-errors'
import { createLogger } from '@/utils/functions/logger'
import { buildTranslationMapFromJson } from '@/utils/functions/translation-helper'
import {
  buildOrderBy,
  buildPagination,
  buildSearchWhereForJsonFields,
  mergeWhere,
} from '@/utils/functions/query-builders'

import type { Product } from '../../generated/prisma/client'
import type { IProductResponse, TTranslationsMap } from '@/utils/types/product-response'
import type {
  IProductService,
  IGetProductDetailsBySlugArgs,
  IListProductsArgs,
  IListProductsResult,
} from '@/services/interfaces/i-product-service'
import { PRODUCT_SORT_FIELDS } from '@/utils/constants/sorting'

const logger = createLogger('ProductService')

type TAllowedSortField = (typeof PRODUCT_SORT_FIELDS)[number]

type TWhere = Prisma.ProductWhereInput

const mapProductToResponse = (product: Product, isPurchased: boolean): IProductResponse => {
  const nameTranslations: TTranslationsMap = buildTranslationMapFromJson(product.name)

  const descriptionTranslations: TTranslationsMap = buildTranslationMapFromJson(product.description)

  return {
    slug: product.slug,
    nameTranslations: nameTranslations,
    descriptionTranslations: descriptionTranslations,
    price: product.priceCents / 100,
    stripeProductId: product.stripeProductId,
    stripePriceId: product.stripePriceId,
    isPurchased,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

const buildWhere = (args: IListProductsArgs): TWhere => {
  const { queryParams, userId } = args

  const purchasedWhere: TWhere =
    typeof queryParams.isPurchased === 'boolean'
      ? {
          userProducts:
            queryParams.isPurchased === true ? { some: { userId } } : { none: { userId } },
        }
      : {}

  const searchWhere = buildSearchWhereForJsonFields<TWhere>(
    queryParams.search,
    ['name', 'description'],
    queryParams.locale
  )

  return mergeWhere<TWhere>(purchasedWhere, searchWhere)
}

export const productService: IProductService = {
  async listProducts(args: IListProductsArgs): Promise<IListProductsResult> {
    const { queryParams, userId } = args

    logger.debug('Listing products', { queryParams: { ...queryParams, userId } })

    const { skip, take } = buildPagination({ page: queryParams.page, limit: queryParams.limit })

    const where = buildWhere({ queryParams, userId })

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy<TAllowedSortField, Prisma.ProductOrderByWithRelationInput>(
          queryParams.sortBy,
          PRODUCT_SORT_FIELDS,
          [{ createdAt: 'desc' }],
          (field, direction) => ({ [field]: direction })
        ),
        include: {
          userProducts: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / queryParams.limit))

    return {
      products: products.map((product) =>
        mapProductToResponse(product, product.userProducts.length > 0)
      ),
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
      },
    }
  },

  async getProductDetailsBySlug(args: IGetProductDetailsBySlugArgs): Promise<IProductResponse> {
    const { productSlug, userId } = args

    logger.debug('Getting product details by slug', { productSlug, userId })

    const product = await prisma.product.findUnique({
      where: {
        slug: productSlug,
      },
      include: {
        userProducts: {
          where: { userId },
          select: { id: true },
        },
      },
    })

    if (!product) {
      throw new NotFoundError('Product not found', 'errors.product_not_found')
    }

    return mapProductToResponse(product, product.userProducts.length > 0)
  },
}
