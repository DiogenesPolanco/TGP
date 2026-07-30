import type {
  Application,
  Vulnerability,
  Incident,
  Risk,
  AuditFinding,
  Team,
  Technology,
  Blocker,
  Commitment,
  BusinessUnit,
  HealthIndex,
} from '@/types/domain'

export interface ExecutiveNarrative {
  timestamp: Date
  flashBriefing: string
  keyInsights: Insight[]
  buHighlights: BUNarrative[]
  recommendations: string[]
}

export interface Insight {
  icon: 'critical' | 'warning' | 'positive' | 'info'
  text: string
}

export interface BUNarrative {
  name: string
  thi: number
  text: string
}

export interface NarrativeInput {
  thi: HealthIndex | null
  applications: Application[]
  vulnerabilities: Vulnerability[]
  incidents: Incident[]
  risks: Risk[]
  auditFindings: AuditFinding[]
  teams: Team[]
  technologies: Technology[]
  businessUnits: BusinessUnit[]
  blockers: Blocker[]
  commitments: Commitment[]
  periodStart: Date
  thiRanges?: Record<string, { min: number; max: number; label: string }>
}

const DEFAULT_THI_RANGES = [
  { min: 90, max: 100, label: 'Excelente' },
  { min: 70, max: 89, label: 'Saludable' },
  { min: 50, max: 69, label: 'Regular' },
  { min: 30, max: 49, label: 'En Riesgo' },
  { min: 0, max: 29, label: 'Crítico' },
]

function getThiLabel(score: number, ranges?: Record<string, { min: number; max: number; label: string }>): string {
  if (ranges) {
    for (const r of Object.values(ranges)) {
      if (score >= r.min && score <= r.max) return r.label
    }
  }
  for (const r of DEFAULT_THI_RANGES) {
    if (score >= r.min && score <= r.max) return r.label
  }
  return 'Crítico'
}

