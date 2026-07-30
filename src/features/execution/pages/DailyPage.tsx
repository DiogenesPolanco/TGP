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
  AlertTriangle,
  Clock,
  XCircle,
  CheckCircle2,
  ListTodo,
  Target,
  Share2,
  Check,
  Copy,
} from 'lucide-react'
import { UpNextPanel } from '../components/UpNextPanel'
import { PriorityFeed } from '../components/PriorityFeed'
import { WeeklyTimeline } from '../components/WeeklyTimeline'
import { StatCard } from '../components/dailyPanels'
import { Button } from '@/components/ui/Button'

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

  useEffect(() => {
    runEscalation()
  }, [])

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

  const agenda = useMemo(() => {
    const ref = selectedWeek ? new Date(selectedWeek.start) : new Date(today)
    const weekEnd = selectedWeek ? new Date(selectedWeek.end) : new Date(today)

    const activitiesWithDue = activities.filter((a) => a.dueDate)
    const dueToday = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      return d.getTime() === today.getTime()
    })
    const overdue = activitiesWithDue.filter((a) => {
      const d = new Date(a.dueDate!)
      d.setHours(0, 0, 0, 0)
      const boundary = selectedWeek ? ref : today
      return (
        d.getTime() < boundary.getTime() && a.status !== 'completed' && a.status !== 'cancelled'
      )
    })

    const activeCommitments = commitments.filter(
      (c) => c.status === 'active' || c.status === 'at_risk',
    )
    const commitmentsDueSoon = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      const diff = d.getTime() - today.getTime()
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
    })
    const commitmentsOverdue = activeCommitments.filter((c) => {
      const d = new Date(c.commitmentDate)
      d.setHours(0, 0, 0, 0)
      const boundary = selectedWeek ? ref : today
      return (
        d.getTime() < boundary.getTime() && c.status !== 'fulfilled' && c.status !== 'cancelled'
      )
    })

    const activeBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated')
    const tasksDue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false
      const d = new Date(t.dueDate)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
      return d.getTime() <= today.getTime()
    })

    const activePlans = plans.filter((p) => p.status === 'in_progress')
    const completedThisWeek = activities.filter((a) => {
      if (!a.completedAt) return false
      const d = new Date(a.completedAt)
      d.setHours(0, 0, 0, 0)
      if (selectedWeek) return d.getTime() >= ref.getTime() && d.getTime() <= weekEnd.getTime()
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

  const criticalBlockers = agenda.activeBlockers.filter(
    (b) => b.severity === 'critical' || b.severity === 'high',
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Seguimiento Diario</h2>
          <p className="text-sm text-muted mt-1">
            {today.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
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
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline"
          >
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
        <div className="space-y-4">
          <PriorityFeed
            blockers={blockers}
            activities={activities}
            commitments={commitments}
            tasks={tasks}
            plans={plans}
            today={today}
          />
        </div>
        <div className="space-y-4">
          <UpNextPanel
            activities={activities}
            plans={plans}
            commitments={commitments}
            today={selectedWeek?.start ?? today}
          />
        </div>
      </div>

      {showTerms && (
        <TermsModal onAccept={handleTermsAccepted} onClose={() => setShowTerms(false)} />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Compartir Seguimiento Diario"
          buttonLabel="Compartir"
          description="Opcional: agrega una contraseña para cifrar los datos. Quien reciba el enlace necesitará la contraseña para verlos."
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
            const { url } = await createShareLink(48, 'daily', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'daily', undefined, sharePending)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => {
            setShowPassphrase(false)
            setSharePending(null)
          }}
        />
      )}
    </div>
  )
}
