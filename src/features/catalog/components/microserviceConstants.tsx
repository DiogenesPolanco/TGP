import type { MicroserviceLifecycleStatus } from '@/types/domain'
import { Check, RefreshCw, Clock, Ban, Calendar } from 'lucide-react'
import type { ReactNode } from 'react'

export const lifecycleLabel: Record<MicroserviceLifecycleStatus, string> = {
  active: 'Activo',
  evolving: 'En Evolución',
  deprecated: 'Deprecado',
  decommissioned: 'Decomisionado',
  planned: 'Planificado',
}

export const lifecycleColor: Record<string, string> = {
  active: 'bg-success/10 text-success',
  evolving: 'bg-info/10 text-info',
  deprecated: 'bg-warning/10 text-warning',
  decommissioned: 'bg-danger/10 text-danger',
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-muted',
}

export const lifecycleDotColor: Record<string, string> = {
  active: 'bg-success',
  evolving: 'bg-info',
  deprecated: 'bg-warning',
  decommissioned: 'bg-danger',
  planned: 'bg-neutral-40',
}

export const lifecycleIcon: Record<string, ReactNode> = {
  active: <Check size={12} />,
  evolving: <RefreshCw size={12} />,
  deprecated: <Clock size={12} />,
  decommissioned: <Ban size={12} />,
  planned: <Calendar size={12} />,
}
