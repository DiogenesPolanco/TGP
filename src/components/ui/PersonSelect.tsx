import { useState, useMemo, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useUserStore } from '@/stores/userStore'
import { ChevronDown, X, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PersonOption {
  id: string
  label: string
  subtitle: string
  source: 'user' | 'member' | 'current'
}

interface PersonSelectProps {
  value: string
  onChange: (id: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  /** If provided, only show members of this team */
  teamId?: string
}

export function PersonSelect({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar persona...',
  required = false,
  teamId,
}: PersonSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const users = useLiveQuery(() => db.users.toArray()) ?? []
  const currentUser = useUserStore((s) => s.currentUser)

  const selectedPerson = useMemo(() => {
    if (!value) return null
    if (value === '__me__' && currentUser) {
      return { id: '__me__', label: `Yo — ${currentUser.email}`, subtitle: 'Usuario actual' }
    }
    for (const team of teams) {
      const m = team.members.find((m) => m.id === value)
      if (m) return { id: m.id, label: m.displayName, subtitle: team.name }
    }
    const u = users.find((u) => u.id === value)
    if (u) return { id: u.id, label: u.displayName, subtitle: u.email }
    return { id: value, label: value, subtitle: 'Valor actual' }
  }, [value, teams, users, currentUser])

  const allOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: PersonOption[] = []

    if (currentUser && !seen.has('__me__')) {
      seen.add('__me__')
      options.push({ id: '__me__', label: `Yo — ${currentUser.email}`, subtitle: 'Usuario actual', source: 'current' })
    }

    for (const u of users) {
      if (u.isActive === 1 && !seen.has(u.id)) {
        seen.add(u.id)
        options.push({ id: u.id, label: u.displayName, subtitle: u.email, source: 'user' })
      }
    }

    for (const team of teams) {
      if (teamId && team.id !== teamId) continue
      for (const m of team.members) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          options.push({
            id: m.id,
            label: m.displayName,
            subtitle: teamId ? m.role : `${m.role} · ${team.name}`,
            source: 'member',
          })
        }
      }
    }

    return options.sort((a, b) => a.label.localeCompare(b.label))
  }, [teams, users, currentUser, teamId])

  const filtered = useMemo(() => {
    if (!query) return allOptions
    const q = query.toLowerCase()
    return allOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || o.subtitle.toLowerCase().includes(q),
    )
  }, [allOptions, query])

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIdx(0)
  }, [query])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-person-select]')) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Scroll highlight into view
  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll<HTMLElement>('[data-option]')
    items[highlightIdx]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx, open])

  const select = (id: string) => {
    onChange(id)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const clear = () => {
    onChange('')
    setQuery('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIdx((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[highlightIdx]) select(filtered[highlightIdx].id)
        break
      case 'Escape':
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleFocus = () => {
    setOpen(true)
  }

  return (
    <div data-person-select className="relative">
      {label && (
        <label className="block text-sm font-medium text-secondary mb-1.5">
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-text transition-colors ${
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-neutral-30 dark:border-neutral-60'
        } bg-transparent`}
        onClick={() => inputRef.current?.focus()}
      >
        {value && selectedPerson ? (
          <>
            <span className="flex-1 truncate text-neutral-90 dark:text-white">
              {selectedPerson.label}
            </span>
            <span className="text-xs text-neutral-50 truncate max-w-[120px] hidden sm:inline">
              {selectedPerson.subtitle}
            </span>
            <Button
              type="button"
              onClick={(e) => { e.stopPropagation(); clear() }}
              className="p-0.5 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors shrink-0"
            >
              <X size={14} className="text-neutral-50" />
            </Button>
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              required={required}
              className="flex-1 bg-transparent outline-none text-neutral-90 dark:text-white placeholder-neutral-50"
            />
            <ChevronDown
              size={16}
              className={`text-neutral-50 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </div>

      {open && !value && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 mt-1 bg-card border border-boundary rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-50 text-center">
              {query ? 'Sin resultados' : 'No hay personas disponibles'}
            </p>
          ) : (
            filtered.map((option, idx) => (
              <Button
                key={option.id}
                type="button"
                data-option
                onMouseEnter={() => setHighlightIdx(idx)}
                onClick={() => select(option.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  idx === highlightIdx
                    ? 'bg-primary/10 text-primary'
                    : 'text-neutral-90 dark:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-neutral-20 dark:bg-neutral-70 flex items-center justify-center shrink-0">
                  <User size={14} className="text-neutral-50" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{option.label}</p>
                  <p className="text-xs text-neutral-50 truncate">{option.subtitle}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                  option.source === 'user'
                    ? 'bg-info/10 text-info'
                    : option.source === 'current'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-50'
                }`}>
                  {option.source === 'user' ? 'Usuario' : option.source === 'current' ? 'Tú' : 'Miembro'}
                </span>
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
