import type { DashboardMetrics } from '../services/finOpsService'

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function FinOpsKPICards({ metrics }: { metrics: DashboardMetrics }) {
  const cards = [
    { label: 'Gasto del mes', value: fmt(metrics.total) },
    {
      label: 'Variación vs mes anterior',
      value:
        metrics.variationPct === null
          ? '—'
          : `${metrics.variationPct > 0 ? '+' : ''}${metrics.variationPct}%`,
    },
    {
      label: '% del presupuesto',
      value: metrics.budgetPct === null ? '—' : `${metrics.budgetPct}%`,
    },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-boundary bg-card p-4">
          <p className="text-xs text-neutral-500">{c.label}</p>
          <p className="text-2xl font-semibold mt-1">{c.value}</p>
        </div>
      ))}
    </div>
  )
}
