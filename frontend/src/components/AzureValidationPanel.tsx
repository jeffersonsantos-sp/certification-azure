import { useState } from 'react'
import {
  AzureCheckStatus,
  LabProgress,
  LabValidationResult,
  LocalizedString,
  validateLab,
} from '../services/api'
import { useAzure } from '../context/AzureContext'
import { useLanguage } from '../context/LanguageContext'

const statusStyles: Record<AzureCheckStatus, string> = {
  passed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
  error: 'border-amber-200 bg-amber-50 text-amber-700',
  skipped: 'border-gray-200 bg-gray-50 text-gray-600',
}

const statusIcons: Record<AzureCheckStatus, string> = {
  passed: '✓',
  failed: '✕',
  error: '!',
  skipped: '•',
}

function localized(value: LocalizedString | null | undefined, language: string): string {
  return value?.[language] || value?.en || ''
}

export default function AzureValidationPanel({
  slug,
  resourceGroupName,
  onProgress,
}: {
  slug: string
  resourceGroupName: string
  onProgress: (progress: LabProgress) => void
}) {
  const { t, language } = useLanguage()
  const {
    configured,
    missingConfig,
    connected,
    account,
    subscriptions,
    selectedSubscriptionId,
    selectedSubscription,
    loadingSubscriptions,
    connecting,
    error,
    connect,
    disconnect,
    selectSubscription,
    getAccessToken,
  } = useAzure()
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [result, setResult] = useState<LabValidationResult | null>(null)

  const handleValidate = async () => {
    if (!selectedSubscriptionId || validating) return

    setValidating(true)
    setValidationError(null)
    try {
      const token = await getAccessToken()
      const response = await validateLab(slug, token, selectedSubscriptionId)
      setResult(response)
      onProgress(response.progress)
    } catch (err: any) {
      console.error('Lab validation failed:', err)
      setValidationError(err.response?.data?.detail || t('azure.validationFailed'))
    } finally {
      setValidating(false)
    }
  }

  if (!configured) {
    return (
      <section className="card-elevated border-amber-200 p-6 md:p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">{t('azure.title')}</h2>
        <p className="mb-2 text-sm text-gray-600">{t('azure.notConfigured')}</p>
        {missingConfig.length > 0 && (
          <p className="mb-2 text-sm font-medium text-amber-700">
            {t('azure.missingConfig', { vars: missingConfig.join(', ') })}
          </p>
        )}
        <p className="text-sm text-gray-500">{t('azure.configHint')}</p>
      </section>
    )
  }

  return (
    <section className="card-elevated p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('azure.title')}</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">{t('azure.description')}</p>
        </div>
        {connected && (
          <button type="button" onClick={disconnect} className="btn-secondary px-4 py-2 text-sm">
            {t('azure.disconnect')}
          </button>
        )}
      </div>

      {!connected ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={connect}
              disabled={connecting}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60"
            >
              {connecting ? t('azure.connecting') : t('azure.connect')}
            </button>
            <p className="max-w-2xl text-sm text-blue-700">{t('azure.readOnly')}</p>
          </div>
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="font-semibold">
              {t('azure.connectedAs', {
                name: account?.name || account?.username || '',
              })}
            </span>
            <span className="text-emerald-600">
              {t('azure.tenant')}: {account?.tenantId}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {t('azure.subscription')}
              </label>
              <select
                value={selectedSubscriptionId}
                onChange={(event) => selectSubscription(event.target.value)}
                className="input"
                disabled={loadingSubscriptions}
              >
                {loadingSubscriptions ? (
                  <option value="">{t('azure.loadingSubscriptions')}</option>
                ) : subscriptions.length === 0 ? (
                  <option value="">{t('azure.noSubscriptions')}</option>
                ) : (
                  <>
                    <option value="">{t('azure.selectSubscription')}</option>
                    {subscriptions.map((subscription) => (
                      <option key={subscription.id} value={subscription.id}>
                        {subscription.name} ({subscription.id})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">{t('azure.resourceGroup')}</p>
              <p className="input font-mono text-sm text-gray-600">{resourceGroupName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!selectedSubscriptionId || validating}
              className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {validating ? t('azure.validating') : t('azure.validate')}
            </button>
            <p className="text-xs text-gray-500">{t('azure.readOnly')}</p>
          </div>

          {(validationError || error) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {validationError || error}
            </div>
          )}

          {result && (
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <div
                className={`rounded-2xl border p-5 ${
                  result.passed
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3
                    className={`text-lg font-bold ${
                      result.passed ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {result.passed ? t('azure.passed') : t('azure.failed')}
                  </h3>
                  <span
                    className={`text-2xl font-bold ${
                      result.passed ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {t('azure.score', { score: result.score_percentage })}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-gray-900">{t('azure.results')}</h3>
                <div className="space-y-2">
                  {result.checks.map((check) => (
                    <div
                      key={check.key}
                      className={`rounded-xl border p-4 ${statusStyles[check.status]}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-bold">
                          {statusIcons[check.status]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{localized(check.name, language)}</span>
                            <span className="badge bg-white/70 text-gray-600">
                              {t(`azure.checkStatuses.${check.status}`)}
                            </span>
                            {!check.required && (
                              <span className="badge bg-white/70 text-gray-500">
                                {t('labs.optional')}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm opacity-90">{check.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubscription && (
                <p className="text-xs text-gray-400">
                  {selectedSubscription.name} · {selectedSubscription.id}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
