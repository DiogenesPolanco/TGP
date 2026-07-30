import { Minus, TrendingUp, TrendingDown } from 'lucide-react'
import type { Column } from '@/components/ui/SortableTable'
import type { PredictabilityPeriod } from '../hooks/usePredictability'

/* ── Shared color maps ── */

export const colorMapSummary = {
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
  primary: 'text-primary bg-primary/10',
} as const

export const gradientAccentSummary = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  primary: 'bg-primary',
} as const

export const gradientOverlaySummary = {
  success: 'from-success/5',
  warning: 'from-warning/5',
  danger: 'from-danger/5',
  primary: 'from-primary/5',
} as const

/* ── Pure helpers (standalone, no Dexie context needed) ── */

export function getPredictabilityColor(value: number): string {
  if (value >= 80 && value <= 120) return 'text-success'
  if (value >= 50 && value <= 150) return 'text-warning'
  return 'text-danger'
}

export function getPredictabilityBg(value: number): string {
  if (value >= 80 && value <= 120) return 'bg-success/10'
  if (value >= 50 && value <= 150) return 'bg-warning/10'
  return 'bg-danger/10'
}

/* ── Components ── */

export function PredictabilityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload: Record<string, unknown> }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white/90 dark:bg-neutral-80/90 backdrop-blur-md border border-neutral-20/80 dark:border-neutral-70/80 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
      <p className="font-semibold text-neutral-90 dark:text-white mb-2 pb-2 border-b border-boundary">
        {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Predictibilidad</span>
          <span className="font-semibold text-neutral-90 dark:text-white">
            {data.predictabilidad as string}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Planificados</span>
          <span className="font-medium text-neutral-90 dark:text-white">
            {data.estimado as string} pts
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Completados</span>
          <span className="font-medium text-neutral-90 dark:text-white">
            {data.real as string} pts
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-boundary">
          <span className="text-muted">Planes</span>
          <span className="font-medium text-neutral-90 dark:text-white">
            {data.planes as string}
          </span>
        </div>
      </div>
    </div>
  )
}

export function PredictabilitySummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
  rounded = 'rounded-xl',
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: 'success' | 'warning' | 'danger' | 'primary'
  rounded?: 'rounded-xl' | 'rounded-2xl'
}) {
  return (
    <div
      className={`group relative bg-card border border-boundary p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${rounded}`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${gradientOverlaySummary[color]} via-transparent to-transparent`}
      />
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 opacity-60 ${gradientAccentSummary[color]}`}
      />
      <div className="relative">
        <div
          className={`w-fit p-2 rounded-lg ${colorMapSummary[color]} mb-3 transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
        <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-muted mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/* ── Period columns factory ── */

export function createPeriodColumns(
  getColor: (v: number) => string,
  getBg: (v: number) => string,
): Column<PredictabilityPeriod & { id: string }>[] {
  return [
    {
      key: 'label',
      label: 'Período',
      sortable: true,
      render: (p) => (
        <span className="font-medium text-neutral-90 dark:text-white">{p.label}</span>
      ),
    },
    {
      key: 'avgPredictability',
      label: 'Predictibilidad',
      sortable: true,
      className: 'text-right',
      render: (p) => (
        <span className={`font-semibold ${getColor(p.avgPredictability)}`}>
          {p.avgPredictability}%
        </span>
      ),
    },
    {
      key: 'totalEstimated',
      label: 'Story Points Planif.',
      sortable: true,
      className: 'text-right',
      render: (p) => <span className="text-muted">{p.totalEstimated} pts plan.</span>,
    },
    {
      key: 'totalActual',
      label: 'Story Points Comp.',
      sortable: true,
      className: 'text-right',
      render: (p) => <span className="text-muted">{p.totalActual} pts comp.</span>,
    },
    {
      key: 'planCount',
      label: 'Planes',
      sortable: true,
      className: 'text-right',
      render: (p) => <span className="text-muted">{p.planCount}</span>,
    },
    {
      key: 'color',
      label: 'Estado',
      sortable: true,
      className: 'text-right',
      render: (p) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBg(p.avgPredictability)} ${getColor(p.avgPredictability)}`}
        >
          {p.avgPredictability >= 80 && p.avgPredictability <= 120 ? (
            <>
              <Minus size={12} /> Consistente
            </>
          ) : p.avgPredictability < 80 ? (
            <>
              <TrendingDown size={12} /> Subestima
            </>
          ) : (
            <>
              <TrendingUp size={12} /> Sobreestima
            </>
          )}
        </span>
      ),
    },
  ]
}
