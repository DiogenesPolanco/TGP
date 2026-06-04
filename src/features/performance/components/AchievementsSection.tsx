import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Achievement } from '@/types/domain'
import { Plus, Award, Trophy, Star, BookOpen, TrendingUp, Trash2 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

interface Props {
  memberId: string
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  logro: { icon: <Trophy size={16} />, label: 'Logro', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' },
  reconocimiento: { icon: <Star size={16} />, label: 'Reconocimiento', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  certificacion: { icon: <BookOpen size={16} />, label: 'Certificación', color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' },
  ascenso: { icon: <TrendingUp size={16} />, label: 'Ascenso', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
}

export function AchievementsSection({ memberId }: Props) {
  const { confirm } = useConfirm()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'logro' as Achievement['type'],
    linkedToPromotion: false,
  })

  useEffect(() => {
    db.achievements.where('memberId').equals(memberId).toArray().then(setAchievements)
  }, [memberId])

  const addAchievement = async () => {
    if (!newAchievement.title.trim()) return
    const achievement: Achievement = {
      id: crypto.randomUUID(),
      memberId,
      ...newAchievement,
      date: new Date(newAchievement.date),
      createdAt: new Date(),
    }
    await db.achievements.add(achievement)
    setAchievements([...achievements, achievement])
    setShowForm(false)
    setNewAchievement({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'logro',
      linkedToPromotion: false,
    })
  }

  const removeAchievement = async (id: string) => {
    const ok = await confirm('¿Estás seguro de eliminar este logro?')
    if (!ok) return
    await db.achievements.delete(id)
    setAchievements(achievements.filter((a) => a.id !== id))
  }

  const sorted = [...achievements].sort((a, b) => b.date.getTime() - a.date.getTime())
  const promotionReady = achievements.filter((a) => a.linkedToPromotion)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Logros y Reconocimientos</h2>
          {promotionReady.length > 0 && (
            <p className="text-xs text-green-600 mt-0.5">
              {promotionReady.length} logro(s) marcados para ascenso
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} /> Nuevo Logro
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = achievements.filter((a) => a.type === key).length
          return (
            <div key={key} className="text-center p-3 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
              <div className={`inline-flex p-2 rounded-lg mb-1 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <p className="text-lg font-bold text-neutral-90 dark:text-white">{count}</p>
              <p className="text-xs text-neutral-50">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* New Achievement Form */}
      {showForm && (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Título</label>
              <input
                type="text"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
                placeholder="Título del logro"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
              <select
                value={newAchievement.type}
                onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value as Achievement['type'] })}
                className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
              >
                <option value="logro">Logro</option>
                <option value="reconocimiento">Reconocimiento</option>
                <option value="certificacion">Certificación</option>
                <option value="ascenso">Ascenso</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Descripción</label>
            <textarea
              value={newAchievement.description}
              onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
              className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm min-h-[60px]"
              placeholder="Descripción del logro..."
            />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
              <input
                type="date"
                value={newAchievement.date}
                onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                className="rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                checked={newAchievement.linkedToPromotion}
                onChange={(e) => setNewAchievement({ ...newAchievement, linkedToPromotion: e.target.checked })}
                className="rounded border-neutral-30"
              />
              <span className="text-sm text-neutral-70 dark:text-neutral-30">Considerar para ascenso</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={addAchievement} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">
              Guardar Logro
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 text-neutral-40">
          <Award size={40} className="mx-auto mb-3 opacity-50" />
          <p>Sin logros registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const cfg = typeConfig[a.type]
            return (
              <div
                key={a.id}
                className="flex items-start justify-between p-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white">{a.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {a.linkedToPromotion && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                          Ascenso
                        </span>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-sm text-neutral-50 mt-0.5">{a.description}</p>
                    )}
                    <p className="text-xs text-neutral-40 mt-1">
                      {a.date.toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAchievement(a.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-3 shrink-0"
                  title="Eliminar logro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
