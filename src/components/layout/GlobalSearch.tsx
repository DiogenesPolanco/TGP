import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getCategoryMeta, performSearch, statusLabel, severityLabel, priorityLabel } from './globalSearchHelpers'
import type { SearchGroup } from './globalSearchHelpers'

interface GlobalSearchProps { open: boolean; onClose: () => void }

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const flatList = useMemo(() => groups.flatMap((g) => g.results), [groups])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    else { setQuery(''); setGroups([]); setSelected(0) }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setGroups([]); setSelected(0); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await performSearch(query)
      startTransition(() => { setGroups(results); setSelected(0); setLoading(false) })
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleSelect = useCallback((item: (typeof flatList)[number]) => {
    onClose()
    startTransition(() => navigate(item.route))
  }, [navigate, onClose])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, flatList.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && flatList[selected]) handleSelect(flatList[selected])
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, flatList, selected, handleSelect, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-search-modal]')) onClose()
    }
    if (open) setTimeout(() => window.addEventListener('click', handleClick), 0)
    return () => window.removeEventListener('click', handleClick)
  }, [open, onClose])

  if (!open) return null

  const totalResults = groups.reduce((acc, g) => acc + g.results.length, 0)

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]" data-search-modal>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-[620px] mx-4 bg-card rounded-2xl border border-boundary shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-3 px-4 border-b border-boundary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscá aplicaciones, equipos, vulnerabilidades, riesgos..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-default placeholder:text-muted py-4 font-medium" />
          {loading && <div className="w-4 h-4 border-2 border-neutral-30 dark:border-neutral-60 border-t-primary rounded-full animate-spin shrink-0" />}
          <kbd className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded border border-boundary text-muted bg-neutral-5 dark:bg-neutral-85 shrink-0">ESC</kbd>
        </div>

        {totalResults > 0 && (
          <div className="px-2.5 pt-2.5 pb-2">
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider px-2 mb-1.5">{totalResults} resultado(s)</p>
          </div>
        )}

        <div ref={listRef} className="overflow-y-auto max-h-[60vh] px-2.5 pb-2.5 space-y-3">
          {groups.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-xs">{group.icon}</span>
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{getCategoryMeta(group.category).label}</span>
              </div>
              <div className="space-y-0.5">
                {group.results.map((result, ri) => {
                  const globalIdx = flatList.indexOf(result)
                  return (
                    <button key={`${group.category}-${result.id}-${ri}`} data-idx={globalIdx}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelected(globalIdx)}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer border-none',
                        globalIdx === selected ? 'bg-neutral-10 dark:bg-neutral-85' : 'hover:bg-neutral-5 dark:hover:bg-neutral-85',
                      )}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-default block truncate">{result.label}</span>
                        {result.description && <span className="text-xs text-muted block truncate mt-0.5">{result.description}</span>}
                      </div>
                      {result.badge && (
                        <span className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 mt-0.5',
                          'bg-neutral-10 dark:bg-neutral-85 text-muted',
                        )}>
                          {statusLabel(result.badge) || severityLabel(result.badge) || priorityLabel(result.badge) || result.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {query.trim() && !loading && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted mb-3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <p className="text-sm font-medium text-default">Sin resultados para "{query}"</p>
              <p className="text-xs text-muted mt-1">Probá con otros términos o revisá que los datos estén cargados.</p>
            </div>
          )}

          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted mb-3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <p className="text-sm font-medium text-default">Búsqueda global</p>
              <p className="text-xs text-muted mt-1">Aplicaciones, equipos, OKRs, vulnerabilidades y más.</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['application', 'team', 'vulnerability', 'objective'].map((key) => {
                  const meta = getCategoryMeta(key)
                  return (
                    <button key={key} onClick={() => setQuery(meta.label.toLowerCase())}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-default bg-neutral-5 dark:bg-neutral-85 hover:bg-neutral-10 dark:hover:bg-neutral-80 transition-colors border-none cursor-pointer">
                      <span>{meta.icon}</span> {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
