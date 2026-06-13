import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { cn } from '@/lib/utils'

function statusLabel(status: string): string {
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

function severityLabel(severity: string): string {
  const map: Record<string, string> = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
    info: 'Info',
  }
  return map[severity] ?? severity
}

function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  }
  return map[priority] ?? priority
}
import {
  Search,
  AppWindow,
  Cpu,
  Bug,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  Users,
  Target,
  Building2,
  X,
  FileText,
  CheckSquare,
  Ban,
  Package,
  Box,
  User,
  CalendarDays,
  Stamp,
} from 'lucide-react'

/* ─── Types ─── */

interface SearchGroup {
  key: string
  label: string
  icon: typeof Search
  route: (item: SearchResult) => string
  items: SearchResult[]
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any
}

interface CategoryMeta {
  key: string
  label: string
  icon: typeof Search
  description: string
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'applications', label: 'Aplicaciones', icon: AppWindow, description: 'Aplicaciones del portafolio' },
  { key: 'technologies', label: 'Tecnologías', icon: Cpu, description: 'Tecnologías con tracking EOL' },
  { key: 'vulnerabilities', label: 'Vulnerabilidades', icon: Bug, description: 'Vulnerabilidades con SLA' },
  { key: 'incidents', label: 'Incidentes', icon: AlertTriangle, description: 'Incidentes de seguridad' },
  { key: 'risks', label: 'Riesgos', icon: ShieldAlert, description: 'Riesgos con matriz probabilidad/impacto' },
  { key: 'auditFindings', label: 'Hallazgos', icon: ClipboardCheck, description: 'Hallazgos de auditoría' },
  { key: 'teams', label: 'Equipos', icon: Users, description: 'Equipos con métricas DORA' },
  { key: 'objectives', label: 'Objetivos', icon: Target, description: 'OKRs con Key Results' },
  { key: 'businessUnits', label: 'Unidades de Negocio', icon: Building2, description: 'Unidades organizativas' },
  { key: 'plans', label: 'Planes', icon: FileText, description: 'Planes de ejecución' },
  { key: 'commitments', label: 'Compromisos', icon: Stamp, description: 'Compromisos con tracking' },
  { key: 'activities', label: 'Actividades', icon: CheckSquare, description: 'Actividades de planes' },
  { key: 'tasks', label: 'Tareas', icon: CheckSquare, description: 'Tareas operativas' },
  { key: 'blockers', label: 'Bloqueos', icon: Ban, description: 'Bloqueos con escalamiento' },
  { key: 'deliverables', label: 'Entregables', icon: Package, description: 'Entregables vinculados' },
  { key: 'microservices', label: 'Microservicios', icon: Box, description: 'Microservicios por aplicación' },
  { key: 'members', label: 'Miembros', icon: User, description: 'Perfiles de miembros' },
  { key: 'teamSprints', label: 'Sprints', icon: CalendarDays, description: 'Sprints de equipo' },
]

/* ─── Search helpers ─── */

function score(query: string, text: string): number {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()

  if (lower === q) return 100
  if (lower.startsWith(q)) return 80
  if (lower.includes(q)) return 50

  const words = q.split(/\s+/)
  const matchCount = words.filter((w) => lower.includes(w)).length
  if (matchCount > 0) return 30 * (matchCount / words.length)

  return 0
}

