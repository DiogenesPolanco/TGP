import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  isValidShareHash,
  getPublicPredictabilityData,
  type PublicPredictabilityData,
} from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { PrintButton } from '@/components/ui/PrintButton'
import type {
  PeriodGranularity,
  PredictabilityPeriod,
} from '@/features/execution/hooks/usePredictability'
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
import { Target, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react'
import { ChartGradients } from '@/components/charts/ChartGradients'
import { SortableTable } from '@/components/ui/SortableTable'
import { Button } from '@/components/ui/Button'
import {
  PredictabilityTooltip,
  PredictabilitySummaryCard,
  createPeriodColumns,
  getPredictabilityColor,
  getPredictabilityBg,
} from '@/features/execution/components/predictabilityHelpers'

const granularityTabs: { key: PeriodGranularity; label: string }[] = [
  { key: 'monthly', label: 'Mensual' },
  { key: 'quarterly', label: 'Trimestral' },
  { key: 'yearly', label: 'Anual' },
]

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
        const avgPredictability =
          totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0
        const color: 'success' | 'warning' | 'danger' =
          avgPredictability >= 80 && avgPredictability <= 120
            ? 'success'
            : avgPredictability >= 50 && avgPredictability <= 150
              ? 'warning'
              : 'danger'

        let label: string
        switch (granularity) {
          case 'monthly': {
            const months = [
              'Enero',
              'Febrero',
              'Marzo',
              'Abril',
              'Mayo',
              'Junio',
              'Julio',
              'Agosto',
              'Septiembre',
              'Octubre',
              'Noviembre',
              'Diciembre',
            ]
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

const periodColumns = createPeriodColumns(getPredictabilityColor, getPredictabilityBg)
export function PublicPredictabilityPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicPredictabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)
  const [granularity, setGranularity] = useState<PeriodGranularity>('monthly')

  useEffect(() => {
    if (!hash) {
      setValid(false)
      setLoading(false)
      return
    }
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
          if (azureData) {
            tryLoad(azureData)
            return
          }
        } catch {}
      }
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) {
          tryLoad(viewerData)
          return
        }
      } catch {}
      if (isValidShareHash(hash)) {
        const d = await getPublicPredictabilityData()
        setData(d)
        setValid(true)
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
      return {
        avg: 0,
        best: null as { label: string; value: number } | null,
        worst: null as { label: string; value: number } | null,
        totalPlans: 0,
        healthyCount: 0,
      }
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

  if (loading)
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  if (!valid) return <InvalidLinkPage />
  if (!data) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="Predictibilidad protegida"
            description="Esta vista fue compartida con cifrado. Ingresa la contraseña para verla."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) {
                setData(decrypted as PublicPredictabilityData)
                setPendingEncrypted(null)
              } else {
                alert('Contraseña incorrecta')
              }
            }}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-card border-b border-boundary">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">
                Predictibilidad de Sprints
              </h1>
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
        <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-neutral-50" />
              <span className="text-sm text-muted">Vista compartida</span>
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
          <PredictabilitySummaryCard
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
            rounded="rounded-2xl"
          />
          <PredictabilitySummaryCard
            title="Mejor Período"
            value={summary.best ? `${summary.best.value}%` : 'N/A'}
            subtitle={summary.best?.label}
            icon={<TrendingUp size={20} />}
            color="success"
            rounded="rounded-2xl"
          />
          <PredictabilitySummaryCard
            title="Peor Período"
            value={summary.worst ? `${summary.worst.value}%` : 'N/A'}
            subtitle={summary.worst?.label}
            icon={<TrendingDown size={20} />}
            color="danger"
            rounded="rounded-2xl"
          />
          <PredictabilitySummaryCard
            title="Planes Analizados"
            value={String(summary.totalPlans)}
            subtitle={`${summary.healthyCount} en rango ideal`}
            icon={<BarChart3 size={20} />}
            color="primary"
            rounded="rounded-2xl"
          />
        </div>

        {/* Chart */}
        <div className="bg-card rounded-2xl border border-boundary p-6 shadow-sm">
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
                <Tooltip content={<PredictabilityTooltip />} cursor={{ fill: '#F4F5F7', opacity: 0.5 }} />
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
                No se encontraron sprints de equipo para los datos compartidos.
              </p>
            </div>
          )}
        </div>

        {/* Detail table */}
        {currentPeriods.length > 0 && (
          <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
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

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )}
