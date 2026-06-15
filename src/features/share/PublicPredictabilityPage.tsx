import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidShareHash, getPublicPredictabilityData, type PublicPredictabilityData } from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { PrintButton } from '@/components/ui/PrintButton'
import type { PeriodGranularity, PredictabilityPeriod } from '@/features/execution/hooks/usePredictability'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Target, TrendingUp, TrendingDown, Minus, BarChart3, Calendar,
} from 'lucide-react'
import { ChartGradients } from '@/components/charts/ChartGradients'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Button } from '@/components/ui/Button';

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

interface SprintItem {
  sprintId: string
  sprintName: string
  teamId: string
  plannedSP: number
  completedSP: number
  notCompletedSP: number
  predictability: number
  endDate: Date
  quarter: string
  year: number
}

interface TeamInfo {
  id: string
  name: string
}

function getColor(value: number): string {
  if (value >= 80 && value <= 120) return 'text-success'
  if (value >= 50 && value <= 150) return 'text-warning'
  return 'text-danger'
}

function getBg(value: number): string {
  if (value >= 80 && value <= 120) return 'bg-success/10'
  if (value >= 50 && value <= 150) return 'bg-warning/10'
  return 'bg-danger/10'
}

function buildPeriods(
  teamSprints: PublicPredictabilityData['teamSprints'],
  _teams: TeamInfo[],
): Record<PeriodGranularity, PredictabilityPeriod[]> {
  const sprints: SprintItem[] = teamSprints
    .filter((s) => s.plannedSP > 0)
    .map((s) => ({
      sprintId: s.id,
      sprintName: s.sprintName,
      teamId: s.teamId,
      plannedSP: s.plannedSP,
      completedSP: s.completedSP,
      notCompletedSP: s.notCompletedSP,
      predictability: s.plannedSP > 0 ? Math.round((s.completedSP / s.plannedSP) * 100) : 0,
      endDate: s.endDate instanceof Date ? s.endDate : new Date(s.endDate),
      quarter: s.quarter,
      year: s.year,
    }))

  function aggregate(granularity: PeriodGranularity) {
    const groups = new Map<string, SprintItem[]>()

    for (const s of sprints) {
      let key: string
      switch (granularity) {
        case 'monthly': {
          const m = String(s.endDate.getMonth() + 1).padStart(2, '0')
          key = `${s.endDate.getFullYear()}-${m}`
          break
        }
        case 'quarterly':
          key = `${s.year}-${s.quarter}`
          break
        case 'yearly':
          key = String(s.year)
          break
      }
      const existing = groups.get(key) ?? []
      existing.push(s)
      groups.set(key, existing)
    }

    return Array.from(groups.entries())
      .map(([periodKey, periodSprints]) => {
        const totalEstimated = periodSprints.reduce((sum, sp) => sum + sp.plannedSP, 0)
        const totalActual = periodSprints.reduce((sum, sp) => sum + sp.completedSP, 0)
        const avgPredictability = totalEstimated > 0
          ? Math.round((totalActual / totalEstimated) * 100)
          : 0
        const color: 'success' | 'warning' | 'danger' = avgPredictability >= 80 && avgPredictability <= 120
          ? 'success'
          : avgPredictability >= 50 && avgPredictability <= 150
            ? 'warning'
            : 'danger'

        let label: string
        switch (granularity) {
          case 'monthly': {
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            const monthIdx = periodSprints[0].endDate.getMonth()
            label = `${months[monthIdx]} ${periodSprints[0].endDate.getFullYear()}`
            break
          }
          case 'quarterly':
            label = `${periodSprints[0].quarter} ${periodSprints[0].year}`
            break
          case 'yearly':
            label = String(periodSprints[0].year)
            break
        }

        return {
          periodKey,
          label,
          avgPredictability,
          totalEstimated,
          totalActual,
          planCount: periodSprints.length,
          sprints: periodSprints,
          color,
        }
      })
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
  }

  return {
    monthly: aggregate('monthly'),
    quarterly: aggregate('quarterly'),
    yearly: aggregate('yearly'),
  }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }>; label?: string }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-white/90 dark:bg-neutral-80/90 backdrop-blur-md border border-neutral-20/80 dark:border-neutral-70/80 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
      <p className="font-semibold text-neutral-90 dark:text-white mb-2 pb-2 border-b border-neutral-20 dark:border-neutral-70">
        {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-60 dark:text-neutral-40">Predictibilidad</span>
          <span className="font-semibold text-neutral-90 dark:text-white">{data.predictabilidad as string}%</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-60 dark:text-neutral-40">Planificados</span>
          <span className="font-medium text-neutral-90 dark:text-white">{data.estimado as string} pts</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-neutral-60 dark:text-neutral-40">Completados</span>
          <span className="font-medium text-neutral-90 dark:text-white">{data.real as string} pts</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-20 dark:border-neutral-70">
          <span className="text-neutral-60 dark:text-neutral-40">Planes</span>
          <span className="font-medium text-neutral-90 dark:text-white">{data.planes as string}</span>
        </div>
      </div>
    </div>
  )
}