async function searchEntity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: { toArray: () => Promise<any[]> },
  fields: string[],
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildResult: (item: any) => SearchResult,
  minScore = 10,
): Promise<SearchResult[]> {
  const all = await table.toArray()
  const scored: { result: SearchResult; score: number }[] = []

  for (const item of all) {
    let bestScore = 0
    for (const field of fields) {
      const value = item[field]
      if (typeof value === 'string' || typeof value === 'number') {
        const s = score(query, String(value))
        if (s > bestScore) bestScore = s
      }
    }
    if (bestScore >= minScore) {
      scored.push({ result: buildResult(item), score: bestScore })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.result)
}

/* ─── Search registry (maps category key → query config) ─── */

interface SearchConfig {
  table: { toArray: () => Promise<unknown[]> }
  fields: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildResult: (item: any) => SearchResult
}

const SEARCH_REGISTRY: Record<string, SearchConfig> = {
  applications: {
    table: db.applications,
    fields: ['name', 'description', 'ownerName'],
    buildResult: (item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.ownerName,
      entity: item,
    }),
  },
  technologies: {
    table: db.technologies,
    fields: ['name', 'version', 'vendor'],
    buildResult: (item) => ({
      id: item.id,
      title: `${item.name} ${item.version}`,
      subtitle: item.vendor,
      entity: item,
    }),
  },
  vulnerabilities: {
    table: db.vulnerabilities,
    fields: ['title', 'externalId'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `CVSS ${item.cvssScore} · ${severityLabel(item.severity)}`,
      entity: item,
    }),
  },
  incidents: {
    table: db.incidents,
    fields: ['title', 'externalId'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: severityLabel(item.severity),
      entity: item,
    }),
  },
  risks: {
    table: db.risks,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `Score ${item.riskScore} · ${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  auditFindings: {
    table: db.auditFindings,
    fields: ['title', 'auditReference'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${item.category} · ${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  teams: {
    table: db.teams,
    fields: ['name'],
    buildResult: (item) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.members.length} miembros`,
      entity: item,
    }),
  },
  objectives: {
    table: db.objectives,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${item.progress}% · ${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  businessUnits: {
    table: db.businessUnits,
    fields: ['name'],
    buildResult: (item) => ({
      id: item.id,
      title: item.name,
      subtitle: '',
      entity: item,
    }),
  },
  plans: {
    table: db.plans,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${statusLabel(item.status)} · ${item.teamId}`,
      entity: item,
    }),
  },
  activities: {
    table: db.activities,
    fields: ['title'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  tasks: {
    table: db.tasks,
    fields: ['title'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${statusLabel(item.status)} · ${priorityLabel(item.priority)}`,
      entity: item,
    }),
  },
  commitments: {
    table: db.commitments,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  blockers: {
    table: db.blockers,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: `${severityLabel(item.severity)} · ${statusLabel(item.status)}`,
      entity: item,
    }),
  },
  deliverables: {
    table: db.deliverables,
    fields: ['title', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.title,
      subtitle: statusLabel(item.status),
      entity: item,
    }),
  },
  microservices: {
    table: db.microservices,
    fields: ['name', 'description'],
    buildResult: (item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.description ?? '',
      entity: item,
    }),
  },
  members: {
    table: db.memberProfiles,
    fields: ['email', 'role'],
    buildResult: (item) => ({
      id: item.id,
      title: item.email,
      subtitle: `Rol: ${item.role}`,
      entity: item,
    }),
  },
  teamSprints: {
    table: db.teamSprints,
    fields: ['sprintName'],
    buildResult: (item) => ({
      id: item.id,
      title: item.sprintName,
      subtitle: `${item.quarter} ${item.year}`,
      entity: item,
    }),
  },
}

/* ─── Route mapping ─── */

const ROUTE_MAP: Record<string, (item: SearchResult) => string> = {
  applications: (item) => `/catalog/applications/${item.id}`,
  technologies: (item) => `/catalog/obsolescence/${item.id}`,
  vulnerabilities: (item) => `/security/vulnerabilities/${item.id}`,
  incidents: (item) => `/security/incidents/${item.id}`,
  risks: (item) => `/governance/risks/${item.id}`,
  auditFindings: (item) => `/governance/audit/${item.id}`,
  teams: (item) => `/teams/${item.id}`,
  objectives: (item) => `/strategy/objectives/${item.id}`,
  businessUnits: () => `/admin/business-units`,
  plans: (item) => `/execution/plans/${item.id}`,
  commitments: (item) => `/execution/commitments/${item.id}`,
  activities: (item) => `/execution/plans/${item.entity.planId}`,
  tasks: (item) => `/execution/tasks/${item.id}`,
  blockers: (item) => `/execution/blockers/${item.id}/edit`,
  deliverables: (item) => `/catalog/deliverables/${item.id}`,
  microservices: (item) => `/catalog/microservices/${item.id}`,
  members: (item) => `/teams/${item.entity.teamId}/performance/${item.id}`,
  teamSprints: (item) => `/teams/${item.entity.teamId}`,
}

