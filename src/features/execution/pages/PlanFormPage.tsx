import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { ProjectStatus, ProjectHealth } from '@/constants/enums'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

export function PlanFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const plan = useLiveQuery(() => (id ? db.plans.get(id) : undefined), [id])
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: '',
    businessUnitId: '',
    objectiveId: '',
    status: 'planned' as ProjectStatus,
    health: 'green' as ProjectHealth,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    if (plan) {
      queueMicrotask(() => {
        setFormData({
          title: plan.title ?? '',
          description: plan.description ?? '',
          teamId: plan.teamId ?? '',
          businessUnitId: plan.businessUnitId ?? '',
          objectiveId: plan.objectiveId ?? '',
          status: (plan.status as ProjectStatus) ?? 'planned',
          health: (plan.health as ProjectHealth) ?? 'green',
          startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : '',
          endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : '',
        })
      })
    }
  }, [plan])

  if (id && !plan) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.startDate || !formData.endDate) return
    const data = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      teamId: formData.teamId || null,
      businessUnitId: formData.businessUnitId || null,
      objectiveId: formData.objectiveId || null,
      status: formData.status,
      health: formData.health,
      startDate: parseLocalDate(formData.startDate),
      endDate: parseLocalDate(formData.endDate),
      metadata: plan?.metadata ?? {},
      createdAt: plan?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }
    if (plan) {
      await db.plans.update(plan.id, data)
      addNotification({ type: 'success', message: 'Plan actualizado' })
    } else {
      await db.plans.add({ id: crypto.randomUUID(), ...data })
      addNotification({ type: 'success', message: 'Plan creado' })
    }
    navigate('/execution/plans')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => navigate('/execution/plans')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {plan ? 'Editar Plan' : 'Nuevo Plan'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-boundary p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Título *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Q2 2026 — Modernización Core" className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Descripción</label>
          <RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el plan..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="Equipo" value={formData.teamId} onChange={(v) => setFormData({ ...formData, teamId: v })} options={[
              { value: '', label: 'Sin equipo' },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]} />
          </div>
          <div>
            <Select label="Unidad de Negocio" value={formData.businessUnitId} onChange={(v) => setFormData({ ...formData, businessUnitId: v })} options={[
              { value: '', label: 'Sin BU' },
              ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
            ]} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="OKR Asociado" value={formData.objectiveId} onChange={(v) => setFormData({ ...formData, objectiveId: v })} options={[
              { value: '', label: 'Sin OKR' },
              ...objectives.map((o) => ({ value: o.id, label: o.title })),
            ]} />
          </div>
          <div>
            <Select label="Estado" value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as ProjectStatus })} options={[
              { value: 'planned', label: 'Planificado' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'on_hold', label: 'En Pausa' },
              { value: 'completed', label: 'Completado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="Salud" value={formData.health} onChange={(v) => setFormData({ ...formData, health: v as ProjectHealth })} options={[
              { value: 'green', label: 'Verde' },
              { value: 'yellow', label: 'Amarillo' },
              { value: 'red', label: 'Rojo' },
            ]} />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Fecha Inicio *</label>
            <DatePicker required value={formData.startDate} onChange={(v) => setFormData({ ...formData, startDate: v })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Fecha Fin *</label>
            <DatePicker required value={formData.endDate} onChange={(v) => setFormData({ ...formData, endDate: v })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" onClick={() => navigate('/execution/plans')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</Button>
          <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{plan ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </form>
    </div>
  )
}
