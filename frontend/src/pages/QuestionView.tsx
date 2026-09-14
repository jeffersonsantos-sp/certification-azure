import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuestion, submitAnswer, Question } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function QuestionView() {
  const { t } = useLanguage()
  const { questionId } = useParams()
  const navigate = useNavigate()
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null)

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) {
        setError(t('questionView.noQuestionId'))
        setLoading(false)
        return
      }

      try {
        const data = await getQuestion(questionId)
        setQuestion(data)
      } catch (err) {
        setError(t('questionView.failedLoad'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestion()
  }, [questionId])

  const handleSubmit = async () => {
    if (!selected || !questionId) return

    try {
      const response = await submitAnswer(questionId, selected)
      setResult(response)
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-elevated p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-elevated p-8 text-center">
          <p className="text-gray-500 mb-4">{error || t('questionView.questionNotFound')}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            {t('questionView.goBack')}
          </button>
        </div>
      </div>
    )
  }

  const isCorrect = result?.correct

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500 hover:text-gray-700">
            {t('questionView.backToPractice')}
          </button>
          <span className={`badge badge-${question.difficulty}`}>{question.difficulty}</span>
        </div>
      </div>

      <div className="card-elevated p-6 md:p-8">
        <h2 className="text-xl font-semibold text-gray-900 leading-relaxed mb-8">
          {question.question_text}
        </h2>

        <div className="space-y-3 mb-8">
          {question.options.map((opt) => {
            const isSelected = selected === opt.label
            const showCorrect = submitted && opt.label === question.correct_answer
            const showIncorrect = submitted && isSelected && opt.label !== question.correct_answer

            return (
              <label
                key={opt.label}
                className={`option ${
                  showCorrect ? 'correct' : showIncorrect ? 'incorrect' : ''
                } ${isSelected && !submitted ? 'selected' : ''}`}
                onClick={() => !submitted && setSelected(opt.label)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                  showCorrect
                    ? 'bg-emerald-500 text-white'
                    : showIncorrect
                    ? 'bg-rose-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'border-2 border-gray-200 text-gray-500'
                }`}>
                  {showCorrect ? '✓' : showIncorrect ? '✗' : opt.label}
                </div>
                <div className="flex-1">
                  <span className="text-gray-700 leading-relaxed">{opt.text}</span>
                  {showCorrect && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">✓ {t('practice.correctAnswer')}</p>
                  )}
                  {showIncorrect && (
                    <p className="mt-2 text-sm font-medium text-rose-600">✗ {t('practice.yourAnswer')}</p>
                  )}
                </div>
                <input type="radio" name="answer" value={opt.label} className="sr-only" />
              </label>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
          <button onClick={() => navigate(-1)} className="btn-ghost w-full sm:w-auto">
            {t('questionView.back')}
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={!selected}
                className={`btn-primary flex-1 sm:flex-none ${!selected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {t('questionView.submitAnswer')}
              </button>
            ) : (
              <button onClick={() => navigate(-1)} className="btn-primary flex-1 sm:flex-none">
                {t('questionView.continuePractice')}
              </button>
            )}
          </div>
        </div>
      </div>

      {submitted && result && (
        <div className={`mt-6 p-6 rounded-2xl flex items-center gap-4 animate-fadeInUp ${
          isCorrect
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'
            : 'bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200'
        }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
          }`}>
            <span className="text-2xl text-white">{isCorrect ? '✓' : '✗'}</span>
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
              {isCorrect ? t('questionView.correct') : t('questionView.incorrect')}
            </h3>
            <p className={`text-sm ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect
                ? t('questionView.correctMsg')
                : t('questionView.incorrectMsg', { answer: question.correct_answer })}
            </p>
          </div>
        </div>
      )}

      {submitted && result && (
        <div className="mt-6 card-elevated p-6 md:p-8 animate-fadeInUp">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{t('questionView.explanation')}</h3>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  )
}
