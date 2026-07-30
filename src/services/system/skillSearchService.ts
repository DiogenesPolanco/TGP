import { db } from '@/services/db/database'
import type { Skill } from '@/types/system'

export interface TechSearchResult {
  id: string
  name: string
  category: string
  vendor?: string
  version?: string
  supportStatus?: string
  isSkill: boolean
}

export async function searchTechnologiesDynamic(
  query: string,
  catalog: {
    id: string
    name: string
    category?: string
    vendor?: string
    version?: string
    supportStatus?: string
  }[],
): Promise<TechSearchResult[]> {
  if (!query.trim()) return []
  const q = query.toLowerCase()

  const fromCatalog = catalog
    .filter(
      (t) => t.name.toLowerCase().includes(q) || (t.vendor && t.vendor.toLowerCase().includes(q)),
    )
    .map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category ?? '',
      vendor: t.vendor,
      version: t.version,
      supportStatus: t.supportStatus,
      isSkill: false,
    }))

  const skills = await db.skills.where('enabled').equals(1).toArray()
  const fromSkills = skills
    .filter((s) => s.name.toLowerCase().includes(q))
    .filter((s) => !fromCatalog.some((c) => c.name.toLowerCase() === s.name.toLowerCase()))
    .map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      isSkill: true as const,
    }))

  return [...fromCatalog, ...fromSkills].slice(0, 20)
}

// Mantiene compatibilidad con imports existentes que usan searchTechnologies
export { searchTechnologies } from '@/constants/commonSkills'
