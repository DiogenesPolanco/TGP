import { useState, useEffect, useMemo } from 'react'

export function usePagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      queueMicrotask(() => setPage(totalPages))
    }
  }, [items.length, page, totalPages])

  const paginatedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  )

  return { page, setPage, totalPages, paginatedItems, pageSize }
}
