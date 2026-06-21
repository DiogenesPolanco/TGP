import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  if (totalItems === 0) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalItems)

  const getVisiblePages = (): (number | string)[] => {
    const delta = 1
    const range: (number | string)[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i)
      } else if (range[range.length - 1] !== '...') {
        range.push('...')
      }
    }
    return range
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-boundary bg-card">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">
          Mostrando {startItem}-{endItem} de {totalItems}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-neutral-50 dark:text-neutral-50" htmlFor="page-size-select">
              Filas:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-xs text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} className="text-muted" />
          </Button>
          {getVisiblePages().map((p, idx) =>
            typeof p === 'number' ? (
              <Button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
                aria-label={`Página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Button>
            ) : (
              <span key={`ellipsis-${idx}`} className="px-1 text-neutral-40 dark:text-neutral-50 select-none">
                ...
              </span>
            ),
          )}
          <Button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} className="text-muted" />
          </Button>
        </div>
      )}
    </div>
  )
}
