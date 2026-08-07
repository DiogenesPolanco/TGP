import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'
import { getAppCost, getDashboardMetrics } from '@/features/finops/services/finOpsService'

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const consultarCostosTool: AiToolDefinition = {
  name: 'consultar_costos',
  description:
    'FinOps: costo por aplicación. Responde cuánto gasta una aplicación en un mes (incluye microservicios), top de aplicaciones por costo y totales por categoría.',
  parameters: {
    type: 'object',
    properties: {
      applicationId: { type: 'string', description: 'ID de la aplicación (opcional)' },
      period: {
        type: 'string',
        description: 'Mes en formato YYYY-MM (opcional, default mes actual)',
      },
    },
  },
  execute: async (params) => {
    const period = (params.period as string | undefined) ?? new Date().toISOString().slice(0, 7)
    const appId = params.applicationId as string | undefined
    const output: string[] = []

    if (appId) {
      const app = await db.applications.get(appId)
      if (!app) return `No se encontró la aplicación ${appId}.`
      const cost = await getAppCost(appId, period)
      if (cost === 0) {
        return `sin datos de costo para "${app.name}" en ${period}.`
      }
      output.push(`💸 **Costo de "${app.name}" en ${period}:** ${fmt(cost)}`)
      return output.join('\n')
    }

    const m = await getDashboardMetrics(period)
    if (m.total === 0) return `No hay datos de costo para ${period}.`
    output.push(`💸 **FinOps ${period}:** total ${fmt(m.total)}`)
    if (m.variationPct !== null) {
      output.push(
        `   Variación vs mes anterior: ${m.variationPct > 0 ? '+' : ''}${m.variationPct}%`,
      )
    }
    if (m.topApps.length > 0) {
      output.push('   Top apps:')
      for (const app of m.topApps.slice(0, 5)) {
        output.push(`   · ${app.name}: ${fmt(app.total)}`)
      }
    }
    return output.join('\n')
  },
}
