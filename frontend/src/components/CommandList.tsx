import { LabCommand, LocalizedString } from '../services/api'

function localized(value: LocalizedString | null | undefined, language: string): string {
  return value?.[language] || value?.en || ''
}

export default function CommandList({
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
