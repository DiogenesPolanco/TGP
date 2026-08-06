import { db } from '@/services/db/database'

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    open: 'Abierto',
    mitigated: 'Mitigado',
    accepted: 'Aceptado',
    closed: 'Cerrado',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    overdue: 'Vencido',
    fixed: 'Corregido',
    detected: 'Detectado',
    acknowledged: 'Reconocido',
    active: 'Activo',
    cancelled: 'Cancelado',
    completed: 'Completado',
    planned: 'Planificado',
    on_hold: 'En Pausa',
    pending: 'Pendiente',
    todo: 'Por Hacer',
    review: 'En Revisión',
    done: 'Hecho',
    at_risk: 'En Riesgo',
    breached: 'Incumplido',
    fulfilled: 'Cumplido',
    escalated: 'Escalado',
    not_started: 'No Iniciado',
    on_track: 'En Curso',
    behind: 'Atrasado',
    achieved: 'Logrado',
  }
  return map[status] ?? status
}

export function severityLabel(severity: string): string {
  const map: Record<string, string> = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    info: 'Info',
  }
  return map[severity] ?? severity
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    p0: 'P0 - Crítica',
    p1: 'P1 - Alta',
    p2: 'P2 - Media',
    p3: 'P3 - Baja',
    p4: 'P4 - Mínima',
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }
  return map[priority] ?? priority
}

export interface SearchGroup {
  category: string
  icon: string
  results: SearchResult[]
}
export interface SearchResult {
  id: string
  label: string
  description: string
  route: string
  badge?: string
  badgeColor?: string
}

export interface CategoryMeta {
  key: string
  label: string
  icon: string
  color: string
}

const CATEGORIES_DATA: CategoryMeta[] = [
  { key: 'application', label: 'Aplicaciones', icon: '🗂️', color: '#3b82f6' },
  { key: 'microservice', label: 'Microservicios', icon: '⚙️', color: '#8b5cf6' },
  { key: 'technology', label: 'Tecnologías', icon: '💻', color: '#06b6d4' },
  { key: 'vulnerability', label: 'Vulnerabilidades', icon: '🛡️', color: '#ef4444' },
  { key: 'incident', label: 'Incidentes', icon: '🚨', color: '#f97316' },
  { key: 'team', label: 'Equipos', icon: '👥', color: '#14b8a6' },
  { key: 'member', label: 'Miembros', icon: '👤', color: '#22c55e' },
  { key: 'objective', label: 'OKRs', icon: '🎯', color: '#eab308' },
  { key: 'execution_plan', label: 'Planes', icon: '📋', color: '#a855f7' },
  { key: 'activity', label: 'Actividades', icon: '📝', color: '#6366f1' },
  { key: 'commitment', label: 'Compromisos', icon: '🤝', color: '#ec4899' },
  { key: 'dependency', label: 'Dependencias', icon: '🔗', color: '#f43f5e' },
  { key: 'blocker', label: 'Bloqueos', icon: '🚧', color: '#dc2626' },
  { key: 'daily', label: 'Daily', icon: '📅', color: '#0ea5e9' },
  { key: 'sprint', label: 'Sprints', icon: '🏃', color: '#d946ef' },
  { key: 'evaluation', label: 'Evaluaciones', icon: '📊', color: '#10b981' },
  { key: 'candidate', label: 'Candidatos', icon: '👔', color: '#84cc16' },
  { key: 'technology_ref', label: 'Tecnologías (RRHH)', icon: '🔧', color: '#06b6d4' },
  { key: 'equipment', label: 'Equipamiento', icon: '💻', color: '#64748b' },
  { key: 'equipment_ticket', label: 'Tickets', icon: '🎫', color: '#f59e0b' },
  { key: 'audit_finding', label: 'Hallazgos', icon: '🔍', color: '#78716c' },
  { key: 'risk', label: 'Riesgos', icon: '⚠️', color: '#b91c1c' },
]

export function getCategoryMeta(key: string): CategoryMeta {
  return (
    CATEGORIES_DATA.find((c) => c.key === key) ?? { key, label: key, icon: '📄', color: '#6b7280' }
  )
}

function score(query: string, text: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  if (lower === q) return 100
  if (lower.startsWith(q)) return 80
  if (lower.includes(q)) return 50
  const words = q.split(/\s+/)
  const matchCount = words.filter((w) => lower.includes(w)).length
  return matchCount > 0 ? 30 * (matchCount / words.length) : 0
}