export function generateExecutiveNarrative(input: NarrativeInput): ExecutiveNarrative {
  const {
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
  } = input

  const now = new Date()
  const insights: Insight[] = []
  const buHighlights: BUNarrative[] = []
  const recommendations: string[] = []

  // ── Overall THI ──
  const thiScore = thi?.overallScore ?? 0
  const thiLabel = getThiLabel(thiScore, input.thiRanges)
  const missingDimensions: string[] = []
  if (thi) {
    if (thi.deliveryScore === 50) missingDimensions.push('Delivery')
    if (thi.qualityScore === 75) missingDimensions.push('Quality')
  }

  // ── Vulnerability Insights ──
  const criticalVulns = vulnerabilities.filter(
    (v) => v.severity === 'critical' && v.status !== 'fixed',
  ).length
  const highVulns = vulnerabilities.filter(
    (v) => v.severity === 'high' && v.status !== 'fixed',
  ).length
  const totalOpenVulns = vulnerabilities.filter((v) => v.status !== 'fixed').length

  if (criticalVulns > 0) {
    insights.push({
      icon: 'critical',
      text:
        criticalVulns === 1
          ? `${criticalVulns} vulnerabilidad crítica sin resolver`
          : `${criticalVulns} vulnerabilidades críticas sin resolver`,
    })
  }
  if (highVulns > 3) {
    insights.push({
      icon: 'warning',
      text: `${highVulns} vulnerabilidades altas — por encima del umbral recomendado (<3)`,
    })
  } else if (criticalVulns === 0 && highVulns === 0) {
    insights.push({
      icon: 'positive',
      text: 'No hay vulnerabilidades críticas ni altas abiertas',
    })
  }

  // ── Incident Insights ──
  const openIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed',
  ).length
  const p1Incidents = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed',
  ).length

  if (p1Incidents > 0) {
    insights.push({
      icon: 'critical',
      text:
        p1Incidents === 1
          ? `${p1Incidents} incidente P1 abierto`
          : `${p1Incidents} incidentes P1 abiertos`,
    })
  } else if (openIncidents > 0) {
    insights.push({
      icon: 'warning',
      text: `${openIncidents} incidentes abiertos (ninguno P1)`,
    })
  } else {
    insights.push({
      icon: 'positive',
      text: 'Sin incidentes abiertos',
    })
  }

  // ── EOL Technologies ──
  const eolTechs = technologies.filter((t) => t.supportStatus === 'eol')
  const extendedTechs = technologies.filter((t) => t.supportStatus === 'extended')
  const eolTechIds = eolTechs.map((t) => t.id)
  const criticalAppsWithEol = applications.filter(
    (app) =>
      app.technologies.some((tId) => eolTechIds.includes(tId)) &&
      (app.criticality === 'critical' || app.criticality === 'high'),
  )

  if (eolTechs.length > 0) {
    const techNames = [...new Set(eolTechs.map((t) => `${t.name} ${t.version}`))]
      .slice(0, 5)
      .join(', ')
    const msg =
      criticalAppsWithEol.length > 0
        ? `${eolTechs.length} tecnologías EOL (${criticalAppsWithEol.length} apps críticas afectadas): ${techNames}${eolTechs.length > 5 ? ` y ${eolTechs.length - 5} más` : ''}`
        : `${eolTechs.length} tecnologías EOL — ninguna app crítica afectada`
    insights.push({ icon: 'critical', text: msg })
  }
  if (extendedTechs.length > 0) {
    recommendations.push(
      `Planificar migración de ${extendedTechs.length} tecnologías en soporte extendido antes de que alcancen EOL`,
    )
  }

  // ── Findings / Audit ──
  const overdueFindings = auditFindings.filter((f) => f.status === 'overdue').length
  if (overdueFindings > 0) {
    insights.push({
      icon: 'warning',
      text:
        overdueFindings === 1
          ? `${overdueFindings} hallazgo de auditoría vencido`
          : `${overdueFindings} hallazgos de auditoría vencidos`,
    })
  }

  // ── Risk ──
  const openRisks = risks.filter((r) => r.status === 'open')
  const criticalRisks = openRisks.filter((r) => r.riskScore >= 20)
  if (criticalRisks.length > 0) {
    insights.push({
      icon: 'critical',
      text:
        criticalRisks.length === 1
          ? `${criticalRisks.length} riesgo crítico sin mitigar (score ≥ 20)`
          : `${criticalRisks.length} riesgos críticos sin mitigar (score ≥ 20)`,
    })
    recommendations.push(
      `Establecer plan de mitigación para ${criticalRisks.length} riesgo${criticalRisks.length > 1 ? 's' : ''} crítico${criticalRisks.length > 1 ? 's' : ''} con score ≥ 20`,
    )
  }

  // ── DORA ──
  const eliteTeams = teams.filter((t) => {
    if (!t.currentMetrics) return false
    return t.currentMetrics.deploymentFrequency >= 1 && t.currentMetrics.leadTimeHours <= 1
  }).length
  const lowTeams = teams.filter((t) => {
    if (!t.currentMetrics) return false
    return t.currentMetrics.deploymentFrequency < 1 / 30 && t.currentMetrics.leadTimeHours > 720
  }).length

  if (eliteTeams > 0) {
    insights.push({
      icon: 'positive',
      text: `${eliteTeams} equipo${eliteTeams > 1 ? 's' : ''} en nivel Elite DORA`,
    })
  }
  if (lowTeams > 0) {
    recommendations.push(
      `${lowTeams} equipo${lowTeams > 1 ? 's' : ''} en nivel DORA Bajo — revisar prácticas de entrega continua y automatización`,
    )
  }

  // ── Execution ──
  const openBlockers = blockers.filter(
    (b) => b.status === 'open' || b.status === 'escalated',
  ).length
  if (openBlockers > 0) {
    insights.push({
      icon: 'warning',
      text:
        openBlockers === 1
          ? `${openBlockers} bloqueo abierto`
          : `${openBlockers} bloqueos abiertos`,
    })
  }

  const overdueCommitments = commitments.filter((c) => {
    if (c.status === 'breached') return true
    if (c.status === 'active' || c.status === 'at_risk') {
      return new Date(c.commitmentDate) < now
    }
    return false
  }).length
  if (overdueCommitments > 0) {
    insights.push({
      icon: 'warning',
      text:
        overdueCommitments === 1
          ? `${overdueCommitments} compromiso vencido`
          : `${overdueCommitments} compromisos vencidos`,
    })
    recommendations.push(
      `Revisar ${overdueCommitments} compromiso${overdueCommitments > 1 ? 's' : ''} vencido${overdueCommitments > 1 ? 's' : ''} y establecer nuevas fechas objetivo`,
    )
  }

  // ── Flash Briefing ──
  const totalApps = applications.length
  const totalTeams = teams.length
  const briefingParts: string[] = []

  if (thi) {
    const weakDim = [
      { name: 'Delivery', score: thi.deliveryScore },
      { name: 'Quality', score: thi.qualityScore },
      { name: 'Security', score: thi.securityScore },
      { name: 'Availability', score: thi.availabilityScore },
      { name: 'Obsolescence', score: thi.obsolescenceScore },
      { name: 'Risk', score: thi.riskScore },
      { name: 'Compliance', score: thi.complianceScore },
    ]
      .filter((d) => d.score < 70)
      .map((d) => d.name)

    const thiSentence =
      weakDim.length > 0
        ? `THI ${thiScore} (${thiLabel}) — dimensiones débiles: ${weakDim.join(', ')}`
        : `THI ${thiScore} (${thiLabel}) — todas las dimensiones saludables`
    briefingParts.push(thiSentence)
  }

  const scaleParts: string[] = []
  if (totalApps > 0) scaleParts.push(`${totalApps} aplicaciones`)
  if (totalTeams > 0) scaleParts.push(`${totalTeams} equipos`)
  if (technologies.length > 0) scaleParts.push(`${technologies.length} tecnologías`)
  if (totalOpenVulns > 0) scaleParts.push(`${totalOpenVulns} vulnerabilidades abiertas`)
  if (openIncidents > 0) scaleParts.push(`${openIncidents} incidentes abiertos`)
  if (openBlockers > 0) scaleParts.push(`${openBlockers} bloqueos`)
  if (scaleParts.length > 0) {
    briefingParts.push(`Cobertura: ${scaleParts.join(', ')}.`)
  }

  const urgentItems: string[] = []
  if (criticalVulns > 0) urgentItems.push(`${criticalVulns} vulnerabilidades críticas`)
  if (p1Incidents > 0) urgentItems.push(`${p1Incidents} incidentes P1`)
  if (eolTechs.length > 0 && criticalAppsWithEol.length > 0)
    urgentItems.push(`${eolTechs.length} tecnologías EOL`)
  if (criticalRisks.length > 0) urgentItems.push(`${criticalRisks.length} riesgos críticos`)
  if (overdueCommitments > 0) urgentItems.push(`${overdueCommitments} compromisos vencidos`)

  if (urgentItems.length > 0) {
    const needsAttention = urgentItems.slice(0, 4).join(', ')
    briefingParts.push(`Requiere atención: ${needsAttention}.`)
  }

  const flashBriefing = briefingParts.join(' ')

  // ── BU Highlights ──
  for (const bu of businessUnits) {
    const buApps = applications.filter((a) => a.businessUnitId === bu.id)
    if (buApps.length === 0) continue

    const buVulns = vulnerabilities.filter(
      (v) => v.applicationId && buApps.some((a) => a.id === v.applicationId),
    )
    const buCriticalVulns = buVulns.filter(
      (v) => v.severity === 'critical' && v.status !== 'fixed',
    ).length
    const buEolApps = buApps.filter((app) =>
      app.technologies.some((tId) => eolTechIds.includes(tId)),
    ).length
    const buEolCritical = buApps.filter(
      (app) =>
        app.technologies.some((tId) => eolTechIds.includes(tId)) &&
        (app.criticality === 'critical' || app.criticality === 'high'),
    ).length

    const parts: string[] = []
    if (buCriticalVulns > 0) parts.push(`${buCriticalVulns} vulns críticas`)
    if (buEolApps > 0)
      parts.push(
        `${buEolApps} apps con tech EOL${buEolCritical > 0 ? ` (${buEolCritical} críticas)` : ''}`,
      )
    if (parts.length === 0) parts.push('sin alertas')

    let buThi = 0
    const buThiEntry = buDataFind(
      bu.id,
      applications,
      vulnerabilities,
      incidents,
      risks,
      technologies,
    )
    if (buThiEntry) buThi = buThiEntry

    buHighlights.push({
      name: bu.name,
      thi: buThi,
      text: parts.join(', '),
    })
  }

  // Sort BU highlights by THI ascending (worst first)
  buHighlights.sort((a, b) => a.thi - b.thi)

  return {
    timestamp: new Date(),
    flashBriefing,
    keyInsights: insights,
    buHighlights,
    recommendations,
  }
}

