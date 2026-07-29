import { useState, useMemo } from 'react'
import {
  usePredictability,
  getPredictabilityColor,
  getPredictabilityBg,
} from '../hooks/usePredictability'
import type { PeriodGranularity, PredictabilityPeriod } from '../hooks/usePredictability'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Target, TrendingUp, TrendingDown, Minus, BarChart3, Calendar } from 'lucide-react'
import { ChartGradients } from '@/components/charts/ChartGradients'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const granularityTabs: { key: PeriodGranularity; label: string }[] = [
  { key: 'monthly', label: 'Mensual' },
  { key: 'quarterly', label: 'Trimestral' },
  { key: 'yearly', label: 'Anual' },
]

const colorMapSummary = {
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  danger: 'text-danger bg-danger/10',
  primary: 'text-primary bg-primary/10',
}

const gradientAccentSummary = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  primary: 'bg-primary',
}

const gradientOverlaySummary = {
  success: 'from-success/5',
  warning: 'from-warning/5',
  danger: 'from-danger/5',
  primary: 'from-primary/5',
}

function CustomTooltip({
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

const periodColumns: Column<PredictabilityPeriod & { id: string }>[] = [
  {
    key: 'label',
    label: 'Período',
    sortable: true,
    render: (p) => <span className="font-medium text-neutral-90 dark:text-white">{p.label}</span>,
  },
  {
    key: 'avgPredictability',
    label: 'Predictibilidad',
    sortable: true,
    className: 'text-right',
    render: (p) => (
      <span className={`font-semibold ${getPredictabilityColor(p.avgPredictability)}`}>
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
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPredictabilityBg(p.avgPredictability)} ${getPredictabilityColor(p.avgPredictability)}`}
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

export function PredictabilityPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | ''>('')
  const [granularity, setGranularity] = useState<PeriodGranularity>('monthly')

  const { periods, teamOptions } = usePredictability(selectedTeamId || null)

  const currentPeriods = periods[granularity]

  const summary = useMemo(() => {
    if (currentPeriods.length === 0) {
      return { avg: 0, best: null, worst: null, totalPlans: 0, healthyCount: 0 }
    }

    const totalEstimated = currentPeriods.reduce((s, p) => s + p.totalEstimated, 0)
    const totalActual = currentPeriods.reduce((s, p) => s + p.totalActual, 0)
    const avg = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0

    let best = { label: '', value: 0 }
    let worst = { label: '', value: Infinity }
    let healthyCount = 0

    for (const p of currentPeriods) {
      if (p.avgPredictability > best.value) best = { label: p.label, value: p.avgPredictability }
      if (p.avgPredictability < worst.value) worst = { label: p.label, value: p.avgPredictability }
      if (p.avgPredictability >= 80 && p.avgPredictability <= 120) healthyCount++
    }

    return {
      avg,
      best: best.value > 0 ? best : null,
      worst: worst.value < Infinity ? worst : null,
      totalPlans: currentPeriods.reduce((s, p) => s + p.planCount, 0),
      healthyCount,
    }
  }, [currentPeriods])

  const chartData = useMemo(() => {
    return currentPeriods.map((p) => ({
      label: p.label,
      predictabilidad: p.avgPredictability,
      planes: p.planCount,
      estimado: p.totalEstimated,
      real: p.totalActual,
      color: p.color,
    }))
  }, [currentPeriods])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Predictibilidad de Sprints
          </h2>
          <p className="text-sm text-muted mt-1">
            Mide qué tan preciso es un equipo al estimar y cumplir sus compromisos. Rango ideal:
            80-120%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-50" />
            <Select
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              options={[
                { value: '', label: 'Todos los equipos' },
                ...teamOptions.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-10 dark:bg-neutral-70 rounded-lg p-1">
            {granularityTabs.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setGranularity(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  granularity === tab.key
                    ? 'bg-white dark:bg-neutral-60 text-primary shadow-sm font-medium'
                    : 'text-muted hover:text-neutral-90 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Predictibilidad Promedio"
          value={`${summary.avg}%`}
          icon={<Target size={20} />}
          color={
            summary.avg >= 80 && summary.avg <= 120
              ? 'success'
              : summary.avg >= 50
                ? 'warning'
                : 'danger'
          }
        />
        <SummaryCard
          title="Mejor Período"
          value={summary.best ? `${summary.best.value}%` : 'N/A'}
          subtitle={summary.best?.label}
          icon={<TrendingUp size={20} />}
          color="success"
        />
        <SummaryCard
          title="Peor Período"
          value={summary.worst ? `${summary.worst.value}%` : 'N/A'}
          subtitle={summary.worst?.label}
          icon={<TrendingDown size={20} />}
          color="danger"
        />
        <SummaryCard
          title="Planes Analizados"
          value={String(summary.totalPlans)}
          subtitle={`${summary.healthyCount} en rango ideal`}
          icon={<BarChart3 size={20} />}
          color="primary"
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
            Tendencia de Predictibilidad
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success/60" />
              <span className="text-muted">Ideal (80-120%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-warning/60" />
              <span className="text-muted">Aceptable (50-150%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-danger/60" />
              <span className="text-muted">Fuera de rango</span>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <ChartGradients id="pred-chart" />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6B778C' }}
                angle={granularity === 'monthly' ? -45 : 0}
                textAnchor={granularity === 'monthly' ? 'end' : 'middle'}
                height={granularity === 'monthly' ? 80 : 40}
                axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 200]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12, fill: '#6B778C' }}
                axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F5F7', opacity: 0.5 }} />
              <ReferenceLine
                y={80}
                stroke="#36B37E"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: '80% mínimo',
                  position: 'right',
                  fontSize: 11,
                  fill: '#36B37E',
                }}
              />
              <ReferenceLine
                y={120}
                stroke="#36B37E"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: '120% máximo',
                  position: 'right',
                  fontSize: 11,
                  fill: '#36B37E',
                }}
              />
              <Bar
                dataKey="predictabilidad"
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
                fill="url(#pred-chart-primary)"
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
                shape={(props: { x?: number; y?: number; width?: number; height?: number }) => {
                  const { x, y, width, height } = props
                  const payload = (props as any).payload
                  const fill =
                    payload.color === 'success'
                      ? 'url(#pred-chart-success)'
                      : payload.color === 'warning'
                        ? 'url(#pred-chart-warning)'
                        : 'url(#pred-chart-danger)'
                  return <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-16 text-center">
            <BarChart3 size={40} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
            <p className="text-sm text-neutral-50">
              No se encontraron sprints de equipo para el filtro seleccionado. Registra sprints en
              el detalle del equipo para ver el gráfico.
            </p>
          </div>
        )}
      </div>

      {/* Detail table */}
      {currentPeriods.length > 0 && (
        <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-boundary">
            <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
              Detalle por Período
            </h3>
          </div>
          <SortableTable
            columns={periodColumns}
            data={currentPeriods.map(
              (p) => ({ ...p, id: p.periodKey }) as PredictabilityPeriod & { id: string },
            )}
            pageSize={10}
          />
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: 'success' | 'warning' | 'danger' | 'primary'
}) {
  return (
    <div className="group relative bg-card rounded-xl border border-boundary p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
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
