import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Technology, SupportStatus } from '@/types/domain'
import { X, Search } from 'lucide-react'

interface Props {
  memberId: string
}

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success',
  extended: 'bg-warning/10 text-warning',
  eol: 'bg-danger/10 text-danger',
  unknown: 'bg-neutral-500/20 text-neutral-600 dark:text-neutral-400',
}

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activa',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: 'Desconocido',
}

export function TechStackSection({ memberId }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [allTechnologies, setAllTechnologies] = useState<Technology[]>([])
  const [techSearch, setTechSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    Promise.all([
      db.memberProfiles.get(memberId),
      db.technologies.toArray(),
    ]).then(([profile, techs]) => {
      setAllTechnologies(techs)
      setSelectedIds(profile?.technologies ?? [])
    })
  }, [memberId])

  const selectedTechs = allTechnologies.filter((t) => selectedIds.includes(t.id))
  const availableTechs = allTechnologies.filter(
    (t) => !selectedIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.vendor.toLowerCase().includes(techSearch.toLowerCase()))
  )

  const addTechnology = async (techId: string) => {
    const updated = [...selectedIds, techId]
    setSelectedIds(updated)
    setTechSearch('')
    setShowDropdown(false)
    const profile = await db.memberProfiles.get(memberId)
    const base = profile ?? { id: memberId, teamId: '', email: '', phoneCell: '', phoneHome: '', address: '', role: 'developer' as const, skills: [], microservices: [], avgStoryPoints: 0, vacationDaysPerYear: 14, vacationUsed: 0, createdAt: new Date() }
    await db.memberProfiles.put({ ...base, technologies: updated, updatedAt: new Date() })
  }

  const removeTechnology = async (techId: string) => {
    const updated = selectedIds.filter((id) => id !== techId)
    setSelectedIds(updated)
    const profile = await db.memberProfiles.get(memberId)
    if (!profile) return
    await db.memberProfiles.put({ ...profile, technologies: updated, microservices: profile.microservices ?? [], updatedAt: new Date() })
  }

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías</h2>

      <div className="space-y-2 mb-4">
        {selectedTechs.map((tech) => (
          <div key={tech.id} className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name} {tech.version}</span>
              <span className="text-xs text-neutral-60 dark:text-neutral-40">({tech.category})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[tech.supportStatus]}`}>
                {statusLabel[tech.supportStatus]}
              </span>
              <button
                onClick={() => removeTechnology(tech.id)}
                className="p-1 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        {selectedTechs.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">No hay tecnologías asignadas</p>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar tecnología para agregar..."
              value={techSearch}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setTechSearch(e.target.value); setShowDropdown(true) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableTechs.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están asignadas'}
              </p>
            ) : (
              availableTechs.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => addTechnology(tech.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-90 dark:text-white">{tech.name}</span>
                    <span className="text-neutral-50">{tech.version}</span>
                    <span className="text-xs text-neutral-50">({tech.vendor})</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                    {statusLabel[tech.supportStatus]}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
