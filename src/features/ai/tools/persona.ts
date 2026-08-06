import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const consultarPersonaTool: AiToolDefinition = {
  name: 'consultar_persona',
  description:
    'Perfil completo de una persona: datos de contacto, equipos, roles, bbeneficios, riesgos asignados, compromisos, tareas, tickets de equipamiento y hallazgos. Usá buscar_persona primero para obtener el ID o email.',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID de la persona en memberProfiles (o email como fallback)',
      },
    },
  },
  execute: async (params) => {
    const idInput = ((params.id as string) ?? '').trim()
    if (!idInput) return 'Error: parámetro "id" requerido. Usá buscar_persona para encontrar el ID.'

    const output: string[] = []
    let encontrada = false

    output.push(`👤 **Perfil completo**`)
    output.push('')

    const member = idInput.includes('@')
      ? (await db.memberProfiles.toArray()).find(
          (m) => m.email?.toLowerCase() === idInput.toLowerCase(),
        )
      : await db.memberProfiles.get(idInput)

    if (member) {
      encontrada = true
      const nombre = (member as any).displayName ?? member.email
      output.push(`**${nombre}**`)

      if (member.email) output.push(`📧 ${member.email}`)
      if (member.phoneCell) output.push(`📱 ${member.phoneCell} (cel)`)
      if (member.phoneHome) output.push(`🏠 ${member.phoneHome} (fijo)`)
      if (member.role) output.push(`🔖 Rol: ${member.role}`)
      if ((member as any).jobTitle) output.push(`💼 Cargo: ${(member as any).jobTitle}`)
      if ((member as any).department) output.push(`🏢 Depto: ${(member as any).department}`)
      if ((member as any).location) output.push(`📍 ${(member as any).location}`)
      output.push('')
    }

    try {
      const teams = await db.teams.toArray()
      const equipos = teams.filter((t) =>
        t.members?.some((m) => {
          const mId = (m as any).id ?? (m as any).userPrincipal ?? (m as any).email
          if (!mId) return false
          const matchDirect = mId === idInput
          const matchMember = member && (mId === member.id || mId === member.email)
          return matchDirect || matchMember
        }),
      )

      if (equipos.length > 0) {
        output.push(`**Equipos (${equipos.length}):**`)
        for (const t of equipos) {
          const miembro = t.members?.find((m) => {
            const mId = (m as any).id ?? (m as any).userPrincipal ?? (m as any).email
            if (!mId) return false
            return mId === idInput || (member && (mId === member.id || mId === member.email))
          })
          const rol = miembro ? ((miembro as any).role ?? '') : ''
          output.push(`  · **${t.name}** ${rol ? `(${rol})` : ''}`)
        }
        output.push('')
      }
    } catch {}

    async function findMemberItems<T extends Record<string, any>>(
      table: { toArray: () => Promise<T[]> },
      field: string,
      name: string,
      formatter: (item: T) => string,
    ) {
      try {
        const items = await table.toArray()
        const matchId = member?.id ?? idInput
        const matchEmail = member?.email
        const relacionados = items.filter((item: any) => {
          const val = item[field]
          if (!val) return false
          return val === matchId || val === idInput || (matchEmail && val === matchEmail)
        })
        if (relacionados.length > 0) {
          output.push(`**${name} (${relacionados.length}):**`)
          for (const r of relacionados) {
            output.push(`  · ${formatter(r)}`)
          }
          output.push('')
        }
      } catch {}
    }

    await findMemberItems(
      db.commitments as any,
      'assignedTo',
      'Compromisos',
      (c: any) =>
        `${c.title ?? c.description ?? 'Sin título'}${c.commitmentDate ? ` · Vence: ${new Date(c.commitmentDate).toLocaleDateString('es-ES')}` : ''} ${c.status ? `[${c.status}]` : ''}`,
    )

    await findMemberItems(
      db.tasks as any,
      'assignedTo',
      'Tareas',
      (t: any) =>
        `${t.title ?? 'Sin título'}${t.dueDate ? ` · Vence: ${new Date(t.dueDate).toLocaleDateString('es-ES')}` : ''} ${t.status ? `[${t.status}]` : ''}`,
    )

    await findMemberItems(
      db.equipmentTickets as any,
      'assigneeId',
      'Tickets de equipamiento',
      (t: any) =>
        `${t.title ?? 'Ticket #' + t.id} · ${t.type ?? ''} ${t.status ? `[${t.status}]` : ''}`,
    )

    await findMemberItems(
      db.auditFindings as any,
      'assignedTo',
      'Hallazgos',
      (h: any) =>
        `${h.title ?? 'Hallazgo #' + h.id} · ${h.severity ?? ''} ${h.status ? `[${h.status}]` : ''}`,
    )

    try {
      const risks = await db.risks.toArray()
      const relacionados = risks.filter((r: any) => {
        const owner = (r as any).owner ?? (r as any).assignedTo
        return owner === idInput || owner === member?.id || owner === member?.email
      })
      if (relacionados.length > 0) {
        output.push(`**Riesgos asignados (${relacionados.length}):**`)
        for (const r of relacionados) {
          output.push(
            `  · ${(r as any).title ?? 'Riesgo #' + r.id} · Score: ${(r as any).riskScore ?? '—'} ${r.status ? `[${r.status}]` : ''}`,
          )
        }
        output.push('')
      }
    } catch {}

    if (!encontrada && output.length <= 2) {
      output.push(
        `No se encontró una persona con ID o email "${idInput}". Usá \`buscar_persona\` primero para localizar el ID correcto.`,
      )
    }

    return output.join('\n')
  },
}
