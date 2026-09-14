import { Language } from '../i18n'

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>()

// Free translation API (MyMemory)
async function translateText(text: string, targetLang: 'pt' | 'en'): Promise<string> {
  if (targetLang === 'en') return text
  
  const cacheKey = `${text}_${targetLang}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  try {
    const encodedText = encodeURIComponent(text)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`
    )
    const data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText
      translationCache.set(cacheKey, translated)
      return translated
    }
  } catch (error) {
    console.error('Translation error:', error)
  }
  
  return text
}

// Difficulty level translations (instant, no API needed)
export const difficultyTranslations: Record<string, Record<Language, string>> = {
  'easy': { en: 'Easy', 'pt-BR': 'Fácil' },
  'intermediate': { en: 'Intermediate', 'pt-BR': 'Intermediário' },
  'advanced': { en: 'Advanced', 'pt-BR': 'Avançado' },
}

// Main translation function for question text (async)
export async function translateQuestionTextAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

// Translate explanation text (async)
export async function translateExplanationAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

// Translate question options (async)
export async function translateOptionTextAsync(text: string, lang: Language): Promise<string> {
  if (lang === 'en') return text
  return translateText(text, 'pt')
}

// Translate difficulty level (sync, no API needed)
export function translateDifficulty(difficulty: string, lang: Language): string {
  return difficultyTranslations[difficulty]?.[lang] || difficulty
}

// Batch translate multiple texts
export async function translateBatch(texts: string[], lang: Language): Promise<string[]> {
  if (lang === 'en') return texts
  return Promise.all(texts.map(text => translateText(text, 'pt')))
}
