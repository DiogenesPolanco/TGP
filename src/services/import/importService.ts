import * as XLSX from 'xlsx-js-style'
import { db } from '@/services/db/database'
import type {
  Criticality, ArchitectureType, ApplicationStatus, TechCategory, SupportStatus,
  Severity, VulnSource, VulnStatus, IncidentStatus, RiskCategory, RiskStatus,
  AuditCategory, AuditStatus, DatabaseType, EnvironmentType,
  DeliverableStatus, UserRole, BusinessUnitStatus,
} from '@/types/domain'
import type {
  TaskStatus, CommitmentStatus, BlockerSeverity, BlockerStatus,
  DependencyRelation, ProjectStatus, ProjectHealth,
} from '@/constants/enums'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const PARSE_TIMEOUT_MS = 30_000 // 30s timeout for ReDoS mitigation

export class ImportFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportFileError'
  }
}

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportParseError'
  }
}

function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof ImportFileError || err instanceof ImportParseError) {
    return err.message
  }
  // Sanitize unknown errors — strip technical details, stack traces, paths
  const msg = String(err)
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return `Error al procesar la fila: ${msg.slice(0, 200)}`
}

function sanitizeRecordValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .slice(0, 5000) // limit length to prevent abuse
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }
  return value
}

function sanitizeRecordKeys(data: Record<string, unknown>): Record<string, unknown> {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (dangerousKeys.includes(key)) continue
    clean[key] = sanitizeRecordValue(value)
  }
  return clean
}

