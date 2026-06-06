import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { runEscalation } from '../services/escalationService'
import {
  AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight, Pencil,
  Calendar, ListTodo, Ban, Target,
} from 'lucide-react'
import type { Blocker } from '@/types/domain'

const severityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  info: 'Info',
}

export function DailyPage() {
  const navigate = useNavigate()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  useEffect(() => { runEscalation() }, [])

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
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])

  const appMap = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])
  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans])
  const activityMap = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities])

  const blockerPlan = useMemo(() => (blocker: Blocker) => {
    if (blocker.sourceType === 'plan') return planMap.get(blocker.sourceId)
    if (blocker.sourceType === 'activity') {
      const act = activityMap.get(blocker.sourceId)
      return act ? planMap.get(act.planId) : undefined
    }
    if (blocker.sourceType === 'commitment') {
      return undefined // commitments don't have a direct planId
    }
    if (blocker.sourceType === 'task') {
      const task = tasks.find((t) => t.id === blocker.sourceId)
      return task?.planId ? planMap.get(task.planId) : undefined
    }
    return undefined
  }, [planMap, activityMap, tasks])

  const agenda = useMemo(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Activities due today or overdue
    const activitiesWithDue = activities.filter((a) => a.dueDate)
    const dueToday = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime()
    })
    const overdue = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      return d.getTime() < today.getTime() && a.status !== 'completed' && a.status !== 'cancelled'
    })

    // Commitments expiring soon (within 7 days)
    const activeCommitments = commitments.filter((c) => c.status === 'active' || c.status === 'at_risk')
    const commitmentsDueSoon = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      const diff = d.getTime() - today.getTime()
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    })
    const commitmentsOverdue = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() < today.getTime() && c.status !== 'fulfilled' && c.status !== 'cancelled'
    })

    // Active blockers
    const activeBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')

    // Tasks due today
    const tasksDue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false
      const d = new Date(t.dueDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() <= today.getTime()
    })

    // Plan progress
    const activePlans = plans.filter((p) => p.status === 'in_progress')

    return {
      dueToday,
      overdue,
      commitmentsDueSoon,
      commitmentsOverdue,
      activeBlockers,
      tasksDue,
      activePlans,
      completedToday: activities.filter((a) => {
        if (!a.completedAt) return false
        const d = new Date(a.completedAt)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      }),
    }
  }, [today, activities, commitments, blockers, tasks, plans])

  const criticalBlockers = agenda.activeBlockers.filter((b) => b.severity === 'critical' || b.severity === 'high')

  return (
    <><div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Seguimiento Diario
          </h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            {today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Bloqueos"
          value={agenda.activeBlockers.length}
          color={criticalBlockers.length > 0 ? 'text-danger' : 'text-warning'}
          bgColor={criticalBlockers.length > 0 ? 'bg-danger/10' : 'bg-warning/10'}
          onClick={() => navigate('/execution/plans')}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Vence Hoy"
          value={agenda.dueToday.length + agenda.commitmentsDueSoon.length}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Vencido"
          value={agenda.overdue.length + agenda.commitmentsOverdue.length}
          color="text-danger"
          bgColor="bg-danger/10"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Completado Hoy"
          value={agenda.completedToday.length}
          color="text-success"
          bgColor="bg-success/10"
        />
        <StatCard
          icon={<ListTodo size={18} />}
          label="Tareas Pendientes"
          value={agenda.tasksDue.length}
          color="text-info"
          bgColor="bg-info/10"
        />
        <StatCard
          icon={<Target size={18} />}
          label="Planes Activos"
          value={agenda.activePlans.length}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left column: Agenda */}
        <div className="space-y-4">
          {/* Blockers */}
          {agenda.activeBlockers.length > 0 && (
            <div className="bg-white dark:bg-neutral-80 rounded-xl border border-danger/30 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-danger/5 border-b border-danger/20">
                <Ban size={16} className="text-danger" />
                <h3 className="text-sm font-semibold text-danger">Bloqueos Activos ({agenda.activeBlockers.length})</h3>
              </div>
              <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {agenda.activeBlockers.slice(0, 5).map((blocker) => {
                  const plan = blockerPlan(blocker)
                  return (
                    <div
                      key={blocker.id}
                      className="px-4 py-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                      onClick={() => navigate(`/execution/blockers/${blocker.id}/edit`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          blocker.severity === 'critical' ? 'bg-danger/10 text-danger' :
                          blocker.severity === 'high' ? 'bg-warning/10 text-warning' :
                          'bg-neutral-10 text-neutral-60'
                        }`}>
                          {severityLabel[blocker.severity]}
                        </span>
                        <span className="text-sm font-medium text-neutral-90 dark:text-white flex-1 truncate">{blocker.title}</span>
                        <Pencil size={14} className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-1 ml-1">
                        {blocker.description?.slice(0, 120)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 ml-1">
                        {plan && <span className="text-xs text-primary font-medium">{plan.title}</span>}
                        {blocker.assigneeId && <span className="text-xs text-neutral-50">Asignado: {blocker.assigneeId}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Overdue */}
          {agenda.overdue.length > 0 && (
            <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
                <XCircle size={16} className="text-danger" />
                <h3 className="text-sm font-semibold text-danger">Vencidas ({agenda.overdue.length})</h3>
              </div>
              <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {agenda.overdue.map((act) => {
                  const plan = planMap.get(act.planId)
                  const daysOverdue = Math.ceil((today.getTime() - new Date(act.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={act.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">{act.title}</p>
                        <p className="text-xs text-neutral-50">
                          {plan?.title} &middot; {daysOverdue}d vencida
                          {act.assigneeId && <span> &middot; {act.assigneeId}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/execution/plans/${act.planId}`)}
                        className="shrink-0 p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Due today */}
          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
              <Calendar size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Vence Hoy</h3>
              {agenda.dueToday.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">{agenda.dueToday.length}</span>
              )}
            </div>
            <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {agenda.dueToday.length === 0 && agenda.commitmentsDueSoon.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-50">
                  <CheckCircle2 size={24} className="mx-auto text-success mb-2" />
                  <p>Sin vencimientos para hoy</p>
                </div>
              ) : (
                <>
                  {agenda.dueToday.map((act) => {
                    const plan = planMap.get(act.planId)
                    const app = appMap.get(act.applicationId ?? '')
                    return (
                      <div
                        key={act.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                        onClick={() => navigate(`/execution/plans/${act.planId}`)}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">{act.title}</p>
                          <p className="text-xs text-neutral-50">
                            {plan?.title}
                            {app && <span> &middot; {app.name}</span>}
                            {act.assigneeId && <span> &middot; {act.assigneeId}</span>}
                          </p>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )
                  })}
                  {agenda.commitmentsDueSoon.map((c) => {
                    const app = appMap.get(c.applicationId ?? '')
                    return (
                      <div
                        key={c.id}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                        onClick={() => navigate('/execution/commitments')}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                            Compromiso: {c.title}
                          </p>
                          <p className="text-xs text-neutral-50">
                            Vence: {new Date(c.commitmentDate).toLocaleDateString('es-ES')}
                            {app && <span> &middot; {app.name}</span>}
                          </p>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* Tasks due */}
          {agenda.tasksDue.length > 0 && (
            <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-20 dark:border-neutral-70">
                <ListTodo size={16} className="text-info" />
                <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Tareas Pendientes ({agenda.tasksDue.length})</h3>
              </div>
              <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {agenda.tasksDue.slice(0, 8).map((task) => {
                  const plan = planMap.get(task.planId ?? '')
                  return (
                    <div
                      key={task.id}
                      className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors group"
                      onClick={() => task.planId && navigate(`/execution/plans/${task.planId}`)}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'critical' ? 'bg-danger' :
                        task.priority === 'high' ? 'bg-warning' :
                        'bg-neutral-40'
                      }`} />
                      <span className="text-sm text-neutral-90 dark:text-white flex-1 truncate">{task.title}</span>
                      {plan && <span className="text-xs text-neutral-50 shrink-0">{plan.title}</span>}
                      <ArrowRight size={14} className="shrink-0 text-neutral-40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Plans overview */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30 uppercase tracking-wider">
            Planes Activos
          </h3>

          {agenda.activePlans.length === 0 ? (
            <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-8 text-center">
              <Target size={32} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
              <p className="text-sm text-neutral-50">No hay planes activos</p>
            </div>
          ) : (
            agenda.activePlans.map((plan) => {
              const planActivities = activities.filter((a) => a.planId === plan.id)
              const completed = planActivities.filter((a) => a.status === 'completed').length
              const total = planActivities.length
              const healthColor = plan.health === 'red' ? 'bg-danger' : plan.health === 'yellow' ? 'bg-warning' : 'bg-success'

              const daysTotal = Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24))
              // eslint-disable-next-line react-hooks/purity
              const daysLeft = Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const progress = daysTotal > 0 ? Math.round(((daysTotal - Math.max(0, daysLeft)) / daysTotal) * 100) : 0

              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/execution/plans/${plan.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-neutral-90 dark:text-white">{plan.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${healthColor}`} />
                      <span className="text-xs text-neutral-50">
                        {daysLeft > 0 ? `${daysLeft}d` : 'Vencido'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${healthColor}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-60 dark:text-neutral-40">
                    <span>{progress}% completo</span>
                    <span>{completed}/{total} actividades</span>
                      <span>{new Date(plan.startDate).toLocaleDateString('es-ES')} - {new Date(plan.endDate).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>

    </>
  )
}

function StatCard({
  icon, label, value, color, bgColor, onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  bgColor: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`${bgColor} rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 text-left hover:shadow-sm transition-shadow`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </button>
  )
}
