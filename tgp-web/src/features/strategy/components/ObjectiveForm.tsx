import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Plus } from 'lucide-react'
import type { Objective, KeyResult } from '@/types/domain'

interface ObjectiveFormProps {
  objective: Objective | null
  onClose: () => void
  onSave: () => void
}

export function ObjectiveForm({ objective, onClose, onSave }: ObjectiveFormProps) {
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const [formData, setFormData] = useState({
    title: objective?.title ?? '',
    description: objective?.description ?? '',
    type: objective?.type ?? 'okr',
    teamId: objective?.teamId ?? '',
    businessUnitId: objective?.businessUnitId ?? '',
    periodStart: objective?.periodStart ? new Date(objective.periodStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    periodEnd: objective?.periodEnd ? new Date(objective.periodEnd).toISOString().split('T')[0] : '',
    status: objective?.status ?? 'not_started',
    keyResults: objective?.keyResults ?? [] as KeyResult[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const progress = formData.keyResults.length > 0
      ? (formData.keyResults.reduce((sum, kr) => sum + (kr.target > 0 ? (kr.current / kr.target) * 100 : 0), 0) / formData.keyResults.length)
      : 0

    const data = {
      ...formData,
      teamId: formData.teamId || null,
      businessUnitId: formData.businessUnitId || null,
      periodStart: new Date(formData.periodStart),
      periodEnd: new Date(formData.periodEnd),
      progress: Math.min(100, progress),
      metadata: objective?.metadata ?? {},
      createdAt: objective?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (objective) {
      await db.objectives.update(objective.id, data)
    } else {
      await db.objectives.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  const addKeyResult = () => {
    const newKr: KeyResult = {
      id: crypto.randomUUID(),
      title: '',
      measure: '',
      baseline: 0,
      target: 100,
      current: 0,
      status: 'not_started',
    }
    setFormData({ ...formData, keyResults: [...formData.keyResults, newKr] })
  }

  const updateKeyResult = (index: number, field: keyof KeyResult, value: string | number) => {
    const updated = [...formData.keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, keyResults: updated })
  }

  const removeKeyResult = (index: number) => {
    setFormData({ ...formData, keyResults: formData.keyResults.filter((_, i) => i !== index) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {objective ? 'Editar Objetivo' : 'Nuevo Objetivo'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="okr">OKR</option>
                <option value="kpi">KPI</option>
                <option value="balanced_scorecard">Balanced Scorecard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Equipo</label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sin equipo</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Business Unit</label>
              <select
                value={formData.businessUnitId}
                onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Sin BU</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Inicio *</label>
              <input
                type="date"
                required
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fin *</label>
              <input
                type="date"
                required
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Key Results</label>
              <button
                type="button"
                onClick={addKeyResult}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus size={14} />
                Agregar KR
              </button>
            </div>
            <div className="space-y-2">
              {formData.keyResults.map((kr, index) => (
                <div key={kr.id} className="flex items-center gap-2 p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                  <input
                    type="text"
                    placeholder="Título KR"
                    value={kr.title}
                    onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Medida"
                    value={kr.measure}
                    onChange={(e) => updateKeyResult(index, 'measure', e.target.value)}
                    className="w-20 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Target"
                    value={kr.target}
                    onChange={(e) => updateKeyResult(index, 'target', parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Current"
                    value={kr.current}
                    onChange={(e) => updateKeyResult(index, 'current', parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 rounded border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeKeyResult(index)}
                    className="text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              {objective ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
