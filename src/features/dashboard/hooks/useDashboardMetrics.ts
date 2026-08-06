import { useMemo, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useLiveDataLayer } from '@/hooks/useLiveDataLayer'
import { useThiCalculation } from './useThiCalculation'
import { generateExecutiveNarrative } from '@/services/thi/narrativeGenerator'
import { useAppStore } from '@/stores/appStore'
import { useFilterStore } from '@/stores/filterStore'
import type {
  HealthIndex,
  Application,
  Vulnerability,
  Incident,
  Risk,
  AuditFinding,
  Team,
  Technology,
  BusinessUnit,
  Blocker,
  Commitment,
  Plan,
  Activity,
  Microservice,
} from '@/types/domain'

function getPeriodStartDate(period: '7d' | '30d' | '90d' | 'ytd' | 'custom'): Date {
  const now = new Date()
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1)
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

interface AlertItem {
  type: 'critical' | 'warning' | 'success' | 'info'
  message: string
}

export interface DashboardMetrics {
  loading: boolean
  thi: HealthIndex | null
  lastUpdated: Date
  periodStart: Date

  // Raw data counts
  applications: { id: string; businessUnitId: string; technologies: string[] }[]
  vulnerabilities: {
    id: string
    applicationId: string | null
    severity: string
    status: string
    createdAt: Date
  }[]
  incidents: {
    id: string
    applicationId: string | null
    status: string
    downtimeMinutes: number | null
    createdAt: Date
  }[]
  risks: {
    id: string
    applicationId: string | null
    status: string
    riskScore: number
    createdAt: Date
  }[]
  auditFindings: { id: string; status: string; dueDate: Date }[]
  technologies: { id: string; supportStatus: string }[]
  teams: {
    id: string
    currentMetrics: { deploymentFrequency: number; leadTimeHours: number } | null
  }[]
  blockers: { id: string; status: string }[]
  commitments: { id: string; status: string; commitmentDate: Date }[]
  activities: { id: string; dueDate: Date | null; status: string }[]
  plans: { id: string; status: string }[]
  businessUnits: { id: string; name: string }[]

  // Computed KPIs
  criticalVulns: number
  openIncidents: number
  totalRiskScore: number
  complianceScore: number
  eliteTeams: number
  eolTechs: number
  extendedTechs: number
  activePlans: number
  openBlockers: number
  overdueCommitments: number
  activitiesDueToday: number
  overdueFindings: number
  totalFindings: number
  openFindings: number
  closedFindings: number

  // Trends (computed by comparing current vs previous period)
  vulnTrend: 'up' | 'down' | 'neutral'
  incidentTrend: 'up' | 'down' | 'neutral'
  thiTrend: 'up' | 'down' | 'neutral'

  // Chart data
  buData: { name: string; thi: number }[]
  techStatusData: { name: string; value: number; color: string }[]

  // Sparkline history
  thiHistory: { date: Date; score: number }[]

  // Alerts & narrative
  alerts: AlertItem[]
  narrative: ReturnType<typeof generateExecutiveNarrative>
}

