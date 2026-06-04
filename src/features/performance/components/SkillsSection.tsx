import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Skill } from '@/types/domain'
import { Plus, X } from 'lucide-react'

interface Props {
  memberId: string
}

const levelColors: Record<string, string> = {
  beginner: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  intermediate: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  advanced: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  expert: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
}

export function SkillsSection({ memberId }: Props) {
  const [profile, setProfile] = useState<{ skills: Skill[] } | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLevel, setNewLevel] = useState<Skill['level']>('intermediate')

  useEffect(() => {
    db.memberProfiles.get(memberId).then((p) => {
      setProfile(p ?? null)
      setSkills(p?.skills ?? [])
    })
  }, [memberId])

  const saveSkills = async (updated: Skill[]) => {
    const existing = profile ?? { skills: [] }
    await db.memberProfiles.put({
      ...existing,
      id: memberId,
      teamId: '',
      email: (existing as any).email ?? '',
      phoneCell: (existing as any).phoneCell ?? '',
      phoneHome: (existing as any).phoneHome ?? '',
      address: (existing as any).address ?? '',
      role: (existing as any).role ?? 'developer',
      technologies: (existing as any).technologies ?? [],
      avgStoryPoints: (existing as any).avgStoryPoints ?? 0,
      vacationDaysPerYear: (existing as any).vacationDaysPerYear ?? 20,
      vacationUsed: (existing as any).vacationUsed ?? 0,
      createdAt: (existing as any).createdAt ?? new Date(),
      updatedAt: new Date(),
      skills: updated,
    } as any)
  }

  const addSkill = async () => {
    if (!newName.trim()) return
    const updated: Skill[] = [
      ...skills,
      { id: crypto.randomUUID(), name: newName.trim(), level: newLevel, category: newCategory.trim() },
    ]
    setSkills(updated)
    await saveSkills(updated)
    setNewName('')
    setNewCategory('')
  }

  const removeSkill = async (id: string) => {
    const updated = skills.filter((s) => s.id !== id)
    setSkills(updated)
    await saveSkills(updated)
  }

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Skills</h2>

      {/* Add form */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del skill"
          className="flex-1 min-w-[160px] rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
        />
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Categoría (opcional)"
          className="w-[140px] rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
        />
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as Skill['level'])}
          className="rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <button
          onClick={addSkill}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Skills grid */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-center py-8 text-neutral-40">Sin skills registrados</p>
      ) : (
        Object.entries(grouped).map(([category, catskills]) => (
          <div key={category} className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-50 mb-2">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {catskills.map((s) => (
                <span
                  key={s.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${levelColors[s.level]}`}
                >
                  {s.name}
                  <button onClick={() => removeSkill(s.id)} className="hover:opacity-70">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
