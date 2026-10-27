import { Language } from '../i18n'

const CACHE_PREFIX = 'questionTranslation:'
const translationCache = new Map<string, string>()

function readCache(key: string): string | null {
  const inMemory = translationCache.get(key)
  if (inMemory) return inMemory

  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key)
    if (stored) {
      translationCache.set(key, stored)
      return stored
    }
  } catch {
    // localStorage unavailable
  }

  return null
}

function writeCache(key: string, value: string) {
  translationCache.set(key, value)
  try {
    localStorage.setItem(CACHE_PREFIX + key, value)
  } catch {
    // localStorage unavailable or full
  }
}

async function translateWithGoogle(text: string): Promise<string | null> {
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`
  )

  if (!response.ok) return null

  const data = await response.json()
  const segments = data?.[0]

  if (!Array.isArray(segments)) return null

  const translated = segments
    .map((segment: unknown) => (Array.isArray(segment) ? segment[0] : ''))
    .join('')
    .trim()

  return translated || null
}

async function translateWithMyMemory(text: string): Promise<string | null> {
  const response = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`
  )

  if (!response.ok) return null

  const data = await response.json()

  if (Number(data.responseStatus) !== 200 || !data.responseData?.translatedText) {
    return null
  }

  const translated = String(data.responseData.translatedText).trim()

  if (!translated || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
    return null
  }

  return translated
}

async function translateText(text: string, targetLang: 'pt' | 'en'): Promise<string> {
  if (targetLang === 'en' || !text.trim()) return text

  const cacheKey = `${targetLang}_${text}`
  const cached = readCache(cacheKey)
  if (cached) return cached

  for (const provider of [translateWithGoogle, translateWithMyMemory]) {
    try {
      const translated = await provider(text)
      if (translated) {
        writeCache(cacheKey, translated)
        return translated
      }
    } catch (error) {
      console.error('Translation error:', error)
    }
  }

  return text
}

export const difficultyTranslations: Record<string, Record<Language, string>> = {
  'easy': { en: 'Easy', 'pt-BR': 'Fácil' },
  'intermediate': { en: 'Intermediate', 'pt-BR': 'Intermediário' },
  'advanced': { en: 'Advanced', 'pt-BR': 'Avançado' },
}

export async function translateQuestionTextAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

export async function translateExplanationAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

export async function translateOptionTextAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

export function translateDifficulty(difficulty: string, lang: Language): string {
  return difficultyTranslations[difficulty]?.[lang] || difficulty
}

export async function translateBatch(texts: string[], lang: Language): Promise<string[]> {
  if (lang === 'en') return texts
  return Promise.all(texts.map((text) => translateText(text, 'pt')))
}
