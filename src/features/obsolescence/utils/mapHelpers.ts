import type { SupportStatus, Technology } from '@/types/domain'

export type StatusFilter = SupportStatus | 'all' | 'mixed'

export function getWorstStatus(
  techIds: string[],
  techMap: Map<string, Technology>,
): SupportStatus | 'mixed' {
  if (techIds.length === 0) return 'unknown'
  let hasExtended = false,
    hasUnknown = false,
    hasActive = false
  for (const tId of techIds) {
    const tech = techMap.get(tId)
    if (!tech || tech.supportStatus === 'unknown') {
      hasUnknown = true
    } else if (tech.supportStatus === 'eol') return 'eol'
    else if (tech.supportStatus === 'extended') hasExtended = true
    else if (tech.supportStatus === 'active') hasActive = true
  }
  if (hasExtended && hasActive) return 'mixed'
  if (hasExtended) return 'extended'
  if (hasActive && hasUnknown) return 'mixed'
  if (hasActive) return 'active'
  return 'unknown'
}

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '#8888a0' },
  { value: 'eol', label: 'EOL', color: '#FF5630' },
  { value: 'extended', label: 'Soporte Extendido', color: '#FF8B00' },
  { value: 'active', label: 'Activo', color: '#36B37E' },
  { value: 'unknown', label: 'Sin datos', color: '#6B778C' },
  { value: 'mixed', label: 'Mixto', color: '#8B5CF6' },
]