/* ─── Component ─── */

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flatResults = useMemo(() => {
    const items: { route: string; group: SearchGroup; result: SearchResult }[] = []
    for (const group of groups) {
      for (const item of group.items) {
        items.push({ route: group.route(item), group, result: item })
      }
    }
    return items
  }, [groups])

  const runSearch = useCallback(async (q: string, category: string | null) => {
    setLoading(true)
    try {
      const keysToSearch = category
        ? [category]
        : Object.keys(SEARCH_REGISTRY)

      const results = await Promise.all(
        keysToSearch.map(async (key) => {
          const config = SEARCH_REGISTRY[key]
          const items = await searchEntity(config.table, config.fields, q, config.buildResult)
          return { key, items }
        }),
      )

      const resultGroups: SearchGroup[] = []
      for (const { key, items } of results) {
        if (items.length === 0) continue
        const meta = CATEGORIES.find((c) => c.key === key)
        resultGroups.push({
          key,
          label: meta?.label ?? key,
          icon: meta?.icon ?? Search,
          route: ROUTE_MAP[key],
          items,
        })
      }

      setGroups(resultGroups)
      setSelectedIndex(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const result = flatResults[selectedIndex]
        if (result) {
          navigate(result.route)
          onClose()
        }
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selectedIndex, flatResults, navigate, onClose])

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setQuery('')
        setGroups([])
        setSelectedIndex(0)
        setActiveCategory(null)
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      startTransition(() => setGroups([]))
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query.trim(), activeCategory), 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, activeCategory, runSearch])

  const handleSelect = (route: string) => {
    navigate(route)
    onClose()
  }

  const handleCategoryClick = (key: string) => {
    if (activeCategory === key) {
      setActiveCategory(null) // deselect = search all
    } else {
      setActiveCategory(key)
    }
    // Re-run search with new category filter
    if (query.trim()) {
      runSearch(query.trim(), activeCategory === key ? null : key)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-neutral-80 rounded-2xl shadow-2xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-20 dark:border-neutral-70">
          <Search size={20} className="text-neutral-50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en todos los datos..."
            className="flex-1 bg-transparent text-neutral-90 dark:text-white text-lg outline-none placeholder:text-neutral-40"
          />
          {loading && (
            <div className="w-5 h-5 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <X size={18} className="text-neutral-50" />
          </button>
        </div>

        {/* Category chips (when searching) */}
        {query.trim() && groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3 pb-1 border-b border-neutral-10 dark:border-neutral-75">
            <span className="text-xs text-neutral-50 font-medium mr-1">Filtrar:</span>
            <button
              onClick={() => {
                setActiveCategory(null)
                if (query.trim()) runSearch(query.trim(), null)
              }}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full font-medium transition-colors',
                activeCategory === null
                  ? 'bg-primary/15 text-primary-dark dark:text-primary-light'
                  : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 hover:bg-neutral-20 dark:hover:bg-neutral-65',
              )}
            >
              Todas
            </button>
            {CATEGORIES.map((cat) => {
              const hasItems = groups.some((g) => g.key === cat.key)
              if (!hasItems) return null
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat.key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors',
                    activeCategory === cat.key
                      ? 'bg-primary/15 text-primary-dark dark:text-primary-light'
                      : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 hover:bg-neutral-20 dark:hover:bg-neutral-65',
                  )}
                >
                  <cat.icon size={12} />
                  {cat.label}
                </button>
              )
            })}
          </div>
        )}

        {/* No results */}
        {query.trim() && groups.length === 0 && !loading && (
          <div className="px-5 py-12 text-center text-neutral-50">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sin resultados para <span className="font-medium text-neutral-70 dark:text-neutral-30">"{query}"</span></p>
            <p className="text-xs mt-1">Prueba con otro término o selecciona una categoría específica</p>
          </div>
        )}

        {/* Results */}
        {groups.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-50 uppercase tracking-wider">
                  <group.icon size={14} />
                  {group.label}
                  <span className="ml-auto text-neutral-40 font-normal normal-case">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((item) => {
                  const idx = flatResults.findIndex(
                    (fr) => fr.result.id === item.id && fr.group.key === group.key,
                  )
                  const isSelected = idx === selectedIndex
                  const route = group.route(item)

                  return (
                    <button
                      key={`${group.key}-${item.id}`}
                      onClick={() => handleSelect(route)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-neutral-10 dark:hover:bg-neutral-70',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-primary/15 text-primary'
                            : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-50',
                        )}
                      >
                        <group.icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            isSelected
                              ? 'text-primary-dark dark:text-primary-light'
                              : 'text-neutral-90 dark:text-white',
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-neutral-50 truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Empty state — category grid */}
        {!query.trim() && (
          <div className="px-4 py-5">
            <p className="text-xs font-semibold text-neutral-50 uppercase tracking-wider px-1 mb-3">
              Selecciona una categoría para buscar
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key)
                    inputRef.current?.focus()
                  }}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-neutral-10 dark:bg-neutral-75 hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors text-center group"
                >
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-65 flex items-center justify-center text-neutral-60 group-hover:text-primary transition-colors">
                    <cat.icon size={16} />
                  </div>
                  <span className="text-xs font-medium text-neutral-70 dark:text-neutral-30 group-hover:text-neutral-90 dark:group-hover:text-white transition-colors leading-tight">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-neutral-40">
              <span>⌘K  abrir</span>
              <span>↓↑  navegar</span>
              <span>⏎  ir</span>
              <span>Esc  cerrar</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
