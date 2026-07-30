import { TrendingUp, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import type { ReactNode } from 'react'

export const STATUS_OPTIONS = [
  { value: 'not_started', label: 'No iniciado' },
  { value: 'on_track', label: 'Encaminado' },
  { value: 'at_risk', label: 'En riesgo' },
  { value: 'behind', label: 'Atrasado' },
  { value: 'achieved', label: 'Logrado' },
]

export const STATUS_STYLE: Record<string, string> = {
  not_started: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
  on_track: 'bg-success/10 text-success border-success/30',
  at_risk: 'bg-warning/10 text-warning border-warning/30',
  behind: 'bg-danger/10 text-danger border-danger/30',
  achieved: 'bg-success/10 text-success border-success/30',
}

export const STATUS_ICON: Record<string, ReactNode> = {
  not_started: <HelpCircle size={14} />,
  on_track: <TrendingUp size={14} />,
  at_risk: <AlertCircle size={14} />,
  behind: <AlertCircle size={14} />,
  achieved: <CheckCircle2 size={14} />,
}
