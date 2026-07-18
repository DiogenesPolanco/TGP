import { db } from '@/services/db/database'
import { type AiToolDefinition, normalizeBoolean } from '../types'

export const objetivosTool: AiToolDefinition = {
  name: 'consultar_objetivos',
  description: 'Consulta OKRs y objetivos con filtros por equipo, BU, estado, período',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: ['string', 'null'], description: 'ID del equipo' },
      businessUnitId: { type: ['string', 'null'], description: 'ID de la unidad de negocio' },
      status: {
        type: 'string',
        enum: ['on_track', 'at_risk', 'behind', 'achieved', 'not_started'],
        description: 'Filtrar por estado',
      },
      activos: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo objetivos activos (periodo vigente, no achieved ni cancelled)',
      },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 10)' },
    },
  },
  execute: async (params) => {
    const teamId = params.teamId as string | undefined
    const businessUnitId = params.businessUnitId as string | undefined
    const status = params.status as string | undefined
    const activos = normalizeBoolean(params.activos)
    const limit = (params.limit as number) ?? 10

    let objectives = await db.objectives.toArray()

    if (teamId) objectives = objectives.filter((o) => o.teamId === teamId)
    if (businessUnitId) objectives = objectives.filter((o) => o.businessUnitId === businessUnitId)
    if (status) objectives = objectives.filter((o) => o.status === status)

    const now = new Date()
    if (activos) {
      objectives = objectives.filter(
        (o) =>
          o.status !== 'achieved' &&
          new Date(o.periodEnd) >= now
      )
    }

    objectives.sort((a, b) => new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime())
    objectives = objectives.slice(0, limit)

    const teams = await db.teams.toArray()
    const teamMap = new Map(teams.map((t) => [t.id, t.name]))

    const lines = objectives.map((o) => {
      const teamName = o.teamId ? (teamMap.get(o.teamId) ?? o.teamId) : 'Sin equipo'
      const progress = o.progress ?? 0
      const krs = (o.keyResults ?? []).map(
        (kr) => `    · ${kr.title}: ${kr.current}/${kr.target} (${kr.status})`
      ).join('\n')

      return `- ${o.title}
   Equipo: ${teamName} | Estado: ${o.status} | Progreso: ${progress}% | Período: ${new Date(o.periodStart).toLocaleDateString('es-ES')} - ${new Date(o.periodEnd).toLocaleDateString('es-ES')}
${krs ? krs : '    (sin Key Results definidos)'}`
    })

    return `Se encontraron ${objectives.length} objetivo(s):\n\n${lines.join('\n\n')}`
  },
}

export const planesTool: AiToolDefinition = {
  name: 'consultar_planes',
  description: 'Consulta planes/proyectos con filtros por equipo, estado, fechas',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: ['string', 'null'], description: 'ID del equipo' },
      status: {
        type: 'string',
        enum: ['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'],
        description: 'Filtrar por estado',
      },
      activos: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo planes activos (in_progress o planned)',
      },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 10)' },
    },
  },
  execute: async (params) => {
    const teamId = params.teamId as string | undefined
    const status = params.status as string | undefined
    const activos = normalizeBoolean(params.activos)
    const limit = (params.limit as number) ?? 10

    let plans = await db.plans.toArray()

    if (teamId) plans = plans.filter((p) => p.teamId === teamId)
    if (status) plans = plans.filter((p) => p.status === status)
    if (activos) plans = plans.filter((p) => p.status === 'in_progress' || p.status === 'planned')

    plans = plans.slice(0, limit)

    const teams = await db.teams.toArray()
    const teamMap = new Map(teams.map((t) => [t.id, t.name]))

    const lines = plans.map((p) => {
      const teamName = p.teamId ? (teamMap.get(p.teamId) ?? p.teamId) : 'Sin equipo'
      return `- ${p.title} | Equipo: ${teamName} | Estado: ${p.status} | ${new Date(p.startDate).toLocaleDateString('es-ES')} → ${new Date(p.endDate).toLocaleDateString('es-ES')}`
    })

    return `Se encontraron ${plans.length} plan(es):\n\n${lines.join('\n')}`
  },
}
