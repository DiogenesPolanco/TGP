import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import { Plus, X } from 'lucide-react'

interface Props {
  memberId: string
}

export function TechStackSection({ memberId }: Props) {
  const [profile, setProfile] = useState<{ technologies: string[] } | null>(null)
  const [techs, setTechs] = useState<string[]>([])
  const [newTech, setNewTech] = useState('')

  useEffect(() => {
    db.memberProfiles.get(memberId).then((p) => {
      setProfile(p ?? null)
      setTechs(p?.technologies ?? [])
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

  const addTech = async () => {
    if (!newTech.trim()) return
    const updated = [...techs, newTech.trim()]
    setTechs(updated)
    await saveTechs(updated)
    setNewTech('')
  }

  const removeTech = async (tech: string) => {
    const updated = techs.filter((t) => t !== tech)
    setTechs(updated)
    await saveTechs(updated)
  }

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTech}
          onChange={(e) => setNewTech(e.target.value)}
          placeholder="Agregar tecnología (React, Node.js, etc.)"
          className="flex-1 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addTech()}
        />
        <button
          onClick={addTech}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {techs.length === 0 ? (
        <p className="text-center py-8 text-neutral-40">Sin tecnologías registradas</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {techs.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {t}
              <button onClick={() => removeTech(t)} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
