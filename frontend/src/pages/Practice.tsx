import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRandomQuestions, submitAnswer, Question, AnswerResponse, AnswerValue } from '../services/api'
import QuestionContent from '../components/QuestionContent'
import { useLanguage } from '../context/LanguageContext'
import QuestionLanguageToggle from '../components/QuestionLanguageToggle'
import { translateQuestionTextAsync, translateExplanationAsync, translateDifficulty, translateOptionTextAsync } from '../i18n/questions'
import { readSession, writeSession, clearSession } from '../utils/sessionStorage'
import { formatAnswer } from '../utils/answers'

const domainNameKeys: Record<string, string> = {
  'identity-governance': 'practice.identityGovernance',
  'storage': 'practice.storage',
  'compute': 'practice.compute',
  'networking': 'practice.networking',
  'monitoring': 'practice.monitoring',
}

interface TranslatedQuestion {
  questionText: string
  options: { label: string; text: string }[]
}

interface PracticeResult {
  questionId: string
  correct: boolean
  selected: AnswerValue
  correctAnswer?: AnswerValue
  explanation?: string
  referenceUrl?: string | null
}

interface PracticeSession {
  version: 1
  savedAt: number
  selectedDomain: string | null
  difficulty: string
  questionCount: number
  mode: string
  sessionActive: boolean
  questions: Question[]
  currentIndex: number
  selectedAnswer: AnswerValue | null
  submitted: boolean
  feedback: AnswerResponse | null
  results: PracticeResult[]
}

const PRACTICE_SESSION_KEY = 'az104-practice-session-v1'
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

