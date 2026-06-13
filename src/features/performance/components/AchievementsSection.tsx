import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import type { Achievement } from '@/types/domain'
import { Plus, Award, Trophy, Star, BookOpen, TrendingUp, Trash2, Edit3 } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({
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

  const startEdit = (a: Achievement) => {
    setEditingId(a.id)
    setEditData({
      title: a.title,
      description: a.description,
      date: new Date(a.date).toISOString().split('T')[0],
      type: a.type,
      linkedToPromotion: a.linkedToPromotion,
    })
  }

  const saveEdit = async () => {
    if (!editingId || !editData.title.trim()) return
    const updated = achievements.map((a) =>
      a.id === editingId
        ? { ...a, ...editData, title: editData.title.trim(), date: new Date(editData.date) }
        : a
    )
    const record = updated.find((a) => a.id === editingId)!
    await db.achievements.put(record)
    setAchievements(updated)
    setEditingId(null)
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
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
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
              <Select
                value={newAchievement.type}
                onChange={(v) => setNewAchievement({ ...newAchievement, type: v as Achievement['type'] })}
                options={[
                  { value: 'logro', label: 'Logro' },
                  { value: 'reconocimiento', label: 'Reconocimiento' },
                  { value: 'certificacion', label: 'Certificación' },
                  { value: 'ascenso', label: 'Ascenso' },
                ]}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-neutral-60 mb-1 block">Descripción</label>
            <RichTextEditor
              value={newAchievement.description}
              onChange={(html) => setNewAchievement({ ...newAchievement, description: html })}
              placeholder="Descripción del logro..."
            />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
              <DatePicker
                value={newAchievement.date}
                onChange={(v) => setNewAchievement({ ...newAchievement, date: v })}
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
            return editingId === a.id ? (
              <div key={a.id} className="p-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
                <div className="grid gap-3 sm:grid-cols-2 mb-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-60 mb-1 block">Título</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent px-3 py-2 text-sm"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-60 mb-1 block">Tipo</label>
                    <Select
                      value={editData.type}
                      onChange={(v) => setEditData({ ...editData, type: v as Achievement['type'] })}
                      options={[
                        { value: 'logro', label: 'Logro' },
                        { value: 'reconocimiento', label: 'Reconocimiento' },
                        { value: 'certificacion', label: 'Certificación' },
                        { value: 'ascenso', label: 'Ascenso' },
                      ]}
                    />
                  </div>
                </div>
                <div className="mb-3">
                <label className="text-xs font-medium text-neutral-60 mb-1 block">Descripción</label>
                <RichTextEditor
                  value={editData.description}
                  onChange={(html) => setEditData({ ...editData, description: html })}
                  placeholder="Descripción del logro..."
                />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <label className="text-xs font-medium text-neutral-60 mb-1 block">Fecha</label>
                    <DatePicker
                      value={editData.date}
                      onChange={(v) => setEditData({ ...editData, date: v })}
                      className="rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      checked={editData.linkedToPromotion}
                      onChange={(e) => setEditData({ ...editData, linkedToPromotion: e.target.checked })}
                      className="rounded border-neutral-30"
                    />
                    <span className="text-sm text-neutral-70 dark:text-neutral-30">Ascenso</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-neutral-60 hover:text-neutral-90">Cancelar</button>
                </div>
              </div>
            ) : (
              <div
                key={a.id}
                className="flex items-start justify-between p-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 group/ach"
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
                      {new Date(a.date).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => startEdit(a)}
                    className="p-1.5 opacity-0 group-hover/ach:opacity-100 text-neutral-50 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Editar logro"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => removeAchievement(a.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar logro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
