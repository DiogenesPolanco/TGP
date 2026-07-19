import { db } from '@/services/db/database'
import type { HealthIndex } from '@/types/domain'
import { type AiToolDefinition } from '../types'

export const consultarHealthIndexTool: AiToolDefinition = {
  name: 'consultar_health_index',
  description: 'Histórico del Technology Health Index (THI): evolución de la puntuación a lo largo del tiempo, por BU o dimensión. Mostrá tendencias, mejoras y deterioros.',
  parameters: {
    type: 'object',
    properties: {
      buId: {
        type: 'string',
        description: 'Filtrar por unidad de negocio',
      },
      periodo: {
        type: 'string',
        enum: ['7d', '30d', '90d', '1y', 'all'],
        description: 'Período a analizar (default: 90d)',
      },
      dimension: {
        type: 'string',
        description: 'Filtrar por dimensión específica (ej: "Seguridad", "Obsolescencia")',
      },
    },
  },
  execute: async (params) => {
    const buId = params.buId as string | undefined
    const periodo = (params.periodo as string) ?? '90d'
    const dimension = params.dimension as string | undefined
    const output: string[] = []

    const ahora = new Date()
    const limites: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': Infinity }
    const dias = limites[periodo] ?? 90
    const corte = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000)

    let records = await db.healthIndexHistory.toArray()

    if (buId) records = records.filter((r) => r.businessUnitId === buId)
    records = records.filter((r) => new Date(r.calculatedAt) >= corte)
    records.sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime())

    if (records.length === 0) {
      return `No hay registros de Health Index en el período seleccionado (${periodo}).`
    }

    const first = records[0]
    const last = records[records.length - 1]
    const getScore = (r: typeof first) => r.overallScore ?? 0

    const scoreInicial = getScore(first)
    const scoreActual = getScore(last)
    const diff = scoreActual - scoreInicial
    const diffPct = scoreInicial > 0 ? ((diff / scoreInicial) * 100).toFixed(1) : '0'

    output.push(`📈 **Technology Health Index — Histórico**`)
    output.push(`_${periodo === 'all' ? 'Todo el histórico' : `Últimos ${periodo}`} · ${records.length} registro(s) de ${new Date(first.calculatedAt).toLocaleDateString('es-ES')} a ${new Date(last.calculatedAt).toLocaleDateString('es-ES')}_`)
    output.push('')

    output.push(`**Evolución general:**`)
    output.push(`  📍 Inicio: ${scoreInicial.toFixed(1)}/10`)
    output.push(`  📍 Actual: ${scoreActual.toFixed(1)}/10`)
    const icon = diff > 0.5 ? '📈 Mejorando' : diff < -0.5 ? '📉 Deteriorando' : '➡️ Estable'
    output.push(`  ${icon} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)} · ${diffPct}%)`)
    output.push('')

    const maxRecord = records.reduce((best, r) => getScore(r) > getScore(best) ? r : best, records[0])
    const minRecord = records.reduce((worst, r) => getScore(r) < getScore(worst) ? r : worst, records[0])
    output.push(`**Puntos extremos:**`)
    output.push(`  🟢 Máximo: ${getScore(maxRecord).toFixed(1)} (${new Date(maxRecord.calculatedAt).toLocaleDateString('es-ES')})`)
    output.push(`  🔴 Mínimo: ${getScore(minRecord).toFixed(1)} (${new Date(minRecord.calculatedAt).toLocaleDateString('es-ES')})`)
    output.push('')

    const DIMENSION_LABELS: Record<string, keyof HealthIndex> = {
      delivery: 'deliveryScore',
      calidad: 'qualityScore',
      seguridad: 'securityScore',
      disponibilidad: 'availabilityScore',
      obsolescencia: 'obsolescenceScore',
      riesgo: 'riskScore',
      compliance: 'complianceScore',
    }

    if (!dimension) {
      output.push('**Desglose por dimensión (último registro):**')
      const dims = [
        ['Entrega', last.deliveryScore],
        ['Calidad', last.qualityScore],
        ['Seguridad', last.securityScore],
        ['Disponibilidad', last.availabilityScore],
        ['Obsolescencia', last.obsolescenceScore],
        ['Riesgo', last.riskScore],
        ['Compliance', last.complianceScore],
      ] as const
      const sorted = [...dims].sort(([, a], [, b]) => a - b)
      for (const [k, v] of sorted) {
        const ic = v >= 7 ? '🟢' : v >= 4 ? '🟡' : '🔴'
        output.push(`  ${ic} ${k}: ${v.toFixed(1)}/10`)
      }
      output.push('')
    } else {
      const dimKey = DIMENSION_LABELS[dimension.toLowerCase()]
      if (!dimKey) {
        output.push(`Dimensión "${dimension}" no reconocida. Opciones: Entrega, Calidad, Seguridad, Disponibilidad, Obsolescencia, Riesgo, Compliance`)
        output.push('')
      } else {
        const dimensionValues = records
          .map((r) => ({ date: r.calculatedAt, value: r[dimKey] }))
          .filter((x): x is { date: Date; value: number } => typeof x.value === 'number')
        if (dimensionValues.length > 0) {
          const dimFirst = dimensionValues[0].value
          const dimLast = dimensionValues[dimensionValues.length - 1].value
          const dimDiff = dimLast - dimFirst
          output.push(`**Dimensión: ${dimension}**`)
          output.push(`  📍 Inicio: ${dimFirst.toFixed(1)}/10 → Actual: ${dimLast.toFixed(1)}/10`)
          output.push(`  ${dimDiff >= 0 ? '📈' : '📉'} ${dimDiff >= 0 ? '+' : ''}${dimDiff.toFixed(1)}`)
          output.push('')
        } else {
          output.push(`Dimensión "${dimension}" no encontrada en los registros.`)
          output.push('')
        }
      }
    }

    const ultimos5 = records.slice(-5)
    output.push('**Últimas mediciones:**')
    for (const r of ultimos5) {
      const s = getScore(r)
      const ic = s >= 7 ? '🟢' : s >= 4 ? '🟡' : '🔴'
      output.push(`  ${ic} ${new Date(r.calculatedAt).toLocaleDateString('es-ES')}: ${s.toFixed(1)}/10`)
    }
    output.push('')

    if (!buId) {
      output.push('💡 Usá buId para ver el THI de una unidad de negocio específica.')
    }
    output.push('💡 Usá dimension="Seguridad" (o el nombre que corresponda) para ver la evolución de un componente específico.')

    return output.join('\n')
  },
}