export function useDashboardMetrics(): DashboardMetrics {
  const { selectedBusinessUnitId, selectedPeriod } = useFilterStore()
  const periodStart = getPeriodStartDate(selectedPeriod)
  const thi = useThiCalculation(selectedBusinessUnitId)
  const setAlerts = useAppStore((s) => s.setAlerts)

  const [lastUpdated] = useState(new Date())

  const { data: rawApplications } = useLiveDataLayer<Application>('applications')
  const { data: rawVulnerabilities } = useLiveDataLayer<Vulnerability>('vulnerabilities')
  const { data: rawIncidents } = useLiveDataLayer<Incident>('incidents')
  const { data: rawRisks } = useLiveDataLayer<Risk>('risks')
  const { data: rawAuditFindings } = useLiveDataLayer<AuditFinding>('auditFindings')
  const { data: rawTeams } = useLiveDataLayer<Team>('teams')
  const { data: rawTechnologies } = useLiveDataLayer<Technology>('technologies')
  const { data: rawBusinessUnits } = useLiveDataLayer<BusinessUnit>('businessUnits')
  const { data: rawBlockers } = useLiveDataLayer<Blocker>('blockers')
  const { data: rawPlans } = useLiveDataLayer<Plan>('plans')
  const { data: rawCommitments } = useLiveDataLayer<Commitment>('commitments')
  const { data: rawActivities } = useLiveDataLayer<Activity>('activities')
  const { data: rawMicroservices } = useLiveDataLayer<Microservice>('microservices')
  const { data: rawHistory } = useLiveDataLayer<HealthIndex>('healthIndexHistory')
  const doraConfig = useLiveQuery(() => db.systemConfig.get('dora.benchmarks'))
  const thiRangesConfig = useLiveQuery(() => db.systemConfig.get('thi.ranges'))

  const loading =
    !rawApplications ||
    !rawVulnerabilities ||
    !rawIncidents ||
    !rawRisks ||
    !rawAuditFindings ||
    !rawTeams ||
    !rawTechnologies ||
    !rawBusinessUnits ||
    !rawBlockers ||
    !rawPlans ||
    !rawCommitments ||
    !rawActivities ||
    !rawMicroservices ||
    !rawHistory

  const applications = useMemo(() => rawApplications ?? [], [rawApplications])
  const vulnerabilities = useMemo(() => rawVulnerabilities ?? [], [rawVulnerabilities])
  const incidents = useMemo(() => rawIncidents ?? [], [rawIncidents])
  const risks = useMemo(() => rawRisks ?? [], [rawRisks])
  const auditFindings = useMemo(() => rawAuditFindings ?? [], [rawAuditFindings])
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const technologies = useMemo(() => rawTechnologies ?? [], [rawTechnologies])
  const businessUnits = useMemo(() => rawBusinessUnits ?? [], [rawBusinessUnits])
  const blockers = useMemo(() => rawBlockers ?? [], [rawBlockers])
  const plans = useMemo(() => rawPlans ?? [], [rawPlans])
  const commitments = useMemo(() => rawCommitments ?? [], [rawCommitments])
  const activities = useMemo(() => rawActivities ?? [], [rawActivities])
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const thiHistory = useMemo(
    () =>
      (rawHistory ?? [])
        .sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime())
        .map((h) => ({ date: new Date(h.calculatedAt), score: h.overallScore })),
    [rawHistory],
  )

  // Period-filtered data
  const vulnsInPeriod = vulnerabilities.filter((v) => new Date(v.createdAt) >= periodStart)
  const incidentsInPeriod = incidents.filter((i) => new Date(i.createdAt) >= periodStart)
  const risksInPeriod = risks.filter((r) => new Date(r.createdAt) >= periodStart)

  // --- Computed KPIs ---
  const criticalVulns = vulnsInPeriod.filter(
    (v) => v.severity === 'critical' && v.status !== 'fixed',
  ).length
  const openIncidents = incidentsInPeriod.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed',
  ).length
  const overdueFindings = auditFindings.filter((f) => f.status === 'overdue').length
  const totalFindings = auditFindings.length
  const openFindings = auditFindings.filter(
    (f) => f.status === 'open' || f.status === 'in_progress',
  ).length
  const closedFindings = auditFindings.filter(
    (f) => f.status === 'closed' || f.status === 'resolved',
  ).length
  const complianceScore = thi?.complianceScore ?? 0
  const totalRiskScore = risksInPeriod
    .filter((r) => r.status === 'open')
    .reduce((sum, r) => sum + r.riskScore, 0)
  const eliteTeams = teams.filter((t) => {
    if (!t.currentMetrics) return false
    const elite = (
      doraConfig?.value as {
        elite: { deploymentFrequency: { min: number }; leadTimeHours: { max: number } }
      }
    )?.elite ?? { deploymentFrequency: { min: 1 }, leadTimeHours: { max: 1 } }
    return (
      t.currentMetrics.deploymentFrequency >= elite.deploymentFrequency.min &&
      (elite.leadTimeHours.max == null || t.currentMetrics.leadTimeHours <= elite.leadTimeHours.max)
    )
  }).length

  const activePlans = plans.filter(
    (p) => p.status === 'in_progress' || p.status === 'planned',
  ).length
  const openBlockers = blockers.filter(
    (b) => b.status === 'open' || b.status === 'escalated',
  ).length
  const overdueCommitments = commitments.filter((c) => {
    if (c.status === 'breached') return true
    if (c.status === 'active' || c.status === 'at_risk') {
      return new Date(c.commitmentDate) < new Date()
    }
    return false
  }).length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activitiesDueToday = activities.filter((a) => {
    if (!a.dueDate) return false
    const due = new Date(a.dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime() && a.status !== 'completed' && a.status !== 'cancelled'
  }).length

  const usedTechIds = new Set([
    ...applications.flatMap((a) => a.technologies),
    ...microservices.flatMap((ms) => ms.technologies),
  ])
  const eolTechs = technologies.filter((t) => t.supportStatus === 'eol' && usedTechIds.has(t.id))
  const extendedTechs = technologies.filter((t) => t.supportStatus === 'extended')

  // --- Trends: compare current period vs previous equivalent period ---
  const prevStart = useMemo(() => {
    // Use selectedPeriod to know the duration of the current period
    const periodDays =
      selectedPeriod === '7d'
        ? 7
        : selectedPeriod === '30d'
          ? 30
          : selectedPeriod === '90d'
            ? 90
            : 30
    return new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000)
  }, [periodStart, selectedPeriod])
  const vulnsPrev = vulnerabilities.filter((v) => {
    const d = new Date(v.createdAt)
    return d >= prevStart && d < periodStart && v.status !== 'fixed'
  }).length
  const vulnTrend: 'up' | 'down' | 'neutral' =
    criticalVulns < vulnsPrev ? 'down' : criticalVulns > vulnsPrev ? 'up' : 'neutral'

  const incidentsPrev = incidents.filter((i) => {
    const d = new Date(i.createdAt)
    return d >= prevStart && d < periodStart && i.status !== 'resolved' && i.status !== 'closed'
  }).length
  const incidentTrend: 'up' | 'down' | 'neutral' =
    openIncidents < incidentsPrev ? 'down' : openIncidents > incidentsPrev ? 'up' : 'neutral'

  // THI trend: compare current vs average of previous 3 records
  const thiTrend: 'up' | 'down' | 'neutral' = (() => {
    if (thiHistory.length < 2) return 'neutral'
    const current = thi?.overallScore ?? 0
    if (thiHistory.length >= 4) {
      const prevAvg = thiHistory.slice(-4, -1).reduce((s, h) => s + h.score, 0) / 3
      if (current > prevAvg + 1) return 'up'
      if (current < prevAvg - 1) return 'down'
    }
    return 'neutral'
  })()

  // --- Technology status chart data ---
  const techStatusData = [
    {
      name: 'Activas',
      value: technologies.filter((t) => t.supportStatus === 'active').length,
      color: '#36B37E',
    },
    { name: 'S. Extendido', value: extendedTechs.length, color: '#FFAB00' },
    { name: 'EOL', value: eolTechs.length, color: '#FF5630' },
    {
      name: 'Desconocido',
      value: technologies.filter((t) => t.supportStatus === 'unknown').length,
      color: '#A5ADBA',
    },
  ].filter((d) => d.value > 0)

  // --- BU chart data ---
  const buData = businessUnits
    .map((bu) => {
      const buApps = applications.filter((a) => a.businessUnitId === bu.id)
      if (buApps.length === 0) return null

      const buVulns = vulnerabilities.filter(
        (v) => v.applicationId && buApps.some((a) => a.id === v.applicationId),
      )
      const buIncidents = incidents.filter(
        (i) => i.applicationId && buApps.some((a) => a.id === i.applicationId),
      )
      const buRisks = risks.filter(
        (r) => r.applicationId && buApps.some((a) => a.id === r.applicationId),
      )

      const buSecurityScore = (() => {
        const criticalHigh = buVulns.filter(
          (v) => (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed',
        )
        return Math.max(0, 100 - Math.min(criticalHigh.length * 5, 80))
      })()

      const buAvailabilityScore = (() => {
        const totalDowntime = buIncidents
          .filter((i) => i.status === 'resolved')
          .reduce((sum, i) => sum + (i.downtimeMinutes ?? 0), 0)
        return Math.max(0, 100 - Math.min(totalDowntime / 60, 50))
      })()

      const buObsolescenceScore = (() => {
        const appsWithEol = buApps.filter((app) =>
          app.technologies.some((techId) => {
            const tech = technologies.find((t) => t.id === techId)
            return tech?.supportStatus === 'eol'
          }),
        )
        return buApps.length > 0 ? Math.round((1 - appsWithEol.length / buApps.length) * 100) : 100
      })()

      const buRiskScore = (() => {
        const activeRisks = buRisks.filter((r) => r.status === 'open')
        const totalScore = activeRisks.reduce((sum, r) => sum + r.riskScore, 0)
        return Math.max(0, 100 - Math.min(totalScore / 5, 80))
      })()

      const dimensions = [buSecurityScore, buAvailabilityScore, buObsolescenceScore, buRiskScore]
      const buThi = Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length)

      return { name: bu.name, thi: buThi }
    })
    .filter((d): d is { name: string; thi: number } => d !== null)

  // --- Narrative and Alerts ---
  const narrative = useMemo(
    () =>
      generateExecutiveNarrative({
        thi,
        applications,
        vulnerabilities,
        incidents,
        risks,
        auditFindings,
        teams,
        technologies,
        businessUnits,
        blockers,
        commitments,
        periodStart,
        thiRanges: thiRangesConfig?.value as
          Record<string, { min: number; max: number; label: string }> | undefined,
      }),
    [
      thi,
      applications,
      vulnerabilities,
      incidents,
      risks,
      auditFindings,
      teams,
      technologies,
      businessUnits,
      blockers,
      commitments,
      periodStart,
      thiRangesConfig,
    ],
  )

  const alerts = useMemo(() => {
    const items: AlertItem[] = []
    if (narrative.flashBriefing) {
      items.push({ type: 'info', message: narrative.flashBriefing })
    }
    for (const insight of narrative.keyInsights) {
      const type =
        insight.icon === 'critical'
          ? 'critical'
          : insight.icon === 'warning'
            ? 'warning'
            : insight.icon === 'positive'
              ? 'success'
              : 'info'
      items.push({ type, message: insight.text })
    }
    for (const bu of narrative.buHighlights) {
      items.push({ type: 'info', message: `BU ${bu.name}: THI ${bu.thi} — ${bu.text}` })
    }
    for (const rec of narrative.recommendations) {
      items.push({ type: 'info', message: rec })
    }
    return items
  }, [narrative])

  // Sync alerts to global store
  useEffect(() => {
    setAlerts(alerts)
  }, [alerts, setAlerts])

  return {
    loading,
    thi,
    lastUpdated,
    periodStart,
    applications,
    vulnerabilities,
    incidents,
    risks,
    auditFindings,
    technologies,
    teams,
    blockers,
    commitments,
    activities,
    plans,
    businessUnits,

    criticalVulns,
    openIncidents,
    totalRiskScore,
    complianceScore,
    eliteTeams,
    eolTechs: eolTechs.length,
    extendedTechs: extendedTechs.length,
    activePlans,
    openBlockers,
    overdueCommitments,
    activitiesDueToday,
    overdueFindings,
    totalFindings,
    openFindings,
    closedFindings,

    vulnTrend,
    incidentTrend,
    thiTrend,

    buData,
    techStatusData,

    thiHistory,

    alerts,
    narrative,
  }
}