export default function Practice() {
  const { t, questionLanguage } = useLanguage()
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
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerValue | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<AnswerResponse | null>(null)
  const [translatedExplanation, setTranslatedExplanation] = useState<string | null>(null)
  const [translatedQuestions, setTranslatedQuestions] = useState<Map<number, TranslatedQuestion>>(new Map())
  const [results, setResults] = useState<PracticeResult[]>([])
  const [savedSession, setSavedSession] = useState<PracticeSession | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const stored = readSession<PracticeSession>(PRACTICE_SESSION_KEY)
    if (stored && stored.version === 1 && Date.now() - stored.savedAt < SESSION_MAX_AGE_MS) {
      if (stored.sessionActive) {
        setSavedSession(stored)
      } else {
        setResults(stored.results)
        setSelectedDomain(stored.selectedDomain)
        setMode(stored.mode)
      }
    } else if (stored) {
      clearSession(PRACTICE_SESSION_KEY)
    }
    setSessionReady(true)
  }, [])

  useEffect(() => {
    if (!sessionReady || savedSession) return

    if (!sessionActive && results.length === 0) {
      clearSession(PRACTICE_SESSION_KEY)
      return
    }

    writeSession<PracticeSession>(PRACTICE_SESSION_KEY, {
      version: 1,
      savedAt: Date.now(),
      selectedDomain,
      difficulty,
      questionCount,
      mode,
      sessionActive,
      questions,
      currentIndex,
      selectedAnswer,
      submitted,
      feedback,
      results,
    })
  }, [sessionReady, sessionActive, selectedDomain, difficulty, questionCount, mode, questions, currentIndex, selectedAnswer, submitted, feedback, results])

  const resumeSession = () => {
    if (!savedSession) return
    setSelectedDomain(savedSession.selectedDomain)
    setDifficulty(savedSession.difficulty)
    setQuestionCount(savedSession.questionCount)
    setMode(savedSession.mode)
    setSessionActive(savedSession.sessionActive)
    setQuestions(savedSession.questions)
    setCurrentIndex(savedSession.currentIndex)
    setSelectedAnswer(savedSession.selectedAnswer)
    setSubmitted(savedSession.submitted)
    setFeedback(savedSession.feedback)
    setResults(savedSession.results)
    setSavedSession(null)
  }

  const discardSession = () => {
    clearSession(PRACTICE_SESSION_KEY)
    setSavedSession(null)
    setResults([])
  }

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

      clearSession(PRACTICE_SESSION_KEY)
      setSavedSession(null)
      setQuestions(response.questions)
      setSessionActive(true)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setSubmitted(false)
      setFeedback(null)
      setTranslatedExplanation(null)
      setResults([])
      setTranslatedQuestions(new Map())
    } catch (err) {
      setError(t('practice.failedLoad'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Translate questions when language changes
  useEffect(() => {
    if (questions.length === 0 || questionLanguage === 'en') {
      setTranslatedQuestions(new Map())
      return
    }

    let cancelled = false

    const translateAllQuestions = async () => {
      const newTranslated = new Map<number, TranslatedQuestion>()

      for (let i = 0; i < questions.length && !cancelled; i++) {
        const q = questions[i]
        const [questionText, ...optionTexts] = await Promise.all([
          translateQuestionTextAsync(q.question_text, questionLanguage),
          ...q.options.map(opt => translateOptionTextAsync(opt.text, questionLanguage))
        ])

        newTranslated.set(i, {
          questionText,
          options: q.options.map((opt, idx) => ({
            label: opt.label,
            text: optionTexts[idx]
          })),
        })

        if (!cancelled) {
          setTranslatedQuestions(new Map(newTranslated))
        }
      }
    }

    translateAllQuestions()

    return () => {
      cancelled = true
    }
  }, [questions, questionLanguage])

  useEffect(() => {
    if (!feedback || questionLanguage === 'en') {
      setTranslatedExplanation(null)
      return
    }

    let cancelled = false
    translateExplanationAsync(feedback.explanation, questionLanguage).then((translated) => {
      if (!cancelled) setTranslatedExplanation(translated)
    })

    return () => {
      cancelled = true
    }
  }, [feedback, questionLanguage])

  const handleSubmit = async () => {
    const hasAnswer = Array.isArray(selectedAnswer) ? selectedAnswer.length > 0 : Boolean(selectedAnswer)
    if (!hasAnswer || submitting || selectedAnswer === null) return
    const answer = selectedAnswer

    setSubmitting(true)
    setError(null)

    try {
      const response = await submitAnswer(questions[currentIndex].id, answer)
      setFeedback(response)
      setSubmitted(true)
      setResults((previous) => [...previous, {
        questionId: questions[currentIndex].id,
        correct: response.correct,
        selected: answer,
        correctAnswer: response.correct_answer,
        explanation: response.explanation,
        referenceUrl: response.reference_url,
      }])
    } catch (e) {
      setError(t('practice.submitFailed'))
      console.error('Failed to submit answer:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setSubmitted(false)
      setFeedback(null)
      setTranslatedExplanation(null)
    }
  }

  const handleFinish = () => {
    setSessionActive(false)
    setFeedback(null)
    setTranslatedExplanation(null)
  }

  const currentQuestion = questions[currentIndex]
  const translated = translatedQuestions.get(currentIndex)
  const hasSelection = Array.isArray(selectedAnswer) ? selectedAnswer.length > 0 : Boolean(selectedAnswer)
  const progress = ((currentIndex + 1) / questions.length) * 100
  const correctCount = results.filter(r => r.correct).length

  if (sessionActive && questions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            {error}
          </div>
        )}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <span className="text-sm font-medium text-gray-500">
              {t('practice.questionOf', { current: currentIndex + 1, total: questions.length })}
            </span>
            <div className="flex items-center gap-4">
              <QuestionLanguageToggle />
              <span className="text-sm font-medium text-gray-500">
                {t('practice.score', { correct: correctCount, total: results.length })}
              </span>
            </div>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`badge badge-${currentQuestion.difficulty}`}>
              {translateDifficulty(currentQuestion.difficulty, questionLanguage)}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {selectedDomain && domainNameKeys[selectedDomain] ? t(domainNameKeys[selectedDomain]) : 'General'}
            </span>
          </div>

          <QuestionContent
            question={currentQuestion}
            selected={selectedAnswer}
            onSelect={mode === 'exam' && submitted ? () => {} : setSelectedAnswer}
            submitted={mode === 'exam' ? false : submitted}
            correctAnswer={mode === 'exam' ? undefined : feedback?.correct_answer}
            translatedQuestionText={translated?.questionText}
            translatedOptions={translated?.options}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <button onClick={handleFinish} className="btn-ghost w-full sm:w-auto">
              {t('practice.endSession')}
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!hasSelection || submitting}
                  className={`btn-primary flex-1 sm:flex-none ${!hasSelection || submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? t('practice.loading') : t('practice.submit')}
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

        {submitted && mode === 'learning' && (
          <div className="mt-6 card-elevated p-6 md:p-8 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('practice.explanation')}</h3>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {translatedExplanation || feedback?.explanation}
            </p>
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

      {savedSession && (
        <div className="card-elevated flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('practice.resumeTitle')}</h2>
            <p className="text-sm text-gray-500">{t('practice.resumeDescription')}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={resumeSession} className="btn-primary px-5 py-2 text-sm">
              {t('practice.resume')}
            </button>
            <button onClick={discardSession} className="btn-secondary px-5 py-2 text-sm">
              {t('practice.discard')}
            </button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="card-elevated p-6 md:p-8 animate-fadeInUp">
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

      {results.length > 0 && (
        <div className="card-elevated p-6 md:p-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">{t('practice.sessionReview')}</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.questionId}-${index}`}
                className={`rounded-xl border-2 p-4 ${result.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900">
                    {t('practice.questionOf', { current: index + 1, total: results.length })}
                  </span>
                  <span className={`text-sm font-bold ${result.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {result.correct ? t('practice.correct') : t('practice.incorrect')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {t('practice.yourAnswer')}: <span className="font-semibold">{formatAnswer(result.selected, questions.find((q) => q.id === result.questionId) || questions[0])}</span>
                  {!result.correct && result.correctAnswer && (
                    <>
                      {' • '}{t('practice.correctAnswer')}: <span className="font-semibold">{formatAnswer(result.correctAnswer, questions.find((q) => q.id === result.questionId) || questions[0])}</span>
                    </>
                  )}
                </p>
                {result.explanation && (
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{result.explanation}</p>
                )}
                {result.referenceUrl && (
                  <p className="mt-2 text-sm">
                    <a href={result.referenceUrl} target="_blank" rel="noopener noreferrer" className="footer-link font-medium text-sky-600 underline underline-offset-2">
                      {t('questionContent.documentation')}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
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
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('practice.configuration')}</h2>
            <QuestionLanguageToggle />
          </div>

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
