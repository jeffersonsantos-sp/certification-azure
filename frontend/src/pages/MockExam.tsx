import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRandomQuestions, submitExam, Question, AnswerValue } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import QuestionLanguageToggle from '../components/QuestionLanguageToggle'
import QuestionContent from '../components/QuestionContent'
import { translateQuestionTextAsync, translateDifficulty, translateOptionTextAsync } from '../i18n/questions'
import { formatAnswer } from '../utils/answers'
import { readSession, writeSession, clearSession } from '../utils/sessionStorage'

interface TranslatedQuestion {
  questionText: string
  options: { label: string; text: string }[]
}

interface ExamResult {
  question: Question
  selected: AnswerValue
  correct: boolean
  correct_answer: AnswerValue
  explanation: string
  reference_url?: string | null
}

interface MockSession {
  version: 1
  savedAt: number
  started: boolean
  finished: boolean
  timeLeft: number
  config: { questions: number; time: number; domain: string }
  questions: Question[]
  currentIndex: number
  answers: Record<string, AnswerValue>
  results: ExamResult[]
}

const MOCK_SESSION_KEY = 'az104-mock-exam-session-v1'
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

export default function MockExam() {
  const { t, questionLanguage } = useLanguage()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(90 * 60)
  const [config, setConfig] = useState({ questions: 50, time: 90, domain: 'all' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [translatedQuestions, setTranslatedQuestions] = useState<Map<number, TranslatedQuestion>>(new Map())
  const [results, setResults] = useState<ExamResult[]>([])
  const [savedSession, setSavedSession] = useState<MockSession | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const submittingRef = useRef(false)
  const questionsRef = useRef(questions)
  const answersRef = useRef(answers)
  const tRef = useRef(t)

  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { tRef.current = t }, [t])

  useEffect(() => {
    const stored = readSession<MockSession>(MOCK_SESSION_KEY)
    if (stored && stored.version === 1 && Date.now() - stored.savedAt < SESSION_MAX_AGE_MS) {
      if (stored.started && !stored.finished) {
        setSavedSession(stored)
      } else if (stored.finished) {
        setFinished(true)
        setStarted(false)
        setConfig(stored.config)
        setQuestions(stored.questions)
        setAnswers(stored.answers)
        setResults(stored.results)
        setTimeLeft(stored.timeLeft)
      }
    } else if (stored) {
      clearSession(MOCK_SESSION_KEY)
    }
    setSessionReady(true)
  }, [])

  useEffect(() => {
    if (!sessionReady || savedSession) return
    if (!started && !finished) {
      clearSession(MOCK_SESSION_KEY)
      return
    }

    writeSession<MockSession>(MOCK_SESSION_KEY, {
      version: 1,
      savedAt: Date.now(),
      started,
      finished,
      timeLeft,
      config,
      questions,
      currentIndex,
      answers,
      results,
    })
  }, [sessionReady, started, finished, timeLeft, config, questions, currentIndex, answers, results, savedSession])

  const resumeSession = () => {
    if (!savedSession) return
    const elapsed = Math.max(0, Math.floor((Date.now() - savedSession.savedAt) / 1000))
    setConfig(savedSession.config)
    setQuestions(savedSession.questions)
    setCurrentIndex(savedSession.currentIndex)
    setAnswers(savedSession.answers)
    setTimeLeft(Math.max(0, savedSession.timeLeft - elapsed))
    setStarted(true)
    setFinished(false)
    setResults(savedSession.results)
    setSavedSession(null)
    submittingRef.current = false
  }

  const discardSession = () => {
    clearSession(MOCK_SESSION_KEY)
    setSavedSession(null)
    setResults([])
  }

  const finishExam = useCallback(async () => {
    const currentQuestions = questionsRef.current
    if (submittingRef.current || currentQuestions.length === 0) return
    submittingRef.current = true

    try {
      const response = await submitExam(
        currentQuestions.map((q) => ({
          question_id: q.id,
          answer: answersRef.current[q.id] ?? '',
        }))
      )

      const resultsById = new Map(response.results.map((result) => [result.question_id, result]))
      setResults(currentQuestions.map((q) => {
        const result = resultsById.get(q.id)
        return {
          question: q,
          selected: result?.selected ?? answersRef.current[q.id] ?? '',
          correct: result?.correct ?? false,
          correct_answer: result?.correct_answer ?? '',
          explanation: result?.explanation ?? '',
          reference_url: result?.reference_url ?? q.reference_url ?? null,
        }
      }))
      setFinished(true)
      setStarted(false)
    } catch (err) {
      setError(tRef.current('mockExam.submitFailed'))
      console.error('Failed to submit exam:', err)
    } finally {
      submittingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!started || finished) return
    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [started, finished])

  useEffect(() => {
    if (started && !finished && timeLeft === 0 && questions.length > 0) {
      finishExam()
    }
  }, [started, finished, timeLeft, questions.length, finishExam])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const startExam = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getRandomQuestions({
        count: config.questions,
        domain_id: config.domain !== 'all' ? config.domain : undefined,
      })

      if (response.questions.length === 0) {
        setError(t('mockExam.noQuestions'))
        setLoading(false)
        return
      }

      clearSession(MOCK_SESSION_KEY)
      setSavedSession(null)
      setQuestions(response.questions)
      setCurrentIndex(0)
      setAnswers({})
      setTimeLeft(config.time * 60)
      setStarted(true)
      setFinished(false)
      setTranslatedQuestions(new Map())
      setResults([])
      setError(null)
      submittingRef.current = false
    } catch (err) {
      setError(t('mockExam.failedLoad'))
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
          }))
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

  const selectAnswer = (questionId: string, answer: AnswerValue) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const hasAnswer = (value: AnswerValue | undefined) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const correctCount = results.filter((r) => r.correct).length

  if (finished) {
    const score = Math.round((correctCount / results.length) * 100)
    const passed = score >= 70

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className={`card-elevated p-8 text-center ${passed ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-rose-50 to-red-50'}`}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('mockExam.examComplete')}</h1>
          <div className="text-7xl font-bold gradient-text my-6">{score}%</div>
          <p className={`text-xl font-semibold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
            {passed ? t('mockExam.congratulations') : t('mockExam.keepStudying')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{results.length}</div>
            <div className="text-sm text-gray-500">{t('practice.total')}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600">{correctCount}</div>
            <div className="text-sm text-gray-500">{t('practice.correct')}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-rose-600">{results.length - correctCount}</div>
            <div className="text-sm text-gray-500">{t('practice.incorrect')}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{config.time - Math.floor(timeLeft / 60)}</div>
            <div className="text-sm text-gray-500">{t('mockExam.minutesUsed')}</div>
          </div>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('mockExam.questionReview')}</h2>
          <div className="space-y-4">
            {results.map((r, i) => (
              <div
                key={r.question.id}
                className={`p-4 rounded-xl border-2 ${
                  r.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    r.correct ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {r.correct ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      <span className="text-gray-400">Q{i + 1}.</span> {translatedQuestions.get(i)?.questionText || r.question.question_text}
                    </p>
                    {r.reference_url && (
                      <p className="mt-2 text-sm">
                        <a href={r.reference_url} target="_blank" rel="noopener noreferrer" className="footer-link font-medium text-sky-600 underline underline-offset-2">
                          {t('questionContent.documentation')}
                        </a>
                      </p>
                    )}
                    {!r.correct && (
                      <p className="text-sm text-gray-600">
                        {t('practice.yourAnswer')}: <span className="font-semibold text-rose-600">{formatAnswer(r.selected, r.question)}</span>
                        {' • '}
                        {t('practice.correctAnswer')}: <span className="font-semibold text-emerald-600">{formatAnswer(r.correct_answer, r.question)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={startExam} className="btn-primary">
            {t('mockExam.retakeExam')}
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">
            {t('mockExam.backToDashboard')}
          </button>
        </div>

        <div className="card-elevated p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('mockExam.performanceBySkill')}</h2>
          <div className="space-y-3">
            {Array.from(new Set(results.map(r => r.question.skill_id))).map(skillId => {
              const skillResults = results.filter(r => r.question.skill_id === skillId)
              const correct = skillResults.filter(r => r.correct).length
              const pct = Math.round((correct / skillResults.length) * 100)
              return (
                <div key={skillId} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 w-32">{skillId.toUpperCase()}</span>
                  <div className="flex-1 progress">
                    <div
                      className={`progress-bar ${pct >= 70 ? '' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-16 text-right">
                    {correct}/{skillResults.length}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (started && questions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            {error}
          </div>
        )}
        <div className="sticky top-16 z-30 glass border-b border-gray-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">AZ-104 {t('nav.mockExam')}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">
                Q{currentIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <QuestionLanguageToggle className="hidden sm:flex" />
              <div className={`text-lg font-mono font-bold px-4 py-2 rounded-xl ${
                timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-900'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <button onClick={finishExam} className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-xl transition-colors">
                {t('mockExam.endExam')}
              </button>
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
          </div>

          {(() => {
            const translated = translatedQuestions.get(currentIndex)
            return (
              <QuestionContent
                question={currentQuestion}
                selected={answers[currentQuestion.id] ?? null}
                onSelect={(value) => selectAnswer(currentQuestion.id, value)}
                translatedQuestionText={translated?.questionText}
                translatedOptions={translated?.options}
              />
            )
          })()}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="btn-ghost w-full sm:w-auto disabled:opacity-50"
            >
              {t('mockExam.previous')}
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {t('mockExam.next')}
                </button>
              ) : (
                <button onClick={finishExam} className="btn-primary flex-1 sm:flex-none">
                  {t('mockExam.finishExam')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t('mockExam.questionNavigator')}</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-500 rounded" /> {t('mockExam.answered')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gray-200 rounded" /> {t('mockExam.unanswered')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                  i === currentIndex
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : hasAnswer(answers[q.id])
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('mockExam.title')}</h1>
        <p className="text-gray-500 text-lg">{t('mockExam.titleDesc')}</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          {error}
        </div>
      )}

      {savedSession && (
        <div className="card-elevated flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('mockExam.resumeTitle')}</h2>
            <p className="text-sm text-gray-500">{t('mockExam.resumeDescription')}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={resumeSession} className="btn-primary px-5 py-2 text-sm">
              {t('mockExam.resume')}
            </button>
            <button onClick={discardSession} className="btn-secondary px-5 py-2 text-sm">
              {t('mockExam.discard')}
            </button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002050] via-[#0078D4] to-[#50E6FF] p-8 md:p-12 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">📝</div>
            <div>
              <div className="text-4xl font-bold">{config.questions}</div>
              <div className="text-blue-200">{t('mockExam.questionsLabel')}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">⏱️</div>
            <div>
              <div className="text-4xl font-bold">{config.time}</div>
              <div className="text-blue-200">{t('mockExam.minutes')}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">🎯</div>
            <div>
              <div className="text-4xl font-bold">70%</div>
              <div className="text-blue-200">{t('mockExam.passScore')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-elevated p-6 md:p-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t('mockExam.configuration')}</h2>
          <QuestionLanguageToggle />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">{t('mockExam.domain')}</label>
            <div className="space-y-2">
              {[
                { v: 'all', l: t('mockExam.allDomains'), icon: '🎯' },
                { v: 'identity-governance', l: t('practice.identityGovernance'), icon: '🔐' },
                { v: 'storage', l: t('practice.storage'), icon: '💾' },
                { v: 'compute', l: t('practice.compute'), icon: '🖥️' },
                { v: 'networking', l: t('practice.networking'), icon: '🌐' },
                { v: 'monitoring', l: t('practice.monitoring'), icon: '📊' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setConfig((p) => ({ ...p, domain: o.v }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    config.domain === o.v
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span>{o.icon}</span>
                  <span className="font-medium text-gray-700">{o.l}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">{t('mockExam.timeLimit')}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: 60, l: '60 min' },
                { v: 90, l: '90 min' },
                { v: 120, l: '120 min' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setConfig((p) => ({ ...p, time: o.v }))}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    config.time === o.v
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">{t('mockExam.questionsCount')}</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: 40, l: '40 Q' },
                { v: 50, l: '50 Q' },
                { v: 60, l: '60 Q' },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setConfig((p) => ({ ...p, questions: o.v }))}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    config.questions === o.v
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={startExam}
          disabled={loading}
          className="btn-primary text-lg px-12 py-4"
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {t('mockExam.loading')}
            </>
          ) : (
            <>
              <span className="mr-2">▶</span>
              {t('mockExam.startMockExam')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
