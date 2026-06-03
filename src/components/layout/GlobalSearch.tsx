import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'
import type {
  Application,
  Technology,
  Vulnerability,
  Incident,
  Risk,
  AuditFinding,
  Team,
  Objective,
  BusinessUnit,
} from '@/types/domain'

/* ─── Types ─── */

interface SearchGroup {
  label: string
  icon: typeof Search
  route: (item: SearchResult) => string
  items: SearchResult[]
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
  entity: unknown
}

type EntityRow =
  | Application
  | Technology
  | Vulnerability
  | Incident
  | Risk
  | AuditFinding
  | Team
  | Objective
  | BusinessUnit

/* ─── Search logic ─── */

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

async function searchEntity<T extends EntityRow>(
  table: { toArray: () => Promise<T[]> },
  fields: (keyof T)[],
  query: string,
  buildResult: (item: T) => SearchResult,
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const flatResults = useMemo(() => {
    const items: { route: string; group: SearchGroup; result: SearchResult }[] = []
    for (const group of groups) {
      for (const item of group.items) {
        items.push({
          route: group.route(item),
          group,
          result: item,
        })
      }
    }
    return items
  }, [groups])

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

  /* ---- Auto-focus ---- */

  useEffect(() => {
    if (open) {
      setQuery('')
      setGroups([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  /* ---- Debounced search ---- */

  useEffect(() => {
    if (!query.trim()) {
      setGroups([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const [applications, technologies, vulnerabilities, incidents, risks, auditFindings, teams, objectives, businessUnits] =
        await Promise.all([
          searchEntity(db.applications, ['name', 'description', 'ownerName'], q, (item) => ({
            id: item.id,
            title: item.name,
            subtitle: item.ownerName,
            entity: item,
          })),
          searchEntity(db.technologies, ['name', 'version', 'vendor'], q, (item) => ({
            id: item.id,
            title: `${item.name} ${item.version}`,
            subtitle: item.vendor,
            entity: item,
          })),
          searchEntity(db.vulnerabilities, ['title', 'externalId'], q, (item) => ({
            id: item.id,
            title: item.title,
            subtitle: `CVSS ${item.cvssScore} · ${item.severity}`,
            entity: item,
          })),
          searchEntity(db.incidents, ['title', 'externalId'], q, (item) => ({
            id: item.id,
            title: item.title,
            subtitle: item.severity,
            entity: item,
          })),
          searchEntity(db.risks, ['title', 'description'], q, (item) => ({
            id: item.id,
            title: item.title,
            subtitle: `Score ${item.riskScore} · ${item.status}`,
            entity: item,
          })),
          searchEntity(db.auditFindings, ['title', 'auditReference'], q, (item) => ({
            id: item.id,
            title: item.title,
            subtitle: `${item.category} · ${item.status}`,
            entity: item,
          })),
          searchEntity(db.teams, ['name'], q, (item) => ({
            id: item.id,
            title: item.name,
            subtitle: `${item.members.length} miembros`,
            entity: item,
          })),
          searchEntity(db.objectives, ['title', 'description'], q, (item) => ({
            id: item.id,
            title: item.title,
            subtitle: `${item.progress}% · ${item.status}`,
            entity: item,
          })),
          searchEntity(db.businessUnits, ['name'], q, (item) => ({
            id: item.id,
            title: item.name,
            subtitle: '',
            entity: item,
          })),
        ])

      const result: SearchGroup[] = []

      if (applications.length > 0)
        result.push({
          label: 'Aplicaciones',
          icon: AppWindow,
          route: () => `/catalog/applications`,
          items: applications,
        })
      if (technologies.length > 0)
        result.push({
          label: 'Tecnologías',
          icon: Cpu,
          route: () => `/catalog/obsolescence`,
          items: technologies,
        })
      if (vulnerabilities.length > 0)
        result.push({
          label: 'Vulnerabilidades',
          icon: Bug,
          route: () => `/security/vulnerabilities`,
          items: vulnerabilities,
        })
      if (incidents.length > 0)
        result.push({
          label: 'Incidentes',
          icon: AlertTriangle,
          route: () => `/security/incidents`,
          items: incidents,
        })
      if (risks.length > 0)
        result.push({
          label: 'Riesgos',
          icon: ShieldAlert,
          route: () => `/governance/risks`,
          items: risks,
        })
      if (auditFindings.length > 0)
        result.push({
          label: 'Hallazgos',
          icon: ClipboardCheck,
          route: () => `/governance/audit`,
          items: auditFindings,
        })
      if (teams.length > 0)
        result.push({
          label: 'Equipos',
          icon: Users,
          route: (item) => `/teams/${item.id}`,
          items: teams,
        })
      if (objectives.length > 0)
        result.push({
          label: 'Objetivos',
          icon: Target,
          route: () => `/strategy/objectives`,
          items: objectives,
        })
      if (businessUnits.length > 0)
        result.push({
          label: 'Unidades de Negocio',
          icon: Building2,
          route: () => `/dashboard`,
          items: businessUnits,
        })

      setGroups(result)
      setSelectedIndex(0)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  /* ---- Flatten for keyboard nav ---- */

  const handleSelect = (route: string) => {
    navigate(route)
    onClose()
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
            placeholder="Buscar aplicaciones, vulnerabilidades, equipos..."
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

        {/* Results */}
        {query.trim() && groups.length === 0 && !loading && (
          <div className="px-5 py-12 text-center text-neutral-50">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sin resultados para <span className="font-medium text-neutral-70 dark:text-neutral-30">"{query}"</span></p>
            <p className="text-xs mt-1">Prueba con otro término</p>
          </div>
        )}

        {groups.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-50 uppercase tracking-wider">
                  <group.icon size={14} />
                  {group.label}
                  <span className="ml-auto text-neutral-40 font-normal normal-case">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((item) => {
                  const idx = flatResults.findIndex(
                    (fr) => fr.result.id === item.id && fr.group.label === group.label,
                  )
                  const isSelected = idx === selectedIndex
                  const route = group.route(item)

                  return (
                    <button
                      key={`${group.label}-${item.id}`}
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

        {/* Empty state */}
        {!query.trim() && (
          <div className="px-5 py-12 text-center text-neutral-50">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Escribe para buscar en todos los datos</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-neutral-40">
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