const periodColumns: Column<PredictabilityPeriod & { id: string }>[] = [
  { key: 'label', label: 'Período', sortable: true, render: (p) => <span className="font-medium text-neutral-90 dark:text-white">{p.label}</span> },
  {
    key: 'avgPredictability',
    label: 'Predictibilidad',
    sortable: true,
    className: 'text-right',
    render: (p) => <span className={`font-semibold ${getColor(p.avgPredictability)}`}>{p.avgPredictability}%</span>,
  },
  {
    key: 'totalEstimated',
    label: 'Story Points Planif.',
    sortable: true,
    className: 'text-right',
    render: (p) => <span className="text-neutral-60 dark:text-neutral-40">{p.totalEstimated} pts plan.</span>,
  },
  {
    key: 'totalActual',
    label: 'Story Points Comp.',
    sortable: true,
    className: 'text-right',
    render: (p) => <span className="text-neutral-60 dark:text-neutral-40">{p.totalActual} pts comp.</span>,
  },
  {
    key: 'planCount',
    label: 'Planes',
    sortable: true,
    className: 'text-right',
    render: (p) => <span className="text-neutral-60 dark:text-neutral-40">{p.planCount}</span>,
  },
  {
    key: 'color',
    label: 'Estado',
    sortable: true,
    className: 'text-right',
    render: (p) => (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBg(p.avgPredictability)} ${getColor(p.avgPredictability)}`}>
        {p.avgPredictability >= 80 && p.avgPredictability <= 120 ? (
          <><Minus size={12} /> Consistente</>
        ) : p.avgPredictability < 80 ? (
          <><TrendingDown size={12} /> Subestima</>
        ) : (
          <><TrendingUp size={12} /> Sobreestima</>
        )}
      </span>
    ),
  },
]

export function PublicPredictabilityPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicPredictabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)
  const [granularity, setGranularity] = useState<PeriodGranularity>('monthly')

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }
    ;(async () => {
      const tryLoad = (raw: unknown) => {
        if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
          setPendingEncrypted(raw as EncryptedPayload)
          setValid(true)
          setLoading(false)
        } else {
          setData(raw as PublicPredictabilityData)
          setValid(true)
          setLoading(false)
        }
      }

      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash) {
        try {
          const fragment = decodeURIComponent(rawHash)
          const { downloadUsingManifest } = await import('@/services/share/azureShareService')
          const azureData = await downloadUsingManifest(fragment)
          if (azureData) { tryLoad(azureData); return }
        } catch {}
      }
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) { tryLoad(viewerData); return }
      } catch {}
      if (isValidShareHash(hash)) {
        const d = await getPublicPredictabilityData()
        setData(d); setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    })()
  }, [hash])

  const periods = useMemo(() => {
    if (!data) return { monthly: [], quarterly: [], yearly: [] }
    return buildPeriods(data.teamSprints, data.teams)
  }, [data])

  const currentPeriods = periods[granularity]

  const summary = useMemo(() => {
    if (currentPeriods.length === 0) {
      return { avg: 0, best: null as { label: string; value: number } | null, worst: null as { label: string; value: number } | null, totalPlans: 0, healthyCount: 0 }
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

  if (loading) return <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center"><div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" /></div>
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
          <PassphraseModal
            title="Predictibilidad protegida"
            description="Esta vista fue compartida con cifrado. Ingresa la contraseña para verla."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) { setData(decrypted as PublicPredictabilityData); setPendingEncrypted(null) }
              else { alert('Contraseña incorrecta') }
            }}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div id="printable-content" className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Predictibilidad de Sprints</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-screen-2xl mx-auto">
        {/* Filters */}
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-neutral-50" />
              <span className="text-sm text-neutral-60 dark:text-neutral-40">Vista compartida</span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-10 dark:bg-neutral-70 rounded-lg p-1">
              {granularityTabs.map((tab) => (
                <Button
                  key={tab.key}
                  onClick={() => setGranularity(tab.key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    granularity === tab.key
                      ? 'bg-white dark:bg-neutral-60 text-primary shadow-sm font-medium'
                      : 'text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
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
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
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
                    const fill = payload.color === 'success' ? 'url(#pred-chart-success)'
                      : payload.color === 'warning' ? 'url(#pred-chart-warning)'
                      : 'url(#pred-chart-danger)'
                    return (
                      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} />
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center">
              <BarChart3 size={40} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
              <p className="text-sm text-neutral-50">
                No se encontraron sprints de equipo para los datos compartidos.
              </p>
            </div>
          )}
        </div>

        {/* Detail table */}
        {currentPeriods.length > 0 && (
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-20 dark:border-neutral-70">
              <h3 className="text-base font-semibold text-neutral-90 dark:text-white">
                Detalle por Período
              </h3>
            </div>
            <SortableTable
              columns={periodColumns}
              data={currentPeriods.map((p) => ({ ...p, id: p.periodKey } as PredictabilityPeriod & { id: string }))}
              pageSize={10}
            />
          </div>
        )}

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
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
  return (
    <div className="group relative bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${gradientOverlaySummary[color]} via-transparent to-transparent`}
      />
      <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-60 ${gradientAccentSummary[color]}`} />
      <div className="relative">
        <div className={`w-fit p-2 rounded-lg ${colorMapSummary[color]} mb-3 transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
