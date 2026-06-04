import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

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
    <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-80">
      <span className="text-sm text-neutral-60 dark:text-neutral-40">
        Mostrando {startItem}-{endItem} de {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} className="text-neutral-60 dark:text-neutral-40" />
        </button>
        {getVisiblePages().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-white'
                  : 'text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
              }`}
              aria-label={`Página ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-1 text-neutral-40 dark:text-neutral-50 select-none">
              ...
            </span>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} className="text-neutral-60 dark:text-neutral-40" />
        </button>
      </div>
    </div>
  )
}
