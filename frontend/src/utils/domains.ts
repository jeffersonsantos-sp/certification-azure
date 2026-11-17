const domainNameKeys: Record<string, string> = {
  'identity-governance': 'practice.identityGovernance',
  storage: 'practice.storage',
  compute: 'practice.compute',
  networking: 'practice.networking',
  monitoring: 'practice.monitoring',
}

const domainColors: Record<string, string> = {
  'identity-governance': 'bg-blue-50 text-blue-700 border-blue-200',
  storage: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  compute: 'bg-orange-50 text-orange-700 border-orange-200',
  networking: 'bg-violet-50 text-violet-700 border-violet-200',
  monitoring: 'bg-teal-50 text-teal-700 border-teal-200',
}

export function domainLabel(id: string, translate: (key: string) => string): string {
  const key = domainNameKeys[id]
  return key ? translate(key) : id
}

export function domainColor(id: string): string {
  return domainColors[id] || 'bg-gray-50 text-gray-600 border-gray-200'
}
