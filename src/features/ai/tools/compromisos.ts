import { db } from '@/services/db/database'
import { type AiToolDefinition, normalizeBoolean } from '../types'

export const compromisosTool: AiToolDefinition = {
  name: 'consultar_compromisos',
  description: 'Consulta compromisos y tareas con filtros por estado, equipo, persona, fecha',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['active', 'at_risk', 'breached', 'fulfilled', 'cancelled'],
        description: 'Filtrar por estado del compromiso',
      },
      teamId: { type: ['string', 'null'], description: 'ID del equipo' },
      ownerId: { type: 'string', description: 'ID del responsable' },
      vencidos: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo compromisos vencidos (commitmentDate pasada y no fulfilled)',
      },
      estaSemana: {
        type: ['boolean', 'string', 'number'],
        description: 'Compromisos con fecha en los próximos 7 días',
      },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 20)' },
    },
  },
  execute: async (params) => {
    const status = params.status as string | undefined
    const teamId = params.teamId as string | undefined
    const ownerId = params.ownerId as string | undefined
    const vencidos = normalizeBoolean(params.vencidos)
    const estaSemana = normalizeBoolean(params.estaSemana)
    const limit = (params.limit as number) ?? 20

    let commitments = await db.commitments.toArray()

    if (status) commitments = commitments.filter((c) => c.status === status)
    if (teamId) commitments = commitments.filter((c) => c.teamId === teamId)
    if (ownerId)
      commitments = commitments.filter((c) => c.ownerId === ownerId || c.accountableId === ownerId)

    const now = new Date()
    if (vencidos) {
      commitments = commitments.filter(
        (c) =>
          c.status !== 'fulfilled' && c.status !== 'cancelled' && new Date(c.commitmentDate) < now,
      )
    }
    if (estaSemana) {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      commitments = commitments.filter(
        (c) =>
          c.status !== 'fulfilled' &&
          c.status !== 'cancelled' &&
          new Date(c.commitmentDate) >= now &&
          new Date(c.commitmentDate) <= weekFromNow,
      )
    }

    commitments.sort(
      (a, b) => new Date(a.commitmentDate).getTime() - new Date(b.commitmentDate).getTime(),
    )
    commitments = commitments.slice(0, limit)

    const users = await db.users.toArray()
    const userMap = new Map(users.map((u) => [u.id, u.displayName]))

    const lines = commitments.map((c) => {
      const owner = userMap.get(c.ownerId) ?? c.ownerId
      const accountable = userMap.get(c.accountableId) ?? c.accountableId
      const date = new Date(c.commitmentDate).toLocaleDateString('es-ES')
      const isOverdue =
        c.status !== 'fulfilled' && c.status !== 'cancelled' && new Date(c.commitmentDate) < now
      return `- ${c.title} | Responsable: ${owner} | Rinde: ${accountable} | Vence: ${date} | Estado: ${c.status}${isOverdue ? ' [VENCIDO]' : ''}`
    })

    const total = commitments.length
    const overdue = commitments.filter(
      (c) =>
        c.status !== 'fulfilled' && c.status !== 'cancelled' && new Date(c.commitmentDate) < now,
    ).length

    let summary = `Se encontraron ${total} compromiso(s)`
    if (overdue > 0) summary += `, ${overdue} vencido(s)`
    summary += ':\n\n' + lines.join('\n')

    return summary
  },
}

export const tareasTool: AiToolDefinition = {
  name: 'consultar_tareas',
  description: 'Consulta tareas con filtros por estado, asignado, prioridad, fecha',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'review', 'done'],
        description: 'Filtrar por estado de la tarea',
      },
      assigneeId: { type: 'string', description: 'ID del asignado' },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filtrar por prioridad',
      },
      planId: { type: 'string', description: 'ID del plan' },
      vencidas: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo tareas vencidas no completadas',
      },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 20)' },
    },
  },
  execute: async (params) => {
    const status = params.status as string | undefined
    const assigneeId = params.assigneeId as string | undefined
    const priority = params.priority as string | undefined
    const planId = params.planId as string | undefined
    const vencidas = normalizeBoolean(params.vencidas)
    const limit = (params.limit as number) ?? 20

    let tasks = await db.tasks.toArray()

    if (status) tasks = tasks.filter((t) => t.status === status)
    if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId)
    if (priority) tasks = tasks.filter((t) => t.priority === priority)
    if (planId) tasks = tasks.filter((t) => t.planId === planId)

    const now = new Date()
    if (vencidas) {
      tasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now)
    }

    tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    })
    tasks = tasks.slice(0, limit)

    const users = await db.users.toArray()
    const userMap = new Map(users.map((u) => [u.id, u.displayName]))

    const lines = tasks.map((t) => {
      const assignee = t.assigneeId ? (userMap.get(t.assigneeId) ?? t.assigneeId) : 'Sin asignar'
      const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'
      const isOverdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
      return `- ${t.title} | Asignado: ${assignee} | Prioridad: ${t.priority} | Vence: ${due} | Estado: ${t.status}${isOverdue ? ' [VENCIDA]' : ''}`
    })

    return `Se encontraron ${tasks.length} tarea(s):\n\n${lines.join('\n')}`
  },
}
