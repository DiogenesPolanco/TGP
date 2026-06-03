import * as XLSX from 'xlsx'
import { db } from '@/services/db/database'
import type {
  Criticality, ArchitectureType, ApplicationStatus, TechCategory, SupportStatus,
  Severity, VulnSource, VulnStatus, IncidentStatus, RiskCategory, RiskStatus,
  AuditCategory, AuditStatus,
} from '@/types/domain'

/* ─── Column definitions ─── */

interface ColumnDef {
  key: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'date' | 'enum'
  enumValues?: readonly string[]
  default?: unknown
}

type EntityTable =
  | 'applications'
  | 'technologies'
  | 'vulnerabilities'
  | 'incidents'
  | 'risks'
  | 'auditFindings'

interface ImportConfig {
  table: EntityTable
  label: string
  columns: ColumnDef[]
  buildEntity: (row: Record<string, unknown>, id: string) => Record<string, unknown>
  /** Returns field/value pairs that uniquely identify an existing record for upsert */
  matchKey: (row: Record<string, unknown>) => Record<string, unknown>
}

/* ─── Import configuration per entity ─── */

const importConfigs: Record<string, ImportConfig> = {
  applications: {
    table: 'applications',
    label: 'Aplicaciones',
    columns: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'ownerName', label: 'Owner', required: true },
      { key: 'businessUnitId', label: 'Business Unit ID', required: true },
      { key: 'criticality', label: 'Criticidad', required: true, type: 'enum', enumValues: ['low', 'medium', 'high', 'critical'] as const },
      { key: 'architecture', label: 'Arquitectura', type: 'enum', enumValues: ['monolith', 'microservices', 'serverless', 'soa', 'event_driven', 'hybrid'] as const, default: 'monolith' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['active', 'deprecated', 'retired', 'planned'] as const, default: 'active' },
      { key: 'supportEndDate', label: 'Fin Soporte', type: 'date' },
      { key: 'technologies', label: 'Tecnologías (IDs separados por ;)' },
    ],
    buildEntity: (row, id) => ({
      id,
      name: String(row['Nombre'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      ownerId: `imported-${id}`,
      ownerName: String(row['Owner'] ?? ''),
      businessUnitId: String(row['Business Unit ID'] ?? ''),
      criticality: (row['Criticidad'] as Criticality) ?? 'medium',
      architecture: (row['Arquitectura'] as ArchitectureType) ?? 'monolith',
      status: (row['Estado'] as ApplicationStatus) ?? 'active',
      supportEndDate: parseDateCell(row['Fin Soporte']),
      technologies: parseArrayCell(row['Tecnologías (IDs separados por ;)']),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ name: String(row['Nombre'] ?? '') }),
  },

  technologies: {
    table: 'technologies',
    label: 'Tecnologías (Obsolescencia)',
    columns: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'version', label: 'Versión', required: true },
      { key: 'category', label: 'Categoría', required: true, type: 'enum', enumValues: ['framework', 'language', 'database', 'os', 'library', 'runtime', 'message_broker', 'cache', 'web_server', 'cloud_service', 'tool', 'other'] as const },
      { key: 'vendor', label: 'Vendor', required: true },
      { key: 'eolDate', label: 'Fecha EOL', type: 'date' },
      { key: 'supportStatus', label: 'Estado Soporte', required: true, type: 'enum', enumValues: ['active', 'extended', 'eol', 'unknown'] as const },
    ],
    buildEntity: (row, id) => ({
      id,
      name: String(row['Nombre'] ?? ''),
      version: String(row['Versión'] ?? ''),
      category: (row['Categoría'] as TechCategory) ?? 'other',
      vendor: String(row['Vendor'] ?? ''),
      eolDate: parseDateCell(row['Fecha EOL']),
      supportStatus: (row['Estado Soporte'] as SupportStatus) ?? 'active',
      cveList: [],
      metadata: {},
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ name: String(row['Nombre'] ?? ''), version: String(row['Versión'] ?? '') }),
  },

  vulnerabilities: {
    table: 'vulnerabilities',
    label: 'Vulnerabilidades',
    columns: [
      { key: 'applicationId', label: 'App ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'cvssScore', label: 'CVSS', type: 'number', required: true },
      { key: 'severity', label: 'Severidad', required: true, type: 'enum', enumValues: ['critical', 'high', 'medium', 'low', 'info'] as const },
      { key: 'source', label: 'Fuente', type: 'enum', enumValues: ['fluid_attacks', 'sonarqube', 'manual', 'github_advisory'] as const, default: 'manual' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['open', 'in_progress', 'fixed', 'accepted'] as const, default: 'open' },
      { key: 'slaDeadline', label: 'SLA Fecha', type: 'date' },
      { key: 'detectedAt', label: 'Detectado', type: 'date' },
      { key: 'externalId', label: 'ID Externo' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? '') || null,
      externalId: String(row['ID Externo'] ?? ''),
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      cvssScore: Number(row['CVSS']) || 0,
      severity: (row['Severidad'] as Severity) ?? 'medium',
      source: (row['Fuente'] as VulnSource) ?? 'manual',
      status: (row['Estado'] as VulnStatus) ?? 'open',
      slaDeadline: parseDateCell(row['SLA Fecha']) ?? new Date(),
      detectedAt: parseDateCell(row['Detectado']) ?? new Date(),
      fixedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  incidents: {
    table: 'incidents',
    label: 'Incidentes',
    columns: [
      { key: 'applicationId', label: 'App ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'severity', label: 'Severidad', required: true, type: 'enum', enumValues: ['critical', 'high', 'medium', 'low', 'info'] as const },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['detected', 'acknowledged', 'in_progress', 'resolved', 'closed'] as const, default: 'detected' },
      { key: 'detectedAt', label: 'Detectado', type: 'date' },
      { key: 'downtimeMinutes', label: 'Downtime (min)', type: 'number' },
      { key: 'externalId', label: 'ID Externo' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? '') || null,
      externalId: String(row['ID Externo'] ?? ''),
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      severity: (row['Severidad'] as Severity) ?? 'medium',
      status: (row['Estado'] as IncidentStatus) ?? 'detected',
      detectedAt: parseDateCell(row['Detectado']) ?? new Date(),
      respondedAt: null,
      resolvedAt: null,
      downtimeMinutes: parseNumberCell(row['Downtime (min)']),
      rca: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  risks: {
    table: 'risks',
    label: 'Riesgos',
    columns: [
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'applicationId', label: 'App ID' },
      { key: 'businessUnitId', label: 'Business Unit ID', required: true },
      { key: 'category', label: 'Categoría', required: true, type: 'enum', enumValues: ['technical', 'security', 'operational', 'regulatory', 'financial'] as const },
      { key: 'probability', label: 'Probabilidad (1-5)', type: 'number', required: true },
      { key: 'impact', label: 'Impacto (1-5)', type: 'number', required: true },
      { key: 'riskScore', label: 'Score', type: 'number' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['open', 'mitigated', 'accepted', 'closed'] as const, default: 'open' },
    ],
    buildEntity: (row, id) => {
      const probability = Number(row['Probabilidad (1-5)']) || 1
      const impact = Number(row['Impacto (1-5)']) || 1
      return {
        id,
        applicationId: String(row['App ID'] ?? '') || null,
        businessUnitId: String(row['Business Unit ID'] ?? ''),
        title: String(row['Título'] ?? ''),
        description: String(row['Descripción'] ?? ''),
        category: (row['Categoría'] as RiskCategory) ?? 'technical',
        probability,
        impact,
        riskScore: Number(row['Score']) || probability * impact,
        mitigationPlan: null,
        status: (row['Estado'] as RiskStatus) ?? 'open',
        targetDate: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  auditFindings: {
    table: 'auditFindings',
    label: 'Hallazgos de Auditoría',
    columns: [
      { key: 'applicationId', label: 'App ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'severity', label: 'Severidad', required: true, type: 'enum', enumValues: ['critical', 'high', 'medium', 'low', 'info'] as const },
      { key: 'category', label: 'Categoría', required: true, type: 'enum', enumValues: ['security', 'compliance', 'architecture', 'process', 'data_governance', 'access_control', 'business_continuity'] as const },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['open', 'in_progress', 'resolved', 'closed', 'overdue'] as const, default: 'open' },
      { key: 'dueDate', label: 'Fecha Vencimiento', type: 'date' },
      { key: 'auditReference', label: 'Ref. Auditoría' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? '') || null,
      auditReference: String(row['Ref. Auditoría'] ?? ''),
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      severity: (row['Severidad'] as Severity) ?? 'medium',
      category: (row['Categoría'] as AuditCategory) ?? 'compliance',
      status: (row['Estado'] as AuditStatus) ?? 'open',
      dueDate: parseDateCell(row['Fecha Vencimiento']) ?? new Date(),
      evidence: [],
      actionPlan: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },
}

/* ─── Helpers ─── */

function parseDateCell(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(Math.round((value - 25569) * 86400 * 1000)) // Excel serial date
  const str = String(value).trim()
  if (!str) return null
  const parsed = new Date(str)
  return isNaN(parsed.getTime()) ? null : parsed
}

function parseNumberCell(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return isNaN(n) ? null : n
}

function parseArrayCell(value: unknown): string[] {
  if (!value) return []
  return String(value)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function generateId(): string {
  return crypto.randomUUID()
}

/* ─── Parser ─── */

export interface ParsedRow {
  index: number
  data: Record<string, unknown>
  errors: string[]
}

export interface ImportResult {
  entityType: string
  totalRows: number
  successRows: number
  errorRows: number
  errors: { row: number; message: string }[]
}

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => h.trim())
}

export function parseExcel(file: ArrayBuffer, entityType: string): ParsedRow[] {
  const config = importConfigs[entityType]
  if (!config) throw new Error(`Tipo de entidad desconocido: ${entityType}`)

  const workbook = XLSX.read(file, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('El archivo no contiene hojas de cálculo')

  const sheet = workbook.Sheets[sheetName]
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (rawData.length < 2) throw new Error('El archivo debe tener una fila de encabezados y al menos una fila de datos')

  const headers = normalizeHeaders(rawData[0] as string[])
  const rows: ParsedRow[] = []

  // Validate headers match expected columns
  const expectedLabels = config.columns.map((c) => c.label)
  const missingHeaders = expectedLabels.filter((l) => !headers.some((h) => h.includes(l)))
  if (missingHeaders.length > 0) {
    // Allow missing optional columns — only error on required ones
  }

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[]
    if (!row.some((cell) => cell !== '' && cell != null)) continue // skip empty rows

    const data: Record<string, unknown> = {}
    const errors: string[] = []

    for (let j = 0; j < headers.length; j++) {
      data[headers[j]] = row[j] ?? ''
    }

    // Validate required fields
    for (const col of config.columns) {
      const value = data[col.label]
      if (col.required && (value === '' || value == null || value === undefined)) {
        errors.push(`El campo "${col.label}" es requerido`)
      }
      if (value && col.type === 'number' && isNaN(Number(value))) {
        errors.push(`"${col.label}" debe ser un número`)
      }
      if (value && col.type === 'enum' && col.enumValues && !col.enumValues.includes(String(value))) {
        errors.push(`"${col.label}" tiene un valor inválido: "${value}"`)
      }
    }

    rows.push({ index: i + 1, data, errors })
  }

  return rows
}

/* ─── Import execution ─── */

export async function importRows(entityType: string, parsedRows: ParsedRow[]): Promise<ImportResult> {
  const config = importConfigs[entityType]
  if (!config) throw new Error(`Tipo de entidad desconocido: ${entityType}`)

  const result: ImportResult = {
    entityType,
    totalRows: parsedRows.length,
    successRows: 0,
    errorRows: 0,
    errors: [],
  }

  const table = db[config.table] as any

  for (const row of parsedRows) {
    if (row.errors.length > 0) {
      result.errorRows++
      result.errors.push({ row: row.index, message: row.errors.join('; ') })
      continue
    }

    try {
      const matchFields = config.matchKey(row.data)
      const matchKeys = Object.keys(matchFields)
      let existing: any = null

      if (matchKeys.length === 1) {
        existing = await table.where(matchKeys[0]).equals(matchFields[matchKeys[0]]).first()
      } else {
        const all = await table.toArray()
        existing = all.find((item: any) =>
          matchKeys.every((k) => item[k] === matchFields[k]),
        )
      }

      const entity = config.buildEntity(row.data, existing?.id ?? generateId()) as any

      if (existing) {
        entity.createdAt = existing.createdAt
        entity.id = existing.id
        await table.put(entity)
        result.successRows++
      } else {
        await table.add(entity)
        result.successRows++
      }
    } catch (err) {
      result.errorRows++
      result.errors.push({ row: row.index, message: String(err) })
    }
  }

  return result
}

/* ─── Public API ─── */

export function getImportableEntities(): { id: string; label: string; columns: ColumnDef[] }[] {
  return Object.entries(importConfigs).map(([id, config]) => ({
    id,
    label: config.label,
    columns: config.columns,
  }))
}

export function getImportConfig(entityType: string): ImportConfig | undefined {
  return importConfigs[entityType]
}
