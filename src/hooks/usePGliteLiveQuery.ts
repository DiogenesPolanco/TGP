import { useEffect, useState, useCallback, useRef } from 'react'
import type { Results } from '@electric-sql/pglite'
import { getActiveBackend } from '@/services/data-layer'

export interface UsePGliteLiveQueryResult<T> {
  data: T[] | undefined
  error: Error | undefined
  isLoading: boolean
  refresh: () => Promise<void>
}

/**
 * Hook para suscripciones en tiempo real nativas de PGlite.
 * Solo funciona cuando el backend activo es 'pglite'.
 * Usa pg.live.query() con cambios incrementales vía callback.
 *
 * Cuando PGlite no está activo, devuelve isLoading=false y data=undefined.
 */
export function usePGliteLiveQuery<T extends Record<string, unknown>>(
  _tableName: string,
  sql: string,
  params?: any[],
): UsePGliteLiveQueryResult<T> {
  const [data, setData] = useState<T[] | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const unsubscribeRef = useRef<(() => Promise<void>) | null>(null)

  const refresh = useCallback(async () => {
    const backend = getActiveBackend()
    if (!backend || backend.name !== 'pglite') return

    try {
      setIsLoading(true)
      const liveApi = (backend as any).live as { query: Function } | null
      if (!liveApi) {
        setError(new Error('PGlite live API no disponible'))
        return
      }
      const liveQuery = await liveApi.query(sql, params, (results: Results<T>) => {
        setData(results.rows as T[])
        setIsLoading(false)
      })
      setData(liveQuery.initialResults.rows as T[])
      unsubscribeRef.current = liveQuery.unsubscribe.bind(liveQuery)
      setIsLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
      setIsLoading(false)
    }
  }, [sql, params?.join(',')])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (cancelled) return
      await refresh()
    }
    run()

    return () => {
      cancelled = true
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [sql, params?.join(',')])

  return { data, error, isLoading, refresh }
}
