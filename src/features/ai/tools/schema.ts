import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────

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

function inferType(val: unknown): string {
  if (val === null || val === undefined) return 'any'
  if (val instanceof Date) return 'Date'
  if (Array.isArray(val)) {
    if (val.length === 0) return 'array'
    const elemTypes = [...new Set(val.map((v) => inferType(v)))]
    return `array<${elemTypes.join('|')}>`
  }
  if (typeof val === 'object') return 'object'
  return typeof val
}

// Map of table names → readable label for user-facing messages
const TABLE_LABELS: Record<string, string> = {
  applications: 'Aplicaciones',
  technologies: 'Tecnologías',
  applicationDependencies: 'Dependencias entre aplicaciones',
  microservices: 'Microservicios',
  appDatabases: 'Bases de datos',
  vulnerabilities: 'Vulnerabilidades',
  incidents: 'Incidentes',
  risks: 'Riesgos',
  auditFindings: 'Hallazgos de auditoría',
  objectives: 'Objetivos (OKRs)',
  healthIndexHistory: 'Historial de Health Index',
  deliverables: 'Entregables',
  plans: 'Planes',
  activities: 'Actividades',
  tasks: 'Tareas',
  commitments: 'Compromisos',
  dependencies: 'Dependencias',
  blockers: 'Bloqueos',
  teams: 'Equipos',
  memberProfiles: 'Perfiles de miembros',
  sprintRecords: 'Registros de sprint',
  oneOnOnes: 'One-on-Ones',
  achievements: 'Logros',
  vacationRecords: 'Vacaciones',
  teamSprints: 'Sprints de equipo',
  candidates: 'Candidatos',
  candidateTechnologies: 'Tecnologías de candidatos',
  candidateEvaluations: 'Evaluaciones de candidatos',
  equipment: 'Equipamiento',
  equipmentAssignments: 'Asignaciones de equipo',
  equipmentTickets: 'Tickets de equipo',
  businessUnits: 'Unidades de negocio',
  users: 'Usuarios',
  vulnerabilityMicroservices: 'Vulnerabilidades × Microservicios',
  incidentMicroservices: 'Incidentes × Microservicios',
  auditFindingMicroservices: 'Hallazgos × Microservicios',
  riskMicroservices: 'Riesgos × Microservicios',
  appDatabaseMicroservices: 'BD × Microservicios',
}

// ─── explorar_esquema ─────────────────────────────────────────────

export const explorarEsquemaTool: AiToolDefinition = {
  name: 'explorar_esquema',
  description:
    'Descubrí la estructura completa de cualquier tabla: campos, tipos, y valores de ejemplo. Llamá esto ANTES de consultar_datos si no sabés los campos exactos.',
  parameters: {
    type: 'object',
    properties: {
      tabla: {
        type: 'string',
        description: `Nombre exacto de la tabla. Opciones: ${Object.keys(TABLE_LABELS).join(', ')}`,
      },
    },
    required: ['tabla'],
  },
  execute: async (params) => {
    const tableName = params.tabla as string

    const dexieTable = (db as unknown as Record<string, unknown>)[tableName]
    if (!dexieTable || typeof (dexieTable as Record<string, unknown>).toArray !== 'function') {
      const sugerencias = Object.keys(TABLE_LABELS).join(', ')
      return `Error: "${tableName}" no es una tabla válida. Tablas disponibles: ${sugerencias}`
    }

    try {
      const records = await (dexieTable as any).limit(3).toArray()
      if (records.length === 0) {
        const label = TABLE_LABELS[tableName] ?? tableName
        return `La tabla "${tableName}" (${label}) está vacía. No hay datos para inferir estructura.`
      }

      // Tomar el registro más completo (más campos no-null)
      const sample = records.sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          Object.values(b).filter((v) => v !== null && v !== undefined).length -
          Object.values(a).filter((v) => v !== null && v !== undefined).length,
      )[0]

      const fields = Object.entries(sample as Record<string, unknown>).map(([key, val]) => {
        const type = inferType(val)
        const example = serialize(val)
        return `  - ${key}: ${type}${example !== '—' ? ` (ej: ${example})` : ''}`
      })

      const label = TABLE_LABELS[tableName] ?? tableName
      return (
        `📋 **${label}** (\`${tableName}\`)\n` +
        `Registros disponibles: ${records.length >= 3 ? '3+' : records.length}\n\n` +
        `Campos:\n${fields.join('\n')}\n\n` +
        `Usá \`consultar_datos({ table: "${tableName}", limit: N })\` para consultar datos.`
      )
    } catch (err) {
      return `Error explorando "${tableName}": ${err instanceof Error ? err.message : String(err)}`
    }
  },
}

