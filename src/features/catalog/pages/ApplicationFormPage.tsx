import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { ArrowLeft } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { TechSearch } from '@/components/ui/TechSearch'
import type { Criticality, ArchitectureType, ApplicationStatus } from '@/types/domain'

export function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const application = useLiveQuery(() => (id ? db.applications.get(id) : undefined), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerName: '',
    businessUnitId: '',
    criticality: 'medium' as Criticality,
    architecture: 'monolith' as ArchitectureType,
    status: 'active' as ApplicationStatus,
    supportEndDate: '',
  })
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])

  useEffect(() => {
    if (application) {
      queueMicrotask(() => {
        setFormData({
          name: application.name ?? '',
          description: application.description ?? '',
          ownerName: application.ownerName ?? '',
          businessUnitId: application.businessUnitId ?? '',
          criticality: application.criticality ?? 'medium',
          architecture: application.architecture ?? 'monolith',
          status: application.status ?? 'active',
          supportEndDate: application.supportEndDate ? new Date(application.supportEndDate).toISOString().split('T')[0] : '',
        })
        setSelectedTechIds(application.technologies ?? [])
      })
    }
  }, [application])

  if (id && !application) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      supportEndDate: formData.supportEndDate ? new Date(formData.supportEndDate) : null,
      ownerId: application?.ownerId ?? `user-${crypto.randomUUID()}`,
      technologies: selectedTechIds,
      metadata: application?.metadata ?? {},
      createdAt: application?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (application) {
      await db.applications.update(application.id, data)
      addNotification({ type: 'success', message: 'Aplicación actualizada' })
    } else {
      await db.applications.add({ ...data, id: crypto.randomUUID() })
      addNotification({ type: 'success', message: 'Aplicación creada' })
    }
    navigate('/catalog/applications')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/catalog/applications')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {application ? 'Editar Aplicación' : 'Nueva Aplicación'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Nombre *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label>
          <RichTextEditor
            value={formData.description}
            onChange={(html) => setFormData({ ...formData, description: html })}
            placeholder="Describe la aplicación..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Owner *</label>
          <input
            type="text"
            required
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Business Unit *</label>
          <select
            required
            value={formData.businessUnitId}
            onChange={(e) => setFormData({ ...formData, businessUnitId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Seleccionar...</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>{bu.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Criticidad *</label>
              <select
                required
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as Criticality })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Arquitectura</label>
              <select
                value={formData.architecture}
                onChange={(e) => setFormData({ ...formData, architecture: e.target.value as ArchitectureType })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="monolith">Monolito</option>
                <option value="microservices">Microservicios</option>
                <option value="serverless">Serverless</option>
                <option value="soa">SOA</option>
                <option value="event_driven">Event Driven</option>
                <option value="hybrid">Híbrida</option>
              </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Activa</option>
                <option value="deprecated">Deprecada</option>
                <option value="retired">Retirada</option>
                <option value="planned">Planificada</option>
              </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha fin soporte</label>
            <input
              type="date"
              value={formData.supportEndDate}
              onChange={(e) => setFormData({ ...formData, supportEndDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
            Tecnologías
          </label>
          <TechSearch
            selectedIds={selectedTechIds}
            onChange={setSelectedTechIds}
            placeholder="Buscar tecnología para agregar..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/catalog/applications')}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            {application ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  )
}
