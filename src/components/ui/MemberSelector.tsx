import { useState, useRef, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { cn } from '@/lib/utils'
import { User, Plus, Check, ChevronDown } from 'lucide-react'

interface MemberOption {
  id: string
  displayName: string
  teamName: string
  role: string
}

interface MemberSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MemberSelector({ value, onChange, placeholder = 'Buscar o escribir nombre...', className }: MemberSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const members = useLiveQuery(() => db.memberProfiles.toArray(), []) ?? []
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? []

  const allOptions: MemberOption[] = useMemo(() => {
    const seen = new Set<string>()
    const opts: MemberOption[] = []
    for (const m of members) {
      seen.add(m.id)
      const teamName = teams.find((t) => t.id === m.teamId)?.name ?? ''
      opts.push({ id: m.id, displayName: m.email.split('@')[0], teamName, role: m.role.replace(/_/g, ' ') })
    }
    for (const t of teams) {
      for (const tm of t.members) {
        if (!seen.has(tm.id)) {
          seen.add(tm.id)
          opts.push({ id: tm.id, displayName: tm.displayName, teamName: t.name, role: tm.role.replace(/_/g, ' ') })
        }
      }
    }
    opts.sort((a, b) => a.displayName.localeCompare(b.displayName))
    return opts
  }, [members, teams])

  const selectedMember = useMemo(
    () => allOptions.find((m) => m.id === value),
    [allOptions, value],
  )

  const isExternal = value !== '' && !selectedMember

  const filtered = useMemo(() => {
    if (!search.trim()) return allOptions.slice(0, 50)
    const q = search.toLowerCase()
    return allOptions.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.teamName.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    ).slice(0, 50)
  }, [allOptions, search])

  const isTypingNewName = search.trim() && !filtered.some((m) => m.displayName.toLowerCase() === search.trim().toLowerCase())

  const handleSelect = (opt: MemberOption) => {
    onChange(opt.id)
    setSearch('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleUseCustomName = () => {
    onChange(search.trim())
    setSearch('')
    setOpen(false)
    inputRef.current?.blur()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightIdx >= 0 && highlightIdx < filtered.length) {
          handleSelect(filtered[highlightIdx])
        } else if (isTypingNewName) {
          handleUseCustomName()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, highlightIdx, isTypingNewName])

  useEffect(() => {
    if (open) setHighlightIdx(0)
  }, [search, open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const inputDisplay = selectedMember
    ? selectedMember.displayName
    : isExternal
      ? value
      : search

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={inputDisplay}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); if (!selectedMember) setSearch('') }}
          onBlur={() => {
            if (search.trim() && !selectedMember && !isExternal) {
              onChange(search.trim())
            }
          }}
          onChange={(e) => {
            setSearch(e.target.value)
            if (selectedMember && e.target.value !== selectedMember.displayName) {
              onChange('')
            }
            if (!open) setOpen(true)
          }}
          className={cn(
            'w-full pl-9 pr-8 py-2 rounded-lg border text-sm bg-transparent transition-colors outline-none',
            isExternal
              ? 'border-warning/50 text-warning focus:ring-2 focus:ring-warning/20'
              : 'border-neutral-30 dark:border-neutral-60 focus:ring-2 focus:ring-primary/20',
            'text-neutral-90 dark:text-white',
          )}
        />
        <ChevronDown
          size={14}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none',
            open ? 'text-primary' : 'text-neutral-50',
          )}
        />
      </div>

      {isExternal && (
        <p className="text-[10px] text-warning mt-0.5 flex items-center gap-1">
          <Plus size={10} />
          Nombre externo (no registrado en miembros)
        </p>
      )}

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-card border border-boundary rounded-xl shadow-xl max-h-60 overflow-y-auto"
        >
          {filtered.length === 0 && !isTypingNewName && (
            <div className="px-3 py-4 text-center text-sm text-neutral-50">
              Sin resultados
            </div>
          )}

          {filtered.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                idx === highlightIdx ? 'bg-primary/10' : 'hover:bg-neutral-10 dark:hover:bg-neutral-70',
                selectedMember?.id === opt.id ? 'bg-primary/5' : '',
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {opt.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                  {opt.displayName}
                  {selectedMember?.id === opt.id && (
                    <Check size={12} className="inline ml-1 text-primary" />
                  )}
                </p>
                <p className="text-xs text-neutral-50 truncate">
                  {opt.role}{opt.teamName ? ` \u00b7 ${opt.teamName}` : ''}
                </p>
              </div>
            </button>
          ))}

          {isTypingNewName && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleUseCustomName() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-t border-boundary hover:bg-warning/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-warning/10 flex items-center justify-center text-xs font-bold text-warning shrink-0">
                <Plus size={14} />
              </div>
              <div>
                <p className="text-sm font-medium text-warning">
                  Usar &ldquo;{search.trim()}&rdquo;
                </p>
                <p className="text-xs text-neutral-50">Persona externa (no registrada)</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
