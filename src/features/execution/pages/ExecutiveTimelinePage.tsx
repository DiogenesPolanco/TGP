import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '@/services/db/database'
import { Target, AlertTriangle, XCircle, Clock, Filter, Share2, Copy, Check } from 'lucide-react'
import type { ProjectStatus } from '@/constants/enums'
import { createShareLink, getPublicTimelineData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { Select } from '@/components/ui/Select'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { Button } from '@/components/ui/Button'
import { ExecutiveGanttChart } from '../components/ExecutiveGanttChart'
import { ExecutiveTimelineSidebar } from '../components/ExecutiveTimelineSidebar'

function StatBox({
  icon,
  label,
  value,
  color,
  bg,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  bg: string
  active?: boolean
  onClick?: () => void
}) {
  if (!onClick) {
    return (
      <div className={`${bg} rounded-xl border border-boundary p-4`}>
        <div className={`${color} mb-1`}>{icon}</div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    )
  }
  return (
    <Button
      onClick={onClick}
      className={`${bg} rounded-xl border p-4 text-left cursor-pointer transition-all hover:shadow-md ${active ? 'border-neutral-60 dark:border-neutral-40 ring-2 ring-inset ring-neutral-50/30 dark:ring-neutral-30/30' : 'border-boundary hover:border-neutral-40 dark:hover:border-neutral-50'}`}
    >
      <div className={`${color} mb-1`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Button>
  )
}

export function ExecutiveTimelinePage() {
  const navigate = useNavigate()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [healthFilter, setHealthFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')
  const [overdueFilter, setOverdueFilter] = useState(false)
  const [buFilter, setBuFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [weekOffset, setWeekOffset] = useState(0)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<unknown>(null)

  const rawPlans = useLiveQuery(() => db.plans.toArray())
  const plans = useMemo(() => rawPlans ?? [], [rawPlans])
  const rawActivities = useLiveQuery(() => db.activities.toArray())
  const activities = useMemo(() => rawActivities ?? [], [rawActivities])
  const rawBlockers = useLiveQuery(() => db.blockers.toArray())
  const blockers = useMemo(() => rawBlockers ?? [], [rawBlockers])
  const rawCommitments = useLiveQuery(() => db.commitments.toArray())
  const commitments = useMemo(() => rawCommitments ?? [], [rawCommitments])
  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const rawBusinessUnits = useLiveQuery(() => db.businessUnits.toArray())
  const businessUnits = useMemo(() => rawBusinessUnits ?? [], [rawBusinessUnits])

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (healthFilter !== 'all' && p.health !== healthFilter) return false
      if (overdueFilter) {
        if (p.status !== 'in_progress') return false
        if (new Date(p.endDate) >= today) return false
      }
      if (buFilter !== 'all' && p.businessUnitId !== buFilter) return false
      if (teamFilter !== 'all' && p.teamId !== teamFilter) return false
      return true
    })
  }, [plans, statusFilter, healthFilter, overdueFilter, buFilter, teamFilter, today])

  const { timelineStart, timelineEnd, totalWeeks, weekWidth } = useMemo(() => {
    const now = new Date(today)
    const start = new Date(now)
    start.setDate(start.getDate() + weekOffset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 84)
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
      weekWidth: 56,
    }
  }, [today, filteredPlans, weekOffset])

  const totalWidth = totalWeeks * weekWidth

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

  const milestones = useMemo(() => {
    const items: {
      date: Date
      title: string
      planTitle: string
      planId: string
      type: 'due' | 'end'
    }[] = []
    for (const p of filteredPlans) {
      const planActivities = activities.filter(
        (a) =>
          a.planId === p.id && a.dueDate && a.status !== 'completed' && a.status !== 'cancelled',
      )
      for (const a of planActivities) {
        const d = new Date(a.dueDate!)
        const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (diff >= -7 && diff <= 30)
          items.push({ date: d, title: a.title, planTitle: p.title, planId: p.id, type: 'due' })
      }
      const endDiff = Math.ceil(
        (new Date(p.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (endDiff >= -7 && endDiff <= 30 && p.status !== 'completed' && p.status !== 'cancelled')
        items.push({
          date: new Date(p.endDate),
          title: `Fin: ${p.title}`,
          planTitle: p.title,
          planId: p.id,
          type: 'end',
        })
    }
    items.sort((a, b) => a.date.getTime() - b.date.getTime())
    return items.slice(0, 8)
  }, [filteredPlans, activities, today])

  const alerts = useMemo(() => {
    const items: { severity: 'critical' | 'warning' | 'info'; message: string; link?: string }[] =
      []
    const criticalBlockers = blockers.filter(
      (b) => b.severity === 'critical' && (b.status === 'open' || b.status === 'escalated'),
    )
    if (criticalBlockers.length > 0)
      items.push({
        severity: 'critical',
        message: `${criticalBlockers.length} bloqueo(s) crítico(s) sin resolver`,
        link: '/execution/blockers',
      })
    if (stats.overdueActivities > 0)
      items.push({
        severity: 'warning',
        message: `${stats.overdueActivities} actividad(es) vencida(s)`,
        link: '/execution/daily',
      })
    if (stats.atRiskCommitments > 0)
      items.push({
        severity: 'warning',
        message: `${stats.atRiskCommitments} compromiso(s) en riesgo`,
        link: '/execution/commitments',
      })
    const overduePlans = plans.filter(
      (p) => p.status === 'in_progress' && new Date(p.endDate) < today,
    )
    if (overduePlans.length > 0)
      items.push({
        severity: 'critical',
        message: `${overduePlans.length} plan(es) vencido(s)`,
        link: '/execution/plans',
      })
    return items
  }, [blockers, stats, plans, today])

  const doShare = async () => {
    setSharePending(await getPublicTimelineData())
    setShowPassphrase(true)
  }
  const handleShare = async () => {
    if (!isTermsAccepted()) setShowTerms(true)
    else await doShare()
  }
  const handleTermsAccepted = async () => {
    acceptTerms()
    setShowTerms(false)
    await doShare()
  }
  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl.split('#')[0])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Timeline Ejecutivo</h2>
          <p className="text-sm text-muted mt-1">Visión consolidada de todos los planes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors shadow-sm"
            title="Compartir Timeline"
          >
            <Share2 size={16} /> Compartir
          </Button>
          {shareUrl && (
            <Button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors shadow-sm"
              title="Copiar enlace"
            >
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          )}
          <Button
            onClick={() => navigate('/execution/plans/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Target size={16} /> Nuevo Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox
          icon={<Target size={16} />}
          label="Total Planes"
          value={stats.total}
          color="text-primary"
          bg="bg-primary/10"
          active={statusFilter === 'all' && healthFilter === 'all' && !overdueFilter}
          onClick={() => {
            setStatusFilter('all')
            setHealthFilter('all')
            setOverdueFilter(false)
          }}
        />
        <StatBox
          icon={<Clock size={16} />}
          label="Activos"
          value={stats.active}
          color="text-success"
          bg="bg-success/10"
          active={statusFilter === 'in_progress' && healthFilter === 'all' && !overdueFilter}
          onClick={() => {
            setStatusFilter('in_progress')
            setHealthFilter('all')
            setOverdueFilter(false)
          }}
        />
        <StatBox
          icon={<AlertTriangle size={16} />}
          label="En Riesgo"
          value={stats.atRisk}
          color="text-warning"
          bg="bg-warning/10"
          active={statusFilter === 'in_progress' && healthFilter !== 'all' && !overdueFilter}
          onClick={() => {
            setStatusFilter('in_progress')
            setHealthFilter('red')
            setOverdueFilter(false)
          }}
        />
        <StatBox
          icon={<XCircle size={16} />}
          label="Vencidos"
          value={stats.overdue}
          color="text-danger"
          bg="bg-danger/10"
          active={statusFilter === 'in_progress' && healthFilter === 'all' && overdueFilter}
          onClick={() => {
            setStatusFilter('in_progress')
            setHealthFilter('all')
            setOverdueFilter(true)
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-neutral-50" />
        <div className="min-w-[170px]">
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'planned', label: 'Planificado' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'on_hold', label: 'En Pausa' },
              { value: 'completed', label: 'Completado' },
            ]}
          />
        </div>
        <div className="min-w-[170px]">
          <Select
            value={buFilter}
            onChange={setBuFilter}
            options={[
              { value: 'all', label: 'Todas las UB' },
              ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
            ]}
          />
        </div>
        <div className="min-w-[170px]">
          <Select
            value={teamFilter}
            onChange={setTeamFilter}
            options={[
              { value: 'all', label: 'Todos los equipos' },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>
        <span className="text-xs text-neutral-50 ml-auto">{filteredPlans.length} plan(es)</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <ExecutiveGanttChart
          plans={filteredPlans.map((p) => ({
            id: p.id,
            title: p.title,
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate),
            status: p.status,
            health: p.health,
          }))}
          activities={activities}
          today={today}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          totalWeeks={totalWeeks}
          weekWidth={weekWidth}
          totalWidth={totalWidth}
          onNavigate={(o) => setWeekOffset((w) => w + o)}
          onToday={() => setWeekOffset(0)}
        />
        <ExecutiveTimelineSidebar milestones={milestones} alerts={alerts} today={today} />
      </div>

      {showTerms && (
        <TermsModal onAccept={handleTermsAccepted} onClose={() => setShowTerms(false)} />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Compartir Timeline Ejecutivo"
          buttonLabel="Compartir"
          description="Opcional: agrega una contraseña para cifrar los datos. Quien reciba el enlace necesitará la contraseña para verlos."
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'timeline', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'timeline', undefined, sharePending)
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
