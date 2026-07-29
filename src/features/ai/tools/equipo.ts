import { db } from '@/services/db/database'
import { type AiToolDefinition, normalizeBoolean } from '../types'

export const equiposTool: AiToolDefinition = {
  name: 'consultar_equipos',
  description: 'Consulta equipos y sus miembros con filtros',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: ['string', 'null'], description: 'ID del equipo específico' },
      businessUnitId: { type: ['string', 'null'], description: 'ID de la unidad de negocio' },
      incluirMiembros: {
        type: ['boolean', 'string', 'number'],
        description: 'Incluir lista de miembros de cada equipo (true/false/1/0)',
      },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 20)' },
    },
  },
  execute: async (params) => {
    const teamId = params.teamId as string | undefined
    const businessUnitId = params.businessUnitId as string | undefined
    const incluirMiembros = normalizeBoolean(params.incluirMiembros)
    const limit = (params.limit as number) ?? 20

    let teams = await db.teams.toArray()

    if (teamId) teams = teams.filter((t) => t.id === teamId)
    if (businessUnitId) teams = teams.filter((t) => t.businessUnitId === businessUnitId)

    teams = teams.slice(0, limit)

    const lines = teams.map((t) => {
      const memberLines =
        incluirMiembros && t.members.length > 0
          ? '\n    Miembros:\n' +
            t.members.map((m) => `    · ${m.displayName} (${m.role})`).join('\n')
          : ''

      return `- ${t.name}${memberLines}`
    })

    return `Se encontraron ${teams.length} equipo(s):\n\n${lines.join('\n\n')}`
  },
}

// ─── buscar_persona ─────────────────────────────────────────────────

function normalizeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

interface PersonaResult {
  nombre: string
  email: string | null
  rol: string | null
  equipo: string
  fuente: string
  id: string
  teamId: string | null
}