function parseWithTimeout<T>(fn: () => T, timeoutMs: number): T {
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true }, timeoutMs)

  try {
    const result = fn()
    if (timedOut) {
      throw new ImportParseError('El archivo es demasiado complejo o está corrupto (timeout)')
    }
    return result
  } finally {
    clearTimeout(timer)
  }
}

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
  | 'appDatabases'

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

  appDatabases: {
    table: 'appDatabases',
    label: 'Bases de Datos',
    columns: [
      { key: 'applicationId', label: 'App ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'engine', label: 'Motor', required: true },
      { key: 'version', label: 'Versión' },
      { key: 'dbType', label: 'Tipo', required: true, type: 'enum', enumValues: ['relational', 'document', 'key-value', 'graph', 'time-series', 'search', 'cache', 'message_queue', 'vector', 'other'] as const },
      { key: 'environment', label: 'Ambiente', required: true, type: 'enum', enumValues: ['dev', 'qa', 'staging', 'prod', 'dr', 'test', 'uat', 'perf'] as const },
      { key: 'host', label: 'Host / Endpoint' },
      { key: 'port', label: 'Puerto', type: 'number' },
      { key: 'isManaged', label: 'Managed (true/false)' },
      { key: 'technologies', label: 'Tecnologías (IDs separados por ;)' },
      { key: 'microserviceIds', label: 'Microservicios (IDs separados por ;)' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? ''),
      name: String(row['Nombre'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      engine: String(row['Motor'] ?? ''),
      version: String(row['Versión'] ?? ''),
      dbType: (row['Tipo'] as DatabaseType) ?? 'relational',
      environment: (row['Ambiente'] as EnvironmentType) ?? 'dev',
      host: String(row['Host / Endpoint'] ?? '') || null,
      port: parseNumberCell(row['Puerto']),
      isManaged: String(row['Managed (true/false)'] ?? '').toLowerCase() === 'true',
      technologies: parseArrayCell(row['Tecnologías (IDs separados por ;)']),
      microserviceIds: parseArrayCell(row['Microservicios (IDs separados por ;)']),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ name: String(row['Nombre'] ?? ''), applicationId: String(row['App ID'] ?? '') }),
  },

  /* ─── Business Units ─── */
  businessUnits: {
    table: 'businessUnits',
    label: 'Unidades de Negocio',
    columns: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'tenantId', label: 'Tenant ID', required: true },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['active', 'inactive'] as const, default: 'active' },
    ],
    buildEntity: (row, id) => ({
      id,
      tenantId: String(row['Tenant ID'] ?? ''),
      name: String(row['Nombre'] ?? ''),
      status: (row['Estado'] as BusinessUnitStatus) ?? 'active',
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ name: String(row['Nombre'] ?? '') }),
  },

  /* ─── Dependencias entre Apps ─── */
  applicationDependencies: {
    table: 'applicationDependencies',
    label: 'Dependencias de Aplicaciones',
    columns: [
      { key: 'applicationId', label: 'App ID (origen)', required: true },
      { key: 'dependsOnAppId', label: 'App ID (destino)', required: true },
      { key: 'dependencyType', label: 'Tipo Dependencia', type: 'enum', enumValues: ['hard', 'soft', 'data', 'sync', 'async'] as const, default: 'hard' },
      { key: 'criticality', label: 'Criticidad', type: 'enum', enumValues: ['low', 'medium', 'high', 'critical'] as const, default: 'medium' },
      { key: 'description', label: 'Descripción' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID (origen)'] ?? ''),
      dependsOnAppId: String(row['App ID (destino)'] ?? ''),
      dependencyType: (row['Tipo Dependencia'] as DependencyRelation) ?? 'hard',
      criticality: (row['Criticidad'] as Criticality) ?? 'medium',
      description: String(row['Descripción'] ?? ''),
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ applicationId: String(row['App ID (origen)'] ?? ''), dependsOnAppId: String(row['App ID (destino)'] ?? '') }),
  },

  /* ─── Microservicios ─── */
  microservices: {
    table: 'microservices',
    label: 'Microservicios',
    columns: [
      { key: 'applicationId', label: 'App ID', required: true },
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'technologies', label: 'Tecnologías (IDs separados por ;)' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? ''),
      name: String(row['Nombre'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      technologies: parseArrayCell(row['Tecnologías (IDs separados por ;)']),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ name: String(row['Nombre'] ?? ''), applicationId: String(row['App ID'] ?? '') }),
  },

  /* ─── Entregables ─── */
  deliverables: {
    table: 'deliverables',
    label: 'Entregables',
    columns: [
      { key: 'applicationId', label: 'App ID' },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'dueDate', label: 'Fecha Vencimiento', type: 'date' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['pending', 'in_progress', 'completed', 'cancelled'] as const, default: 'pending' },
      { key: 'objectiveId', label: 'Objective ID' },
    ],
    buildEntity: (row, id) => ({
      id,
      applicationId: String(row['App ID'] ?? '') || null,
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      dueDate: parseDateCell(row['Fecha Vencimiento']),
      status: (row['Estado'] as DeliverableStatus) ?? 'pending',
      objectiveId: String(row['Objective ID'] ?? '') || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  /* ─── Usuarios ─── */
  users: {
    table: 'users',
    label: 'Usuarios',
    columns: [
      { key: 'email', label: 'Email', required: true },
      { key: 'displayName', label: 'Nombre', required: true },
      { key: 'role', label: 'Rol', type: 'enum', enumValues: ['admin', 'manager', 'user', 'viewer'] as const, default: 'user' },
      { key: 'businessUnitIds', label: 'Business Unit IDs (separados por ;)' },
      { key: 'isActive', label: 'Activo (true/false)' },
    ],
    buildEntity: (row, id) => ({
      id,
      email: String(row['Email'] ?? ''),
      displayName: String(row['Nombre'] ?? ''),
      role: (row['Rol'] as UserRole) ?? 'user',
      businessUnitIds: parseArrayCell(row['Business Unit IDs (separados por ;)']),
      isActive: String(row['Activo (true/false)'] ?? 'true').toLowerCase() !== 'false',
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ email: String(row['Email'] ?? '') }),
  },

  /* ─── Planes ─── */
  plans: {
    table: 'plans',
    label: 'Planes de Ejecución',
    columns: [
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'teamId', label: 'Team ID' },
      { key: 'businessUnitId', label: 'Business Unit ID' },
      { key: 'objectiveId', label: 'Objective ID' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['planned', 'in_progress', 'completed', 'cancelled'] as const, default: 'planned' },
      { key: 'health', label: 'Health', type: 'enum', enumValues: ['green', 'yellow', 'red'] as const, default: 'green' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
      { key: 'endDate', label: 'Fecha Fin', type: 'date' },
    ],
    buildEntity: (row, id) => ({
      id,
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      teamId: String(row['Team ID'] ?? '') || null,
      businessUnitId: String(row['Business Unit ID'] ?? '') || null,
      objectiveId: String(row['Objective ID'] ?? '') || null,
      status: (row['Estado'] as ProjectStatus) ?? 'planned',
      health: (row['Health'] as ProjectHealth) ?? 'green',
      startDate: parseDateCell(row['Fecha Inicio']) ?? new Date(),
      endDate: parseDateCell(row['Fecha Fin']) ?? new Date(),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  /* ─── Actividades ─── */
  activities: {
    table: 'activities',
    label: 'Actividades',
    columns: [
      { key: 'planId', label: 'Plan ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'assigneeId', label: 'Assignee ID' },
      { key: 'teamId', label: 'Team ID' },
      { key: 'applicationId', label: 'App ID' },
      { key: 'priority', label: 'Prioridad', type: 'enum', enumValues: ['low', 'medium', 'high', 'critical'] as const, default: 'medium' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['pending', 'in_progress', 'completed', 'cancelled'] as const, default: 'pending' },
      { key: 'estimatedHours', label: 'Horas Estimadas', type: 'number' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
      { key: 'dueDate', label: 'Fecha Vencimiento', type: 'date' },
    ],
    buildEntity: (row, id) => ({
      id,
      planId: String(row['Plan ID'] ?? ''),
      parentActivityId: null,
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      assigneeId: String(row['Assignee ID'] ?? '') || null,
      teamId: String(row['Team ID'] ?? '') || null,
      applicationId: String(row['App ID'] ?? '') || null,
      priority: (row['Prioridad'] as Criticality) ?? 'medium',
      status: (row['Estado'] as TaskStatus) ?? 'pending',
      estimatedHours: parseNumberCell(row['Horas Estimadas']),
      actualHours: null,
      plannedPoints: null,
      completedPoints: null,
      startDate: parseDateCell(row['Fecha Inicio']),
      dueDate: parseDateCell(row['Fecha Vencimiento']),
      completedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? ''), planId: String(row['Plan ID'] ?? '') }),
  },

  /* ─── Tareas ─── */
  tasks: {
    table: 'tasks',
    label: 'Tareas',
    columns: [
      { key: 'activityId', label: 'Activity ID' },
      { key: 'planId', label: 'Plan ID' },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'assigneeId', label: 'Assignee ID' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['todo', 'in_progress', 'done', 'blocked'] as const, default: 'todo' },
      { key: 'priority', label: 'Prioridad', type: 'enum', enumValues: ['low', 'medium', 'high', 'critical'] as const, default: 'medium' },
      { key: 'estimatedHours', label: 'Horas Estimadas', type: 'number' },
      { key: 'dueDate', label: 'Fecha Vencimiento', type: 'date' },
      { key: 'dependsOn', label: 'Depende de (IDs separados por ;)' },
    ],
    buildEntity: (row, id) => ({
      id,
      activityId: String(row['Activity ID'] ?? '') || null,
      planId: String(row['Plan ID'] ?? '') || null,
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      assigneeId: String(row['Assignee ID'] ?? '') || null,
      status: (row['Estado'] as TaskStatus) ?? 'todo',
      priority: (row['Prioridad'] as Criticality) ?? 'medium',
      estimatedHours: parseNumberCell(row['Horas Estimadas']),
      dueDate: parseDateCell(row['Fecha Vencimiento']),
      completedAt: null,
      dependsOn: parseArrayCell(row['Depende de (IDs separados por ;)']),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  /* ─── Compromisos ─── */
  commitments: {
    table: 'commitments',
    label: 'Compromisos',
    columns: [
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'ownerId', label: 'Owner ID', required: true },
      { key: 'accountableId', label: 'Accountable ID', required: true },
      { key: 'teamId', label: 'Team ID' },
      { key: 'applicationId', label: 'App ID' },
      { key: 'objectiveId', label: 'Objective ID' },
      { key: 'deliverableId', label: 'Deliverable ID' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['active', 'at_risk', 'fulfilled', 'breached', 'cancelled'] as const, default: 'active' },
      { key: 'commitmentDate', label: 'Fecha Compromiso', type: 'date' },
    ],
    buildEntity: (row, id) => ({
      id,
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      ownerId: String(row['Owner ID'] ?? ''),
      accountableId: String(row['Accountable ID'] ?? ''),
      teamId: String(row['Team ID'] ?? '') || null,
      applicationId: String(row['App ID'] ?? '') || null,
      objectiveId: String(row['Objective ID'] ?? '') || null,
      deliverableId: String(row['Deliverable ID'] ?? '') || null,
      status: (row['Estado'] as CommitmentStatus) ?? 'active',
      commitmentDate: parseDateCell(row['Fecha Compromiso']) ?? new Date(),
      fulfilledAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  /* ─── Bloqueos ─── */
  blockers: {
    table: 'blockers',
    label: 'Bloqueos',
    columns: [
      { key: 'sourceType', label: 'Tipo Origen', required: true, type: 'enum', enumValues: ['task', 'activity', 'plan', 'commitment'] as const },
      { key: 'sourceId', label: 'Source ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'severity', label: 'Severidad', required: true, type: 'enum', enumValues: ['low', 'medium', 'high', 'critical'] as const },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['open', 'in_progress', 'resolved', 'escalated'] as const, default: 'open' },
      { key: 'raisedById', label: 'Raised By ID', required: true },
      { key: 'assigneeId', label: 'Assignee ID' },
    ],
    buildEntity: (row, id) => ({
      id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceType: (row['Tipo Origen'] as any) ?? 'activity',
      sourceId: String(row['Source ID'] ?? ''),
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      severity: (row['Severidad'] as BlockerSeverity) ?? 'medium',
      status: (row['Estado'] as BlockerStatus) ?? 'open',
      raisedById: String(row['Raised By ID'] ?? ''),
      assigneeId: String(row['Assignee ID'] ?? '') || null,
      escalatedAt: null,
      resolvedAt: null,
      resolutionNotes: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? '') }),
  },

  /* ─── Dependencias ─── */
  dependencies: {
    table: 'dependencies',
    label: 'Dependencias',
    columns: [
      { key: 'sourceType', label: 'Tipo Origen', required: true, type: 'enum', enumValues: ['task', 'activity', 'plan', 'commitment'] as const },
      { key: 'sourceId', label: 'Source ID', required: true },
      { key: 'targetType', label: 'Tipo Destino', required: true, type: 'enum', enumValues: ['task', 'activity', 'plan', 'commitment', 'deliverable'] as const },
      { key: 'targetId', label: 'Target ID', required: true },
      { key: 'relationType', label: 'Tipo Relación', type: 'enum', enumValues: ['blocks', 'depends_on', 'related_to', 'duplicates'] as const, default: 'depends_on' },
      { key: 'description', label: 'Descripción' },
      { key: 'status', label: 'Estado', type: 'enum', enumValues: ['active', 'resolved', 'at_risk'] as const, default: 'active' },
    ],
    buildEntity: (row, id) => ({
      id,
      sourceType: String(row['Tipo Origen'] ?? 'task'),
      sourceId: String(row['Source ID'] ?? ''),
      targetType: String(row['Tipo Destino'] ?? 'task'),
      targetId: String(row['Target ID'] ?? ''),
      relationType: ((row['Tipo Relación'] as string) ?? 'depends_on') as DependencyRelation,
      description: String(row['Descripción'] ?? ''),
      status: String(row['Estado'] ?? 'active'),
      expectedResolutionDate: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ sourceId: String(row['Source ID'] ?? ''), targetId: String(row['Target ID'] ?? '') }),
  },

  /* ─── Sprint Records ─── */
  sprintRecords: {
    table: 'sprintRecords',
    label: 'Registros de Sprint',
    columns: [
      { key: 'memberId', label: 'Member ID', required: true },
      { key: 'sprintName', label: 'Sprint', required: true },
      { key: 'quarter', label: 'Quarter', required: true, type: 'enum', enumValues: ['Q1', 'Q2', 'Q3', 'Q4'] as const },
      { key: 'year', label: 'Año', type: 'number', required: true },
      { key: 'storyPointsCompleted', label: 'SP Completados', type: 'number' },
      { key: 'storyPointsNotCompleted', label: 'SP No Completados', type: 'number' },
    ],
    buildEntity: (row, id) => ({
      id,
      memberId: String(row['Member ID'] ?? ''),
      sprintName: String(row['Sprint'] ?? ''),
      quarter: String(row['Quarter'] ?? ''),
      year: Number(row['Año']) || new Date().getFullYear(),
      storyPointsCompleted: parseNumberCell(row['SP Completados']) ?? 0,
      storyPointsNotCompleted: parseNumberCell(row['SP No Completados']) ?? 0,
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ memberId: String(row['Member ID'] ?? ''), sprintName: String(row['Sprint'] ?? '') }),
  },

  /* ─── Logros ─── */
  achievements: {
    table: 'achievements',
    label: 'Logros',
    columns: [
      { key: 'memberId', label: 'Member ID', required: true },
      { key: 'title', label: 'Título', required: true },
      { key: 'description', label: 'Descripción' },
      { key: 'date', label: 'Fecha', type: 'date' },
      { key: 'type', label: 'Tipo', type: 'enum', enumValues: ['logro', 'certificacion', 'reconocimiento', 'ascenso'] as const, default: 'logro' },
    ],
    buildEntity: (row, id) => ({
      id,
      memberId: String(row['Member ID'] ?? ''),
      title: String(row['Título'] ?? ''),
      description: String(row['Descripción'] ?? ''),
      date: parseDateCell(row['Fecha']) ?? new Date(),
      type: String(row['Tipo'] ?? 'logro'),
      linkedToPromotion: false,
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ title: String(row['Título'] ?? ''), memberId: String(row['Member ID'] ?? '') }),
  },

  /* ─── Vacaciones ─── */
  vacationRecords: {
    table: 'vacationRecords',
    label: 'Registros de Vacaciones',
    columns: [
      { key: 'memberId', label: 'Member ID', required: true },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date', required: true },
      { key: 'endDate', label: 'Fecha Fin', type: 'date', required: true },
      { key: 'type', label: 'Tipo', default: 'vacation' },
      { key: 'status', label: 'Estado', default: 'approved' },
    ],
    buildEntity: (row, id) => ({
      id,
      memberId: String(row['Member ID'] ?? ''),
      startDate: parseDateCell(row['Fecha Inicio']) ?? new Date(),
      endDate: parseDateCell(row['Fecha Fin']) ?? new Date(),
      type: String(row['Tipo'] ?? 'vacation'),
      status: String(row['Estado'] ?? 'approved'),
      createdAt: new Date(),
    }),
    matchKey: (row) => ({ memberId: String(row['Member ID'] ?? ''), startDate: parseDateCell(row['Fecha Inicio']) }),
  },

  /* ─── Team Sprints ─── */
  teamSprints: {
    table: 'teamSprints',
    label: 'Sprints de Equipo',
    columns: [
      { key: 'teamId', label: 'Team ID', required: true },
      { key: 'sprintName', label: 'Sprint', required: true },
      { key: 'quarter', label: 'Quarter', required: true, type: 'enum', enumValues: ['Q1', 'Q2', 'Q3', 'Q4'] as const },
      { key: 'year', label: 'Año', type: 'number', required: true },
      { key: 'plannedSP', label: 'SP Planificados', type: 'number' },
      { key: 'completedSP', label: 'SP Completados', type: 'number' },
      { key: 'notCompletedSP', label: 'SP No Completados', type: 'number' },
      { key: 'startDate', label: 'Fecha Inicio', type: 'date' },
      { key: 'endDate', label: 'Fecha Fin', type: 'date' },
    ],
    buildEntity: (row, id) => ({
      id,
      teamId: String(row['Team ID'] ?? ''),
      sprintName: String(row['Sprint'] ?? ''),
      quarter: String(row['Quarter'] ?? ''),
      year: Number(row['Año']) || new Date().getFullYear(),
      plannedSP: parseNumberCell(row['SP Planificados']) ?? 0,
      completedSP: parseNumberCell(row['SP Completados']) ?? 0,
      notCompletedSP: parseNumberCell(row['SP No Completados']) ?? 0,
      startDate: parseDateCell(row['Fecha Inicio']),
      endDate: parseDateCell(row['Fecha Fin']),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    matchKey: (row) => ({ teamId: String(row['Team ID'] ?? ''), sprintName: String(row['Sprint'] ?? '') }),
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
  if (file.byteLength > MAX_FILE_SIZE) {
    throw new ImportFileError(
      `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    )
  }

  const config = importConfigs[entityType]
  if (!config) throw new ImportParseError(`Tipo de entidad desconocido: ${entityType}`)

  const workbook = parseWithTimeout(
    () => XLSX.read(file, { type: 'array', cellDates: true }),
    PARSE_TIMEOUT_MS,
  )
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new ImportParseError('El archivo no contiene hojas de cálculo')

  const sheet = workbook.Sheets[sheetName]
  const rawData: unknown[][] = parseWithTimeout(
    () => XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }),
    PARSE_TIMEOUT_MS,
  )

  if (rawData.length < 2) throw new ImportParseError('El archivo debe tener una fila de encabezados y al menos una fila de datos')

  const headers = normalizeHeaders(rawData[0] as string[])
  const rows: ParsedRow[] = []

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[]
    if (!row.some((cell) => cell !== '' && cell != null)) continue

    let data: Record<string, unknown> = {}
    const errors: string[] = []

    for (let j = 0; j < headers.length; j++) {
      data[headers[j]] = row[j] ?? ''
    }

    // Sanitize parsed data against prototype pollution
    data = sanitizeRecordKeys(data)

    for (const col of config.columns) {
      const value = data[col.label]
      if (col.required && (value === '' || value == null || value === undefined)) {
        errors.push('El campo requerido "' + col.label + '" está vacío')
      }
      if (value && col.type === 'number' && isNaN(Number(value))) {
        errors.push('"' + col.label + '" debe ser un número')
      }
      if (value && col.type === 'enum' && col.enumValues && !col.enumValues.includes(String(value))) {
        errors.push('"' + col.label + '" tiene un valor inválido')
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = db[config.table as keyof typeof db] as any

  for (const row of parsedRows) {
    if (row.errors.length > 0) {
      result.errorRows++
      result.errors.push({ row: row.index, message: row.errors.join('; ') })
      continue
    }

    try {
      const matchFields = config.matchKey(row.data)
      const matchKeys = Object.keys(matchFields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let existing: any = null

      if (matchKeys.length === 1) {
        try {
          existing = await table.where(matchKeys[0]).equals(matchFields[matchKeys[0]]).first()
        } catch {
          // Fallback if the field isn't indexed (e.g. schema not yet migrated)
          const all = await table.toArray()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existing = all.find((item: any) => item[matchKeys[0]] === matchFields[matchKeys[0]])
        }
      } else {
        const all = await table.toArray()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing = all.find((item: any) =>
          matchKeys.every((k) => item[k] === matchFields[k]),
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      result.errors.push({ row: row.index, message: sanitizeErrorMessage(err) })
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
