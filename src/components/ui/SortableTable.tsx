import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Pagination } from './Pagination'
import { usePagination } from '@/hooks/usePagination'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render: (item: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface SortableTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  pageSize?: number
  emptyMessage?: string
  rowClassName?: (item: T) => string | undefined
}

export function SortableTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  pageSize = 5,
  emptyMessage = 'No se encontraron registros',
  rowClassName,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const { page, setPage, totalPages, paginatedItems, pageSize: currentPageSize, setPageSize } = usePagination(sorted, pageSize)

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
        <div className="p-12 text-center text-sm text-neutral-50">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase ${
                    col.sortable ? 'cursor-pointer select-none hover:text-neutral-90 dark:hover:text-white transition-colors' : ''
                  } ${col.headerClassName ?? ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="shrink-0">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp size={14} className="text-primary" />
                          ) : (
                            <ArrowDown size={14} className="text-primary" />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="text-neutral-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {paginatedItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors group ${rowClassName?.(item) ?? ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm ${col.className ?? ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={data.length}
        pageSize={currentPageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
