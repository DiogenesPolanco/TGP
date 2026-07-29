import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────

function n(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function match(val: unknown, term: string): boolean {
  if (typeof val === 'string') return n(val).includes(term)
  if (typeof val === 'number') return String(val).includes(term)
  return false
}

/** Construye un mapa bidireccional: nombre→ID e ID→nombre de todos los miembros/usuarios */
async function buildMemberIdMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const teams = await db.teams.toArray()
    for (const t of teams) {
      for (const m of t.members ?? []) {
        const id = (m as any).id ?? ''
        const name = (m as any).displayName ?? ''
        if (id && name) {
          map.set(n(name), id)
          map.set(n(id), name)
        }
      }
    }
    const profiles = await db.memberProfiles.toArray()
    for (const p of profiles) {
      if (!map.has(n(p.id))) {
        map.set(n(p.email), p.id)
        map.set(n(p.id), p.email)
      }
    }
  } catch {
    /* tablas no disponibles */
  }
  return map
}

/** Arma un tool de búsqueda sobre una tabla Dexie */
function defineBuscador(
  name: string,
  description: string,
  tableName: string,
  _labelSingular: string,
  labelPlural: string,
  searchFields: string[],
  displayFields: string[],
  extra?: {
    permissionDomain?: string
    augment?: (rows: any[]) => Promise<string[]>
    /** Campos que almacenan IDs de miembros/usuarios (ej: assigneeId, ownerId). Se resuelven automáticamente por nombre. */
    personIdFields?: string[]
  },
): AiToolDefinition {
  return {
    name,
    description,
    parameters: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: `Texto a buscar en ${labelPlural} (no necesita acentos, busca parcial)`,
        },
        limit: { type: 'number', description: 'Máximo de resultados (default 20, max 100)' },
      },
      required: [],
    },
    execute: async (params) => {
      const query = ((params.q as string) ?? '').trim()
      const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)

      const dexieTable = (db as unknown as Record<string, unknown>)[tableName]
      if (!dexieTable || typeof (dexieTable as any).toArray !== 'function') {
        return `Error: tabla "${tableName}" no disponible.`
      }

      let rows = await (dexieTable as any).toArray()

      if (query) {
        const term = n(query)
        const personFields = extra?.personIdFields ?? []

        // Resolver IDs de personas si el query coincide con algún nombre
        let matchingPersonIds: Set<string> | undefined
        if (personFields.length > 0) {
          const memberMap = await buildMemberIdMap()
          matchingPersonIds = new Set<string>()
          for (const [key, val] of memberMap) {
            if (key.includes(term)) matchingPersonIds.add(val)
          }
        }

        rows = rows.filter((r: Record<string, unknown>) => {
          // Buscar en campos de texto
          if (searchFields.some((f) => match(r[f], term))) return true
          // Buscar en campos de ID de persona
          if (matchingPersonIds && matchingPersonIds.size > 0) {
            if (personFields.some((f) => r[f] && matchingPersonIds!.has(r[f] as string)))
              return true
          }
          return false
        })
      }

      if (rows.length === 0) {
        const msg = query
          ? `No se encontraron ${labelPlural} que coincidan con "${query}".`
          : `No hay ${labelPlural} registrados en el sistema.`
        return msg
      }

      rows = rows.slice(0, limit)

      // Resolver nombres de personas para display (cargar una sola vez)
      const memberNameMap = new Map<string, string>()
      const personFields = extra?.personIdFields ?? []
      if (personFields.length > 0) {
        const raw = await buildMemberIdMap()
        // El map es bidireccional: invertir para tener ID→nombre
        for (const [key, val] of raw) {
          if (!memberNameMap.has(val)) memberNameMap.set(val, key)
        }
        // Restaurar mayúsculas del nombre original desde el map sin normalizar
        try {
          const teams = await db.teams.toArray()
          for (const t of teams) {
            for (const m of t.members ?? []) {
              const id = (m as any).id ?? ''
              const name = (m as any).displayName ?? ''
              if (id && name) memberNameMap.set(id, name)
            }
          }
          const profiles = await db.memberProfiles.toArray()
          for (const p of profiles) {
            memberNameMap.set(p.id, p.email)
          }
        } catch {
          /* ok */
        }
      }

      const lines = rows.map((r: Record<string, unknown>, i: number) => {
        const parts = displayFields
          .map((f) => {
            const v = r[f]
            if (v == null) return null
            // Si es un campo de persona y el valor es un ID, resolver a nombre
            if (personFields.includes(f) && memberNameMap.has(v as string)) {
              return memberNameMap.get(v as string)
            }
            const s = typeof v === 'string' ? v : String(v)
            if (f.includes('Id') || f === 'id') return `\`${s.slice(0, 12)}…\``
            return s.length > 60 ? s.slice(0, 60) + '…' : s
          })
          .filter(Boolean)

        let line = `${i + 1}. **${parts[0] ?? '(sin nombre)'}**`
        if (parts.length > 1) line += ` · ${parts.slice(1).join(' · ')}`
        return line
      })

      let out = `Se encontraron ${rows.length} ${labelPlural}:\n\n${lines.join('\n')}`
      out += `\n\n💡 Usá \`consultar_relaciones({ tabla: "${tableName}", id: "<id>" })\` para ver todos los datos vinculados.`
      return out
    },
  }
}