async function searchEntity(
  table: any,
  fields: string[],
  query: string,
  category: string,
): Promise<{ result: SearchResult; score: number }[]> {
  const all = await table.toArray()
  const scored: { result: SearchResult; score: number }[] = []
  for (const item of all) {
    let bestScore = 0
    for (const field of fields) {
      const value = item[field]
      if (value) {
        const s = score(query, String(value))
        if (s > bestScore) bestScore = s
      }
    }
    if (bestScore > 0) scored.push({ result: mapToResult(item, category), score: bestScore })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 10)
}

function mapToResult(item: any, category: string): SearchResult {
  const label =
    item.name ??
    item.title ??
    item.displayName ??
    item.fullName ??
    item.label ??
    `${category}#${item.id}`
  const descriptions: Record<string, string[]> = {
    application: [item.description, item.ownerName, item.criticality, item.status].filter(Boolean),
    microservice: [item.description, item.serviceLevel, item.lifecycleStatus].filter(Boolean),
    technology: [item.version, item.category, item.vendor, item.supportStatus].filter(Boolean),
    vulnerability: [item.description, item.severity, item.status, item.externalId].filter(Boolean),
    incident: [item.description, item.severity, item.status].filter(Boolean),
    team: [item.description].filter(Boolean),
    member: [item.email, item.role, item.displayName].filter(Boolean),
    objective: [item.description, item.status, item.type].filter(Boolean),
    execution_plan: [item.description, item.status, item.health].filter(Boolean),
    activity: [item.description, item.status, item.priority].filter(Boolean),
    commitment: [item.description, item.status].filter(Boolean),
    dependency: [item.description, item.status, item.relationType].filter(Boolean),
    blocker: [item.description, item.severity, item.status].filter(Boolean),
    daily: [item.description, item.status].filter(Boolean),
    sprint: [item.sprintName, item.quarter, String(item.year ?? '')].filter(Boolean),
    evaluation: [item.category, String(item.points ?? '')].filter(Boolean),
    candidate: [item.email, item.position, item.status].filter(Boolean),
    technology_ref: [item.name, String(item.points ?? '')].filter(Boolean),
    equipment: [item.name, item.type, item.assignedTo, item.status].filter(Boolean),
    equipment_ticket: [item.description, item.status, item.priority, item.assigneeId].filter(
      Boolean,
    ),
    audit_finding: [item.description, item.severity, item.status, item.category].filter(Boolean),
    risk: [item.description, item.severity, item.status, item.category].filter(Boolean),
  }
  const desc = (descriptions[category] ?? [item.description].filter(Boolean)).join(' · ')
  const badge = item.status ?? item.severity ?? item.priority ?? undefined
  return { id: item.id, label, description: desc, route: '', badge, badgeColor: undefined }
}

export interface SearchConfig {
  table: any
  fields: string[]
  category: string
  route: string
  param?: (item: any) => string
}

