import { TProductQueryParams } from '@/libs/zod/schemas/product-schema'
import { IProductResponse } from '@/utils/types/product-response'

export interface IGetProductDetailsBySlugArgs {
  productSlug: string
  userId: string
}

export interface IListProductsArgs {
  queryParams: TProductQueryParams
  userId: string
}

export interface IListProductsResult {
  products: IProductResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface IProductService {
  getProductDetailsBySlug(args: IGetProductDetailsBySlugArgs): Promise<IProductResponse>
  listProducts(args: IListProductsArgs): Promise<IListProductsResult>
}
