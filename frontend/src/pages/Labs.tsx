import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getLabProgressSummary,
  getLabs,
  LabProgressSummary,
  LabProgressStatus,
  LabSummary,
  LocalizedString,
} from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { domainColor, domainLabel } from '../utils/domains'

const statusStyles: Record<LabProgressStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-700',
  passed: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
}

const statusKeys: Record<LabProgressStatus, string> = {
  not_started: 'labs.statuses.notStarted',
  in_progress: 'labs.statuses.inProgress',
  passed: 'labs.statuses.passed',
  failed: 'labs.statuses.failed',
}

function localized(value: LocalizedString | null | undefined, language: string): string {
  return value?.[language] || value?.en || ''
}

export default function Labs() {
  const { t, language } = useLanguage()
  const [labs, setLabs] = useState<LabSummary[]>([])
  const [summary, setSummary] = useState<LabProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [labsResponse, summaryResponse] = await Promise.all([
          getLabs(),
          getLabProgressSummary(),
        ])
        setLabs(labsResponse.labs)
        setSummary(summaryResponse)
      } catch (err) {
        console.error('Failed to load labs:', err)
        setError(t('labs.failedLoad'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [language])

  const domains = Array.from(new Set(labs.map((lab) => lab.domain_id)))
  const query = search.trim().toLowerCase()
  const filteredLabs = labs.filter((lab) => {
    if (domainFilter !== 'all' && lab.domain_id !== domainFilter) return false
    if (statusFilter !== 'all' && lab.progress.status !== statusFilter) return false
    if (!query) return true

    const haystack = [
      localized(lab.title, language),
      localized(lab.description, language),
      lab.slug,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl gradient-bg text-white p-8 md:p-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-100">
            {t('nav.labs')}
          </p>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">{t('labs.title')}</h1>
          <p className="text-lg text-blue-100">{t('labs.subtitle')}</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat">
            <p className="mb-2 text-sm text-gray-500">{t('labs.totalLabs')}</p>
            <p className="text-3xl font-bold text-gray-900">{summary.total_labs}</p>
          </div>
          <div className="stat">
            <p className="mb-2 text-sm text-gray-500">{t('labs.inProgress')}</p>
            <p className="text-3xl font-bold text-gray-900">{summary.labs_in_progress}</p>
          </div>
          <div className="stat">
            <p className="mb-2 text-sm text-gray-500">{t('labs.stepsCompleted')}</p>
            <p className="text-3xl font-bold text-gray-900">
              {summary.completed_steps}
              <span className="text-base font-medium text-gray-400"> / {summary.total_steps}</span>
            </p>
          </div>
        </div>
      )}

      <div className="card-elevated p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('labs.searchPlaceholder')}
            className="input md:col-span-1"
          />
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="input"
            aria-label={t('labs.domain')}
          >
            <option value="all">{t('labs.allDomains')}</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domainLabel(domain, t)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input"
            aria-label={t('labs.status')}
          >
            <option value="all">{t('labs.allStatuses')}</option>
            <option value="not_started">{t('labs.statuses.notStarted')}</option>
            <option value="in_progress">{t('labs.statuses.inProgress')}</option>
            <option value="passed">{t('labs.statuses.passed')}</option>
            <option value="failed">{t('labs.statuses.failed')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card-elevated p-10 text-center text-gray-500">{t('labs.loading')}</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : labs.length === 0 ? (
        <div className="card-elevated p-10 text-center text-gray-500">{t('labs.noLabs')}</div>
      ) : filteredLabs.length === 0 ? (
        <div className="card-elevated p-10 text-center text-gray-500">{t('labs.noResults')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredLabs.map((lab) => {
            const progress = lab.progress
            const status = progress.status
            const buttonLabel =
              status === 'not_started'
                ? t('labs.startLab')
                : status === 'passed'
                  ? t('labs.reviewLab')
                  : t('labs.continueLab')

            return (
              <article key={lab.id} className="card-elevated flex flex-col p-6 card-hover">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`badge border ${domainColor(lab.domain_id)}`}>
                    {domainLabel(lab.domain_id, t)}
                  </span>
                  <span className={`badge badge-${lab.difficulty}`}>
                    {t(`practice.${lab.difficulty}`)}
                  </span>
                  <span className={`badge ${statusStyles[status]}`}>{t(statusKeys[status])}</span>
                  <span className="ml-auto text-sm text-gray-400">
                    {t('labs.minutes', { count: lab.estimated_minutes })}
                  </span>
                </div>

                <h2 className="mb-2 text-xl font-bold text-gray-900">
                  {localized(lab.title, language)}
                </h2>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
                  {localized(lab.description, language)}
                </p>

                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">{t('labs.progress')}</span>
                  <span className="text-gray-500">
                    {t('labs.stepsCount', {
                      completed: progress.completed_steps,
                      total: progress.total_steps,
                    })}
                  </span>
                </div>
                <div className="progress mb-5">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress.progress_percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-gray-400">{lab.resource_group_name}</span>
                  <Link
                    to={`/labs/${lab.slug}`}
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    {buttonLabel}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
