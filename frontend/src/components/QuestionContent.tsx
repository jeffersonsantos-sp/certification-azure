import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { AnswerValue, Question } from '../services/api'

interface QuestionContentProps {
  question: Question
  selected: AnswerValue | null
  onSelect: (value: AnswerValue) => void
  submitted?: boolean
  correctAnswer?: AnswerValue | null
  showFeedback?: boolean
  translatedQuestionText?: string
  translatedOptions?: { label: string; text: string }[]
}

function answerLabels(value: AnswerValue | null | undefined): string[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export default function QuestionContent({
  question,
  selected,
  onSelect,
  submitted = false,
  correctAnswer,
  showFeedback = submitted,
  translatedQuestionText,
  translatedOptions,
}: QuestionContentProps) {
  const { t } = useLanguage()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const questionType = question.question_type || 'single_choice'
  const selectedLabels = answerLabels(selected)
  const correctLabels = answerLabels(correctAnswer)
  const optionLabels = question.options.map((option) => option.label)
  const dragOrder = (
    Array.isArray(selected) && selected.length === optionLabels.length
      ? selected
      : optionLabels
  ) as string[]

  const optionText = (label: string) =>
    translatedOptions?.find((option) => option.label === label)?.text
    ?? question.options.find((option) => option.label === label)?.text
    ?? label

  useEffect(() => {
    if (questionType === 'drag_drop' && (!Array.isArray(selected) || selected.length !== optionLabels.length)) {
      onSelect(optionLabels)
    }
  }, [question.id, questionType])

  const moveItem = (from: number, to: number) => {
    if (submitted || from === to || to < 0 || to >= dragOrder.length) return
    const next = [...dragOrder]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onSelect(next)
  }

  const renderOptions = () => {
    const multiple = questionType === 'multiple_choice'

    return (
      <div className="space-y-3">
        {multiple && (
          <p className="text-sm text-gray-500">{t('questionContent.selectAll')}</p>
        )}
        {question.options.map((option) => {
          const isSelected = selectedLabels.includes(option.label)
          const showCorrect = submitted && correctLabels.includes(option.label)
          const showIncorrect = submitted && isSelected && !correctLabels.includes(option.label)

          return (
            <button
              type="button"
              key={option.label}
              disabled={submitted}
              onClick={() => {
                if (submitted) return
                if (multiple) {
                  const next = isSelected
                    ? selectedLabels.filter((label) => label !== option.label)
                    : [...selectedLabels, option.label]
                  onSelect([...next].sort())
                } else {
                  onSelect(option.label)
                }
              }}
              className={`option w-full text-left ${showCorrect ? 'correct' : showIncorrect ? 'incorrect' : ''} ${
                isSelected && !submitted ? 'selected' : ''
              }`}
            >
              <div className={`w-10 h-10 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                multiple ? 'rounded-lg' : 'rounded-full'
              } ${
                showCorrect
                  ? 'bg-emerald-500 text-white'
                  : showIncorrect
                  ? 'bg-rose-500 text-white'
                  : isSelected
                  ? 'bg-blue-500 text-white'
                  : 'border-2 border-gray-200 text-gray-500'
              }`}>
                {showCorrect ? '✓' : showIncorrect ? '✗' : isSelected && multiple ? '✓' : option.label}
              </div>
              <div className="flex-1">
                <span className="text-gray-700 leading-relaxed">{optionText(option.label)}</span>
                {showCorrect && (
                  <p className="mt-2 text-sm font-medium text-emerald-600">{t('questionContent.correctAnswer')}</p>
                )}
                {showIncorrect && (
                  <p className="mt-2 text-sm font-medium text-rose-600">{t('questionContent.yourAnswer')}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  const renderDragDrop = () => {
    const correctOrder = correctLabels.map(optionText).join(' → ')
    const isCorrectOrder = submitted
      && correctLabels.length > 0
      && dragOrder.join('|') === correctLabels.join('|')

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">{t('questionContent.dragInstructions')}</p>
        {dragOrder.map((label, index) => (
          <div
            key={label}
            draggable={!submitted}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) moveItem(dragIndex, index)
              setDragIndex(null)
            }}
            className="option flex items-center gap-3 cursor-grab active:cursor-grabbing"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {index + 1}
            </div>
            <span className="flex-1 text-gray-700 leading-relaxed">{optionText(label)}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={submitted || index === 0}
                onClick={() => moveItem(index, index - 1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                aria-label={t('questionContent.moveUp')}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={submitted || index === dragOrder.length - 1}
                onClick={() => moveItem(index, index + 1)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                aria-label={t('questionContent.moveDown')}
              >
                ↓
              </button>
            </div>
          </div>
        ))}

        {submitted && (
          <div className={`mt-4 rounded-xl border p-4 ${
            isCorrectOrder ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
          }`}>
            <p className="text-sm font-semibold text-gray-700">{t('questionContent.correctOrder', { order: correctOrder })}</p>
            {!isCorrectOrder && (
              <p className="mt-1 text-sm text-rose-600">
                {t('questionContent.yourOrder', { order: dragOrder.map(optionText).join(' → ') })}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderHotspot = () => {
    const regions = question.question_data?.regions ?? []
    const imageUrl = question.question_data?.image_url
    const correctRegion = regions.find((region) => region.id === correctAnswer)

    return (
      <div className="space-y-3">
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <img
              src={imageUrl}
              alt={t('questionContent.diagramAlt')}
              className="w-full h-auto select-none"
              draggable={false}
            />
            {regions.map((region) => {
              const isSelected = selected === region.id
              const showCorrect = submitted && correctAnswer === region.id
              const showIncorrect = submitted && isSelected && correctAnswer !== region.id

              return (
                <button
                  type="button"
                  key={region.id}
                  disabled={submitted}
                  onClick={() => onSelect(region.id)}
                  title={region.label}
                  aria-label={region.label}
                  className={`absolute rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-emerald-500 bg-emerald-400/25'
                      : showIncorrect
                      ? 'border-rose-500 bg-rose-400/25'
                      : isSelected
                      ? 'border-blue-500 bg-blue-400/20'
                      : 'border-blue-300/60 bg-blue-100/10 hover:border-blue-500 hover:bg-blue-200/20'
                  }`}
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`,
                  }}
                >
                  <span className="sr-only">{region.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('questionContent.imageUnavailable')}</p>
        )}

        {submitted && correctRegion && (
          <p className="text-sm font-semibold text-emerald-600">
            {t('questionContent.correctArea', { area: correctRegion.label })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {questionType === 'case_study' && question.question_data?.scenario && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-700 mb-2">{t('questionContent.caseStudy')}</div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {question.question_data.scenario}
          </p>
        </div>
      )}

      {question.question_data?.instructions && (
        <p className="text-sm text-gray-500">{question.question_data.instructions}</p>
      )}

      <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
        {translatedQuestionText || question.question_text}
      </h2>

      {questionType === 'hotspot'
        ? renderHotspot()
        : questionType === 'drag_drop'
        ? renderDragDrop()
        : renderOptions()}

      {showFeedback && question.reference_url && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm">
          <span className="font-semibold text-sky-800">{t('questionContent.documentation')}:</span>{' '}
          <a
            href={question.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link font-medium text-sky-700 underline underline-offset-2"
          >
            learn.microsoft.com
          </a>
        </div>
      )}
    </div>
  )
}
