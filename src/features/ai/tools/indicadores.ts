import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const consultarIndicadoresTool: AiToolDefinition = {
  name: 'consultar_indicadores',
  description:
    'Dashboard ejecutivo: resumen del estado actual de la plataforma en una sola llamada. Incluye THI, vulnerabilidades críticas, incidentes activos, riesgos altos, objetivos en rojo, compromisos y tareas vencidas.',
  parameters: {
    type: 'object',
    properties: {
      buId: {
        type: 'string',
        description: 'ID de la unidad de negocio para filtar (opcional)',
      },
    },
  },
  execute: async (params) => {
    const buId = params.buId as string | undefined
    const output: string[] = []
    const now = new Date()

    output.push(`📊 **Dashboard ejecutivo**${buId ? ' (filtrado por BU)' : ''}`)
    output.push(
      `_${now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}_`,
    )
    output.push('')

    try {
      const healthRecords = await db.healthIndexHistory.toArray()
      const buRecords = buId
        ? healthRecords.filter((h) => h.businessUnitId === buId)
        : healthRecords
      const latest =
        buRecords.length > 0
          ? buRecords.reduce((latest, curr) =>
              new Date(curr.calculatedAt) > new Date(latest.calculatedAt) ? curr : latest,
            )
          : null

      if (latest) {
        const thi = latest.overallScore ?? 0
        output.push(
          `🏥 **THI (Technology Health Index):** ${typeof thi === 'number' ? thi.toFixed(1) : thi}/10`,
        )
        const dims = [
          `  · Entrega: ${latest.deliveryScore.toFixed(1)}`,
          `  · Calidad: ${latest.qualityScore.toFixed(1)}`,
          `  · Seguridad: ${latest.securityScore.toFixed(1)}`,
          `  · Disponibilidad: ${latest.availabilityScore.toFixed(1)}`,
          `  · Obsolescencia: ${latest.obsolescenceScore.toFixed(1)}`,
          `  · Riesgo: ${latest.riskScore.toFixed(1)}`,
          `  · Compliance: ${latest.complianceScore.toFixed(1)}`,
        ].join('\n')
        output.push(dims)
        output.push('')
      }
    } catch {}

    try {
      const vulns = await db.vulnerabilities.toArray()
      const critical = vulns.filter(
        (v) => v.severity === 'critical' && v.status !== 'fixed' && v.status !== 'accepted',
      )
      const high = vulns.filter(
        (v) => v.severity === 'high' && v.status !== 'fixed' && v.status !== 'accepted',
      )
      const totalOpen = vulns.filter((v) => v.status !== 'fixed' && v.status !== 'accepted')

      if (totalOpen.length > 0 || critical.length > 0) {
        output.push(
          `🔒 **Vulnerabilidades:** ${totalOpen.length} abiertas (${critical.length} críticas, ${high.length} altas)`,
        )
        output.push('')
      }
    } catch {}

    try {
      const incidents = await db.incidents.toArray()
      const p1 = incidents.filter(
        (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed',
      )
      const p2 = incidents.filter(
        (i) => i.severity === 'high' && i.status !== 'resolved' && i.status !== 'closed',
      )
      const activeIncidents = incidents.filter(
        (i) => i.status !== 'resolved' && i.status !== 'closed',
      )

      if (activeIncidents.length > 0 || p1.length > 0) {
        output.push(
          `🚨 **Incidentes:** ${activeIncidents.length} activos (${p1.length} P1, ${p2.length} P2)`,
        )
        output.push('')
      }
    } catch {}

    try {
      let risks = await db.risks.toArray()
      if (buId) risks = risks.filter((r) => r.businessUnitId === buId)
      const critical = risks.filter(
        (r) => r.riskScore && r.riskScore >= 15 && r.status !== 'mitigated',
      )
      const high = risks.filter(
        (r) => r.riskScore && r.riskScore >= 10 && r.riskScore < 15 && r.status !== 'mitigated',
      )
      const open = risks.filter((r) => r.status !== 'mitigated')

      if (open.length > 0) {
        output.push(
          `⚠️  **Riesgos:** ${open.length} abiertos (${critical.length} críticos, ${high.length} altos)`,
        )
        output.push('')
      }
    } catch {}

    try {
      let objectives = await db.objectives.toArray()
      if (buId) objectives = objectives.filter((o) => o.businessUnitId === buId)
      const atRisk = objectives.filter((o) => o.status === 'at_risk')
      const behind = objectives.filter((o) => o.status === 'behind')
      const achieved = objectives.filter((o) => o.status === 'achieved')
      const active = objectives.filter((o) => o.status !== 'achieved')

      if (active.length > 0 || atRisk.length > 0) {
        output.push(
          `🎯 **OKRs:** ${active.length} activos (${atRisk.length} en riesgo, ${behind.length} atrasados, ${achieved.length} logrados)`,
        )
        output.push('')
      }
    } catch {}

    try {
      let commitments = await db.commitments.toArray()
      if (buId) {
        // Intentar filtrar por unidades de negocio a través de equipos
        const teams = await db.teams.filter((t) => t.businessUnitId === buId).toArray()
        const teamIds = new Set(teams.map((t) => t.id))
        commitments = commitments.filter((c) => c.teamId && teamIds.has(c.teamId))
      }
      const vencidos = commitments.filter(
        (c) =>
          c.status !== 'fulfilled' && c.status !== 'cancelled' && new Date(c.commitmentDate) < now,
      )

      if (vencidos.length > 0) {
        output.push(`📅 **Compromisos vencidos:** ${vencidos.length}`)
        output.push('')
      }
    } catch {}

    try {
      const tasks = await db.tasks.toArray()
      const vencidas = tasks.filter(
        (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now,
      )

      if (vencidas.length > 0) {
        output.push(`✅ **Tareas vencidas:** ${vencidas.length}`)
        output.push('')
      }
    } catch {}

    if (output.length <= 2) {
      output.push('No hay datos disponibles para mostrar indicadores.')
    }

    output.push(
      '💡 Usá las tools específicas (buscar_*, consultar_*) para profundizar en cada área.',
    )
    return output.join('\n')
  },
}
