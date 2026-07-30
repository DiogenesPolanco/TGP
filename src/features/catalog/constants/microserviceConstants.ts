import type { MicroserviceLifecycleStatus } from '@/types/domain'

export const lifecycleLabel: Record<MicroserviceLifecycleStatus, string> = {
  active: 'Activo',
  evolving: 'En Evolución',
  deprecated: 'Deprecado',
  decommissioned: 'Decomisionado',
  planned: 'Planificado',
}

export const lifecycleColor: Record<MicroserviceLifecycleStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  evolving: 'bg-info/10 text-info border-info/30',
  deprecated: 'bg-warning/10 text-warning border-warning/30',
  decommissioned:
    'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  planned: 'bg-success/10 text-success border-success/30',
}

export const serviceLevelLabel: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}