function buDataFind(
  buId: string,
  applications: Application[],
  vulnerabilities: Vulnerability[],
  incidents: Incident[],
  risks: Risk[],
  technologies: Technology[],
): number | null {
  const buApps = applications.filter((a) => a.businessUnitId === buId)
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

  const securityScore = (() => {
    const criticalHigh = buVulns.filter(
      (v) => (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed',
    )
    return Math.max(0, 100 - Math.min(criticalHigh.length * 5, 80))
  })()

  const availabilityScore = (() => {
    const totalDowntime = buIncidents
      .filter((i) => i.status === 'resolved')
      .reduce((sum, i) => sum + (i.downtimeMinutes ?? 0), 0)
    return Math.max(0, 100 - Math.min(totalDowntime / 60, 50))
  })()

  const obsolescenceScore = (() => {
    const appsWithEol = buApps.filter((app) =>
      app.technologies.some((techId) => {
        const tech = technologies.find((t) => t.id === techId)
        return tech?.supportStatus === 'eol'
      }),
    )
    return buApps.length > 0 ? Math.round((1 - appsWithEol.length / buApps.length) * 100) : 100
  })()

  const riskScore = (() => {
    const activeRisks = buRisks.filter((r) => r.status === 'open')
    const totalScore = activeRisks.reduce((sum, r) => sum + r.riskScore, 0)
    return Math.max(0, 100 - Math.min(totalScore / 5, 80))
  })()

  const dimensions = [securityScore, availabilityScore, obsolescenceScore, riskScore]
  return Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length)
}