// ─── Definiciones ──────────────────────────────────────────────────

export const buscarAplicacionTool = defineBuscador(
  'buscar_aplicacion',
  'Buscá aplicaciones por nombre, owner, tecnología, criticidad o cualquier campo parcialmente. Ideal para catálogo de aplicaciones.',
  'applications',
  'aplicación',
  'aplicaciones',
  ['name', 'description', 'ownerName', 'technologies', 'criticality', 'status', 'architecture'],
  ['name', 'criticality', 'status', 'ownerName', 'architecture'],
  { personIdFields: ['ownerId'] },
)

export const buscarMicroservicioTool = defineBuscador(
  'buscar_microservicio',
  'Buscá microservicios por nombre, descripción, tecnologías, technical lead o estado.',
  'microservices',
  'microservicio',
  'microservicios',
  ['name', 'description', 'technologies', 'technicalLead', 'lifecycleStatus', 'features'],
  ['name', 'lifecycleStatus', 'serviceLevel', 'technicalLead'],
)

export const buscarTecnologiaTool = defineBuscador(
  'buscar_tecnologia',
  'Buscá tecnologías por nombre, vendor, versión, categoría o estado de soporte.',
  'technologies',
  'tecnología',
  'tecnologías',
  ['name', 'vendor', 'version', 'category', 'supportStatus'],
  ['name', 'version', 'vendor', 'category', 'supportStatus'],
)

export const buscarBDTool = defineBuscador(
  'buscar_bd',
  'Buscá bases de datos por nombre, engine, tipo, entorno o aplicación asociada.',
  'appDatabases',
  'base de datos',
  'bases de datos',
  ['name', 'description', 'engine', 'dbType', 'environment', 'host'],
  ['name', 'engine', 'dbType', 'environment', 'host'],
)

export const buscarVulnerabilidadTool = defineBuscador(
  'buscar_vulnerabilidad',
  'Buscá vulnerabilidades por título, severidad, estado, fuente o descripción.',
  'vulnerabilities',
  'vulnerabilidad',
  'vulnerabilidades',
  ['title', 'description', 'severity', 'status', 'source', 'cvssScore'],
  ['title', 'severity', 'status', 'cvssScore', 'source'],
)

export const buscarIncidenteTool = defineBuscador(
  'buscar_incidente',
  'Buscá incidentes por título, severidad, estado o descripción.',
  'incidents',
  'incidente',
  'incidentes',
  ['title', 'description', 'severity', 'status'],
  ['title', 'severity', 'status'],
)

export const buscarRiesgoTool = defineBuscador(
  'buscar_riesgo',
  'Buscá riesgos por título, categoría, estado, probabilidad o impacto.',
  'risks',
  'riesgo',
  'riesgos',
  ['title', 'description', 'category', 'status', 'probability', 'impact', 'mitigationPlan'],
  ['title', 'category', 'status', 'riskScore'],
)

