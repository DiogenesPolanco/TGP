import { db } from '@/services/db/database'

export interface Prediction {
  metric: string
  current: number
  predicted: number
  trend: 'up' | 'down' | 'stable'
  confidence: 'high' | 'medium' | 'low'
  detail: string
}

function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length
  if (n < 3) return { slope: 0, intercept: values[0] ?? 0, r2: 0 }

  const indices = Array.from({ length: n }, (_, i) => i)
  const sumX = indices.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = indices.reduce((s, i) => s + i * values[i], 0)
  const sumX2 = indices.reduce((s, i) => s + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const yMean = sumY / n
  const ssRes = values.reduce((s, y, i) => s + (y - (slope * i + intercept)) ** 2, 0)
  const ssTot = values.reduce((s, y) => s + (y - yMean) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, r2 }
}

function predictNext(values: number[], steps = 30): { prediction: number; confidence: 'high' | 'medium' | 'low' } {
  const { slope, intercept, r2 } = linearRegression(values)
  const nextIndex = values.length + steps - 1
  const prediction = Math.max(0, Math.min(100, slope * nextIndex + intercept))

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (values.length >= 10 && r2 > 0.7) confidence = 'high'
  else if (values.length >= 5 && r2 > 0.4) confidence = 'medium'

  return { prediction: Math.round(prediction * 10) / 10, confidence }
}

export async function getPredictions(): Promise<Prediction[]> {
  const predictions: Prediction[] = []

  const history = await db.healthIndexHistory
    .orderBy('calculatedAt')
    .toArray()

  if (history.length >= 3) {
    const scores = history.map((h) => h.overallScore)
    const { prediction: thiPred, confidence: thiConf } = predictNext(scores)
    const current = scores[scores.length - 1]
    const trend = thiPred > current + 2 ? 'up' : thiPred < current - 2 ? 'down' : 'stable'

    predictions.push({
      metric: 'THI General',
      current,
      predicted: thiPred,
      trend,
      confidence: thiConf,
      detail: thiConf === 'high'
        ? `Proyección basada en ${scores.length} registros históricos con tendencia ${trend === 'up' ? 'positiva' : trend === 'down' ? 'negativa' : 'estable'}`
        : `Se necesitan más datos históricos para mejorar la precisión (actual: ${scores.length} registros)`,
    })
  }

  const vulns = await db.vulnerabilities.toArray()
  if (vulns.length >= 3) {
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const recentVulns = vulns.filter((v) => new Date(v.createdAt).getTime() > thirtyDaysAgo)
    const monthlyRate = Math.round((recentVulns.length / Math.max(1, 30)) * 30)

    const criticalOpen = vulns.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length
    const slaRisk = criticalOpen > 0
      ? 'Riesgo de incumplimiento SLA: vulnerabilidades críticas sin corregir'
      : 'Sin riesgo SLA detectado'

    predictions.push({
      metric: 'Velocidad Vulnerabilidades',
      current: recentVulns.length,
      predicted: monthlyRate,
      trend: monthlyRate > recentVulns.length ? 'up' : monthlyRate < recentVulns.length ? 'down' : 'stable',
      confidence: vulns.length >= 10 ? 'high' : 'medium',
      detail: `${recentVulns.length} vulnerabilidades en los últimos 30 días. Proyección mensual: ${monthlyRate}. ${slaRisk}`,
    })
  }

  const risks = await db.risks.toArray()
  if (risks.length > 0) {
    const openRisks = risks.filter((r) => r.status === 'open')
    const totalScore = openRisks.reduce((s, r) => s + r.riskScore, 0)
    const criticalRisks = openRisks.filter((r) => r.riskScore >= 15).length

    predictions.push({
      metric: 'Exposición Riesgos',
      current: totalScore,
      predicted: totalScore + criticalRisks * 5,
      trend: criticalRisks > 2 ? 'up' : criticalRisks > 0 ? 'stable' : 'down',
      confidence: openRisks.length >= 5 ? 'high' : 'medium',
      detail: `${openRisks.length} riesgos activos (${criticalRisks} críticos). Score actual: ${totalScore}`,
    })
  }

  const techs = await db.technologies.toArray()
  const apps = await db.applications.toArray()
  if (techs.length > 0 && apps.length > 0) {
    const eolTechs = techs.filter((t) => t.supportStatus === 'eol')
    const appsWithEol = apps.filter((a) => a.technologies.some((tId) => eolTechs.some((e) => e.id === tId)))
    const pct = Math.round((appsWithEol.length / apps.length) * 100)

    predictions.push({
      metric: 'Apps con Tech EOL',
      current: appsWithEol.length,
      predicted: appsWithEol.length + Math.round(eolTechs.length * 0.1),
      trend: pct > 20 ? 'up' : pct > 10 ? 'stable' : 'down',
      confidence: eolTechs.length >= 5 ? 'high' : 'medium',
      detail: `${appsWithEol.length} de ${apps.length} apps (${pct}%) usan tecnologías EOL. ${eolTechs.length} tecnologías obsoletas identificadas.`,
    })
  }

  const teams = await db.teams.toArray()
  if (teams.length > 0) {
    const eliteTeams = teams.filter((t) => (t.currentMetrics?.deploymentFrequency ?? 0) >= 1).length
    const pctElite = Math.round((eliteTeams / teams.length) * 100)

    predictions.push({
      metric: 'Equipos Elite DORA',
      current: eliteTeams,
      predicted: eliteTeams + (pctElite < 30 ? 1 : 0),
      trend: pctElite < 20 ? 'up' : 'stable',
      confidence: teams.length >= 3 ? 'medium' : 'low',
      detail: `${eliteTeams} de ${teams.length} equipos (${pctElite}%) clasifican como Elite según métricas DORA.`,
    })
  }

  return predictions
}
