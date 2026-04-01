import type { Prisma } from '../../../generated/prisma/client'

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/utils/constants/localization'
import type { TLocale, TLocaleInput } from '@/utils/types/locale'

export type TTranslationMap = Partial<Record<TLocale, string>>

export const normalizeLocale = (locale?: TLocaleInput): TLocale => {
  if (typeof locale !== 'string' || locale.length === 0) {
    return DEFAULT_LOCALE
  }

  const sanitized = locale.trim().toLowerCase()

  // Accept values like "en-US" -> "en"
  const base = sanitized.split(/[-_]/)[0]

  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
    return base
  }

  return DEFAULT_LOCALE
}

export const getTranslationFromMap = (
  map: TTranslationMap | null | undefined,
  locale: TLocaleInput,
  fallbackLocale: TLocaleInput
): string | undefined => {
  const normalizedLocale = normalizeLocale(locale)
  const normalizedFallbackLocale = normalizeLocale(fallbackLocale)

  if (!map) {
    return undefined
  }

  const preferred = map[normalizedLocale]
  if (typeof preferred === 'string' && preferred.length > 0) {
    return preferred
  }

  const fallback = map[normalizedFallbackLocale]
  if (typeof fallback === 'string' && fallback.length > 0) {
    return fallback
  }

  return Object.values(map).find((value) => typeof value === 'string' && value.length > 0)
}

export const buildTranslationMapFromJson = (
  value: Prisma.JsonValue,
  supportedLocales: readonly TLocale[] = SUPPORTED_LOCALES,
  defaultLocale: TLocale = DEFAULT_LOCALE
): TTranslationMap => {
  const map: TTranslationMap = {}

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      map[defaultLocale] = trimmed
    }

    return map
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return map
  }

  const record = value as Record<string, unknown>

  for (const locale of supportedLocales) {
    const raw = record[locale]
    if (typeof raw !== 'string') {
      continue
    }

    const trimmed = raw.trim()
    if (trimmed.length === 0) {
      continue
    }

    map[locale] = trimmed
  }

  if (typeof map[defaultLocale] === 'string' && map[defaultLocale].length > 0) {
    return map
  }

  const firstEntry = Object.entries(map).find(([, translation]) => {
    return typeof translation === 'string' && translation.length > 0
  })

  if (!firstEntry) {
    return map
  }

  map[defaultLocale] = firstEntry[1]

  return map
}
