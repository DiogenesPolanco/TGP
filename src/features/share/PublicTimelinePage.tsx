import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import {
  isValidShareHash,
  getPublicTimelineData,
  type PublicTimelineData,
} from '@/services/share/publicShareService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { PrintButton } from '@/components/ui/PrintButton'
import { Target, AlertTriangle, XCircle, Clock, Calendar } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planificado', color: 'text-info' },
  in_progress: { label: 'En Progreso', color: 'text-success' },
  on_hold: { label: 'En Pausa', color: 'text-warning' },
  completed: { label: 'Completado', color: 'text-success' },
  cancelled: { label: 'Cancelado', color: 'text-neutral-50' },
}

const healthConfig: Record<string, { label: string; bar: string; dot: string; bg: string }> = {
  green: { label: 'Saludable', bar: 'bg-success', dot: 'bg-success', bg: 'bg-success/10' },
  yellow: { label: 'En Riesgo', bar: 'bg-warning', dot: 'bg-warning', bg: 'bg-warning/10' },
  red: { label: 'Crítico', bar: 'bg-danger', dot: 'bg-danger', bg: 'bg-danger/10' },
}

export function PublicTimelinePage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicTimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)

  // Always-declared hooks — moved before any early return
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const plans = data?.plans ?? []
  const activities = data?.activities ?? []
  const blockers = data?.blockers ?? []
  const commitments = data?.commitments ?? []

  const stats = useMemo(() => {
    const active = plans.filter((p: any) => p.status === 'in_progress')
    const activeOverdue = active.filter((p: any) => new Date(p.endDate) < today)
    const activeAtRisk = active.filter((p: any) => p.health === 'red' || p.health === 'yellow')
    const completed = plans.filter((p: any) => p.status === 'completed')
    const overdueActivities = activities.filter((a: any) => {
      if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') return false
      return new Date(a.dueDate) < today
    })
    const openBlockers = blockers.filter(
      (b: any) => b.status === 'open' || b.status === 'escalated',
    )
    const atRiskCommitments = commitments.filter((c: any) => c.status === 'at_risk')
    return {
      total: plans.length,
      active: active.length,
      completed: completed.length,
      overdue: activeOverdue.length,
      atRisk: activeAtRisk.length,
      overdueActivities: overdueActivities.length,
      openBlockers: openBlockers.length,
      atRiskCommitments: atRiskCommitments.length,
    }
  }, [plans, activities, blockers, commitments, today])

  const filteredPlans = plans

  const { timelineStart, timelineEnd, totalWeeks, weekWidth } = useMemo(() => {
    const now = new Date(today)
    const start = new Date(now)
    start.setDate(start.getDate() - 14)
    const end = new Date(start)
    end.setDate(end.getDate() + 84)
    let minDate = start
    let maxDate = end
    for (const p of filteredPlans as any[]) {
      if (new Date(p.startDate) < minDate) minDate = new Date(p.startDate)
      if (new Date(p.endDate) > maxDate) maxDate = new Date(p.endDate)
    }
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    return {
      timelineStart: minDate,
      timelineEnd: maxDate,
      totalWeeks: Math.max(12, Math.ceil(totalDays / 7)),
      weekWidth: 56,
    }
  }, [today, filteredPlans])

  const totalWidth = totalWeeks * weekWidth

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
          setData(raw as PublicTimelineData)
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
        const d = await getPublicTimelineData()
        setData(d)
        setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    })()
  }, [hash])

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
            title="Timeline protegido"
            description="Este timeline fue compartido con cifrado. Ingresa la contraseña para verlo."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) {
                setData(decrypted as PublicTimelineData)
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
                Timeline Ejecutivo
              </h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-6">
        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl border border-boundary p-4">
            <Target size={16} className="text-primary mb-1" />
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-neutral-60">Total Planes</p>
          </div>
          <div className="bg-card rounded-2xl border border-boundary p-4">
            <Clock size={16} className="text-success mb-1" />
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-neutral-60">Activos</p>
          </div>
          <div className="bg-card rounded-2xl border border-boundary p-4">
            <AlertTriangle size={16} className="text-warning mb-1" />
            <p className="text-2xl font-bold text-warning">{stats.atRisk}</p>
            <p className="text-xs text-neutral-60">En Riesgo</p>
          </div>
          <div className="bg-card rounded-2xl border border-boundary p-4">
            <XCircle size={16} className="text-danger mb-1" />
            <p className="text-2xl font-bold text-danger">{stats.overdue}</p>
            <p className="text-xs text-neutral-60">Vencidos</p>
          </div>
        </div>

        {/* Main content: Gantt full width (no alerts sidebar) */}
        <div className="bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-boundary">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-primary" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
                Línea de Tiempo
              </h3>
            </div>
            <span className="text-xs text-neutral-50">
              {timelineStart.toLocaleDateString('es-ES')} —{' '}
              {timelineEnd.toLocaleDateString('es-ES')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: `${totalWidth + 200}px` }}>
              {/* Week headers */}
              <div className="flex border-b border-boundary sticky top-0 bg-card z-10">
                <div className="w-48 shrink-0 px-4 py-2 text-xs font-semibold text-neutral-50 uppercase tracking-wider border-r border-boundary">
                  Plan
                </div>
                <div className="flex">
                  {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => {
                    const weekDate = new Date(timelineStart)
                    weekDate.setDate(weekDate.getDate() + i * 7)
                    const isCurrent =
                      weekDate <= today && new Date(weekDate.getTime() + 6 * 86400000) >= today
                    return (
                      <div
                        key={i}
                        className={`shrink-0 text-center py-2 text-[10px] font-semibold uppercase tracking-wider border-r border-boundary ${
                          isCurrent ? 'bg-primary/[0.04] text-primary' : 'text-neutral-50'
                        }`}
                        style={{ width: `${weekWidth}px` }}
                      >
                        <span>
                          {weekDate.getDate()}/{weekDate.getMonth() + 1}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Plan rows */}
              {filteredPlans.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-50">
                  No hay planes disponibles
                </div>
              ) : (
                (filteredPlans as any[]).map((plan: any) => {
                  const planStart = new Date(plan.startDate)
                  const planEnd = new Date(plan.endDate)
                  const totalSpan = timelineEnd.getTime() - timelineStart.getTime()
                  const leftPct =
                    totalSpan > 0
                      ? ((planStart.getTime() - timelineStart.getTime()) / totalSpan) * 100
                      : 0
                  const widthPct =
                    totalSpan > 0
                      ? ((planEnd.getTime() - planStart.getTime()) / totalSpan) * 100
                      : 0
                  const isOverdue = planEnd < today && plan.status === 'in_progress'
                  const health = healthConfig[plan.health] ?? healthConfig.green

                  const planActivities = activities.filter((a: any) => a.planId === plan.id)
                  const completedPct =
                    planActivities.length > 0
                      ? Math.round(
                          (planActivities.filter((a: any) => a.status === 'completed').length /
                            planActivities.length) *
                            100,
                        )
                      : 0

                  return (
                    <div
                      key={plan.id}
                      className="flex items-center border-b border-boundary hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors"
                    >
                      <div className="w-48 shrink-0 px-4 py-3 border-r border-boundary flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${health.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                            {plan.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-medium ${
                                isOverdue
                                  ? 'text-danger'
                                  : (statusConfig[plan.status]?.color ?? 'text-neutral-50')
                              }`}
                            >
                              {isOverdue
                                ? 'Vencido'
                                : (statusConfig[plan.status]?.label ?? plan.status)}
                            </span>
                            <span className="text-[10px] text-neutral-50">{completedPct}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative flex-1 h-20" style={{ minWidth: `${totalWidth}px` }}>
                        {today >= timelineStart && today <= timelineEnd && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-danger/60 z-20"
                            style={{
                              left: `${((today.getTime() - timelineStart.getTime()) / totalSpan) * 100}%`,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full bg-danger absolute -top-1 -left-[3px]" />
                          </div>
                        )}

                        <div className="absolute inset-0">
                          {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 border-l border-neutral-20/50 dark:border-neutral-70/30"
                              style={{
                                left: `${((i * weekWidth) / (totalWeeks * weekWidth)) * 100}%`,
                              }}
                            />
                          ))}
                        </div>

                        {widthPct > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-11 rounded-md flex items-center px-3 transition-shadow overflow-hidden"
                            style={{
                              left: `${Math.max(0, leftPct)}%`,
                              width: `${Math.max(2, widthPct)}%`,
                              backgroundColor:
                                plan.health === 'red'
                                  ? 'rgba(255, 86, 48, 0.15)'
                                  : plan.health === 'yellow'
                                    ? 'rgba(255, 171, 0, 0.15)'
                                    : 'rgba(54, 179, 126, 0.12)',
                              borderLeft: `3px solid ${plan.health === 'red' ? '#FF5630' : plan.health === 'yellow' ? '#FFAB00' : '#36B37E'}`,
                            }}
                          >
                            <div
                              className="absolute inset-0 rounded-md opacity-20"
                              style={{
                                width: `${completedPct}%`,
                                backgroundColor:
                                  plan.health === 'red'
                                    ? '#FF5630'
                                    : plan.health === 'yellow'
                                      ? '#FFAB00'
                                      : '#36B37E',
                              }}
                            />
                            <span className="relative text-[11px] font-medium text-neutral-90 dark:text-white truncate z-10">
                              {plan.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-boundary">
            <span className="text-[11px] text-neutral-50 uppercase tracking-wider font-semibold">
              Leyenda
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60">
              <span className="w-3 h-3 rounded-sm bg-success/30 border-l-[3px] border-success" />{' '}
              Saludable
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60">
              <span className="w-3 h-3 rounded-sm bg-warning/30 border-l-[3px] border-warning" /> En
              Riesgo
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60">
              <span className="w-3 h-3 rounded-sm bg-danger/30 border-l-[3px] border-danger" />{' '}
              Crítico
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60">
              <span className="w-2 h-2 rounded-full bg-danger" /> Hoy
            </span>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-40 py-4 border-t border-boundary">
          TGP — Technology Governance Platform · Datos compartidos
        </div>
      </main>
    </div>
  )
}
