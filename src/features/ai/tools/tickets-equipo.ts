import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

function n(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export const buscarTicketEquipoTool: AiToolDefinition = {
  name: 'buscar_ticket_equipo',
  description: 'Buscá tickets de equipamiento por tipo, estado, prioridad, equipo asociado o persona solicitante/asignada. Incluye tickets de reparación, reemplazo y nuevos.',
  parameters: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Búsqueda por descripción, tipo, estado, prioridad o nombre de persona',
      },
      tipo: {
        type: 'string',
        enum: ['replacement', 'repair', 'new'],
        description: 'Filtrar por tipo de ticket',
      },
      estado: {
        type: 'string',
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        description: 'Filtrar por estado',
      },
      prioridad: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filtrar por prioridad',
      },
      equipmentId: {
        type: 'string',
        description: 'ID del equipo asociado',
      },
      limit: { type: 'number', description: 'Máximo de resultados (default 20)' },
    },
  },
  execute: async (params) => {
    const q = (params.q as string ?? '').trim()
    const tipo = params.tipo as string | undefined
    const estado = params.estado as string | undefined
    const prioridad = params.prioridad as string | undefined
    const equipmentId = params.equipmentId as string | undefined
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)

    let tickets = await db.equipmentTickets.toArray()

    if (tipo) tickets = tickets.filter((t) => t.type === tipo)
    if (estado) tickets = tickets.filter((t) => t.status === estado)
    if (prioridad) tickets = tickets.filter((t) => t.priority === prioridad)
    if (equipmentId) tickets = tickets.filter((t) => t.equipmentId === equipmentId)

    const personMap = new Map<string, string>()
    const equipmentMap = new Map<string, string>()
    try {
      const teams = await db.teams.toArray()
      for (const t of teams) {
        for (const m of (t.members ?? [])) {
          const id = (m as any).id ?? ''
          const name = (m as any).displayName ?? ''
          if (id && name) personMap.set(id, name)
        }
      }
      const profiles = await db.memberProfiles.toArray()
      for (const p of profiles) personMap.set(p.id, p.email)

      const equipment = await db.equipment.toArray()
      for (const e of equipment) {
        equipmentMap.set(e.id, `${e.brand} ${e.model} (${e.type})`)
      }
    } catch {}

    if (q) {
      const term = n(q)
      const matchingPersonIds = new Set<string>()
      for (const [id, name] of personMap) {
        if (n(name).includes(term)) matchingPersonIds.add(id)
      }
      tickets = tickets.filter((t) => {
        if (n(t.description).includes(term)) return true
        if (n(t.type).includes(term) || n(t.status).includes(term) || n(t.priority).includes(term)) return true
        if (t.jiraTicketId && n(t.jiraTicketId).includes(term)) return true
        if (matchingPersonIds.size > 0) {
          if (t.requesterId && matchingPersonIds.has(t.requesterId)) return true
          if (t.assigneeId && matchingPersonIds.has(t.assigneeId)) return true
        }
        return false
      })
    }

    if (tickets.length === 0) {
      return q
        ? `No se encontraron tickets de equipamiento que coincidan con "${q}".`
        : 'No hay tickets de equipamiento registrados.'
    }

    tickets = tickets.slice(0, limit)
    const lines = tickets.map((t) => {
      const nombreEquipo = t.equipmentId ? equipmentMap.get(t.equipmentId) ?? t.equipmentId.slice(0, 12) : '—'
      const solicitante = t.requesterId ? personMap.get(t.requesterId) ?? t.requesterId.slice(0, 12) : '—'
      const asignado = t.assigneeId ? personMap.get(t.assigneeId) ?? t.assigneeId.slice(0, 12) : '—'
      const icon = t.status === 'closed' ? '✅' : t.status === 'resolved' ? '🟢' : t.status === 'in_progress' ? '🔄' : '🔴'
      const jira = t.jiraTicketId ? ` · Jira: ${t.jiraTicketId}` : ''
      return `${icon} **${t.type}** · ${t.priority} · ${t.status} · Eq: ${nombreEquipo}${jira}\n   Solicitante: ${solicitante} · Asignado: ${asignado}`
    })

    let out = `Se encontraron ${tickets.length} ticket(s) de equipamiento:\n\n${lines.join('\n\n')}`
    const abiertos = tickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved').length
    out += `\n\n📊 ${abiertos} abierto(s) de ${tickets.length}`
    return out
  },
}
