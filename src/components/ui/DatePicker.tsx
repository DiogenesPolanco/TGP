import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  ref?: React.Ref<HTMLInputElement>
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDate(str: string): Date | null {
  if (!str) return null
  const d = new Date(str + 'T00:00:00')
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
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseDate(value ?? '') ?? new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)

  const selected = parseDate(value ?? '')

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const d = parseDate(value ?? '')
    if (d) {
      setViewMonth({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const { year, month } = viewMonth
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }, [])

  const nextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }, [])

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
    },
    [onChange],
  )

  const goToToday = useCallback(() => {
    const d = new Date()
    setViewMonth({ year: d.getFullYear(), month: d.getMonth() })
    handleSelect(d.getFullYear(), d.getMonth(), d.getDate())
  }, [handleSelect])

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

  const cells: { day: number; disabled: boolean }[] = []
  const totalCells = firstDay + daysInMonth
  const rows = Math.ceil(totalCells / 7)

  for (let r = 0; r < rows * 7; r++) {
    const dayNum = r - firstDay + 1
    if (dayNum >= 1 && dayNum <= daysInMonth) {
      const dateStr = formatDate(year, month, dayNum)
      let cellDisabled = false
      if (min && dateStr < min) cellDisabled = true
      if (max && dateStr > max) cellDisabled = true
      cells.push({ day: dayNum, disabled: cellDisabled })
    } else {
      cells.push({ day: 0, disabled: true })
    }
  }

  const selectedStr = selected ? formatDate(selected.getFullYear(), selected.getMonth(), selected.getDate()) : ''

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        value={value ?? ''}
        readOnly
      />

      {label && (
        <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onBlur={onBlur}
        className={`${className} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        }`}
      >
          <span className={`${displayValue ? '' : 'opacity-60'}`}>
          {displayValue || placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[280px] bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors text-neutral-60 hover:text-neutral-90 dark:hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-neutral-90 dark:text-white">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors text-neutral-60 hover:text-neutral-90 dark:hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-neutral-50 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              if (cell.day === 0) {
                return <div key={i} />
              }

              const dateStr = formatDate(year, month, cell.day)
              const isSelected = dateStr === selectedStr
              const isToday = dateStr === todayStr

              return (
                <button
                  key={i}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => handleSelect(year, month, cell.day)}
                  className={`text-sm py-1.5 rounded-lg transition-colors ${
                    cell.disabled
                      ? 'text-neutral-30 cursor-not-allowed'
                      : isSelected
                        ? 'bg-primary text-white font-semibold'
                        : isToday
                          ? 'bg-primary/10 text-primary font-semibold hover:bg-primary/20'
                          : 'text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70'
                  }`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-20 dark:border-neutral-70">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                onChange?.('')
                setOpen(false)
              }}
              className="text-xs text-neutral-50 hover:text-neutral-70 dark:hover:text-neutral-30 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
