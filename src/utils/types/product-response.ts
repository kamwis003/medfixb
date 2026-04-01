import type { TLocale } from '@/utils/types/locale'

export type TTranslationsMap = Partial<Record<TLocale, string>>

export interface IProductResponse {
  slug: string
  nameTranslations: TTranslationsMap
  descriptionTranslations: TTranslationsMap
  price: number
  stripeProductId: string
  stripePriceId: string
  isPurchased: boolean
  createdAt: Date
  updatedAt: Date
}
