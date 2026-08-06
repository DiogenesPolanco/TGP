import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, CalendarDays } from 'lucide-react'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  required?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: string
  max?: string
  name?: string
  onBlur?: () => void
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const MONTHS_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

type PickerMode = 'calendar' | 'month' | 'year'

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const parts = str.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isNaN(d.getTime()) ? null : d
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function DatePicker({
  value,
  onChange,
  label,
  required,
  placeholder = 'Seleccionar fecha',
  className = '',
  disabled,
  min,
  max,
  name,
  onBlur,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PickerMode>('calendar')
  const [viewYear, setViewYear] = useState(() => {
    const d = parseDate(value ?? '') ?? new Date()
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDate(value ?? '') ?? new Date()
    return d.getMonth()
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)

  const selected = parseDate(value ?? '')

  // Click outside / Escape to close
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMode('calendar')
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setMode('calendar')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Sync view to selected value
  useEffect(() => {
    const d = parseDate(value ?? '')
    if (d) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const today = new Date()
  const todayDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() }
  const todayStr = formatDate(todayDate.year, todayDate.month, todayDate.day)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const goPrev = useCallback(() => {
    if (mode === 'calendar') {
      if (viewMonth === 0) {
        setViewYear((y) => y - 1)
        setViewMonth(11)
      } else setViewMonth((m) => m - 1)
    } else if (mode === 'month') {
      setViewYear((y) => y - 1)
    } else if (mode === 'year') {
      setViewYear((y) => y - 12)
    }
  }, [mode, viewMonth])

  const goNext = useCallback(() => {
    if (mode === 'calendar') {
      if (viewMonth === 11) {
        setViewYear((y) => y + 1)
        setViewMonth(0)
      } else setViewMonth((m) => m + 1)
    } else if (mode === 'month') {
      setViewYear((y) => y + 1)
    } else if (mode === 'year') {
      setViewYear((y) => y + 12)
    }
  }, [mode, viewMonth])

  const handleSelect = useCallback(
    (y: number, m: number, d: number) => {
      const str = formatDate(y, m, d)
      onChange?.(str)
      if (hiddenRef.current) {
        hiddenRef.current.value = str
        hiddenRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        hiddenRef.current.dispatchEvent(new Event('change', { bubbles: true }))
      }
      setOpen(false)
      setMode('calendar')
    },
    [onChange],
  )

  const goToToday = useCallback(() => {
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    handleSelect(d.getFullYear(), d.getMonth(), d.getDate())
  }, [handleSelect])

  const clearDate = useCallback(() => {
    onChange?.('')
    setOpen(false)
    setMode('calendar')
  }, [onChange])

  const displayValue = value
    ? (() => {
        const d = parseDate(value)
        if (!d) return value
        return d.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      })()
    : ''

  // Title in header — clickable to switch modes
  const headerTitle =
    mode === 'calendar' ? (
      <button
        type="button"
        onClick={() => setMode('month')}
        className="flex items-center gap-1 px-2 py-1 -mx-2 rounded-lg hover:bg-subtle transition-colors"
      >
        <span className="text-sm font-semibold text-default dark:text-white">
          {MONTHS[viewMonth]}
        </span>
        <span className="text-sm font-medium text-muted">{viewYear}</span>
        <ChevronDown size={12} className="text-muted" />
      </button>
    ) : mode === 'month' ? (
      <button
        type="button"
        onClick={() => setMode('year')}
        className="flex items-center gap-1 px-2 py-1 -mx-2 rounded-lg hover:bg-subtle transition-colors"
      >
        <span className="text-sm font-semibold text-default dark:text-white">{viewYear}</span>
        <ChevronDown size={12} className="text-muted" />
      </button>
    ) : (
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-default dark:text-white">
          {viewYear - 5} – {viewYear + 6}
        </span>
      </div>
    )

  // Build calendar grid
  const totalCells = firstDay + daysInMonth
  const rows = Math.ceil(totalCells / 7)
  const cells: { day: number; disabled: boolean }[] = []

  for (let r = 0; r < rows * 7; r++) {
    const dayNum = r - firstDay + 1
    if (dayNum >= 1 && dayNum <= daysInMonth) {
      const dateStr = formatDate(viewYear, viewMonth, dayNum)
      let cellDisabled = false
      if (min && dateStr < min) cellDisabled = true
      if (max && dateStr > max) cellDisabled = true
      cells.push({ day: dayNum, disabled: cellDisabled })
    } else {
      cells.push({ day: 0, disabled: true })
    }
  }

  const selectedStr = selected
    ? formatDate(selected.getFullYear(), selected.getMonth(), selected.getDate())
    : ''

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input ref={hiddenRef} type="hidden" name={name} value={value ?? ''} readOnly />

      {label && (
        <label className="block text-xs font-medium text-secondary mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onBlur={onBlur}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all duration-150
          ${
            open
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-neutral-30 dark:border-neutral-60 hover:border-neutral-40 dark:hover:border-neutral-50'
          }
          bg-card
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <CalendarDays size={15} className="shrink-0 text-muted" />
        <span
          className={`flex-1 min-w-0 truncate ${displayValue ? 'text-default dark:text-white' : 'text-muted'}`}
        >
          {displayValue || placeholder}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-50 w-[280px] bg-card rounded-xl border border-boundary shadow-xl p-3.5 origin-top-left"
          style={{ animation: 'datepickerFadeIn 0.2s ease-out' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrev}
              className="p-1.5 rounded-lg hover:bg-subtle transition-colors text-muted hover:text-default dark:hover:text-white"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {headerTitle}

            <button
              type="button"
              onClick={goNext}
              className="p-1.5 rounded-lg hover:bg-subtle transition-colors text-muted hover:text-default dark:hover:text-white"
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ── Mode: Month Picker ── */}
          {mode === 'month' && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {MONTHS_SHORT.map((name, i) => {
                const isCurrentMonth = viewYear === todayDate.year && i === todayDate.month
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(i)
                      setMode('calendar')
                    }}
                    className={`text-sm py-2 rounded-lg transition-all ${
                      i === viewMonth
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : isCurrentMonth
                          ? 'text-primary font-semibold hover:bg-primary/10'
                          : 'text-secondary dark:text-neutral-30 hover:bg-subtle'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Mode: Year Picker ── */}
          {mode === 'year' && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map((y) => {
                const isCurrentYear = y === todayDate.year
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y)
                      setMode('month')
                    }}
                    className={`text-sm py-2 rounded-lg transition-all ${
                      y === viewYear
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : isCurrentYear
                          ? 'text-primary font-semibold hover:bg-primary/10'
                          : 'text-secondary dark:text-neutral-30 hover:bg-subtle'
                    }`}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Mode: Calendar ── */}
          {mode === 'calendar' && (
            <>
              <div className="grid grid-cols-7 mb-0.5">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-semibold text-muted tracking-wide py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {cells.map((cell, i) => {
                  if (cell.day === 0) return <div key={i} />
                  const dateStr = formatDate(viewYear, viewMonth, cell.day)
                  const isSelected = dateStr === selectedStr
                  const isToday = dateStr === todayStr

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={cell.disabled}
                      onClick={() => handleSelect(viewYear, viewMonth, cell.day)}
                      className={`
                        relative text-sm py-1.5 rounded-lg transition-all duration-100 text-center
                        ${
                          cell.disabled
                            ? 'text-neutral-30 dark:text-neutral-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : isToday
                                ? 'text-primary font-semibold after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary hover:bg-primary/10'
                                : 'text-secondary dark:text-neutral-30 hover:bg-subtle'
                        }
                      `}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-boundary">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
            >
              Hoy
            </button>
            {value && (
              <button
                type="button"
                onClick={clearDate}
                className="text-xs text-muted hover:text-default dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-subtle"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
