import { db } from '@/services/db/database'
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
    records = records.filter((r) => new Date(r.date) >= corte)
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (records.length === 0) {
      return `No hay registros de Health Index en el período seleccionado (${periodo}).`
    }

    const first = records[0]
    const last = records[records.length - 1]
    const getScore = (r: typeof first) => r.score ?? r.overallScore ?? 0

    const scoreInicial = getScore(first)
    const scoreActual = getScore(last)
    const diff = scoreActual - scoreInicial
    const diffPct = scoreInicial > 0 ? ((diff / scoreInicial) * 100).toFixed(1) : '0'

    output.push(`📈 **Technology Health Index — Histórico**`)
    output.push(`_${periodo === 'all' ? 'Todo el histórico' : `Últimos ${periodo}`} · ${records.length} registro(s) de ${new Date(first.date).toLocaleDateString('es-ES')} a ${new Date(last.date).toLocaleDateString('es-ES')}_`)
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
    output.push(`  🟢 Máximo: ${getScore(maxRecord).toFixed(1)} (${new Date(maxRecord.date).toLocaleDateString('es-ES')})`)
    output.push(`  🔴 Mínimo: ${getScore(minRecord).toFixed(1)} (${new Date(minRecord.date).toLocaleDateString('es-ES')})`)
    output.push('')

    if (last.components && !dimension) {
      output.push('**Desglose por dimensión (último registro):**')
      const comps = Object.entries(last.components as Record<string, number>)
        .sort(([, a], [, b]) => a - b)
      for (const [k, v] of comps) {
        const ic = v >= 7 ? '🟢' : v >= 4 ? '🟡' : '🔴'
        output.push(`  ${ic} ${k}: ${v.toFixed(1)}/10`)
      }
      output.push('')
    } else if (dimension) {
      const dimensionValues = records
        .map((r) => ({ date: r.date, value: (r.components as Record<string, number>)?.[dimension] ?? null }))
        .filter((x): x is { date: string | Date; value: number } => x.value !== null)
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

    const ultimos5 = records.slice(-5)
    output.push('**Últimas mediciones:**')
    for (const r of ultimos5) {
      const s = getScore(r)
      const ic = s >= 7 ? '🟢' : s >= 4 ? '🟡' : '🔴'
      output.push(`  ${ic} ${new Date(r.date).toLocaleDateString('es-ES')}: ${s.toFixed(1)}/10`)
    }
    output.push('')

    if (!buId) {
      output.push('💡 Usá buId para ver el THI de una unidad de negocio específica.')
    }
    output.push('💡 Usá dimension="Seguridad" (o el nombre que corresponda) para ver la evolución de un componente específico.')

    return output.join('\n')
  },
}