// ─── Relationship map ─────────────────────────────────────────────

interface Relation {
  table: string
  foreignKey: string
  label: string
  /** When set, use this field on the source entity instead of the provided `id` */
  localKey?: string
  /** If set, also fetch records from this junction table and resolve the target */
  junction?: {
    table: string
    sourceFk: string
    targetFk: string
    targetTable: string
    targetLabel: string
  }
}

const RELATIONS: Record<string, Relation[]> = {
  // ── Catálogo ────────────────────────────────────────────────────
  applications: [
    { table: 'microservices', foreignKey: 'applicationId', label: 'Microservicios' },
    { table: 'vulnerabilities', foreignKey: 'applicationId', label: 'Vulnerabilidades' },
    { table: 'incidents', foreignKey: 'applicationId', label: 'Incidentes' },
    { table: 'risks', foreignKey: 'applicationId', label: 'Riesgos' },
    { table: 'auditFindings', foreignKey: 'applicationId', label: 'Hallazgos de auditoría' },
    { table: 'appDatabases', foreignKey: 'applicationId', label: 'Bases de datos' },
    {
      table: 'applicationDependencies',
      foreignKey: 'applicationId',
      label: 'Dependencias como origen',
    },
    {
      table: 'applicationDependencies',
      foreignKey: 'dependsOnAppId',
      label: 'Dependencias como destino',
    },
    { table: 'deliverables', foreignKey: 'applicationId', label: 'Entregables' },
    { table: 'commitments', foreignKey: 'applicationId', label: 'Compromisos' },
  ],
  microservices: [
    {
      table: 'applications',
      foreignKey: 'id',
      label: 'Aplicación padre',
      localKey: 'applicationId',
    },
    {
      junction: {
        table: 'vulnerabilityMicroservices',
        sourceFk: 'microserviceId',
        targetFk: 'vulnerabilityId',
        targetTable: 'vulnerabilities',
        targetLabel: 'Vulnerabilidades',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
    {
      junction: {
        table: 'incidentMicroservices',
        sourceFk: 'microserviceId',
        targetFk: 'incidentId',
        targetTable: 'incidents',
        targetLabel: 'Incidentes',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
    {
      junction: {
        table: 'auditFindingMicroservices',
        sourceFk: 'microserviceId',
        targetFk: 'auditFindingId',
        targetTable: 'auditFindings',
        targetLabel: 'Hallazgos',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
    {
      junction: {
        table: 'riskMicroservices',
        sourceFk: 'microserviceId',
        targetFk: 'riskId',
        targetTable: 'risks',
        targetLabel: 'Riesgos',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
    {
      junction: {
        table: 'appDatabaseMicroservices',
        sourceFk: 'microserviceId',
        targetFk: 'appDatabaseId',
        targetTable: 'appDatabases',
        targetLabel: 'Bases de datos',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
  ],

  // ── Seguridad (con M:N inversas a microservicios) ──────────────
  vulnerabilities: [
    {
      junction: {
        table: 'vulnerabilityMicroservices',
        sourceFk: 'vulnerabilityId',
        targetFk: 'microserviceId',
        targetTable: 'microservices',
        targetLabel: 'Microservicios afectados',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
  ],
  incidents: [
    {
      junction: {
        table: 'incidentMicroservices',
        sourceFk: 'incidentId',
        targetFk: 'microserviceId',
        targetTable: 'microservices',
        targetLabel: 'Microservicios afectados',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
  ],

  // ── Gobierno (con M:N inversas a microservicios) ───────────────
  risks: [
    {
      junction: {
        table: 'riskMicroservices',
        sourceFk: 'riskId',
        targetFk: 'microserviceId',
        targetTable: 'microservices',
        targetLabel: 'Microservicios asociados',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
  ],
  auditFindings: [
    {
      junction: {
        table: 'auditFindingMicroservices',
        sourceFk: 'auditFindingId',
        targetFk: 'microserviceId',
        targetTable: 'microservices',
        targetLabel: 'Microservicios asociados',
      },
      table: '',
      foreignKey: '',
      label: '',
    },
  ],

  // ── Personas ────────────────────────────────────────────────────
  teams: [
    { table: 'memberProfiles', foreignKey: 'teamId', label: 'Miembros' },
    { table: 'plans', foreignKey: 'teamId', label: 'Planes' },
    { table: 'objectives', foreignKey: 'teamId', label: 'Objetivos' },
    { table: 'commitments', foreignKey: 'teamId', label: 'Compromisos' },
    { table: 'teamSprints', foreignKey: 'teamId', label: 'Sprints' },
  ],
  memberProfiles: [
    { table: 'oneOnOnes', foreignKey: 'memberId', label: 'One-on-Ones' },
    { table: 'achievements', foreignKey: 'memberId', label: 'Logros' },
    { table: 'vacationRecords', foreignKey: 'memberId', label: 'Vacaciones' },
    { table: 'sprintRecords', foreignKey: 'memberId', label: 'Registros de sprint' },
  ],
  users: [
    { table: 'tasks', foreignKey: 'assigneeId', label: 'Tareas asignadas' },
    { table: 'commitments', foreignKey: 'ownerId', label: 'Compromisos como owner' },
    { table: 'commitments', foreignKey: 'accountableId', label: 'Compromisos como accountable' },
    { table: 'blockers', foreignKey: 'raisedById', label: 'Bloqueos reportados' },
    { table: 'blockers', foreignKey: 'assigneeId', label: 'Bloqueos asignados' },
    { table: 'activities', foreignKey: 'assigneeId', label: 'Actividades asignadas' },
    { table: 'oneOnOnes', foreignKey: 'memberId', label: 'One-on-Ones' },
    { table: 'achievements', foreignKey: 'memberId', label: 'Logros' },
    { table: 'vacationRecords', foreignKey: 'memberId', label: 'Vacaciones' },
    { table: 'sprintRecords', foreignKey: 'memberId', label: 'Registros de sprint' },
  ],

  // ── Estrategia ──────────────────────────────────────────────────
  plans: [
    { table: 'activities', foreignKey: 'planId', label: 'Actividades' },
    { table: 'tasks', foreignKey: 'planId', label: 'Tareas' },
  ],
  activities: [{ table: 'tasks', foreignKey: 'activityId', label: 'Tareas' }],

  // ── Unidades de negocio ─────────────────────────────────────────
  businessUnits: [
    { table: 'applications', foreignKey: 'businessUnitId', label: 'Aplicaciones' },
    { table: 'teams', foreignKey: 'businessUnitId', label: 'Equipos' },
    { table: 'objectives', foreignKey: 'businessUnitId', label: 'Objetivos' },
    { table: 'risks', foreignKey: 'businessUnitId', label: 'Riesgos' },
    { table: 'healthIndexHistory', foreignKey: 'businessUnitId', label: 'Health Index' },
    { table: 'plans', foreignKey: 'businessUnitId', label: 'Planes' },
  ],

  // ── Equipamiento ────────────────────────────────────────────────
  equipment: [
    {
      table: 'equipmentAssignments',
      foreignKey: 'equipmentId',
      label: 'Historial de asignaciones',
    },
    { table: 'equipmentTickets', foreignKey: 'equipmentId', label: 'Tickets de soporte' },
  ],
}

// ─── consultar_relaciones ─────────────────────────────────────────

export const consultarRelacionesTool: AiToolDefinition = {
  name: 'consultar_relaciones',
  description:
    'Obtené una entidad completa con TODOS sus datos relacionados en una sola llamada. Soporta: applications (microservicios, vulns, incidents, riesgos, hallazgos, BBDD, dependencias, entregables, compromisos), microservices (aplicación padre + M:N a vulns/incidents/riesgos/hallazgos/BBDD), vulnerabilities/incidents (M:N a microservicios), risks/auditFindings (M:N a microservicios), teams (miembros, planes, objetivos, compromisos, sprints), memberProfiles (1:1, logros, vacaciones, sprints), users (tareas, compromisos, bloqueos, actividades, 1:1, logros, vacaciones, sprints), plans (actividades, tareas), activities (tareas), businessUnits (aplicaciones, equipos, objetivos, riesgos, healthIndex, planes), equipment (asignaciones, tickets).',
  parameters: {
    type: 'object',
    properties: {
      tabla: {
        type: 'string',
        description: `Nombre de la tabla de la entidad principal. Soporta relaciones para: ${Object.keys(RELATIONS).join(', ')}. Para otras tablas, usá consultar_datos.`,
      },
      id: {
        type: 'string',
        description: 'ID de la entidad a consultar (UUID)',
      },
      limit: {
        type: 'number',
        description: 'Máximo de resultados por tabla relacionada (default 20, max 100)',
      },
    },
    required: ['tabla', 'id'],
  },
  execute: async (params) => {
    const tableName = params.tabla as string
    const id = params.id as string
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 20), 100)

    const dexieTable = (db as unknown as Record<string, unknown>)[tableName]
    if (!dexieTable || typeof (dexieTable as Record<string, unknown>).toArray !== 'function') {
      return `Error: "${tableName}" no es una tabla válida.`
    }

    try {
      // Fetch main entity
      const entity = await (dexieTable as any).get(id)
      if (!entity) {
        return `No se encontró un registro en "${tableName}" con ID "${id}".`
      }

      const label = TABLE_LABELS[tableName] ?? tableName
      const entityFields = Object.entries(entity as Record<string, unknown>)
        .map(([key, val]) => `  ${key}: ${serialize(val)}`)
        .join('\n')

      const output: string[] = []
      output.push(`📋 **${label}** (\`${tableName}\`)`)
      output.push(entityFields)
      output.push('')

      // Fetch relations
      const relations = RELATIONS[tableName]
      if (!relations) {
        output.push('No hay relaciones definidas para esta entidad.')
        return output.join('\n')
      }

      for (const rel of relations) {
        // Junction relationship (M:N via bridge table)
        if (rel.junction) {
          const j = rel.junction
          try {
            const jTable = (db as unknown as Record<string, unknown>)[j.table]
            if (!jTable) continue
            const junctions = await (jTable as any).where(j.sourceFk).equals(id).toArray()
            if (junctions.length === 0) continue

            const targetIds = junctions.map((r: Record<string, unknown>) => r[j.targetFk])
            const targetTable = (db as unknown as Record<string, unknown>)[j.targetTable]
            if (!targetTable) continue

            const targetRecords = await (targetTable as any)
              .where('id')
              .anyOf(targetIds.slice(0, limit))
              .toArray()

            if (targetRecords.length > 0) {
              output.push(`🔗 **${j.targetLabel}** (${targetRecords.length}):`)
              for (const rec of targetRecords) {
                const fields = Object.entries(rec as Record<string, unknown>)
                  .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
                  .map(([k, v]) => `${k}: ${v}`)
                  .slice(0, 5)
                  .join(' | ')
                output.push(`  - ${fields}`)
              }
            }
          } catch {
            /* tabla junction no disponible, continuar */
          }
          continue
        }

        // Direct foreign key relationship
        try {
          const relTable = (db as unknown as Record<string, unknown>)[rel.table]
          if (!relTable) continue

          const localKey = (rel as any).localKey
          const fkValue = localKey ? entity[localKey] : id

          if (!fkValue) continue

          const records = await (relTable as any)
            .where(rel.foreignKey)
            .equals(fkValue)
            .limit(limit)
            .toArray()

          if (records.length > 0) {
            output.push(`🔗 **${rel.label}** (${records.length}):`)
            for (const rec of records) {
              const fields = Object.entries(rec as Record<string, unknown>)
                .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
                .map(([k, v]) => `${k}: ${v}`)
                .slice(0, 5)
                .join(' | ')
              output.push(`  - ${fields}`)
            }
          }
        } catch {
          /* tabla relacion no disponible, continuar */
        }
      }

      return output.join('\n')
    } catch (err) {
      return `Error consultando relaciones en "${tableName}": ${err instanceof Error ? err.message : String(err)}`
    }
  },
}
