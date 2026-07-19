import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const consultarBloqueosTool: AiToolDefinition = {
  name: 'consultar_bloqueos',
  description: 'Bloqueos activos: mostrá items bloqueados de planes, sprints y tareas. Permite filtrar por tipo, prioridad o responsable.',
  parameters: {
    type: 'object',
    properties: {
      tipo: {
        type: 'string',
        enum: ['plan', 'sprint', 'tarea', 'compromiso', 'entregable'],
        description: 'Filtrar por tipo de item bloqueado',
      },
      prioridad: {
        type: 'string',
        enum: ['alta', 'media', 'baja'],
        description: 'Filtrar por prioridad',
      },
      responsable: {
        type: 'string',
        description: 'Filtrar por nombre del responsable del bloqueo',
      },
      diasMaximo: {
        type: 'number',
        description: 'Mostrar solo bloqueos con más de N días de antigüedad',
      },
    },
  },
  execute: async (params) => {
    const tipo = params.tipo as string | undefined
    const prioridad = params.prioridad as string | undefined
    const responsable = params.responsable as string | undefined
    const diasMaximo = params.diasMaximo as number | undefined
    const now = new Date()
    const output: string[] = []
    let total = 0

    output.push('🔴 **Bloqueos activos**')
    output.push('')

    async function pushBloqueos<T extends { id?: string; title?: string; name?: string; status?: string; priority?: string; blocker?: string; blockerDescription?: string; blockedDate?: string | Date; dueDate?: string | Date; assignedTo?: string; planId?: string; sprintId?: string; }>(
      items: T[],
      tipo: string,
      getBloqueo: (item: T) => { fecha: Date; descripcion: string; responsable: string } | null
    ) {
      for (const item of items) {
        const b = getBloqueo(item)
        if (!b) continue
        if (diasMaximo) {
          const dias = (now.getTime() - b.fecha.getTime()) / (1000 * 60 * 60 * 24)
          if (dias < diasMaximo) continue
        }
        const nom = item.title ?? item.name ?? `#${item.id ?? '?'}`
        const prio = item.priority ?? '—'
        total++
        output.push(`  🔸 **${nom}** (${tipo}) · prio: ${prio}`)
        output.push(`    ${b.descripcion}`)
        output.push(`    Desde: ${b.fecha.toLocaleDateString('es-ES')} · Resp: ${b.responsable}`)
        output.push('')
      }
    }

    const matchTipo = !tipo || tipo === 'plan'
    const matchPrio = !prioridad

    if (matchTipo) {
      try {
        const planes = await db.plans.toArray()
        await pushBloqueos(planes, 'plan', (p) => {
          if (p.status !== 'blocked' && !p.blocker) return null
          if (prioridad && p.priority !== prioridad) return null
          return {
            fecha: p.blockedDate ? new Date(p.blockedDate) : now,
            descripcion: p.blockerDescription ?? p.blocker ?? 'Sin descripción',
            responsable: p.assignedTo ?? '—',
          }
        })
      } catch {}
    }

    if (!tipo || tipo === 'sprint') {
      try {
        const sprints = await db.sprints.toArray()
        const sprintsBloqueados = sprints.filter((s) => s.status === 'blocked')
        for (const s of sprintsBloqueados) {
          const nom = s.name ?? `Sprint #${s.id}`
          total++
          output.push(`  🔸 **${nom}** (sprint) · ${s.goal ?? ''}`)
          output.push(`    Bloqueado: ${s.blockerReason ?? 'Sin motivo registrado'}`)
          output.push('')
        }
      } catch {}
    }

    if (!tipo || tipo === 'tarea') {
      try {
        const tasks = await db.tasks.toArray()
        await pushBloqueos(tasks, 'tarea', (t) => {
          if (t.status !== 'blocked' && !t.blocker) return null
          if (matchPrio && prioridad && t.priority !== prioridad) return null
          return {
            fecha: t.blockedDate ? new Date(t.blockedDate) : (t.dueDate ? new Date(t.dueDate) : now),
            descripcion: t.blockerDescription ?? t.blocker ?? 'Sin descripción',
            responsable: t.assignedTo ?? '—',
          }
        })
      } catch {}
    }

    if (!tipo || tipo === 'entregable') {
      try {
        const deliverables = await db.deliverables.toArray()
        await pushBloqueos(deliverables, 'entregable', (d) => {
          if (d.status !== 'blocked' && !d.blocker) return null
          return {
            fecha: d.blockedDate ? new Date(d.blockedDate) : (d.dueDate ? new Date(d.dueDate) : now),
            descripcion: d.blockerDescription ?? d.blocker ?? 'Sin descripción',
            responsable: d.assignedTo ?? '—',
          }
        })
      } catch {}
    }

    if (!tipo || tipo === 'compromiso') {
      try {
        const commitments = await db.commitments.toArray()
        const vencidos = commitments.filter(
          (c) => c.status !== 'fulfilled' && c.status !== 'cancelled' && new Date(c.commitmentDate) < now
        )
        for (const c of vencidos) {
          if (prioridad && c.priority !== prioridad) continue
          total++
          output.push(`  🔸 **${c.title ?? `Compromiso #${c.id}`}** (compromiso vencido) · prio: ${c.priority ?? '—'}`)
          output.push(`    Vencido desde: ${new Date(c.commitmentDate).toLocaleDateString('es-ES')} · Resp: ${c.assignedTo ?? '—'}`)
          output.push('')
        }
      } catch {}
    }

    if (total === 0) {
      return '🎉 No se encontraron bloqueos activos.'
    }

    output.push(`**Total: ${total} bloqueo(s) activo(s)**`)
    output.push('')
    output.push('💡 Usá filtros para refinar: tipo, prioridad, responsable o días de antigüedad.')
    return output.join('\n')
  },
}
