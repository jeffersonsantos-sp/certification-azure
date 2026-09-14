import { useEffect, useState } from 'react'
import { getStats, StatsResponse } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

export default function Dashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const domainColors: Record<string, string> = {
    'identity-governance': '#0078D4',
    'storage': '#107C10',
    'compute': '#D83B01',
    'networking': '#8764B8',
    'monitoring': '#008272',
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl gradient-bg text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('dashboard.welcomeBack')}</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl">
            {t('dashboard.welcomeDesc')}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/practice" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0078D4] rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg transition-all">
              {t('dashboard.continuePractice')}
            </a>
            <a href="/mock-exam" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 border border-white/30 transition-all">
              {t('dashboard.takeMockExam')}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stat card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📝</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats?.total_questions || 0}
          </div>
          <div className="text-sm text-gray-500">{t('dashboard.totalQuestions')}</div>
        </div>

        <div className="stat card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📂</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats?.domains?.length || 0}
          </div>
          <div className="text-sm text-gray-500">{t('dashboard.domains')}</div>
        </div>

        <div className="stat card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">🎯</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats?.difficulties?.length || 0}
          </div>
          <div className="text-sm text-gray-500">{t('dashboard.difficultyLevels')}</div>
        </div>

        <div className="stat card-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📋</div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats?.domains?.reduce((sum, d) => sum + d.question_count, 0) || 0}
          </div>
          <div className="text-sm text-gray-500">{t('dashboard.approvedQuestions')}</div>
        </div>
      </div>

      <div className="card-elevated p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.questionsByDomain')}</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {stats?.domains?.map((domain) => {
              const maxQuestions = Math.max(...(stats?.domains?.map(d => d.question_count) || [1]))
              const percentage = maxQuestions > 0 ? (domain.question_count / maxQuestions) * 100 : 0
              return (
                <div key={domain.id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: domainColors[domain.id] || '#666' }}
                      />
                      <span className="font-medium text-gray-900">{domain.name}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">({domain.weight})</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: domainColors[domain.id] }}>
                      {domain.question_count} {t('dashboard.questions')}
                    </span>
                  </div>
                  <div className="progress">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: domainColors[domain.id] || '#666',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <a href="/practice" className="card-elevated p-6 group cursor-pointer">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('dashboard.practiceMode')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard.practiceModeDesc')}</p>
        </a>

        <a href="/mock-exam" className="card-elevated p-6 group cursor-pointer">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('dashboard.mockExam')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard.mockExamDesc')}</p>
        </a>

        <div className="card-elevated p-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('dashboard.statistics')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard.questionsInDb', { count: stats?.total_questions || 0 })}</p>
        </div>
      </div>
    </div>
  )
}
