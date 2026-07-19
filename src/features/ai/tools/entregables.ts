import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const buscarEntregableTool: AiToolDefinition = {
  name: 'buscar_entregable',
  description: 'Buscá entregables por título, aplicación, estado, fecha o palabra clave. Ideal para seguimiento de entregas.',
  parameters: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Búsqueda por texto en título o descripción',
      },
      applicationId: {
        type: 'string',
        description: 'Filtrar por ID de aplicación',
      },
      estado: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        description: 'Filtrar por estado',
      },
      vencidos: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo entregables vencidos (true)',
      },
      limit: { type: 'number', description: 'Máximo de resultados (default 20)' },
    },
  },
  execute: async (params) => {
    const q = (params.q as string ?? '').trim()
    const applicationId = params.applicationId as string | undefined
    const estado = params.estado as string | undefined
    const vencidos = typeof params.vencidos === 'boolean' ? params.vencidos :
      params.vencidos === 'true' || params.vencidos === '1'
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)

    let entregables = await db.deliverables.toArray()
    const now = new Date()
    const apps = await db.applications.toArray()
    const appMap = new Map(apps.map((a) => [a.id, a.name ?? a.id]))

    if (q) {
      const term = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      entregables = entregables.filter((d) => {
        const haystack = [d.title, d.description].filter(Boolean).join(' ')
        return haystack.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(term)
      })
    }
    if (applicationId) entregables = entregables.filter((d) => d.applicationId === applicationId)
    if (estado) entregables = entregables.filter((d) => d.status === estado)
    if (vencidos) entregables = entregables.filter((d) => d.status !== 'completed' && d.status !== 'cancelled' && d.dueDate && new Date(d.dueDate) < now)

    if (entregables.length === 0) {
      return 'No se encontraron entregables con los criterios indicados.'
    }

    entregables = entregables.slice(0, limit)
    const lines = entregables.map((d) => {
      const app = d.applicationId ? appMap.get(d.applicationId) ?? '—' : '—'
      const vencido = d.dueDate && new Date(d.dueDate) < now && d.status !== 'completed' && d.status !== 'cancelled'
      const icon = d.status === 'completed' ? '✅' :
        d.status === 'cancelled' ? '❌' :
        vencido ? '🔴' :
        d.status === 'in_progress' ? '🔄' : '⏳'
      const vence = d.dueDate ? new Date(d.dueDate).toLocaleDateString('es-ES') : '—'
      return `${icon} **${d.title}** · App: ${app} · Vence: ${vence} · ${d.status}${vencido ? ' ⚠️ VENCIDO' : ''}`
    })

    let out = `Se encontraron ${entregables.length} entregable(s):\n\n${lines.join('\n')}`
    if (params.q === undefined && params.applicationId === undefined) {
      const pendientes = entregables.filter((d) => d.status !== 'completed' && d.status !== 'cancelled').length
      out += `\n\n📊 ${pendientes} pendiente(s) de ${entregables.length}`
    }
    return out
  },
}
