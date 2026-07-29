import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { searchTechnologies, COMMON_SKILLS } from '@/constants/commonSkills'
import {
  lookupDepsPackage,
  type DepsPackageResult,
  DEPS_SYSTEMS,
  type DepsSystem,
} from '@/services/security/depsDevService'
import { Plus, X, AlertTriangle, Search, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
}

const statusLabel: Record<string, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

interface TechSearchProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  showVendor?: boolean
  enableDepsSearch?: boolean
}

export function TechSearch({
  selectedIds,
  onChange,
  placeholder = 'Buscar tecnología...',
  showVendor = true,
  enableDepsSearch = false,
}: TechSearchProps) {
  const catalog = useLiveQuery(() => db.technologies.toArray()) ?? []
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const queryRef = useRef('')

  // deps.dev state
  const [depsSystem, setDepsSystem] = useState<DepsSystem>('npm')
  const [depsSearching, setDepsSearching] = useState(false)
  const [depsResult, setDepsResult] = useState<DepsPackageResult | null>(null)
  const [depsError, setDepsError] = useState<string | null>(null)

  const results = searchTechnologies(query, catalog)

  const selected = catalog.filter((t) => selectedIds.includes(t.id))
  const selectedSkills = selectedIds
    .filter((id) => id.startsWith('skill-'))
    .map((id) => COMMON_SKILLS.find((s) => s.id === id))
    .filter(Boolean) as { id: string; name: string; category: string }[]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addItem = (item: { id: string }) => {
    if (!selectedIds.includes(item.id)) {
      onChange([...selectedIds, item.id])
    }
    setQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeItem = (id: string) => {
    onChange(selectedIds.filter((sid) => sid !== id))
  }

  const handleDepsSearch = async () => {
    const searchQuery = query.trim()
    if (!searchQuery || depsSearching) return

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal
    queryRef.current = searchQuery

    setDepsSearching(true)
    setDepsError(null)
    setDepsResult(null)

    // Wikidata search uses its own API
    if (depsSystem === 'wikidata') {
      try {
        const res = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(searchQuery)}&language=en&limit=10&format=json&origin=*`,
          { signal },
        )
        const json = await res.json()
        // Discard if query changed while fetching
        if (queryRef.current !== searchQuery) return
        const results = json.search ?? []
        if (results.length > 0) {
          setDepsResult({
            system: 'wikidata',
            name: results[0].label,
            version: results[0].description ?? '',
            description: results[0].description ?? '',
            license: '',
            advisories: [],
            supportStatus: 'unknown',
            cveList: [],
            advisoryIds: [],
          } as DepsPackageResult)
        } else {
          setDepsError(`No se encontró "${searchQuery}" en Wikidata`)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setDepsError('Error al consultar Wikidata')
      } finally {
        if (queryRef.current === searchQuery) {
          setDepsSearching(false)
        }
      }
      return
    }

    try {
      const result = await lookupDepsPackage(searchQuery, depsSystem)
      // Discard if query changed while fetching
      if (queryRef.current !== searchQuery) return
      if (result) {
        setDepsResult(result)
      } else {
        setDepsError(
          `No se encontró "${searchQuery}" en ${DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.label ?? depsSystem}`,
        )
      }
    } catch {
      if (queryRef.current !== searchQuery) return
      setDepsError('Error al consultar deps.dev')
    } finally {
      if (queryRef.current === searchQuery) {
        setDepsSearching(false)
      }
    }
  }

  const handleDepsSelect = async (result: DepsPackageResult) => {
    // Check if already in catalog by name
    const existing = catalog.find((t) => t.name.toLowerCase() === result.name.toLowerCase())
    if (existing) {
      addItem({ id: existing.id })
      return
    }

    // Create new technology entry
    const id = crypto.randomUUID()
    await db.technologies.add({
      id,
      name: result.name,
      version: result.version,
      category: 'library' as any,
      vendor: DEPS_SYSTEMS.find((s) => s.value === result.system)?.label ?? result.system,
      eolDate: null,
      supportStatus: result.supportStatus,
      cveList: result.cveList,
      metadata: {},
      createdAt: new Date(),
    })
    addItem({ id })
  }

  const hasEol = selected.some((t) => t.supportStatus === 'eol')

  return (
    <div className="space-y-2">
      {/* Selected badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${statusColors[t.supportStatus ?? 'unknown']}`}
            >
              {t.supportStatus === 'eol' && <AlertTriangle size={10} />}
              {t.name}
              {t.version ? ` ${t.version}` : ''}
              <button
                type="button"
                onClick={() => removeItem(t.id)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {selectedSkills.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30"
            >
              {s.name}
              <button
                type="button"
                onClick={() => removeItem(s.id)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              selectedIds.length > 0
                ? `${selectedIds.length + selectedSkills.length} seleccionadas — ${placeholder}`
                : placeholder
            }
            value={query}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
              setDepsResult(null)
              setDepsError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && enableDepsSearch && query.trim() && !depsResult) {
                handleDepsSearch()
              }
            }}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
        </div>
        {enableDepsSearch && (
          <Select
            value={depsSystem}
            onChange={(v) => {
              setDepsSystem(v as DepsSystem)
              setDepsResult(null)
              setDepsError(null)
            }}
            options={DEPS_SYSTEMS.map((s) => ({ value: s.value, label: s.label }))}
            className="w-40 shrink-0"
          />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown &&
        (query || results.length > 0 || depsResult || depsError || depsSearching) && (
          <div
            ref={dropdownRef}
            className="bg-card border border-boundary rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {/* Local catalog results */}
            {results.length > 0 &&
              results.map((r) => {
                const alreadySelected =
                  selectedIds.includes(r.id) || selectedSkills.some((s) => s.id === r.id)
                return (
                  <Button
                    key={r.id}
                    type="button"
                    disabled={alreadySelected}
                    onClick={() => !alreadySelected && addItem(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  >
                    <Plus size={14} className="text-primary shrink-0 mt-0.5 self-start" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-90 dark:text-white truncate font-medium">
                          {r.name}
                        </span>
                        {r.version && !r.isSkill && (
                          <span className="text-xs text-neutral-50 shrink-0">v{r.version}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.isSkill ? (
                          <span className="text-[10px] text-neutral-50 bg-neutral-10 dark:bg-neutral-75 px-1.5 py-0.5 rounded">
                            skill
                          </span>
                        ) : (
                          <>
                            {r.supportStatus && r.supportStatus !== 'unknown' && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColors[r.supportStatus]}`}
                              >
                                {statusLabel[r.supportStatus]}
                              </span>
                            )}
                            {r.vendor && showVendor && (
                              <span className="text-xs text-neutral-50">{r.vendor}</span>
                            )}
                          </>
                        )}
                        <span className="text-[10px] capitalize text-neutral-50">{r.category}</span>
                      </div>
                    </div>
                  </Button>
                )
              })}

            {/* deps.dev section */}
            {enableDepsSearch &&
              (depsSearching ||
                depsResult ||
                depsError ||
                (results.length === 0 && query.trim() && !depsResult)) && (
                <div className={`${results.length > 0 ? 'border-t border-boundary' : ''}`}>
                  {depsSearching ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-50">
                      <Loader2 size={14} className="animate-spin" />
                      Buscando en{' '}
                      {DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.label ?? depsSystem}…
                    </div>
                  ) : depsResult ? (
                    <Button
                      type="button"
                      onClick={() => handleDepsSelect(depsResult)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ExternalLink size={14} className="text-primary shrink-0" />
                        <span className="text-neutral-90 dark:text-white truncate">
                          {depsResult.name}
                        </span>
                        <span className="text-neutral-50 shrink-0">{depsResult.version}</span>
                        <span className="text-xs text-neutral-50 shrink-0">
                          (
                          {DEPS_SYSTEMS.find((s) => s.value === depsResult.system)?.label ??
                            depsResult.system}
                          )
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[depsResult.supportStatus]}`}
                      >
                        {statusLabel[depsResult.supportStatus]}
                      </span>
                    </Button>
                  ) : depsError ? (
                    <div className="px-4 py-3">
                      <p className="text-xs text-danger mb-2">{depsError}</p>
                      <Button
                        type="button"
                        onClick={handleDepsSearch}
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
                      >
                        <Search size={14} />
                        Reintentar
                      </Button>
                    </div>
                  ) : (
                    results.length === 0 &&
                    query.trim() && (
                      <div className="px-4 py-3">
                        <p className="text-sm text-neutral-50 mb-2">
                          No hay resultados locales para "{query}"
                        </p>
                        <Button
                          type="button"
                          onClick={handleDepsSearch}
                          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
                        >
                          <Search size={14} />
                          Buscar en{' '}
                          {DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.label ?? depsSystem}
                        </Button>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>
        )}

      {hasEol && (
        <p className="text-xs text-danger flex items-center gap-1">
          <AlertTriangle size={12} />
          Incluye tecnologías sin soporte (EOL)
        </p>
      )}
    </div>
  )
}
