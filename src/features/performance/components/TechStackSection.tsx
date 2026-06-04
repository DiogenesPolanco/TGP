import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Technology } from '@/types/domain'
import { X, Search } from 'lucide-react'

interface Props {
  memberId: string
}

export function TechStackSection({ memberId }: Props) {
  const [profile, setProfile] = useState<{ technologies: string[] } | null>(null)
  const [techs, setTechs] = useState<string[]>([])
  const [catalog, setCatalog] = useState<Technology[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    Promise.all([
      db.memberProfiles.get(memberId),
      db.technologies.toArray(),
    ]).then(([p, techsList]) => {
      setProfile(p ?? null)
      setTechs(p?.technologies ?? [])
      setCatalog(techsList)
    })
  }, [memberId])

  const saveTechs = async (updated: string[]) => {
    const existing = profile ?? { technologies: [] }
    await db.memberProfiles.put({
      ...existing,
      id: memberId,
      teamId: '',
      email: (existing as any).email ?? '',
      phoneCell: (existing as any).phoneCell ?? '',
      phoneHome: (existing as any).phoneHome ?? '',
      address: (existing as any).address ?? '',
      role: (existing as any).role ?? 'developer',
      skills: (existing as any).skills ?? [],
      avgStoryPoints: (existing as any).avgStoryPoints ?? 0,
      vacationDaysPerYear: (existing as any).vacationDaysPerYear ?? 20,
      vacationUsed: (existing as any).vacationUsed ?? 0,
      createdAt: (existing as any).createdAt ?? new Date(),
      updatedAt: new Date(),
      technologies: updated,
    } as any)
  }

  const toggleTech = async (techName: string) => {
    const updated = techs.includes(techName)
      ? techs.filter((t) => t !== techName)
      : [...techs, techName]
    setTechs(updated)
    await saveTechs(updated)
  }

  const filtered = catalog.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) &&
      !techs.includes(t.name)
  )

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías</h2>

      <div className="relative mb-6">
        <div className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg bg-white dark:bg-neutral-80">
          <Search size={16} className="text-neutral-40 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar tecnologías del catálogo..."
            className="flex-1 bg-transparent text-sm text-neutral-90 dark:text-white focus:outline-none"
          />
          {techs.length > 0 && (
            <span className="text-xs text-neutral-50 shrink-0">{techs.length} seleccionadas</span>
          )}
        </div>

        {showDropdown && search.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-80 border border-neutral-30 dark:border-neutral-60 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-neutral-40 text-center">
                {catalog.length === 0
                  ? 'No hay tecnologías en el catálogo'
                  : 'No se encontraron tecnologías'}
              </p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTech(t.name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  <span className="flex-1 text-neutral-90 dark:text-white">{t.name}</span>
                  <span className="text-xs text-neutral-50">{t.version}</span>
                  <span className="text-xs text-neutral-40 capitalize">{t.category}</span>
                </button>
              ))
            )}
          </div>
        )}

        {showDropdown && (
          <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
        )}
      </div>

      {techs.length === 0 ? (
        <p className="text-center py-8 text-neutral-40">
          Busca y selecciona tecnologías del catálogo
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {techs.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {t}
              <button onClick={() => toggleTech(t)} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
