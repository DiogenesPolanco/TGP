import { Shield, AlertTriangle, Package, Users, AlertOctagon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PublicDashboardData } from '@/services/share/publicShareService'
import { cn } from '@/lib/utils'

export interface DashboardKpis {
  overallScore: number
  criticalVulns: number
  highVulns: number
  openIncidents: number
  p1Incidents: number
  totalRisk: number
  criticalRisks: number
  eolTechs: number
  eliteTeams: number
  totalTeams: number
  thiTrend: number
  redFlags: { icon: ReactNode; text: string; severity: 'critical' | 'warning' | 'info' }[]
  thiLabel: string
  thiColor: string
}

export function computeDashboardKpis(data: PublicDashboardData): DashboardKpis {
  const vulnerabilities = data.vulnerabilities ?? []
  const incidents = data.incidents ?? []
  const risks = data.risks ?? []
  const technologies = data.technologies ?? []
  const teams = data.teams ?? []
  const applications = data.applications ?? []
  const auditFindings = data.auditFindings ?? []
  const healthHistory = data.healthHistory ?? []
  const criticalVulns = vulnerabilities.filter(
    (v: any) => v.severity === 'critical' && v.status !== 'fixed',
  ).length
  const highVulns = vulnerabilities.filter(
    (v: any) => v.severity === 'high' && v.status !== 'fixed',
  ).length
  const openIncidents = incidents.filter(
    (i: any) => i.status !== 'resolved' && i.status !== 'closed',
  ).length
  const p1Incidents = incidents.filter(
    (i: any) => i.severity === 'critical' && i.status !== 'resolved',
  ).length
  const openRisks = risks.filter((r: any) => r.status === 'open')
  const criticalRisks = openRisks.filter((r: any) => r.riskScore >= 15).length
  const totalRisk = openRisks.reduce((s: number, r: any) => s + r.riskScore, 0)
  const eolTechs = technologies.filter((t: any) => t.supportStatus === 'eol').length
  const eliteTeams = teams.filter(
    (t: any) => (t.currentMetrics?.deploymentFrequency ?? 0) >= 1,
  ).length
  const totalTeams = teams.length

  // THI calculation: same 7-dimension formula as main dashboard
  const deliveryScore =
    teams.length === 0
      ? 50
      : Math.round(
          teams.reduce((s, t) => {
            const m = t.currentMetrics
            if (!m) return s + 50
            return (
              s +
              (Math.min(m.velocity / 50, 1) * 100 +
                Math.max(0, 100 - (m.leadTimeHours / 168) * 100) +
                Math.max(0, 100 - m.changeFailureRate * 5) +
                Math.max(0, 100 - (m.mttrHours / 24) * 100)) /
                4
            )
          }, 0) / teams.length,
        )
  const qualityScore = 75
  const criticalHighOpen = vulnerabilities.filter(
    (v: any) => (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed',
  ).length
  const securityScore =
    applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(criticalHighOpen * 5, 80))
  const totalDowntime = incidents
    .filter((i: any) => i.status === 'resolved')
    .reduce((s: number, i: any) => s + ((i as any).downtimeMinutes ?? 0), 0)
  const availabilityScore =
    applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(totalDowntime / 60, 50))
  const appsWithEol = applications.filter((a: any) =>
    a.technologies?.some((tId: string) =>
      technologies.some((t: any) => t.id === tId && t.supportStatus === 'eol'),
    ),
  ).length
  const obsolescenceScore =
    applications.length === 0 ? 100 : Math.round((1 - appsWithEol / applications.length) * 100)
  const activeRiskScore = risks
    .filter((r: any) => r.status === 'open')
    .reduce((s: number, r: any) => s + r.riskScore, 0)
  const riskScore =
    applications.length === 0 ? 100 : Math.max(0, 100 - Math.min(activeRiskScore / 5, 80))
  const closedOnTime = auditFindings.filter(
    (f: any) =>
      (f.status === 'closed' || f.status === 'resolved') && new Date(f.dueDate) >= new Date(),
  ).length
  const complianceScore =
    auditFindings.length === 0 ? 100 : Math.round((closedOnTime / auditFindings.length) * 100)
  const overallScore = Math.round(
    (deliveryScore * 20 +
      qualityScore * 15 +
      securityScore * 20 +
      availabilityScore * 15 +
      obsolescenceScore * 10 +
      riskScore * 10 +
      complianceScore * 10) /
      100,
  )

  const thiTrend =
    healthHistory.length >= 2
      ? healthHistory[healthHistory.length - 1].score - healthHistory[0].score
      : 0

  const redFlags: {
    icon: ReactNode
    text: string
    severity: 'critical' | 'warning' | 'info'
  }[] = []
  if (criticalVulns > 0)
    redFlags.push({
      icon: <Shield size={14} />,
      text: `${criticalVulns} vulnerabilidad${criticalVulns > 1 ? 'es' : ''} crítica${criticalVulns > 1 ? 's' : ''} sin corregir`,
      severity: 'critical',
    })
  if (p1Incidents > 0)
    redFlags.push({
      icon: <AlertOctagon size={14} />,
      text: `${p1Incidents} incidente${p1Incidents > 1 ? 's' : ''} P1 activo${p1Incidents > 1 ? 's' : ''}`,
      severity: 'critical',
    })
  if (criticalRisks > 0)
    redFlags.push({
      icon: <AlertTriangle size={14} />,
      text: `${criticalRisks} riesgo${criticalRisks > 1 ? 's' : ''} crítico${criticalRisks > 1 ? 's' : ''} sin mitigar`,
      severity: 'warning',
    })
  if (eolTechs > 5)
    redFlags.push({
      icon: <Package size={14} />,
      text: `${eolTechs} tecnologías EOL en uso`,
      severity: 'warning',
    })
  if (totalTeams > 0 && eliteTeams / totalTeams < 0.3)
    redFlags.push({
      icon: <Users size={14} />,
      text: `Solo ${Math.round((eliteTeams / totalTeams) * 100)}% de equipos clasifican Elite DORA`,
      severity: 'info',
    })

  return {
    overallScore,
    criticalVulns,
    highVulns,
    openIncidents,
    p1Incidents,
    totalRisk,
    criticalRisks,
    eolTechs,
    eliteTeams,
    totalTeams,
    thiTrend,
    redFlags,
    thiLabel:
      overallScore >= 90
        ? 'Excelente'
        : overallScore >= 70
          ? 'Saludable'
          : overallScore >= 50
            ? 'Regular'
            : overallScore >= 30
              ? 'En Riesgo'
              : 'Crítico',
    thiColor:
      overallScore >= 90
        ? '#36B37E'
        : overallScore >= 70
          ? '#57D9A3'
          : overallScore >= 50
            ? '#FFAB00'
            : overallScore >= 30
              ? '#FF8B00'
              : '#FF5630',
  }
}

