import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Technology } from '@/types/domain'
import { X, Search, Server } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  memberId: string
}

export function MicroservicesSection({ memberId }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [allMicroservices, setAllMicroservices] = useState<{ id: string; name: string; description: string; technologies: string[] }[]>([])
  const [allTechnologies, setAllTechnologies] = useState<Technology[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    Promise.all([
      db.memberProfiles.get(memberId),
      db.microservices.toArray(),
      db.technologies.toArray(),
    ]).then(([profile, mss, techs]) => {
      setAllMicroservices(mss)
      setAllTechnologies(techs)
      setSelectedIds(profile?.microservices ?? [])
    })
  }, [memberId])

  const selectedMS = allMicroservices.filter((ms) => selectedIds.includes(ms.id))
  const availableMS = allMicroservices.filter(
    (ms) => !selectedIds.includes(ms.id) &&
      (!search || ms.name.toLowerCase().includes(search.toLowerCase()) || ms.description.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleMicroservice = async (msId: string) => {
    const updated = selectedIds.includes(msId)
      ? selectedIds.filter((id) => id !== msId)
      : [...selectedIds, msId]
    setSelectedIds(updated)
    setSearch('')
    setShowDropdown(false)

    const profile = await db.memberProfiles.get(memberId)
    const base = profile ?? {
      id: memberId, teamId: '', email: '', phoneCell: '', phoneHome: '',
      address: '', role: 'developer' as const, status: 'activo' as const,
      skills: [] as { id: string; name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; category: string }[],
      technologies: [] as string[], avgStoryPoints: 0,
      vacationDaysPerYear: 14, vacationUsed: 0, createdAt: new Date(), updatedAt: new Date(),
    }
    await db.memberProfiles.put({ ...base, microservices: updated, updatedAt: new Date() })
  }

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Microservicios</h2>

      <div className="space-y-2 mb-4">
        {selectedMS.map((ms) => {
          const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
          const eolCount = techs.filter((t) => t.supportStatus === 'eol').length
          return (
            <div key={ms.id} className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Server size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">{ms.name}</span>
                    {eolCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger shrink-0">{eolCount} EOL</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-60 dark:text-neutral-40 truncate">{ms.description || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-neutral-50">{techs.length} tecnologías</span>
                <Button
                  onClick={() => toggleMicroservice(ms.id)}
                  className="p-1 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          )
        })}
        {selectedMS.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">No hay microservicios asignados</p>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar microservicio para asignar..."
              value={search}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableMS.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {search ? 'Sin resultados' : 'Todos los microservicios ya están asignados'}
              </p>
            ) : (
              availableMS.map((ms) => {
                const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
                return (
                  <Button
                    key={ms.id}
                    type="button"
                    onClick={() => toggleMicroservice(ms.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Server size={14} className="text-primary shrink-0" />
                      <span className="text-neutral-90 dark:text-white truncate">{ms.name}</span>
                      <span className="text-xs text-neutral-50 shrink-0">{techs.length} techs</span>
                    </div>
                    {ms.description && (
                      <span className="text-xs text-neutral-50 truncate ml-2 max-w-[200px]">{ms.description}</span>
                    )}
                  </Button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
