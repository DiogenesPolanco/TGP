import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { usePredictability, getPredictabilityColor, getPredictabilityBg } from '../hooks/usePredictability'
import type { PeriodGranularity } from '../hooks/usePredictability'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Target, TrendingUp, TrendingDown, Minus, BarChart3, Calendar,
} from 'lucide-react'

const granularityTabs: { key: PeriodGranularity; label: string }[] = [
  { key: 'monthly', label: 'Mensual' },
  { key: 'quarterly', label: 'Trimestral' },
  { key: 'yearly', label: 'Anual' },
]

export function PredictabilityPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string | ''>('')
  const [granularity, setGranularity] = useState<PeriodGranularity>('monthly')

  const { periods, teamOptions, plansWithPredictability } = usePredictability(
    selectedTeamId || null,
  )

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
      totalPlans: plansWithPredictability.length,
      healthyCount,
    }
  }, [currentPeriods, plansWithPredictability])

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-neutral-90 dark:text-white mb-1">{label}</p>
        <div className="space-y-1 text-neutral-60 dark:text-neutral-40">
          <p>Predictibilidad: <span className="font-medium text-neutral-90 dark:text-white">{data.predictabilidad}%</span></p>
          <p>Story points planificados: <span className="font-medium">{data.estimado} pts</span></p>
          <p>Story points completados: <span className="font-medium">{data.real} pts</span></p>
          <p>Planes: <span className="font-medium">{data.planes}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Predictibilidad de Sprints
          </h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Mide qué tan preciso es un equipo al estimar y cumplir sus compromisos. Rango ideal: 80-120%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-neutral-50" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[200px]"
            >
              <option value="">Todos los equipos</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-neutral-10 dark:bg-neutral-70 rounded-lg p-1">
            {granularityTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setGranularity(tab.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  granularity === tab.key
                    ? 'bg-white dark:bg-neutral-60 text-primary shadow-sm font-medium'
                    : 'text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
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
          color={summary.avg >= 80 && summary.avg <= 120 ? 'success' : summary.avg >= 50 ? 'warning' : 'danger'}
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
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
            Tendencia de Predictibilidad
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success/60" />
              <span className="text-neutral-60 dark:text-neutral-40">Ideal (80-120%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-warning/60" />
              <span className="text-neutral-60 dark:text-neutral-40">Aceptable (50-150%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-danger/60" />
              <span className="text-neutral-60 dark:text-neutral-40">Fuera de rango</span>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                angle={granularity === 'monthly' ? -45 : 0}
                textAnchor={granularity === 'monthly' ? 'end' : 'middle'}
                height={granularity === 'monthly' ? 80 : 40}
              />
              <YAxis domain={[0, 200]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="#36B37E" strokeDasharray="4 4" label={{ value: '80% mínimo ideal', position: 'right', fontSize: 11, fill: '#36B37E' }} />
              <ReferenceLine y={120} stroke="#36B37E" strokeDasharray="4 4" label={{ value: '120% máximo ideal', position: 'right', fontSize: 11, fill: '#36B37E' }} />
              <Bar
                dataKey="predictabilidad"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                fill="#0052CC"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const fill = payload.color === 'success' ? '#36B37E'
                    : payload.color === 'warning' ? '#FFAB00'
                    : '#FF5630'
                  return (
                    <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} />
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-16 text-center">
            <BarChart3 size={40} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
            <p className="text-sm text-neutral-50">
              {plansWithPredictability.length === 0
                ? 'No hay planes con datos de predictibilidad. Crea actividades con puntos planificados y completados para ver el gráfico.'
                : 'No se encontraron datos para el filtro seleccionado.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail table */}
      {currentPeriods.length > 0 && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-20 dark:border-neutral-70">
            <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
              Detalle por Período
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70">
                  <th className="text-left px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Período</th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Predictibilidad</th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Story Points Planif.</th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Story Points Comp.</th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Planes</th>
                  <th className="text-right px-5 py-3 font-medium text-neutral-60 dark:text-neutral-40">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {currentPeriods.map((period) => (
                  <tr key={period.periodKey} className="hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
                    <td className="px-5 py-3 font-medium text-neutral-90 dark:text-white">{period.label}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${getPredictabilityColor(period.avgPredictability)}`}>
                      {period.avgPredictability}%
                    </td>
                    <td className="px-5 py-3 text-right text-neutral-60 dark:text-neutral-40">{period.totalEstimated} pts plan.</td>
                    <td className="px-5 py-3 text-right text-neutral-60 dark:text-neutral-40">{period.totalActual} pts comp.</td>
                    <td className="px-5 py-3 text-right text-neutral-60 dark:text-neutral-40">{period.planCount}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPredictabilityBg(period.avgPredictability)} ${getPredictabilityColor(period.avgPredictability)}`}>
                        {period.avgPredictability >= 80 && period.avgPredictability <= 120 ? (
                          <><Minus size={12} /> Consistente</>
                        ) : period.avgPredictability < 80 ? (
                          <><TrendingDown size={12} /> Subestima</>
                        ) : (
                          <><TrendingUp size={12} /> Sobreestima</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title, value, subtitle, icon, color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: 'success' | 'warning' | 'danger' | 'primary'
}) {
  const colorMap = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    primary: 'text-primary bg-primary/10',
  }
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <div className={`w-fit p-2 rounded-lg ${colorMap[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5">{subtitle}</p>}
    </div>
  )
}
