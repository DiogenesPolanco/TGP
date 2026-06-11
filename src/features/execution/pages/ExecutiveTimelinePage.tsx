import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import {
  Target, AlertTriangle, CheckCircle2, XCircle, PauseCircle, Clock,
  Calendar, ArrowRight, Users, Building2, Filter, ChevronLeft, ChevronRight,
  AlertOctagon,
} from 'lucide-react'
import type { ProjectStatus } from '@/constants/enums'
import type { Plan, Activity, Blocker, Commitment } from '@/types/domain'

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

export function ExecutiveTimelinePage() {
  const navigate = useNavigate()
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [buFilter, setBuFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [weekOffset, setWeekOffset] = useState(0)

  // Data
  const rawPlans = useLiveQuery(() => db.plans.toArray())
  const plans = useMemo(() => rawPlans ?? [], [rawPlans])
  const rawActivities = useLiveQuery(() => db.activities.toArray())
  const activities = useMemo(() => rawActivities ?? [], [rawActivities])
  const rawTasks = useLiveQuery(() => db.tasks.toArray())
  const tasks = useMemo(() => rawTasks ?? [], [rawTasks])
  const rawBlockers = useLiveQuery(() => db.blockers.toArray())
  const blockers = useMemo(() => rawBlockers ?? [], [rawBlockers])
  const rawCommitments = useLiveQuery(() => db.commitments.toArray())
  const commitments = useMemo(() => rawCommitments ?? [], [rawCommitments])
  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const rawBusinessUnits = useLiveQuery(() => db.businessUnits.toArray())
  const businessUnits = useMemo(() => rawBusinessUnits ?? [], [rawBusinessUnits])

  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const buMap = useMemo(() => new Map(businessUnits.map((b) => [b.id, b])), [businessUnits])

  // Filters
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (buFilter !== 'all' && p.businessUnitId !== buFilter) return false
      if (teamFilter !== 'all' && p.teamId !== teamFilter) return false
      return true
    })
  }, [plans, statusFilter, buFilter, teamFilter])

  // Timeline range
  const { timelineStart, timelineEnd, totalWeeks, weekWidth } = useMemo(() => {
    const now = new Date(today)
    const start = new Date(now)
    start.setDate(start.getDate() + weekOffset * 7)

    const end = new Date(start)
    end.setDate(end.getDate() + 84) // 12 weeks visible

    // Expand to cover plan dates
    let minDate = start
    let maxDate = end
    for (const p of filteredPlans) {
      if (new Date(p.startDate) < minDate) minDate = new Date(p.startDate)
      if (new Date(p.endDate) > maxDate) maxDate = new Date(p.endDate)
    }

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    return {
      timelineStart: minDate,
      timelineEnd: maxDate,
      totalWeeks: Math.max(12, Math.ceil(totalDays / 7)),
      weekWidth: 56, // px per week
    }
  }, [today, filteredPlans, weekOffset])

  // Stats
  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'in_progress')
    const activeOverdue = active.filter((p) => new Date(p.endDate) < today)
    const activeAtRisk = active.filter((p) => p.health === 'red' || p.health === 'yellow')
    const completed = plans.filter((p) => p.status === 'completed')

    const overdueActivities = activities.filter((a) => {
      if (!a.dueDate || a.status === 'completed' || a.status === 'cancelled') return false
      return new Date(a.dueDate) < today
    })
    const openBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')
    const atRiskCommitments = commitments.filter((c) => c.status === 'at_risk')

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

  // Upcoming milestones
  const milestones = useMemo(() => {
    const items: { date: Date; title: string; planTitle: string; planId: string; type: 'due' | 'end' }[] = []

    for (const p of filteredPlans) {
      const planActivities = activities.filter((a) => a.planId === p.id && a.dueDate && a.status !== 'completed' && a.status !== 'cancelled')
      for (const a of planActivities) {
        const d = new Date(a.dueDate!)
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diff >= -7 && diff <= 30) {
          items.push({ date: d, title: a.title, planTitle: p.title, planId: p.id, type: 'due' })
        }
      }
      // Plan end dates coming up
      const endDiff = Math.ceil((new Date(p.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (endDiff >= -7 && endDiff <= 30 && p.status !== 'completed' && p.status !== 'cancelled') {
        items.push({ date: new Date(p.endDate), title: `Fin: ${p.title}`, planTitle: p.title, planId: p.id, type: 'end' })
      }
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime())
    return items.slice(0, 8)
  }, [filteredPlans, activities, today])

  // Alerts
  const alerts = useMemo(() => {
    const items: { severity: 'critical' | 'warning' | 'info'; message: string; link?: string }[] = []

    const criticalBlockers = blockers.filter((b) => b.severity === 'critical' && (b.status === 'open' || b.status === 'escalated'))
    if (criticalBlockers.length > 0) {
      items.push({ severity: 'critical', message: `${criticalBlockers.length} bloqueo(s) crítico(s) sin resolver`, link: '/execution/blockers' })
    }

    if (stats.overdueActivities > 0) {
      items.push({ severity: 'warning', message: `${stats.overdueActivities} actividad(es) vencida(s)`, link: '/execution/daily' })
    }

    if (stats.atRiskCommitments > 0) {
      items.push({ severity: 'warning', message: `${stats.atRiskCommitments} compromiso(s) en riesgo`, link: '/execution/commitments' })
    }

    const overduePlans = plans.filter((p) => p.status === 'in_progress' && new Date(p.endDate) < today)
    if (overduePlans.length > 0) {
      items.push({ severity: 'critical', message: `${overduePlans.length} plan(es) vencido(s)`, link: '/execution/plans' })
    }

    return items
  }, [blockers, stats, plans, today])

  const totalWidth = totalWeeks * weekWidth
  const dayWidth = weekWidth / 7

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Timeline Ejecutivo
          </h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Visión consolidada de todos los planes
          </p>
        </div>
        <button
          onClick={() => navigate('/execution/plans/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <Target size={16} />
          Nuevo Plan
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Target size={16} />} label="Total Planes" value={stats.total} color="text-primary" bg="bg-primary/10" />
        <StatBox icon={<Clock size={16} />} label="Activos" value={stats.active} color="text-success" bg="bg-success/10" />
        <StatBox icon={<AlertTriangle size={16} />} label="En Riesgo" value={stats.atRisk} color="text-warning" bg="bg-warning/10" />
        <StatBox icon={<XCircle size={16} />} label="Vencidos" value={stats.overdue} color="text-danger" bg="bg-danger/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-neutral-50" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
          className="text-sm bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-70 rounded-lg px-3 py-1.5 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todos los estados</option>
          <option value="planned">Planificado</option>
          <option value="in_progress">En Progreso</option>
          <option value="on_hold">En Pausa</option>
          <option value="completed">Completado</option>
        </select>
        <select
          value={buFilter}
          onChange={(e) => setBuFilter(e.target.value)}
          className="text-sm bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-70 rounded-lg px-3 py-1.5 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todas las UB</option>
          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>{bu.name}</option>
          ))}
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="text-sm bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-70 rounded-lg px-3 py-1.5 text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todos los equipos</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-xs text-neutral-50 ml-auto">{filteredPlans.length} plan(es)</span>
      </div>

      {/* Main content: Gantt + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Gantt chart */}
        <div className="xl:col-span-3 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
          {/* Timeline navigation + header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-primary" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Línea de Tiempo</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-50">
                {timelineStart.toLocaleDateString('es-ES')} — {timelineEnd.toLocaleDateString('es-ES')}
              </span>
              <button
                onClick={() => setWeekOffset((o) => o - 12)}
                className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => { setWeekOffset(0) }}
                className="px-2 py-0.5 text-xs font-medium rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => setWeekOffset((o) => o + 12)}
                className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 text-neutral-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Timeline content */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${totalWidth + 200}px` }}>
              {/* Week headers */}
              <div className="flex border-b border-neutral-20 dark:border-neutral-70 sticky top-0 bg-white dark:bg-neutral-80 z-10">
                <div className="w-48 shrink-0 px-4 py-2 text-xs font-semibold text-neutral-50 uppercase tracking-wider border-r border-neutral-20 dark:border-neutral-70">
                  Plan
                </div>
                <div className="flex">
                  {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => {
                    const weekDate = new Date(timelineStart)
                    weekDate.setDate(weekDate.getDate() + i * 7)
                    const isCurrent = weekDate <= today && new Date(weekDate.getTime() + 6 * 86400000) >= today
                    return (
                      <div
                        key={i}
                        className={`shrink-0 text-center py-2 text-[10px] font-semibold uppercase tracking-wider border-r border-neutral-20 dark:border-neutral-70 ${
                          isCurrent ? 'bg-primary/[0.04] text-primary' : 'text-neutral-50'
                        }`}
                        style={{ width: `${weekWidth}px` }}
                      >
                        <span>{weekDate.getDate()}/{weekDate.getMonth() + 1}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Plan rows */}
              {filteredPlans.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-50">
                  No hay planes con los filtros seleccionados
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const planStart = new Date(plan.startDate)
                  const planEnd = new Date(plan.endDate)
                  const totalSpan = timelineEnd.getTime() - timelineStart.getTime()
                  const leftPct = totalSpan > 0
                    ? ((planStart.getTime() - timelineStart.getTime()) / totalSpan) * 100
                    : 0
                  const widthPct = totalSpan > 0
                    ? ((planEnd.getTime() - planStart.getTime()) / totalSpan) * 100
                    : 0
                  const isOverdue = planEnd < today && plan.status === 'in_progress'
                  const health = healthConfig[plan.health] ?? healthConfig.green

                  const planActivities = activities.filter((a) => a.planId === plan.id)
                  const completedPct = planActivities.length > 0
                    ? Math.round((planActivities.filter((a) => a.status === 'completed').length / planActivities.length) * 100)
                    : 0

                  return (
                    <div
                      key={plan.id}
                      className="flex items-center border-b border-neutral-20 dark:border-neutral-70 hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/execution/plans/${plan.id}`)}
                    >
                      {/* Plan label */}
                      <div className="w-48 shrink-0 px-4 py-3 border-r border-neutral-20 dark:border-neutral-70 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${health.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">{plan.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-medium ${
                              isOverdue ? 'text-danger' : statusConfig[plan.status]?.color ?? 'text-neutral-50'
                            }`}>
                              {isOverdue ? 'Vencido' : statusConfig[plan.status]?.label ?? plan.status}
                            </span>
                            <span className="text-[10px] text-neutral-50">{completedPct}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Gantt bar area */}
                      <div className="relative flex-1 h-14" style={{ minWidth: `${totalWidth}px` }}>
                        {/* Today line */}
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

                        {/* Bar background (empty area) */}
                        <div className="absolute inset-0">
                          {/* Week grid lines */}
                          {Array.from({ length: Math.min(totalWeeks, 24) }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 border-l border-neutral-20/50 dark:border-neutral-70/30"
                              style={{ left: `${(i * weekWidth / (totalWeeks * weekWidth)) * 100}%` }}
                            />
                          ))}
                        </div>

                        {/* Plan bar */}
                        {widthPct > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 group-hover:shadow-md transition-shadow overflow-hidden"
                            style={{
                              left: `${Math.max(0, leftPct)}%`,
                              width: `${Math.max(2, widthPct)}%`,
                              backgroundColor: plan.health === 'red' ? 'rgba(255, 86, 48, 0.15)' : plan.health === 'yellow' ? 'rgba(255, 171, 0, 0.15)' : 'rgba(54, 179, 126, 0.12)',
                              borderLeft: `3px solid ${plan.health === 'red' ? '#FF5630' : plan.health === 'yellow' ? '#FFAB00' : '#36B37E'}`,
                            }}
                          >
                            {/* Completion fill */}
                            <div
                              className="absolute inset-0 rounded-md opacity-20"
                              style={{
                                width: `${completedPct}%`,
                                backgroundColor: plan.health === 'red' ? '#FF5630' : plan.health === 'yellow' ? '#FFAB00' : '#36B37E',
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
          <div className="flex items-center gap-4 px-5 py-3 border-t border-neutral-20 dark:border-neutral-70">
            <span className="text-[11px] text-neutral-50 uppercase tracking-wider font-semibold">Leyenda</span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60"><span className="w-3 h-3 rounded-sm bg-success/30 border-l-[3px] border-success" /> Saludable</span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60"><span className="w-3 h-3 rounded-sm bg-warning/30 border-l-[3px] border-warning" /> En Riesgo</span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60"><span className="w-3 h-3 rounded-sm bg-danger/30 border-l-[3px] border-danger" /> Crítico</span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-60"><span className="w-2 h-2 rounded-full bg-danger" /> Hoy</span>
          </div>
        </div>

        {/* Right sidebar: Milestones + Alerts */}
        <div className="space-y-4">
          {/* Milestones */}
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
              <Calendar size={15} className="text-primary" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Próximos Hitos</h3>
            </div>
            <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {milestones.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-50">
                  No hay hitos próximos
                </div>
              ) : (
                milestones.map((m, i) => {
                  const d = new Date(m.date)
                  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div
                      key={i}
                      className="px-4 py-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors"
                      onClick={() => navigate(`/execution/plans/${m.planId}`)}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {m.type === 'end' ? (
                          <Target size={12} className="text-danger" />
                        ) : (
                          <Calendar size={12} className="text-warning" />
                        )}
                        <span className={`text-xs font-semibold ${diffDays <= 0 ? 'text-danger' : diffDays <= 3 ? 'text-warning' : 'text-neutral-90 dark:text-white'}`}>
                          {diffDays <= 0 ? 'VENCE HOY' : diffDays === 1 ? 'MAÑANA' : `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-70 dark:text-neutral-30 truncate">{m.title}</p>
                      <p className="text-[10px] text-neutral-50 mt-0.5">{m.planTitle}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
                <AlertOctagon size={15} className="text-danger" />
                <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Alertas</h3>
              </div>
              <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 flex items-start gap-2 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors ${
                      a.severity === 'critical' ? 'bg-danger/[0.02]' : a.severity === 'warning' ? 'bg-warning/[0.02]' : ''
                    }`}
                    onClick={() => a.link && navigate(a.link)}
                  >
                    <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${
                      a.severity === 'critical' ? 'text-danger' : a.severity === 'warning' ? 'text-warning' : 'text-info'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-neutral-70 dark:text-neutral-30">{a.message}</p>
                    </div>
                    <ArrowRight size={12} className="shrink-0 text-neutral-40 mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl border border-neutral-20 dark:border-neutral-70 p-4`}>
      <div className={`${color} mb-1`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
