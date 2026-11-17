import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getLab,
  LabCommand,
  LabDetail as LabDetailData,
  LabStep,
  LocalizedList,
  LocalizedString,
  startLab,
  updateLabStep,
} from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import AzureValidationPanel from '../components/AzureValidationPanel'
import { domainColor, domainLabel } from '../utils/domains'

function localized(value: LocalizedString | null | undefined, language: string): string {
  return value?.[language] || value?.en || ''
}

function localizedList(value: LocalizedList | null | undefined, language: string): string[] {
  return value?.[language] || value?.en || []
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)

  return (
    <span className="whitespace-pre-line">
      {parts.map((part, index) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={index}
            className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-800"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}

function CommandList({
  commands,
  language,
  copied,
  onCopy,
  keyPrefix,
  copyLabel,
  copiedLabel,
}: {
  commands: LabCommand[]
  language: string
  copied: string | null
  onCopy: (command: string, key: string) => void
  keyPrefix: string
  copyLabel: string
  copiedLabel: string
}) {
  if (commands.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      {commands.map((command, index) => {
        const key = `${keyPrefix}-${index}`
        return (
          <div key={key} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
              <span className="text-xs font-medium text-gray-300">
                {localized(command.label, language)}
              </span>
              <button
                type="button"
                onClick={() => onCopy(command.command, key)}
                className="shrink-0 text-xs font-semibold text-blue-300 hover:text-blue-200"
              >
                {copied === key ? copiedLabel : copyLabel}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-gray-100">
              <code>{command.command}</code>
            </pre>
          </div>
        )
      })}
    </div>
  )
}

export default function LabDetail() {
  const { t, language } = useLanguage()
  const { slug } = useParams()
  const [lab, setLab] = useState<LabDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [updatingStep, setUpdatingStep] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError(t('labs.labNotFound'))
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        setLab(await getLab(slug))
      } catch (err) {
        console.error('Failed to load lab:', err)
        setError(t('labs.failedLoad'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, language])

  const copyCommand = async (command: string, key: string) => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(key)
      window.setTimeout(() => setCopied(null), 1800)
    } catch (err) {
      console.error('Failed to copy command:', err)
    }
  }

  const handleStart = async () => {
    if (!lab || starting) return

    if (lab.progress.status !== 'not_started') {
      document.getElementById('lab-steps')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setStarting(true)
    setActionError(null)
    try {
      const progress = await startLab(lab.slug)
      setLab({ ...lab, progress })
      document.getElementById('lab-steps')?.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to start lab:', err)
      setActionError(t('labs.startError'))
    } finally {
      setStarting(false)
    }
  }

  const handleToggleStep = async (step: LabStep) => {
    if (!lab || updatingStep) return

    setUpdatingStep(step.id)
    setActionError(null)
    try {
      const progress = await updateLabStep(lab.slug, step.id, !step.completed)
      setLab({
        ...lab,
        progress,
        steps: lab.steps.map((item) =>
          item.id === step.id ? { ...item, completed: !step.completed } : item
        ),
      })
    } catch (err) {
      console.error('Failed to update step:', err)
      setActionError(t('labs.stepError'))
    } finally {
      setUpdatingStep(null)
    }
  }

  if (loading) {
    return <div className="card-elevated p-10 text-center text-gray-500">{t('labs.loading')}</div>
  }

  if (error || !lab) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error || t('labs.labNotFound')}
        </div>
        <Link to="/labs" className="btn-secondary">
          {t('labs.backToLabs')}
        </Link>
      </div>
    )
  }

  const progress = lab.progress
  const objectives = localizedList(lab.objectives, language)
  const prerequisites = localizedList(lab.prerequisites, language)
  const startLabel =
    progress.status === 'not_started'
      ? t('labs.startLab')
      : progress.status === 'passed'
        ? t('labs.reviewLab')
        : t('labs.continueLab')

  const checkTypeLabels: Record<string, string> = {
    resource_exists: t('labs.checkTypes.resourceExists'),
    resource_count: t('labs.checkTypes.resourceCount'),
    property_equals: t('labs.checkTypes.propertyEquals'),
    tag_equals: t('labs.checkTypes.tagEquals'),
    role_assignment_exists: t('labs.checkTypes.roleAssignmentExists'),
    nsg_rule_exists: t('labs.checkTypes.nsgRuleExists'),
    subnet_exists: t('labs.checkTypes.subnetExists'),
    policy_assignment_exists: t('labs.checkTypes.policyAssignmentExists'),
    resource_lock_exists: t('labs.checkTypes.resourceLockExists'),
    virtual_network_peering_exists: t('labs.checkTypes.vnetPeeringExists'),
    load_balancer_probe_exists: t('labs.checkTypes.loadBalancerProbeExists'),
    manual: t('labs.checkTypes.manual'),
  }

  return (
    <div className="space-y-8">
      <Link to="/labs" className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-700">
        {t('labs.backToLabs')}
      </Link>

      <div className="relative overflow-hidden rounded-3xl gradient-bg p-7 text-white md:p-10">
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-x-1/3 translate-y-1/3 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`badge border ${domainColor(lab.domain_id)}`}>
              {domainLabel(lab.domain_id, t)}
            </span>
            <span className={`badge badge-${lab.difficulty}`}>{t(`practice.${lab.difficulty}`)}</span>
            <span className="badge border border-white/30 bg-white/15 text-white">
              {t('labs.minutes', { count: lab.estimated_minutes })}
            </span>
          </div>

          <h1 className="mb-3 max-w-4xl text-3xl font-bold md:text-4xl">
            {localized(lab.title, language)}
          </h1>
          <p className="mb-6 max-w-3xl text-lg text-blue-100">
            {localized(lab.description, language)}
          </p>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-blue-50">{t('labs.progress')}</span>
            <span className="text-blue-100">
              {t('labs.stepsCount', {
                completed: progress.completed_steps,
                total: progress.total_steps,
              })}{' '}
              · {progress.progress_percentage}%
            </span>
          </div>
          <div className="progress mb-6 bg-white/20">
            <div className="progress-bar bg-white" style={{ width: `${progress.progress_percentage}%` }} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0078D4] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-60"
            >
              {starting ? '...' : startLabel}
            </button>
            <span className="font-mono text-xs text-blue-100">{lab.resource_group_name}</span>
          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {objectives.length > 0 && (
          <section className="card-elevated p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{t('labs.objectives')}</h2>
            <ul className="space-y-3">
              {objectives.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {prerequisites.length > 0 && (
          <section className="card-elevated p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">{t('labs.prerequisites')}</h2>
            <ul className="space-y-3">
              {prerequisites.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                  <span className="mt-0.5 text-blue-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {lab.cost_warning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <p className="mb-1 font-semibold">{t('labs.costWarning')}</p>
          <p>{localized(lab.cost_warning, language)}</p>
        </div>
      )}

      <AzureValidationPanel
        slug={lab.slug}
        resourceGroupName={lab.resource_group_name}
        onProgress={(newProgress) =>
          setLab((current) => (current ? { ...current, progress: newProgress } : current))
        }
      />

      <section id="lab-steps" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t('labs.steps')}</h2>
          <span className="text-sm text-gray-500">
            {t('labs.stepsCount', {
              completed: progress.completed_steps,
              total: progress.total_steps,
            })}
          </span>
        </div>

        {lab.steps.map((step) => (
          <article
            key={step.id}
            className={`card-elevated p-5 transition-colors md:p-6 ${
              step.completed ? 'border-emerald-200 bg-emerald-50/40' : ''
            }`}
          >
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleToggleStep(step)}
                disabled={updatingStep === step.id}
                aria-label={step.completed ? t('labs.markIncomplete') : t('labs.markComplete')}
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                  step.completed
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600'
                } disabled:opacity-60`}
              >
                {step.completed ? '✓' : step.position}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {localized(step.title, language)}
                  </h3>
                  {step.completed && (
                    <span className="badge bg-emerald-50 text-emerald-700">
                      {t('labs.stepCompleted')}
                    </span>
                  )}
                </div>

                <div className="text-sm leading-relaxed text-gray-600">
                  <RichText text={localized(step.instructions, language)} />
                </div>

                <CommandList
                  commands={step.commands}
                  language={language}
                  copied={copied}
                  onCopy={copyCommand}
                  keyPrefix={step.id}
                  copyLabel={t('labs.copy')}
                  copiedLabel={t('labs.copied')}
                />

                {step.validation_hint && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    {localized(step.validation_hint, language)}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleToggleStep(step)}
                  disabled={updatingStep === step.id}
                  className={`mt-4 inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    step.completed
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {updatingStep === step.id
                    ? '...'
                    : step.completed
                      ? t('labs.markIncomplete')
                      : t('labs.markComplete')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {lab.checks.length > 0 && (
        <section className="card-elevated p-6 md:p-8">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">{t('labs.validationCriteria')}</h2>
          <p className="mb-5 text-sm text-gray-500">{t('labs.validationCriteriaDesc')}</p>
          <div className="space-y-3">
            {lab.checks.map((check) => (
              <div
                key={check.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {localized(check.name, language)}
                    </span>
                    <span className="badge bg-white text-gray-600">
                      {checkTypeLabels[check.check_type] || check.check_type}
                    </span>
                    <span
                      className={`badge ${
                        check.required
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {check.required ? t('labs.required') : t('labs.optional')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{localized(check.description, language)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lab.cleanup_commands.length > 0 && (
        <section className="card-elevated p-6 md:p-8">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">{t('labs.cleanup')}</h2>
          <p className="mb-2 text-sm text-gray-500">{t('labs.cleanupDesc')}</p>
          <CommandList
            commands={lab.cleanup_commands}
            language={language}
            copied={copied}
            onCopy={copyCommand}
            keyPrefix={`${lab.slug}-cleanup`}
            copyLabel={t('labs.copy')}
            copiedLabel={t('labs.copied')}
          />
        </section>
      )}
    </div>
  )
}
