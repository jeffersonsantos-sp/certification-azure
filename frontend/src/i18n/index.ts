import en from './en'
import pt from './pt'

export const languages = {
  en,
  'pt-BR': pt,
} as const

export type Language = keyof typeof languages

export function t(lang: Language, key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: any = languages[lang]

  for (const k of keys) {
    value = value?.[k]
  }

  if (typeof value !== 'string') return key

  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, String(paramValue)),
      value
    )
  }

  return value
}

export { en, pt }
