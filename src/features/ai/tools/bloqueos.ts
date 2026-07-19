import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const consultarBloqueosTool: AiToolDefinition = {
  name: 'consultar_bloqueos',
  description: 'Bloqueos activos registrados en el sistema. Permite filtrar por tipo de item (plan, tarea, actividad, compromiso), severidad o responsable.',
  parameters: {
    type: 'object',
    properties: {
      tipo: {
        type: 'string',
        enum: ['plan', 'tarea', 'actividad', 'compromiso'],
        description: 'Filtrar por tipo de item bloqueado',
      },
      severidad: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filtrar por severidad del bloqueo',
      },
      responsable: {
        type: 'string',
        description: 'Filtrar por ID del responsable del bloqueo',
      },
      diasMaximo: {
        type: 'number',
        description: 'Mostrar solo bloqueos con más de N días de antigüedad',
      },
    },
  },
  execute: async (params) => {
    const tipo = params.tipo as string | undefined
    const severidad = params.severidad as string | undefined
    const responsable = params.responsable as string | undefined
    const diasMaximo = params.diasMaximo as number | undefined
    const now = new Date()
    const output: string[] = []

    output.push('🔴 **Bloqueos activos**')
    output.push('')

    let bloqueos = await db.blockers.toArray()

    if (tipo) bloqueos = bloqueos.filter((b) => b.sourceType === tipo)
    if (severidad) bloqueos = bloqueos.filter((b) => b.severity === severidad)
    if (responsable) bloqueos = bloqueos.filter((b) => b.assigneeId === responsable)
    if (diasMaximo) {
      bloqueos = bloqueos.filter((b) => {
        const dias = (now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return dias >= diasMaximo
      })
    }

    if (bloqueos.length === 0) {
      return '🎉 No se encontraron bloqueos activos con los filtros indicados.'
    }

    // Resolver nombres de responsables y items relacionados
    const userIds = new Set(bloqueos.map((b) => b.raisedById).concat(bloqueos.map((b) => b.assigneeId).filter(Boolean) as string[]))
    const planIds = new Set<string>()
    const taskIds = new Set<string>()
    const activityIds = new Set<string>()
    const commitmentIds = new Set<string>()

    for (const b of bloqueos) {
      if (b.sourceType === 'plan') planIds.add(b.sourceId)
      else if (b.sourceType === 'task') taskIds.add(b.sourceId)
      else if (b.sourceType === 'activity') activityIds.add(b.sourceId)
      else if (b.sourceType === 'commitment') commitmentIds.add(b.sourceId)
    }

    // Cargar datos relacionados
    const [users, plans, tasks, activities, commitments] = await Promise.all([
      db.users.where('id').anyOf([...userIds]).toArray(),
      planIds.size > 0 ? db.plans.where('id').anyOf([...planIds]).toArray() : [],
      taskIds.size > 0 ? db.tasks.where('id').anyOf([...taskIds]).toArray() : [],
      activityIds.size > 0 ? db.activities.where('id').anyOf([...activityIds]).toArray() : [],
      commitmentIds.size > 0 ? db.commitments.where('id').anyOf([...commitmentIds]).toArray() : [],
    ])

    const userMap = new Map(users.map((u) => [u.id, u.displayName ?? u.email]))
    const planMap = new Map(plans.map((p) => [p.id, p.title]))
    const taskMap = new Map(tasks.map((t) => [t.id, t.title]))
    const activityMap = new Map(activities.map((a) => [a.id, a.title]))
    const commitmentMap = new Map(commitments.map((c) => [c.id, c.title]))

    const itemTitle = (b: typeof bloqueos[0]): string => {
      switch (b.sourceType) {
        case 'plan': return planMap.get(b.sourceId) ?? `plan #${b.sourceId.slice(0, 8)}`
        case 'task': return taskMap.get(b.sourceId) ?? `tarea #${b.sourceId.slice(0, 8)}`
        case 'activity': return activityMap.get(b.sourceId) ?? `actividad #${b.sourceId.slice(0, 8)}`
        case 'commitment': return commitmentMap.get(b.sourceId) ?? `compromiso #${b.sourceId.slice(0, 8)}`
        default: return `#${b.sourceId.slice(0, 8)}`
      }
    }

    const typeLabel = (t: string): string => {
      const labels: Record<string, string> = { plan: 'plan', task: 'tarea', activity: 'actividad', commitment: 'compromiso' }
      return labels[t] ?? t
    }

    for (const b of bloqueos) {
      const nombre = itemTitle(b)
      const reportadoPor = userMap.get(b.raisedById) ?? b.raisedById.slice(0, 8)
      const asignadoA = b.assigneeId ? (userMap.get(b.assigneeId) ?? b.assigneeId.slice(0, 8)) : '—'
      const desde = new Date(b.createdAt).toLocaleDateString('es-ES')
      const resuelto = b.resolvedAt ? new Date(b.resolvedAt).toLocaleDateString('es-ES') : null

      output.push(`  🔸 **${nombre}** (${typeLabel(b.sourceType)}) · ${b.severity}`)
      output.push(`    ${b.description}`)
      output.push(`    Desde: ${desde} · Reportó: ${reportadoPor} · Asignado: ${asignadoA}`)
      if (b.escalatedAt) output.push(`    ⚡ Escalado: ${new Date(b.escalatedAt).toLocaleDateString('es-ES')}`)
      if (resuelto) output.push(`    ✅ Resuelto: ${resuelto}`)
      output.push('')
    }

    output.push(`**Total: ${bloqueos.length} bloqueo(s) activo(s)**`)
    output.push('')
    output.push('💡 Usá filtros para refinar: tipo, severidad, responsable o días de antigüedad.')
    return output.join('\n')
  },
}
