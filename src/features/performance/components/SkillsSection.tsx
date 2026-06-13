import { useEffect, useMemo, useState } from 'react'
import { db } from '@/services/db/database'
import type { Skill } from '@/types/domain'
import { Plus, X, Search, Edit3 } from 'lucide-react'
import { Select } from '@/components/ui/Select'

interface Props {
  memberId: string
}

const levelColors: Record<string, string> = {
  beginner: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  intermediate: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  advanced: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  expert: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
}

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
}

export function SkillsSection({ memberId }: Props) {
  const [profile, setProfile] = useState<{ skills: Skill[] } | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLevel, setNewLevel] = useState<Skill['level']>('intermediate')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ name: string; category: string; level: Skill['level'] }>({ name: '', category: '', level: 'intermediate' })

  useEffect(() => {
    db.memberProfiles.get(memberId).then((p) => {
      setProfile(p ?? null)
      setSkills(p?.skills ?? [])
    })
  }, [memberId])

  const [allExistingSkills, setAllExistingSkills] = useState<string[]>([])
  useEffect(() => {
    db.memberProfiles.toArray().then((profiles) => {
      const names = new Set<string>()
      for (const p of profiles) {
        if (p.id === memberId) continue
        for (const s of p.skills ?? []) {
          if (s.name) names.add(s.name)
        }
      }
      setAllExistingSkills([...names].sort())
    })
  }, [memberId])

  const suggestions = useMemo(() => {
    if (!newName.trim()) return []
    return allExistingSkills.filter((n) =>
      n.toLowerCase().includes(newName.toLowerCase())
    ).slice(0, 8)
  }, [allExistingSkills, newName])

  const saveSkills = async (updated: Skill[]) => {
    const defaults = {
      id: memberId,
      teamId: '',
      email: '',
      phoneCell: '',
      phoneHome: '',
      address: '',
      role: 'developer' as const,
      technologies: [] as string[],
      microservices: [] as string[],
      avgStoryPoints: 0,
      vacationDaysPerYear: 14,
      vacationUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      skills: [] as Skill[],
    }
    await db.memberProfiles.put({
      ...defaults,
      ...(profile ?? {}),
      skills: updated,
    })
  }

  const addSkill = async (name?: string, category?: string) => {
    const skillName = (name ?? newName).trim()
    const skillCategory = (category ?? newCategory).trim()
    if (!skillName) return
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) return
    const updated: Skill[] = [
      ...skills,
      { id: crypto.randomUUID(), name: skillName, level: newLevel, category: skillCategory },
    ]
    setSkills(updated)
    await saveSkills(updated)
    setNewName('')
    setNewCategory('')
    setShowSuggestions(false)
  }

  const removeSkill = async (id: string) => {
    const updated = skills.filter((s) => s.id !== id)
    setSkills(updated)
    await saveSkills(updated)
  }

  const startEdit = (s: Skill) => {
    setEditingId(s.id)
    setEditData({ name: s.name, category: s.category, level: s.level })
  }

  const saveEdit = async () => {
    if (!editingId || !editData.name.trim()) return
    const updated = skills.map((s) =>
      s.id === editingId
        ? { ...s, name: editData.name.trim(), category: editData.category, level: editData.level }
        : s
    )
    setSkills(updated)
    await saveSkills(updated)
    setEditingId(null)
  }

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Habilidades</h2>

      <div className="relative flex flex-wrap gap-2 mb-6 p-4 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Buscar o escribir habilidad..."
            className="w-full pl-8 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addSkill(name)}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-90 dark:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Categoría"
          className="w-[140px] rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
        />
        <Select
          value={newLevel}
          onChange={(v) => setNewLevel(v as Skill['level'])}
          options={[
            { value: 'beginner', label: 'Principiante' },
            { value: 'intermediate', label: 'Intermedio' },
            { value: 'advanced', label: 'Avanzado' },
            { value: 'expert', label: 'Experto' },
          ]}
          placeholder="Nivel"
        />
        <button
          onClick={() => addSkill()}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-center py-8 text-neutral-40">Sin habilidades registradas</p>
      ) : (
        Object.entries(grouped).map(([category, catskills]) => (
          <div key={category} className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-50 mb-2">{category}</h3>
            <div className="flex flex-wrap gap-2">
              {catskills.map((s) =>
                editingId === s.id ? (
                  <div key={s.id} className="flex items-center gap-2 p-2 bg-white dark:bg-neutral-80 rounded-lg border border-neutral-30 dark:border-neutral-60 w-full max-w-md">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="flex-1 rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    />
                    <input
                      type="text"
                      value={editData.category}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-[100px] rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                      placeholder="Categoría"
                    />
                    <select
                      value={editData.level}
                      onChange={(e) => setEditData({ ...editData, level: e.target.value as Skill['level'] })}
                      className="rounded border border-neutral-30 dark:border-neutral-60 px-2 py-1 text-xs bg-transparent"
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                      <option value="expert">Experto</option>
                    </select>
                    <button onClick={saveEdit} className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark">OK</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-neutral-60 hover:text-neutral-90">X</button>
                  </div>
                ) : (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${levelColors[s.level]} group/skill`}
                  >
                    {s.name}
                    <span className="text-[10px] opacity-70 ml-1">{levelLabels[s.level]}</span>
                    <button onClick={() => startEdit(s)} className="opacity-0 group-hover/skill:opacity-100 hover:opacity-70 transition-opacity ml-0.5">
                      <Edit3 size={10} />
                    </button>
                    <button onClick={() => removeSkill(s.id)} className="hover:opacity-70 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
