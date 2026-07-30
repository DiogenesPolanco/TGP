import { formatDuration } from '@/utils/technologyUtils'
import type { SupportStatus, Technology } from '@/types/domain'

export function getStatusStyle(status: SupportStatus) {
  switch (status) {
    case 'eol':
      return 'bg-danger/10 text-danger border-danger/30'
    case 'extended':
      return 'bg-warning/10 text-warning border-warning/30'
    case 'active':
      return 'bg-success/10 text-success border-success/30'
    default:
      return 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60'
  }
}

export function getStatusLabel(status: SupportStatus) {
  switch (status) {
    case 'eol':
      return 'EOL'
    case 'extended':
      return 'Soporte Extendido'
    case 'active':
      return 'Activo'
    default:
      return 'Desconocido'
  }
}

export function getEolUrgency(tech: Technology) {
  if (tech.supportStatus === 'eol')
    return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
  if (!tech.eolDate) return { color: 'text-neutral-50', label: 'Sin fecha', dot: 'bg-neutral-40' }

  const now = new Date()
  const eol = new Date(tech.eolDate)
  const diffMs = eol.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
  const human = formatDuration(diffDays)
  if (diffDays < 180) return { color: 'text-warning', label: `En ${human}`, dot: 'bg-warning' }
  if (diffDays < 365)
    return { color: 'text-severity-high', label: `En ${human}`, dot: 'bg-severity-high' }
  return { color: 'text-success', label: `En ${human}`, dot: 'bg-success' }
}

export function getLifecyclePct(eolDate: Date): number {
  const created = new Date(eolDate)
  created.setFullYear(created.getFullYear() - 5)
  const total = eolDate.getTime() - created.getTime()
  const elapsed = Date.now() - created.getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

export const categoryLabels: Record<string, string> = {
  framework: 'Framework',
  language: 'Lenguaje',
  database: 'BD',
  runtime: 'Runtime',
  cache: 'Cache',
  message_broker: 'Mensajería',
  library: 'Librería',
  tool: 'Herramienta',
  os: 'SO',
  web_server: 'Servidor Web',
  cloud_service: 'Cloud',
  other: 'Otro',
}
