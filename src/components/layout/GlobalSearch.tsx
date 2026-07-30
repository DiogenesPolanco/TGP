import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import {
  getCategoryMeta,
  performSearch,
  statusLabel,
  severityLabel,
  priorityLabel,
} from './globalSearchHelpers'
import type { SearchGroup } from './globalSearchHelpers'

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

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
    else {
      setQuery('')
      setGroups([])
      setSelected(0)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setGroups([])
      setSelected(0)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await performSearch(query)
      startTransition(() => {
        setGroups(results)
        setSelected(0)
        setLoading(false)
      })
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = useCallback(
    (item: (typeof flatList)[number]) => {
      onClose()
      startTransition(() => navigate(item.route))
    },
    [navigate, onClose],
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, flatList.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
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
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh]"
      data-search-modal
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[580px] mx-4 overflow-hidden animate-[fadeSlideIn_200ms_ease-out]"
        style={{
          background: 'rgba(18,22,30,0.92)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 px-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Search size={17} className="shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aplicaciones, equipos, vulnerabilidades..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[rgba(255,255,255,0.25)] py-[18px]"
            style={{ fontWeight: 450, letterSpacing: '-0.01em' }}
          />
          {loading && (
            <div
              className="w-4 h-4 rounded-full shrink-0 animate-spin"
              style={{
                border: '2px solid rgba(255,255,255,0.08)',
                borderTopColor: 'rgba(255,255,255,0.6)',
              }}
            />
          )}
          {!loading && !query.trim() && (
            <kbd
              className="hidden md:inline-flex items-center justify-center text-[10px] font-mono shrink-0"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.25)',
                minWidth: 22,
                height: 20,
                borderRadius: 4,
                padding: '0 6px',
              }}
            >
              ESC
            </kbd>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {totalResults > 0 && (
            <div className="px-3 pt-2 pb-1">
              {groups.map((group) => {
                const meta = getCategoryMeta(group.category)
                return (
                  <div key={group.category} className="mb-1">
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: meta.color }}
                      />
                      <span
                        className="text-[11px] font-medium uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    {/* Results */}
                    <div className="space-y-px">
                      {group.results.map((result, ri) => {
                        const globalIdx = flatList.indexOf(result)
                        const isSelected = globalIdx === selected
                        return (
                          <button
                            key={`${group.category}-${result.id}-${ri}`}
                            data-idx={globalIdx}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100 border-none cursor-pointer"
                            style={{
                              borderRadius: 8,
                              background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                background: isSelected ? meta.color : 'rgba(255,255,255,0.12)',
                                transition: 'background 0.15s',
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className="text-sm block truncate"
                                style={{
                                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
                                  fontWeight: isSelected ? 500 : 400,
                                }}
                              >
                                {result.label}
                              </span>
                              {result.description && (
                                <span
                                  className="text-[12px] block truncate mt-px"
                                  style={{ color: 'rgba(255,255,255,0.3)' }}
                                >
                                  {result.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {result.badge && (
                                <span
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.4)',
                                  }}
                                >
                                  {statusLabel(result.badge) ||
                                    severityLabel(result.badge) ||
                                    priorityLabel(result.badge) ||
                                    result.badge}
                                </span>
                              )}
                              <ArrowRight
                                size={13}
                                className="shrink-0 transition-all duration-100"
                                style={{
                                  color: isSelected ? 'rgba(255,255,255,0.3)' : 'transparent',
                                  opacity: isSelected ? 1 : 0,
                                }}
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty: has query, no results */}
          {query.trim() && !loading && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Search size={32} style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Sin resultados para "<span style={{ color: 'rgba(255,255,255,0.6)' }}>{query}</span>
                "
              </p>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Probá con otros términos o revisá que los datos estén cargados
              </p>
            </div>
          )}

          {/* Empty: no query */}
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              {/* Command palette icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <Search size={22} style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Búsqueda global
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Aplicaciones, equipos, OKRs, vulnerabilidades y más
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {['application', 'team', 'vulnerability', 'objective'].map((key) => {
                  const meta = getCategoryMeta(key)
                  return (
                    <button
                      key={key}
                      onClick={() => setQuery(meta.label.toLowerCase())}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-none cursor-pointer"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: meta.color }}
                      />
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer hint */}
          {totalResults > 0 && (
            <div
              className="sticky bottom-0 flex items-center justify-center gap-4 px-5 py-2.5 text-[10px] font-medium"
              style={{
                background: 'rgba(18,22,30,0.9)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.15)',
              }}
            >
              <span className="flex items-center gap-1">
                <kbd
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    padding: '0 5px',
                    height: 17,
                    lineHeight: '17px',
                  }}
                >
                  ↑↓
                </kbd>{' '}
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    padding: '0 5px',
                    height: 17,
                    lineHeight: '17px',
                  }}
                >
                  ↵
                </kbd>{' '}
                abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    padding: '0 5px',
                    height: 17,
                    lineHeight: '17px',
                  }}
                >
                  esc
                </kbd>{' '}
                cerrar
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
