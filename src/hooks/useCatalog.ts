import { useState, useEffect } from 'react'
import { getCatalog, getCatalogMap } from '@/services/system/catalogService'
import type { CatalogEntry } from '@/types/system'

export function useCatalog(category: string): CatalogEntry[] {
  const [entries, setEntries] = useState<CatalogEntry[]>([])
  useEffect(() => {
    getCatalog(category).then(setEntries)
  }, [category])
  return entries
}

export function useCatalogMap(category: string): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({})
  useEffect(() => {
    getCatalogMap(category).then(setMap)
  }, [category])
  return map
}