export const buscarHallazgoTool = defineBuscador(
  'buscar_hallazgo',
  'Buscá hallazgos de auditoría por título, severidad, categoría o estado.',
  'auditFindings',
  'hallazgo',
  'hallazgos',
  ['title', 'description', 'severity', 'category', 'status', 'auditReference'],
  ['title', 'severity', 'category', 'status'],
)

// ─── buscar_equipamiento (custom: resuelve nombres de miembros) ────

export const buscarEquipamientoTool: AiToolDefinition = {
  name: 'buscar_equipamiento',
  description:
    'Buscá equipos (laptops, monitores, etc.) por tipo, marca, modelo, serial, estado, o persona asignada (buscá por nombre de persona aunque assignedTo guarde IDs).',
  parameters: {
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description:
          'Texto a buscar: tipo, marca, modelo, serial, estado, o NOMBRE DE PERSONA asignada',
      },
      limit: { type: 'number', description: 'Máximo de resultados (default 20, max 100)' },
    },
    required: [],
  },
  execute: async (params) => {
    const query = ((params.q as string) ?? '').trim()
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)

    const rows = await db.equipment.toArray()
    let filtered = rows

    if (query) {
      const term = n(query)
      const memberMap = await buildMemberIdMap()

      const matchingIds = new Set<string>()
      for (const [key, val] of memberMap) {
        if (key.includes(term)) matchingIds.add(val)
      }

      filtered = rows.filter((r) => {
        const textFields = [
          r.type,
          r.brand,
          r.model,
          r.serialNumber,
          r.status,
          r.condition,
          r.notes,
        ]
        if (textFields.some((f) => f && n(f).includes(term))) return true
        if (r.assignedTo && matchingIds.has(r.assignedTo)) return true
        return false
      })
    }

    if (filtered.length === 0) {
      return query
        ? `No se encontraron equipos que coincidan con "${query}".`
        : 'No hay equipos registrados en el sistema.'
    }

    const sliced = filtered.slice(0, limit)

    // Construir mapa de display (ID → nombre original con mayúsculas)
    const displayMap = new Map<string, string>()
    try {
      const teams = await db.teams.toArray()
      for (const t of teams) {
        for (const m of t.members ?? []) {
          const id = (m as any).id ?? ''
          const name = (m as any).displayName ?? ''
          if (id && name) displayMap.set(id, name)
        }
      }
      const profiles = await db.memberProfiles.toArray()
      for (const p of profiles) displayMap.set(p.id, p.email)
    } catch {
      /* ok */
    }

    const lines = sliced.map((r, i) => {
      const assignedName = r.assignedTo ? (displayMap.get(r.assignedTo) ?? r.assignedTo) : '—'
      return `${i + 1}. **${r.brand} ${r.model}** · ${r.type} · ${r.status} · ${r.serialNumber}\n   ↳ Asignado a: ${assignedName} · ${r.condition} · ID: \`${r.id.slice(0, 12)}…\``
    })

    let out = `Se encontraron ${filtered.length} equipo(s):\n\n${lines.join('\n\n')}`
    if (filtered.length > limit) {
      out += `\n\n... y ${filtered.length - limit} más. Usá un término más específico.`
    }
    out += `\n\n💡 Usá \`consultar_relaciones({ tabla: "equipment", id: "<id>" })\` para ver asignaciones y tickets.`
    return out
  },
}

export const buscarCandidatoTool = defineBuscador(
  'buscar_candidato',
  'Buscá candidatos por nombre, email, posición o estado de reclutamiento.',
  'candidates',
  'candidato',
  'candidatos',
  ['name', 'email', 'phone', 'position', 'status', 'comments'],
  ['name', 'position', 'status', 'email', 'totalScore'],
)

export const buscarNegocioTool = defineBuscador(
  'buscar_negocio',
  'Buscá unidades de negocio por nombre o descripción.',
  'businessUnits',
  'unidad de negocio',
  'unidades de negocio',
  ['name', 'description'],
  ['name', 'description'],
)
