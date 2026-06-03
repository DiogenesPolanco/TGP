import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save } from 'lucide-react'
import type { Plan } from '@/types/domain'
import type { ProjectStatus, ProjectHealth } from '@/constants/enums'

interface PlanFormProps {
  plan: Plan | null
  onClose: () => void
  onSave: () => void
}

export function PlanForm({ plan, onClose, onSave }: PlanFormProps) {
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []

  const [title, setTitle] = useState(plan?.title ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [teamId, setTeamId] = useState(plan?.teamId ?? '')
  const [businessUnitId, setBusinessUnitId] = useState(plan?.businessUnitId ?? '')
  const [objectiveId, setObjectiveId] = useState(plan?.objectiveId ?? '')
  const [status, setStatus] = useState<ProjectStatus>(plan?.status ?? 'planned')
  const [health, setHealth] = useState<ProjectHealth>(plan?.health ?? 'green')
  const [startDate, setStartDate] = useState(
    plan?.startDate ? plan.startDate.toISOString().split('T')[0] : '',
  )
  const [endDate, setEndDate] = useState(
    plan?.endDate ? plan.endDate.toISOString().split('T')[0] : '',
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !startDate || !endDate) return
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        teamId: teamId || null,
        businessUnitId: businessUnitId || null,
        objectiveId: objectiveId || null,
        status,
        health,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        updatedAt: new Date(),
      }
      if (plan) {
        await db.plans.update(plan.id, data)
      } else {
        await db.plans.add({
          id: crypto.randomUUID(),
          ...data,
          metadata: {},
          createdAt: new Date(),
        })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {plan ? 'Editar Plan' : 'Nuevo Plan'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
              Título <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Q2 2026 — Modernización Core"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Equipo</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin equipo</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Unidad de Negocio</label>
            <select
              value={businessUnitId}
              onChange={(e) => setBusinessUnitId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin BU</option>
              {businessUnits.map((bu) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">OKR Asociado</label>
            <select
              value={objectiveId}
              onChange={(e) => setObjectiveId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin OKR</option>
              {objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="planned">Planificado</option>
              <option value="in_progress">En Progreso</option>
              <option value="on_hold">En Pausa</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Salud</label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as ProjectHealth)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="green">Verde</option>
              <option value="yellow">Amarillo</option>
              <option value="red">Rojo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Fecha Inicio <span className="text-danger">*</span></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Fecha Fin <span className="text-danger">*</span></label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !startDate || !endDate || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : plan ? 'Actualizar' : 'Crear Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
