import { db } from '@/services/db/database'
import type { AiProviderConfig } from '../types'
import type { AiToolDefinition } from '../types'

// Mapea cada tabla Dexie a su dominio de permiso.
const TABLE_TO_DOMAIN: Record<string, keyof AiProviderConfig['dataPermissions']> = {
  // Catálogo
  applications: 'catalogo',
  technologies: 'catalogo',
  applicationDependencies: 'catalogo',
  microservices: 'catalogo',
  appDatabases: 'catalogo',
  appDatabaseMicroservices: 'catalogo',
  // Seguridad
  vulnerabilities: 'seguridad',
  incidents: 'seguridad',
  vulnerabilityMicroservices: 'seguridad',
  incidentMicroservices: 'seguridad',
  // Gobierno
  risks: 'gobierno',
  auditFindings: 'gobierno',
  riskMicroservices: 'gobierno',
  auditFindingMicroservices: 'gobierno',
  // Estrategia
  objectives: 'estrategia',
  healthIndexHistory: 'estrategia',
  deliverables: 'estrategia',
  // Ejecución
  plans: 'ejecucion',
  activities: 'ejecucion',
  tasks: 'ejecucion',
  commitments: 'ejecucion',
  dependencies: 'ejecucion',
  blockers: 'ejecucion',
  // Personas
  teams: 'personas',
  memberProfiles: 'personas',
  sprintRecords: 'personas',
  oneOnOnes: 'personas',
  achievements: 'personas',
  vacationRecords: 'personas',
  teamSprints: 'personas',
  // Reclutamiento
  candidates: 'reclutamiento',
  candidateTechnologies: 'reclutamiento',
  candidateEvaluations: 'reclutamiento',
  // Equipamiento
  equipment: 'equipamiento',
  equipmentAssignments: 'equipamiento',
  equipmentTickets: 'equipamiento',
}

// Tablas base siempre accesibles (no requieren permiso específico).
const PUBLIC_TABLES = new Set(['tenants', 'businessUnits', 'users'])

const ALL_TABLES = Object.keys(TABLE_TO_DOMAIN)