export function Loader() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export function MiniMetric({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string
  value: string
  subtitle: string
  icon: ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
  }
  const s = colors[color] ?? colors.primary
  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('p-1.5 rounded-lg', s)}>{icon}</div>
      </div>
      <p className="text-lg font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-[11px] text-neutral-50 mt-0.5">{subtitle}</p>
    </div>
  )
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: ReactNode
  color: 'danger' | 'warning' | 'success' | 'info' | 'primary'
}) {
  const dots: Record<string, string> = {
    danger: 'bg-danger',
    warning: 'bg-warning',
    success: 'bg-success',
    info: 'bg-info',
    primary: 'bg-primary',
  }
  return (
    <div className="bg-card rounded-2xl border border-boundary p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn('p-2 rounded-lg', {
            'bg-danger/10 text-danger': color === 'danger',
            'bg-warning/10 text-warning': color === 'warning',
            'bg-success/10 text-success': color === 'success',
            'bg-info/10 text-info': color === 'info',
            'bg-primary/10 text-primary': color === 'primary',
          })}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted font-medium mt-0.5">{title}</p>
      <p className="text-xs text-neutral-50 mt-1">{subtitle}</p>
      <div className={cn('mt-3 h-0.5 rounded w-full', dots[color])} style={{ opacity: 0.3 }} />
    </div>
  )
}
