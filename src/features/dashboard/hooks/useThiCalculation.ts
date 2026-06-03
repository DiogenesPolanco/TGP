import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DEFAULT_HEALTH_WEIGHTS } from '@/constants/config'
import { computeAppTechMap } from '@/utils/technologyUtils'
import type { HealthIndex, HealthWeights } from '@/types/domain'

export function useThiCalculation(businessUnitId?: string | null) {
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const vulnerabilities = useLiveQuery(() => db.vulnerabilities.toArray()) ?? []
  const incidents = useLiveQuery(() => db.incidents.toArray()) ?? []
  const risks = useLiveQuery(() => db.risks.toArray()) ?? []
  const auditFindings = useLiveQuery(() => db.auditFindings.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const technologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const microservices = useLiveQuery(() => db.microservices.toArray()) ?? []

  const thi = useMemo(() => {
    const apps = businessUnitId
      ? applications.filter((a) => a.businessUnitId === businessUnitId)
      : applications

    if (apps.length === 0) return null

    const weights: HealthWeights = DEFAULT_HEALTH_WEIGHTS

    const deliveryScore = calculateDeliveryScore(teams)
    const qualityScore = calculateQualityScore(apps)
    const securityScore = calculateSecurityScore(apps, vulnerabilities)
    const availabilityScore = calculateAvailabilityScore(apps, incidents)
    const appTechMap = computeAppTechMap(apps, microservices)
    const obsolescenceScore = calculateObsolescenceScore(apps, technologies, appTechMap)
    const riskScore = calculateRiskScore(apps, risks)
    const complianceScore = calculateComplianceScore(auditFindings)

    const overallScore =
      (deliveryScore * weights.delivery +
        qualityScore * weights.quality +
        securityScore * weights.security +
        availabilityScore * weights.availability +
        obsolescenceScore * weights.obsolescence +
        riskScore * weights.risk +
        complianceScore * weights.compliance) /
      Object.values(weights).reduce((a, b) => a + b, 0)

    const result: HealthIndex = {
      id: crypto.randomUUID(),
      businessUnitId: businessUnitId ?? 'all',
      tenantId: 'default',
      deliveryScore,
      qualityScore,
      securityScore,
      availabilityScore,
      obsolescenceScore,
      riskScore,
      complianceScore,
      overallScore: Math.round(overallScore * 10) / 10,
      weights,
      calculatedAt: new Date(),
      trend: 'stable',
    }

    return result
  }, [applications, vulnerabilities, incidents, risks, auditFindings, teams, technologies, microservices, businessUnitId])

  return thi
}

function calculateDeliveryScore(teams: { currentMetrics: { velocity: number; leadTimeHours: number; changeFailureRate: number; mttrHours: number } | null }[]): number {
  if (teams.length === 0) return 50
  const scores = teams.map((t) => {
    if (!t.currentMetrics) return 50
    const velScore = Math.min(t.currentMetrics.velocity / 50, 1) * 100
    const ltScore = Math.max(0, 100 - (t.currentMetrics.leadTimeHours / 168) * 100)
    const cfrScore = Math.max(0, 100 - t.currentMetrics.changeFailureRate * 5)
    const mttrScore = Math.max(0, 100 - (t.currentMetrics.mttrHours / 24) * 100)
    return (velScore + ltScore + cfrScore + mttrScore) / 4
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function calculateQualityScore(_apps: unknown[]): number {
  return 75
}

function calculateSecurityScore(
  apps: { id: string }[],
  vulns: { applicationId: string | null; severity: string; status: string }[]
): number {
  if (apps.length === 0) return 100
  const appVulns = vulns.filter((v) => v.applicationId && apps.some((a) => a.id === v.applicationId))
  const criticalHigh = appVulns.filter((v) => (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed')
  const penalty = Math.min(criticalHigh.length * 5, 80)
  return Math.max(0, 100 - penalty)
}

function calculateAvailabilityScore(
  apps: unknown[],
  incidents: { applicationId: string | null; downtimeMinutes: number | null; status: string }[]
): number {
  if (apps.length === 0) return 100
  const totalDowntime = incidents
    .filter((i) => i.status === 'resolved')
    .reduce((sum, i) => sum + (i.downtimeMinutes ?? 0), 0)
  const penalty = Math.min(totalDowntime / 60, 50)
  return Math.max(0, 100 - penalty)
}

function calculateObsolescenceScore(
  apps: { id: string; technologies: string[] }[],
  technologies: { id: string; supportStatus: string }[],
  appTechMap: Map<string, string[]>,
): number {
  if (apps.length === 0) return 100
  const appsWithEol = apps.filter((app) => {
    const allTechIds = appTechMap.get(app.id) ?? app.technologies
    return allTechIds.some((techId) => {
      const tech = technologies.find((t) => t.id === techId)
      return tech?.supportStatus === 'eol'
    })
  })
  return Math.round((1 - appsWithEol.length / apps.length) * 100)
}

function calculateRiskScore(
  apps: unknown[],
  risks: { applicationId: string | null; status: string; riskScore: number }[]
): number {
  if (apps.length === 0) return 100
  const activeRisks = risks.filter((r) => r.status === 'open')
  const totalScore = activeRisks.reduce((sum, r) => sum + r.riskScore, 0)
  const penalty = Math.min(totalScore / 5, 80)
  return Math.max(0, 100 - penalty)
}

function calculateComplianceScore(findings: { status: string; dueDate: Date }[]): number {
  if (findings.length === 0) return 100
  const closedOnTime = findings.filter((f) => {
    if (f.status !== 'closed' && f.status !== 'resolved') return false
    return new Date(f.dueDate) >= new Date()
  })
  return Math.round((closedOnTime.length / findings.length) * 100)
}
