import { SUPPORTED_LOCALES } from '@/utils/constants/localization'

export type TLocale = (typeof SUPPORTED_LOCALES)[number]

export type TLocaleInput = string | undefined

export interface ILocaleConfig {
  defaultLocale: TLocale
  supportedLocales: readonly TLocale[]
}
