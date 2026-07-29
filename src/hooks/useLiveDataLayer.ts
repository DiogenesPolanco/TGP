import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import type { Repository } from '@/services/data-layer'
import { dataLayer } from '@/services/data-layer'

type TableName = keyof typeof dataLayer

/**
 * Hook reactivo que reemplaza useLiveQuery del data layer.
 * Usa TanStack Query (ya instalado en el proyecto) para reactividad.
 *
 * @example
 *   const { data: apps } = useLiveDataLayer('applications')
 *   const { data: team } = useLiveDataLayer('teams', teamId)
 */
export function useLiveDataLayer<T extends { id: string }>(
  tableName: TableName,
): UseQueryResult<T[]>
export function useLiveDataLayer<T extends { id: string }>(
  tableName: TableName,
  id?: string,
  options?: { enabled?: boolean },
): UseQueryResult<T | null>
export function useLiveDataLayer<T extends { id: string }>(
  tableName: TableName,
  id?: string,
  options?: { enabled?: boolean },
): UseQueryResult<T[] | T | null> {
  const repo = dataLayer[tableName] as unknown as Repository<T>

  return useQuery<T[] | T | null>({
    queryKey: id ? [tableName, id] : [tableName],
    queryFn: () =>
      (id ? repo.getById(id).then((r) => r ?? null) : repo.getAll()) as Promise<T[] | T | null>,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  })
}

/**
 * Hook para queries filtradas por un campo.
 *
 * @example
 *   const { data } = useLiveDataLayerByField('applications', 'businessUnitId', buId)
 */
export function useLiveDataLayerByField<T extends { id: string }>(
  tableName: TableName,
  field: keyof T & string,
  value: unknown,
  options?: { enabled?: boolean },
): UseQueryResult<T[]> {
  const repo = dataLayer[tableName] as unknown as Repository<T>

  return useQuery<T[]>({
    queryKey: [tableName, 'byField', field, value],
    queryFn: () => repo.getByField(field, value) as Promise<T[]>,
    enabled: options?.enabled ?? (value !== undefined && value !== null),
    staleTime: 1000 * 30,
  })
}
