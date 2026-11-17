import { useState } from 'react'
import { LabStep, LocalizedList } from '../services/api'
import CommandList from './CommandList'

function localizedList(value: LocalizedList | null | undefined, language: string): string[] {
  return value?.[language] || value?.en || []
}

export default function StepMethodTabs({
  step,
  language,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
  portalLabel,
  cliLabel,
}: {
  step: LabStep
  language: string
  copied: string | null
  onCopy: (command: string, key: string) => void
  copyLabel: string
  copiedLabel: string
  portalLabel: string
  cliLabel: string
}) {
  const portalSteps = localizedList(step.portal_steps, language)
  const hasPortalSteps = portalSteps.length > 0
  const [method, setMethod] = useState<'portal' | 'cli'>(hasPortalSteps ? 'portal' : 'cli')

  return (
    <div className="mt-4">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setMethod('portal')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            method === 'portal'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {portalLabel}
        </button>
        <button
          type="button"
          onClick={() => setMethod('cli')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
            method === 'cli'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {cliLabel}
        </button>
      </div>

      {method === 'portal' ? (
        <ol className="mt-4 space-y-3">
          {portalSteps.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-relaxed text-gray-600">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                {index + 1}
              </span>
              <span className="whitespace-pre-line">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <CommandList
          commands={step.commands}
          language={language}
          copied={copied}
          onCopy={onCopy}
          keyPrefix={`${step.id}-cli`}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />
      )}
    </div>
  )
}
