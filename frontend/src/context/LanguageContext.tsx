import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { Language, t as translate } from '../i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  questionLanguage: Language
  setQuestionLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language')
    return (stored as Language) || 'en'
  })

  const [questionLanguage, setQuestionLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('questionLanguage')
    if (stored) return stored as Language
    return (localStorage.getItem('language') as Language) || 'en'
  })

  const questionLanguageOverridden = useRef(
    localStorage.getItem('questionLanguage') !== null
  )

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang

    if (!questionLanguageOverridden.current) {
      setQuestionLanguageState(lang)
    }
  }

  const setQuestionLanguage = (lang: Language) => {
    questionLanguageOverridden.current = true
    setQuestionLanguageState(lang)
    localStorage.setItem('questionLanguage', lang)
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const t = (key: string, params?: Record<string, string | number>) => translate(language, key, params)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, questionLanguage, setQuestionLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
