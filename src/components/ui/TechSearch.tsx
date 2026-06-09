import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { searchTechnologies, COMMON_SKILLS } from '@/constants/commonSkills'
import { Plus, X, AlertTriangle } from 'lucide-react'

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
}

interface TechSearchProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  showVendor?: boolean
}

export function TechSearch({ selectedIds, onChange, placeholder = 'Buscar tecnología...', showVendor = true }: TechSearchProps) {
  const catalog = useLiveQuery(() => db.technologies.toArray()) ?? []
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const results = searchTechnologies(query, catalog)

  const selected = catalog.filter((t) => selectedIds.includes(t.id))
  const selectedSkills = selectedIds
    .filter((id) => id.startsWith('skill-'))
    .map((id) => COMMON_SKILLS.find((s) => s.id === id))
    .filter(Boolean) as { id: string; name: string; category: string }[]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
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

  const hasEol = selected.some((t) => t.supportStatus === 'eol')

  return (
    <div className="space-y-2">
      {/* Selected badges */}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((t) => (
          <span key={t.id} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${statusColors[t.supportStatus ?? 'unknown']}`}>
            {t.supportStatus === 'eol' && <AlertTriangle size={10} />}
            {t.name}{t.version ? ` ${t.version}` : ''}
            <button type="button" onClick={() => removeItem(t.id)} className="ml-0.5 hover:opacity-70 transition-opacity">
              <X size={12} />
            </button>
          </span>
        ))}
        {selectedSkills.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30">
            {s.name}
            <button type="button" onClick={() => removeItem(s.id)} className="ml-0.5 hover:opacity-70 transition-opacity">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedIds.length > 0 ? `${selectedIds.length + selectedSkills.length} seleccionadas — ${placeholder}` : placeholder}
          value={query}
          onFocus={() => setShowDropdown(true)}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
      </div>

      {/* Dropdown */}
      {showDropdown && (query || results.length > 0) && (
        <div ref={dropdownRef} className="bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-50">
              {query ? `Sin resultados para "${query}"` : 'Escribe para buscar...'}
            </p>
          ) : (
            results.map((r) => {
              const alreadySelected = selectedIds.includes(r.id) || selectedSkills.some((s) => s.id === r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={alreadySelected}
                  onClick={() => !alreadySelected && addItem(r)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-90 dark:text-white truncate">{r.name}</span>
                    {r.isSkill && <span className="text-[10px] text-neutral-50 bg-neutral-10 dark:bg-neutral-75 px-1.5 py-0.5 rounded shrink-0">skill</span>}
                    {!r.isSkill && r.vendor && showVendor && (
                      <span className="text-xs text-neutral-50 shrink-0">({r.vendor})</span>
                    )}
                  </div>
                  <span className="text-[10px] capitalize text-neutral-50 shrink-0 ml-2">{r.category}</span>
                </button>
              )
            })
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
