import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: (string | SelectOption)[]
  label?: string
  placeholder?: string
  required?: boolean
  searchable?: boolean
  disabled?: boolean
  className?: string
  error?: string
  clearable?: boolean
}

function toOptions(options: (string | SelectOption)[]): SelectOption[] {
  return options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Seleccionar...',
  required = false,
  searchable,
  disabled = false,
  className = '',
  error,
  clearable = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIdx, setHighlightIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const normalized = useMemo(() => toOptions(options), [options])
  const isSearchable = searchable ?? normalized.length > 8

  const selectedLabel = useMemo(
    () => normalized.find((o) => o.value === value)?.label ?? '',
    [normalized, value],
  )

  const filtered = useMemo(() => {
    if (!query) return normalized
    const q = query.toLowerCase()
    return normalized.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [normalized, query])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    setHighlightIdx(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-select]')) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll<HTMLElement>('[data-option]')
    items[highlightIdx]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx, open])

  const select = (optValue: string) => {
    onChange(optValue)
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
        if (filtered[highlightIdx]) select(filtered[highlightIdx].value)
        break
      case 'Escape':
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const borderClass = error
    ? 'border-danger'
    : open
      ? 'border-primary'
      : 'border-neutral-30 dark:border-neutral-60'

  return (
    <div data-select ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
          disabled
            ? 'bg-neutral-10 dark:bg-neutral-70 border-neutral-20 dark:border-neutral-60 cursor-not-allowed'
            : `cursor-pointer ${borderClass} ${
                open ? 'ring-2 ring-primary/20' : ''
              } hover:border-neutral-40 dark:hover:border-neutral-50`
        } bg-transparent`}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev)
        }}
      >
        {value && selectedLabel ? (
          <>
            <span className="flex-1 truncate text-neutral-90 dark:text-white">
              {selectedLabel}
            </span>
            {clearable && !disabled && (
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clear()
                }}
                className="p-0.5 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors shrink-0"
              >
                <X size={14} className="text-neutral-50" />
              </Button>
            )}
          </>
        ) : (
          <span className="flex-1 truncate text-neutral-50">
            {placeholder}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-neutral-50 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 mt-1 bg-card border border-boundary rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {isSearchable && (
            <div className="p-2 border-b border-boundary">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar..."
                className="w-full px-2.5 py-1.5 rounded border border-neutral-20 dark:border-neutral-60 bg-transparent text-sm text-neutral-90 dark:text-white outline-none focus:ring-1 focus:ring-primary/20 placeholder-neutral-50"
                autoFocus
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-50 text-center">
              {query ? 'Sin resultados' : 'No hay opciones disponibles'}
            </p>
          ) : (
            filtered.map((option, idx) => (
              <Button
                key={option.value}
                type="button"
                data-option
                onMouseEnter={() => setHighlightIdx(idx)}
                onClick={() => select(option.value)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                  idx === highlightIdx
                    ? 'bg-primary/10 text-primary'
                    : value === option.value
                      ? 'bg-neutral-10 dark:bg-neutral-70 text-neutral-90 dark:text-white font-medium'
                      : 'text-neutral-90 dark:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Button>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  )
}