export function createConsultarDatosTool(
  permissions: AiProviderConfig['dataPermissions'],
): AiToolDefinition {
  // Tablas disponibles según permisos
  const available = ALL_TABLES.filter((t) => {
    const domain = TABLE_TO_DOMAIN[t]
    return domain && permissions[domain]
  })

  if (available.length === 0) {
    // Ningún dominio con tablas genéricas habilitado → tool no funcional
    return {
      name: 'consultar_datos',
      description:
        'No hay dominios habilitados para consulta genérica. Habilitá Catálogo, Seguridad, Gobierno, Reclutamiento o Equipamiento en Ajustes.',
      parameters: {
        type: 'object',
        properties: {
          table: { type: 'string', description: 'Nombre de la tabla' },
        },
        required: ['table'],
      },
      execute: async () => 'No hay permisos de datos habilitados para esta consulta.',
    }
  }

  return {
    name: 'consultar_datos',
    description: `Consulta tablas de la base de datos TGP. Tablas disponibles: ${available.join(', ')}`,
    parameters: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: `Nombre de la tabla a consultar. Opciones: ${available.join(', ')}`,
        },
        where: {
          type: 'object',
          additionalProperties: true,
          description: 'Filtros exactos: { campo: valor }. Ej: { "status": "active" }',
        },
        q: {
          type: 'string',
          description:
            'Búsqueda textual: busca el término en TODOS los campos string (case-insensitive, coincidencia parcial). Ej: "Juan", "crítico", "core"',
        },
        limit: {
          type: 'number',
          description: 'Máximo de resultados (default 20, max 100)',
        },
        orderBy: {
          type: 'string',
          description: 'Campo por el cual ordenar resultados',
        },
        orderDir: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Dirección de orden (default asc)',
        },
      },
      required: ['table'],
    },
    execute: async (rawParams) => {
      const params = rawParams as Record<string, unknown>
      const tableName = params.table as string

      // where puede venir como object (OpenAI, Anthropic) o como string JSON (Groq/Llama)
      const whereRaw = params.where
      let where: Record<string, unknown> | undefined
      if (typeof whereRaw === 'string') {
        try {
          where = JSON.parse(whereRaw)
        } catch {
          /* ignorar where malformado */
        }
      } else if (whereRaw && typeof whereRaw === 'object') {
        where = whereRaw as Record<string, unknown>
      }

      const rawLimit = params.limit
      const orderBy = params.orderBy as string | undefined
      const orderDir = (params.orderDir as string) ?? 'asc'
      const limitNum =
        typeof rawLimit === 'number'
          ? rawLimit
          : typeof rawLimit === 'string'
            ? parseInt(rawLimit, 10)
            : 20
      const limit = Math.min(Math.max(1, isNaN(limitNum) ? 20 : limitNum), 100)

      // Validar tabla
      const domain = TABLE_TO_DOMAIN[tableName]
      const isPublic = PUBLIC_TABLES.has(tableName)
      const isValidTable = domain || isPublic

      if (!isValidTable) {
        const sugerencias = [...PUBLIC_TABLES, ...available].join(', ')
        return `Error: "${tableName}" no es una tabla válida. Tablas disponibles: ${sugerencias}`
      }

      // Validar permiso
      if (!isPublic && domain) {
        if (!permissions[domain]) {
          return `Acceso denegado: "${tableName}" pertenece al dominio "${domain}" que no está habilitado. Activá el permiso en Ajustes del Asistente.`
        }
      }

      try {
        const dexieTable = (db as unknown as Record<string, unknown>)[tableName]
        if (!dexieTable || typeof (dexieTable as Record<string, unknown>).toArray !== 'function') {
          return `Error: Tabla "${tableName}" no encontrada en la base de datos.`
        }

        // Obtener todos los registros y filtrar en JS para evitar
        // errores de índices no disponibles en Dexie.
        let results = await (dexieTable as any).toArray()

        if (where && Object.keys(where).length > 0) {
          const entries = Object.entries(where).filter(([, v]) => v !== null && v !== undefined)
          if (entries.length > 0) {
            results = results.filter((item: Record<string, unknown>) =>
              entries.every(([k, v]) => item[k] === v),
            )
          }
        }

        const searchQ = params.q as string | undefined
        if (searchQ && searchQ.trim()) {
          // Normalizar diacríticos: "é" → "e", "ü" → "u", etc.
          const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const term = normalize(searchQ.trim().toLowerCase())
          results = results.filter((item: Record<string, unknown>) =>
            Object.values(item).some((val) => {
              if (typeof val === 'string') return normalize(val.toLowerCase()).includes(term)
              if (typeof val === 'number') return String(val).includes(term)
              return false
            }),
          )
        }

        // Ordenar
        if (orderBy && results.length > 0 && orderBy in results[0]) {
          results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const va = a[orderBy]
            const vb = b[orderBy]
            if (va == null && vb == null) return 0
            if (va == null) return 1
            if (vb == null) return -1
            if (va < vb) return orderDir === 'desc' ? 1 : -1
            if (va > vb) return orderDir === 'desc' ? -1 : 1
            return 0
          })
        }

        results = results.slice(0, limit)

        if (results.length === 0) {
          return `No se encontraron registros en "${tableName}".`
        }

        // Serializar valor a string plano (Date → ISO, Array → join, Object → JSON)
        function serialize(val: unknown): string {
          if (val === null || val === undefined) return '—'
          if (val instanceof Date) return val.toISOString()
          if (Array.isArray(val)) {
            const items = val.map((v) => serialize(v))
            return items.length > 0 ? `[${items.join(', ')}]` : '[]'
          }
          if (typeof val === 'object') {
            try {
              const str = JSON.stringify(val)
              return str.length > 200 ? str.slice(0, 200) + '…' : str
            } catch {
              return '<objeto>'
            }
          }
          return String(val)
        }

        // Formatear resultados como texto estructurado
        const headers = Object.keys(results[0] as Record<string, unknown>)
        const rows = results.map((r: Record<string, unknown>, i: number) => {
          const fields = headers.map((h) => `${h}: ${serialize(r[h])}`).join(' | ')
          return `${i + 1}. ${fields}`
        })

        return `Resultados en "${tableName}" (${results.length}):\n${rows.join('\n')}`
      } catch (err) {
        return `Error consultando "${tableName}": ${err instanceof Error ? err.message : String(err)}`
      }
    },
  }
}
