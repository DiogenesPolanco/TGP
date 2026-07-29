import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Plan } from '@/types/domain'
import type { ProjectStatus, ProjectHealth } from '@/constants/enums'
import { Button } from '@/components/ui/Button'

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
    plan?.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
  )
  const [endDate, setEndDate] = useState(
    plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
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
      <div className="w-full max-w-xl bg-card rounded-2xl border border-boundary shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {plan ? 'Editar Plan' : 'Nuevo Plan'}
          </h3>
          <Button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <X size={20} className="text-neutral-50" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1.5">
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
            <label className="block text-sm font-medium text-secondary mb-1.5">Descripción</label>
            <RichTextEditor
              value={description}
              onChange={(html) => setDescription(html)}
              placeholder="Describe el plan..."
            />
          </div>

          <div>
            <Select
              label="Equipo"
              value={teamId}
              onChange={setTeamId}
              options={[
                { value: '', label: 'Sin equipo' },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Unidad de Negocio"
              value={businessUnitId}
              onChange={setBusinessUnitId}
              options={[
                { value: '', label: 'Sin BU' },
                ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              ]}
            />
          </div>

          <div>
            <Select
              label="OKR Asociado"
              value={objectiveId}
              onChange={setObjectiveId}
              options={[
                { value: '', label: 'Sin OKR' },
                ...objectives.map((o) => ({ value: o.id, label: o.title })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Estado"
              value={status}
              onChange={(v) => setStatus(v as ProjectStatus)}
              options={[
                { value: 'planned', label: 'Planificado' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'on_hold', label: 'En Pausa' },
                { value: 'completed', label: 'Completado' },
                { value: 'cancelled', label: 'Cancelado' },
              ]}
            />
          </div>

          <div>
            <Select
              label="Salud"
              value={health}
              onChange={(v) => setHealth(v as ProjectHealth)}
              options={[
                { value: 'green', label: 'Verde' },
                { value: 'yellow', label: 'Amarillo' },
                { value: 'red', label: 'Rojo' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Fecha Inicio <span className="text-danger">*</span>
            </label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Fecha Fin <span className="text-danger">*</span>
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !startDate || !endDate || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : plan ? 'Actualizar' : 'Crear Plan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