export const SEARCH_REGISTRY: Record<string, SearchConfig> = {
  application: {
    table: db.applications,
    fields: ['name', 'description', 'ownerName', 'criticality', 'status'],
    category: 'application',
    route: '/catalog/applications',
  },
  microservice: {
    table: db.microservices,
    fields: ['name', 'description', 'serviceLevel', 'lifecycleStatus'],
    category: 'microservice',
    route: '/catalog/microservices',
  },
  technology: {
    table: db.technologies,
    fields: ['name', 'version', 'category', 'vendor', 'supportStatus'],
    category: 'technology',
    route: '/catalog/obsolescence',
  },
  vulnerability: {
    table: db.vulnerabilities,
    fields: ['title', 'description', 'severity', 'status', 'externalId'],
    category: 'vulnerability',
    route: '/security/vulnerabilities',
  },
  incident: {
    table: db.incidents,
    fields: ['title', 'description', 'severity', 'status'],
    category: 'incident',
    route: '/security/incidents',
  },
  team: { table: db.teams, fields: ['name', 'description'], category: 'team', route: '/teams' },
  member: {
    table: db.users,
    fields: ['displayName', 'email', 'role'],
    category: 'member',
    route: '/teams/members',
  },
  objective: {
    table: db.objectives,
    fields: ['title', 'description', 'status', 'type'],
    category: 'objective',
    route: '/strategy/objectives',
  },
  execution_plan: {
    table: db.plans,
    fields: ['title', 'description', 'status', 'health'],
    category: 'execution_plan',
    route: '/execution/plans',
  },
  activity: {
    table: db.activities,
    fields: ['title', 'description', 'status', 'priority'],
    category: 'activity',
    route: '/execution',
  },
  commitment: {
    table: db.commitments,
    fields: ['title', 'description', 'status'],
    category: 'commitment',
    route: '/execution/commitments',
  },
  dependency: {
    table: db.dependencies,
    fields: ['description', 'status', 'relationType'],
    category: 'dependency',
    route: '/execution/dependencies',
  },
  blocker: {
    table: db.blockers,
    fields: ['title', 'description', 'severity', 'status'],
    category: 'blocker',
    route: '/execution/blockers',
  },
  daily: {
    table: db.activities,
    fields: ['title', 'description', 'status'],
    category: 'daily',
    route: '/execution/dailies',
  },
  sprint: {
    table: db.teamSprints,
    fields: ['sprintName', 'quarter', 'year'],
    category: 'sprint',
    route: '/performance',
  },
  evaluation: {
    table: db.candidateEvaluations,
    fields: ['category', 'points'],
    category: 'evaluation',
    route: '/performance/evaluations',
  },
  candidate: {
    table: db.candidates,
    fields: ['name', 'email', 'position', 'status'],
    category: 'candidate',
    route: '/recruitment/candidates',
  },
  technology_ref: {
    table: db.candidateTechnologies,
    fields: ['name', 'points'],
    category: 'technology_ref',
    route: '/recruitment/technologies',
  },
  equipment: {
    table: db.equipment,
    fields: ['name', 'type', 'assignedTo', 'status'],
    category: 'equipment',
    route: '/equipment',
  },
  equipment_ticket: {
    table: db.equipmentTickets,
    fields: ['description', 'status', 'priority', 'assigneeId'],
    category: 'equipment_ticket',
    route: '/equipment/tickets',
  },
  audit_finding: {
    table: db.auditFindings,
    fields: ['title', 'description', 'severity', 'status', 'category'],
    category: 'audit_finding',
    route: '/security/audit',
  },
  risk: {
    table: db.risks,
    fields: ['title', 'description', 'severity', 'status', 'category'],
    category: 'risk',
    route: '/security/risks',
  },
}

export const ROUTE_MAP: Record<string, (item: SearchResult) => string> = {
  application: (item) => `/catalog/applications/${item.id}`,
  microservice: (item) => `/catalog/microservices/${item.id}`,
  technology: (item) => `/catalog/obsolescence/${item.id}`,
  vulnerability: (item) => `/security/vulnerabilities/${item.id}`,
  incident: (item) => `/security/incidents/${item.id}`,
  team: (item) => `/teams/${item.id}`,
  member: (item) => `/teams/members/${item.id}`,
  objective: (item) => `/strategy/objectives/${item.id}`,
  execution_plan: (item) => `/execution/plans/${item.id}`,
  activity: (item) => `/execution/${item.id}`,
  commitment: (item) => `/execution/commitments/${item.id}`,
  dependency: (item) => `/execution/dependencies/${item.id}`,
  blocker: (item) => `/execution/blockers/${item.id}`,
  daily: (item) => `/execution/dailies/${item.id}`,
  sprint: (item) => `/performance/${item.id}`,
  evaluation: (item) => `/performance/evaluations/${item.id}`,
  candidate: (item) => `/recruitment/candidates/${item.id}`,
  technology_ref: (item) => `/recruitment/technologies/${item.id}`,
  equipment: (item) => `/equipment/${item.id}`,
  equipment_ticket: (item) => `/equipment/tickets/${item.id}`,
  audit_finding: (item) => `/security/audit/${item.id}`,
  risk: (item) => `/security/risks/${item.id}`,
}

export async function performSearch(query: string): Promise<SearchGroup[]> {
  if (!query.trim()) return []
  const resultsMap: Record<string, SearchResult[]> = {}
  const entries = Object.entries(SEARCH_REGISTRY)
  await Promise.all(
    entries.map(async ([key, cfg]) => {
      const scored = await searchEntity(cfg.table, cfg.fields, query, key)
      if (scored.length > 0) {
        resultsMap[key] = scored.slice(0, 5).map((s) => ({
          ...s.result,
          route: ROUTE_MAP[key]?.(s.result) ?? cfg.route,
        }))
      }
    }),
  )
  return Object.entries(resultsMap)
    .map(([key, results]) => {
      const meta = getCategoryMeta(key)
      return { category: meta.key, icon: meta.icon, results }
    })
    .filter((g) => g.results.length > 0)
}
