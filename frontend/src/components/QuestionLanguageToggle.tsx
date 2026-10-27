import { useLanguage } from '../context/LanguageContext'
import { Language } from '../i18n'

const options: Array<{ value: Language; short: string }> = [
  { value: 'en', short: 'EN' },
  { value: 'pt-BR', short: 'PT-BR' },
]

export default function QuestionLanguageToggle({ className = '' }: { className?: string }) {
  const { t, questionLanguage, setQuestionLanguage } = useLanguage()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-gray-500">{t('questionLanguage.label')}:</span>
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setQuestionLanguage(option.value)}
            title={t(`questionLanguage.${option.value === 'en' ? 'en' : 'ptBR'}`)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              questionLanguage === option.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.short}
          </button>
        ))}
      </div>
    </div>
  )
}
