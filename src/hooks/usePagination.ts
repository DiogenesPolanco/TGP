import { useState, useEffect, useMemo, useCallback } from 'react'

export function usePagination<T>(items: T[], initialPageSize = 5) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
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

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }, [])

  return { page, setPage, totalPages, paginatedItems, pageSize, setPageSize: handlePageSizeChange }
}
