import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRandomQuestions, submitAnswer, Question } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

const domainNameKeys: Record<string, string> = {
  'identity-governance': 'practice.identityGovernance',
  'storage': 'practice.storage',
  'compute': 'practice.compute',
  'networking': 'practice.networking',
  'monitoring': 'practice.monitoring',
}

export default function Practice() {
  const { t } = useLanguage()
  const { domainId } = useParams()
  const navigate = useNavigate()
  const [selectedDomain, setSelectedDomain] = useState<string | null>(domainId || null)
  const [difficulty, setDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [mode, setMode] = useState('learning')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionActive, setSessionActive] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Array<{ questionId: string; correct: boolean; selected: string }>>([])

  const startPractice = async () => {
    if (!selectedDomain) return

    setLoading(true)
    setError(null)

    try {
      const response = await getRandomQuestions({
        count: questionCount,
        domain_id: selectedDomain !== 'all' ? selectedDomain : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
      })

      if (response.questions.length === 0) {
        setError(t('practice.noQuestions'))
        setLoading(false)
        return
      }

      setQuestions(response.questions)
      setSessionActive(true)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setSubmitted(false)
      setResults([])
    } catch (err) {
      setError(t('practice.failedLoad'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedAnswer) return
    setSubmitted(true)
    setResults([...results, {
      questionId: questions[currentIndex].id,
      correct: selectedAnswer === questions[currentIndex].correct_answer,
      selected: selectedAnswer,
    }])
    
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await submitAnswer(questions[currentIndex].id, selectedAnswer)
      } catch (e) {
        console.error('Failed to submit answer:', e)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setSubmitted(false)
    }
  }

  const handleFinish = () => {
    setSessionActive(false)
    setQuestions([])
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const correctCount = results.filter(r => r.correct).length

  if (sessionActive && questions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              {t('practice.questionOf', { current: currentIndex + 1, total: questions.length })}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {t('practice.score', { correct: correctCount, total: results.length })}
            </span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`badge badge-${currentQuestion.difficulty}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {selectedDomain && domainNameKeys[selectedDomain] ? t(domainNameKeys[selectedDomain]) : 'General'}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed mb-8">
            {currentQuestion.question_text}
          </h2>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswer === opt.label
              const isCorrectOpt = opt.label === currentQuestion.correct_answer
              const showCorrect = submitted && isCorrectOpt
              const showIncorrect = submitted && isSelected && !isCorrectOpt

              return (
                <label
                  key={opt.label}
                  className={`option ${
                    showCorrect ? 'correct' : showIncorrect ? 'incorrect' : ''
                  } ${isSelected && !submitted ? 'selected' : ''}`}
                  onClick={() => !submitted && setSelectedAnswer(opt.label)}
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
                      <p className="mt-2 text-sm font-medium text-emerald-600">{t('practice.correctAnswer')}</p>
                    )}
                    {showIncorrect && (
                      <p className="mt-2 text-sm font-medium text-rose-600">{t('practice.yourAnswer')}</p>
                    )}
                  </div>
                  <input type="radio" name="answer" value={opt.label} className="sr-only" />
                </label>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <button onClick={handleFinish} className="btn-ghost w-full sm:w-auto">
              {t('practice.endSession')}
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className={`btn-primary flex-1 sm:flex-none ${!selectedAnswer ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t('practice.submit')}
                </button>
              ) : (
                <button
                  onClick={currentIndex < questions.length - 1 ? handleNext : handleFinish}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {currentIndex < questions.length - 1 ? t('practice.nextQuestion') : t('practice.finish')}
                </button>
              )}
            </div>
          </div>
        </div>

        {submitted && (
          <div className="mt-6 card-elevated p-6 md:p-8 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('practice.explanation')}</h3>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {!sessionActive && results.length > 0 && (
          <div className="mt-6 card-elevated p-6 md:p-8 animate-fadeInUp">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('practice.sessionComplete')}</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-gray-500">{t('practice.total')}</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <div className="text-3xl font-bold text-emerald-600">{correctCount}</div>
                <div className="text-sm text-gray-500">{t('practice.correct')}</div>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-xl">
                <div className="text-3xl font-bold text-rose-600">{results.length - correctCount}</div>
                <div className="text-sm text-gray-500">{t('practice.incorrect')}</div>
              </div>
            </div>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold gradient-text">
                {Math.round((correctCount / results.length) * 100)}%
              </div>
              <div className="text-gray-500">{t('practice.accuracy')}</div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={startPractice} className="btn-primary">
                {t('practice.practiceAgain')}
              </button>
              <button onClick={() => navigate('/')} className="btn-secondary">
                {t('practice.backToDashboard')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('practice.title')}</h1>
        <p className="text-gray-500 text-lg">{t('practice.titleDesc')}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { id: 'identity-governance', name: t('practice.identityGovernance'), weight: '20-25%', icon: '🔐' },
          { id: 'storage', name: t('practice.storage'), weight: '15-20%', icon: '💾' },
          { id: 'compute', name: t('practice.compute'), weight: '20-25%', icon: '🖥️' },
          { id: 'networking', name: t('practice.networking'), weight: '15-20%', icon: '🌐' },
          { id: 'monitoring', name: t('practice.monitoring'), weight: '10-15%', icon: '📊' },
        ].map((domain) => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain.id)}
            className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
              selectedDomain === domain.id
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="text-4xl mb-4">{domain.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{domain.name}</h3>
            <span className="text-sm font-semibold text-blue-600">{domain.weight}</span>
          </button>
        ))}
      </div>

      {selectedDomain && (
        <div className="card-elevated p-6 md:p-8 animate-fadeInUp">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('practice.configuration')}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('practice.difficulty')}</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: t('practice.allLevels'), icon: '🎯' },
                  { value: 'easy', label: t('practice.easy'), icon: '🟢' },
                  { value: 'intermediate', label: t('practice.intermediate'), icon: '🟡' },
                  { value: 'advanced', label: t('practice.advanced'), icon: '🔴' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      difficulty === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('practice.questionsLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15, 20, 25, 30].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                      questionCount === count
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('practice.mode')}</label>
              <div className="space-y-3">
                <button
                  onClick={() => setMode('learning')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'learning'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-lg">👁️</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('practice.learning')}</p>
                      <p className="text-xs text-gray-500">{t('practice.learningDesc')}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setMode('exam')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'exam'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span className="text-lg">📝</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('practice.exam')}</p>
                      <p className="text-xs text-gray-500">{t('practice.examDesc')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-blue-600">{selectedDomain && domainNameKeys[selectedDomain] ? t(domainNameKeys[selectedDomain]) : ''}</span>
              {' • '}{questionCount} {t('practice.questionsLabel').toLowerCase()} • {difficulty === 'all' ? t('practice.allLevels') : difficulty}
            </div>
            <button
              onClick={startPractice}
              disabled={loading}
              className="btn-primary w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t('practice.loading')}
                </>
              ) : (
                <>
                  <span className="mr-2">▶</span>
                  {t('practice.startPractice')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