export const buscarPersonaTool: AiToolDefinition = {
  name: 'buscar_persona',
  description:
    'Buscá personas por nombre, email o parcial en TODAS las tablas de personas (memberProfiles, users, teams) simultáneamente. Incluye acentos. Ideal cuando no sabés exactamente cómo está registrada la persona.',
  parameters: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description: 'Nombre, email o texto a buscar (no necesita acentos, busca parcial)',
      },
      limit: {
        type: 'number',
        description: 'Máximo de resultados (default 20)',
      },
    },
    required: ['q'],
  },
  execute: async (params) => {
    const query = ((params.q as string) ?? '').trim()
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)
    if (!query) return 'Error: parámetro "q" requerido.'

    const term = normalizeDiacritics(query)
    const results: PersonaResult[] = []

    // 1. Buscar en memberProfiles
    try {
      const members = await db.memberProfiles.toArray()
      const teams = await db.teams.toArray()
      const teamMap = new Map(teams.map((t) => [t.id, t]))

      for (const m of members) {
        const displayName = (m as any).displayName ?? m.email
        const phone = m.phoneCell || m.phoneHome || ''
        const haystack = normalizeDiacritics(
          [displayName, m.email, phone, m.role].filter(Boolean).join(' '),
        )
        if (!haystack.includes(term)) continue

        const team = m.teamId ? teamMap.get(m.teamId) : undefined
        results.push({
          nombre: displayName,
          email: m.email ?? null,
          rol: m.role ?? null,
          equipo: team?.name ?? '(sin equipo)',
          fuente: 'memberProfiles',
          id: m.id,
          teamId: m.teamId ?? null,
        })
      }
    } catch {
      /* tabla no disponible */
    }

    // 2. Buscar en users (solapa con memberProfiles, pero puede tener datos distintos)
    try {
      const users = await db.users.toArray()
      for (const u of users) {
        const haystack = normalizeDiacritics([u.displayName, u.email].filter(Boolean).join(' '))
        if (!haystack.includes(term)) continue
        // Evitar duplicados exactos
        if (
          results.some(
            (r) =>
              r.fuente === 'memberProfiles' &&
              r.email &&
              u.email &&
              r.email.toLowerCase() === u.email.toLowerCase(),
          )
        )
          continue

        results.push({
          nombre: u.displayName,
          email: u.email ?? null,
          rol: null,
          equipo: '(usuario del sistema)',
          fuente: 'users',
          id: u.id,
          teamId: null,
        })
      }
    } catch {
      /* tabla no disponible */
    }

    // 3. Buscar en teams (por nombre de miembro dentro del array members[])
    try {
      const teams = await db.teams.toArray()
      for (const t of teams) {
        for (const m of t.members ?? []) {
          const displayName = (m as any).displayName ?? ''
          const haystack = normalizeDiacritics(displayName)
          if (!haystack.includes(term)) continue
          // Evitar duplicados con memberProfiles
          if (
            results.some(
              (r) =>
                r.fuente === 'memberProfiles' &&
                r.equipo === t.name &&
                normalizeDiacritics(r.nombre) === haystack,
            )
          )
            continue

          results.push({
            nombre: displayName,
            email: (m as any).userPrincipal ?? null,
            rol: (m as any).role ?? null,
            equipo: t.name,
            fuente: 'teams.members',
            id: (m as any).id ?? (m as any).userPrincipal ?? displayName,
            teamId: t.id,
          })
        }
      }
    } catch {
      /* tabla no disponible */
    }

    if (results.length === 0) {
      return `No se encontraron personas que coincidan con "${query}". Probá con otra variante del nombre.`
    }

    const limited = results.slice(0, limit)
    const lines = limited.map((r, i) => {
      let line = `${i + 1}. **${r.nombre}**`
      if (r.email) line += ` · ${r.email}`
      if (r.rol) line += ` · ${r.rol}`
      line += ` · ${r.equipo}`
      line += `  \`[${r.fuente}] id: ${r.id}${r.teamId ? ` team: ${r.teamId}` : ''}\``
      return line
    })

    let out = `Se encontraron ${results.length} coincidencia(s) para "${query}":\n\n${lines.join('\n')}`
    if (results.length > limit) {
      const rest = results.length - limit
      out += `\n\n... y ${rest} resultado(s) más. Usá un término más específico o aumentá limit.`
    }
    out += `\n\n💡 Usá \`consultar_relaciones({ tabla: "users", id: "<id>" })\` para ver todos los datos vinculados de una persona.`
    return out
  },
}

export const sprintsTool: AiToolDefinition = {
  name: 'consultar_sprints',
  description: 'Consulta registros de sprint y métricas por equipo o período',
  parameters: {
    type: 'object',
    properties: {
      teamId: { type: ['string', 'null'], description: 'ID del equipo' },
      year: { type: ['number', 'string'], description: 'Año' },
      quarter: { type: ['number', 'string'], description: 'Trimestre (1-4)' },
      limit: { type: ['number', 'string'], description: 'Máximo de resultados (default 10)' },
    },
  },
  execute: async (params) => {
    const teamId = params.teamId as string | undefined
    const year = params.year as number | undefined
    const quarter = params.quarter as string | undefined
    const limit = (params.limit as number) ?? 10

    let sprints = await db.teamSprints.toArray()
    if (teamId) sprints = sprints.filter((s) => s.teamId === teamId)
    if (year) sprints = sprints.filter((s) => s.year === year)
    if (quarter) sprints = sprints.filter((s) => s.quarter === quarter)

    sprints = sprints.slice(0, limit)

    if (sprints.length === 0) return 'No se encontraron registros de sprint.'

    const teams = await db.teams.toArray()
    const teamMap = new Map(teams.map((t) => [t.id, t.name]))

    const lines = sprints.map((s) => {
      const name = teamMap.get(s.teamId) ?? s.teamId
      const pct = s.plannedSP > 0 ? Math.round((s.completedSP / s.plannedSP) * 100) : 0
      return `- ${name} | Sprint: ${s.sprintName} | Q${s.quarter} ${s.year} | Completado: ${s.completedSP}/${s.plannedSP} SP (${pct}%)`
    })

    return `Registros de sprint encontrados (${sprints.length}):\n\n${lines.join('\n')}`
  },
}
