import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { ProjectStatus, ProjectHealth } from '@/constants/enums'

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
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
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
        <button onClick={() => navigate('/execution/plans')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {plan ? 'Editar Plan' : 'Nuevo Plan'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Q2 2026 — Modernización Core" className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label>
          <RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el plan..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Equipo</label>
            <select value={formData.teamId} onChange={(e) => setFormData({ ...formData, teamId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin equipo</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Unidad de Negocio</label>
            <select value={formData.businessUnitId} onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin BU</option>
              {businessUnits.map((bu) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">OKR Asociado</label>
            <select value={formData.objectiveId} onChange={(e) => setFormData({ ...formData, objectiveId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin OKR</option>
              {objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="planned">Planificado</option>
              <option value="in_progress">En Progreso</option>
              <option value="on_hold">En Pausa</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Salud</label>
            <select value={formData.health} onChange={(e) => setFormData({ ...formData, health: e.target.value as ProjectHealth })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="green">Verde</option>
              <option value="yellow">Amarillo</option>
              <option value="red">Rojo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha Inicio *</label>
            <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha Fin *</label>
          <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/execution/plans')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{plan ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
