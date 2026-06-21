import { useEffect, useMemo, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { runEscalation } from '../services/escalationService'
import { createShareLink, getPublicDailyData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import {
  AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight, Pencil,
  Calendar, ListTodo, Ban, Target, Share2, Check, Copy,
} from 'lucide-react'
import type { Blocker } from '@/types/domain'

import { UpNextPanel } from '../components/UpNextPanel'
import { WeeklyTimeline } from '../components/WeeklyTimeline'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

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

  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<unknown>(null)

  const doShare = useCallback(async () => {
    const data = await getPublicDailyData()
    setSharePending(data)
    setShowPassphrase(true)
  }, [])

  const handleShare = useCallback(async () => {
    if (!isTermsAccepted()) {
      setShowTerms(true)
      return
    }
    await doShare()
  }, [doShare])

  const handleTermsAccepted = useCallback(async () => {
    acceptTerms()
    setShowTerms(false)
    await doShare()
  }, [doShare])

  const cleanUrl = shareUrl?.split('#')[0] ?? ''
  const handleCopy = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

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
      return undefined
    }
    if (blocker.sourceType === 'task') {
      const task = tasks.find((t) => t.id === blocker.sourceId)
      return task?.planId ? planMap.get(task.planId) : undefined
    }
    return undefined
  }, [planMap, activityMap, tasks])

  const agenda = useMemo(() => {
    const ref = selectedWeek ? new Date(selectedWeek.start) : new Date(today)
    const weekEnd = selectedWeek ? new Date(selectedWeek.end) : new Date(today)

    const activitiesWithDue = activities.filter((a) => a.dueDate)
    const dueToday = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) {
        return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      }
      return d.getTime() === today.getTime()
    })
    const overdue = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      const boundary = selectedWeek ? ref : today
      return d.getTime() < boundary.getTime() && a.status !== 'completed' && a.status !== 'cancelled'
    })

    const activeCommitments = commitments.filter((c) => c.status === 'active' || c.status === 'at_risk')
    const commitmentsDueSoon = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) {
        return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      }
      const diff = d.getTime() - today.getTime()
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    })
    const commitmentsOverdue = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      const boundary = selectedWeek ? ref : today
      return d.getTime() < boundary.getTime() && c.status !== 'fulfilled' && c.status !== 'cancelled'
    })

    const activeBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')
    const tasksDue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false
      const d = new Date(t.dueDate)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) {
        return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      }
      return d.getTime() <= today.getTime()
    })

    const activePlans = plans.filter((p) => p.status === 'in_progress')

    const completedThisWeek = activities.filter((a) => {
      if (!a.completedAt) return false
      const d = new Date(a.completedAt)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) {
        return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      }
      return d.getTime() === today.getTime()
    })

    return {
      dueToday,
      overdue,
      commitmentsDueSoon,
      commitmentsOverdue,
      activeBlockers,
      tasksDue,
      activePlans,
      completedToday: completedThisWeek,
      isFiltered: !!selectedWeek,
    }
  }, [today, selectedWeek, activities, commitments, blockers, tasks, plans])

  const criticalBlockers = agenda.activeBlockers.filter((b) => b.severity === 'critical' || b.severity === 'high')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Seguimiento Diario
          </h2>
          <p className="text-sm text-muted mt-1">
            {today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-neutral-90 dark:hover:text-white bg-card border border-boundary rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </Button>
      </div>

      {shareUrl && (
        <div className="bg-card rounded-xl border border-boundary p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {cleanUrl}
          </a>
          <Button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      )}

      {/* Phase 1.3: Weekly Timeline Roadmap */}
      <WeeklyTimeline
        activities={activities}
        commitments={commitments}
        today={today}
        selectedWeek={selectedWeek}
        onWeekSelect={setSelectedWeek}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Bloqueos"
          value={agenda.activeBlockers.length}
          color={criticalBlockers.length > 0 ? 'text-danger' : 'text-warning'}
          onClick={() => navigate('/execution/plans')}
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Vence Hoy"
          value={agenda.dueToday.length + agenda.commitmentsDueSoon.length}
          color="text-warning"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Vencido"
          value={agenda.overdue.length + agenda.commitmentsOverdue.length}
          color="text-danger"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label={selectedWeek ? 'Completado Semana' : 'Completado Hoy'}
          value={agenda.completedToday.length}
          color="text-success"
        />
        <StatCard
          icon={<ListTodo size={18} />}
          label="Tareas Pendientes"
          value={agenda.tasksDue.length}
          color="text-info"
        />
        <StatCard
          icon={<Target size={18} />}
          label="Planes Activos"
          value={agenda.activePlans.length}
          color="text-primary"
          onClick={() => navigate('/execution/plans')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left column: Agenda */}
        <div className="space-y-4">
          {/* Blockers */}
          {agenda.activeBlockers.length > 0 && (
            <div className="bg-card rounded-xl border border-danger/30 shadow-sm overflow-hidden">
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
                      <p className="text-xs text-muted mt-1 ml-1">
                        <HtmlDescription html={blocker.description} lines={1} />
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
            <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
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
                      <Button
                        onClick={() => navigate(`/execution/plans/${act.planId}`)}
                        className="shrink-0 p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                      >
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Due today / this week */}
          <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
              <Calendar size={16} className="text-warning" />
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
                {selectedWeek ? 'Vence Esta Semana' : 'Vence Hoy'}
              </h3>
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
            <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-boundary">
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

        {/* Right column: Plans overview + Up Next */}
        <div className="space-y-4">
          {/* Phase 1.2: Up Next Panel */}
          <UpNextPanel
            activities={activities}
            plans={plans}
            commitments={commitments}
            today={selectedWeek?.start ?? today}
          />


        </div>
      </div>

      {showTerms && (
        <TermsModal
          onAccept={handleTermsAccepted}
          onClose={() => { setShowTerms(false) }}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Compartir Seguimiento Diario"
          buttonLabel="Compartir"
          description="Opcional: agrega una contraseña para cifrar los datos. Quien reciba el enlace necesitará la contraseña para verlos."
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'daily', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const data = sharePending
            const { url } = await createShareLink(48, 'daily', undefined, data)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}
    </div>
  )
}

function StatCard({
  icon, label, value, color, onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  onClick?: () => void
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-danger': 'bg-danger/10 text-danger',
    'text-warning': 'bg-warning/10 text-warning',
    'text-success': 'bg-success/10 text-success',
    'text-info': 'bg-info/10 text-info',
  }
  const CardComp = onClick ? Button : 'div'
  return (
    <CardComp
      onClick={onClick}
      className="bg-card rounded-2xl border border-boundary p-4 shadow-sm flex items-center justify-center gap-3"
    >
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </CardComp>
  )
}
