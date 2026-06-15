import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useUserStore } from '@/stores/userStore'
import { ArrowLeft } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { TechSearch } from '@/components/ui/TechSearch'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Criticality, ArchitectureType, ApplicationStatus } from '@/types/domain'
import { Button } from '@/components/ui/Button'

export function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const application = useLiveQuery(() => (id ? db.applications.get(id) : undefined), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const currentUser = useUserStore((s) => s.currentUser)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerName: '',
    ownerId: application?.ownerId ?? '',
    businessUnitId: '',
    criticality: 'medium' as Criticality,
    architecture: 'monolith' as ArchitectureType,
    status: 'active' as ApplicationStatus,
    supportEndDate: '',
  })
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])

  const handlePersonChange = (personId: string) => {
    if (personId === '__me__') {
      setFormData({ ...formData, ownerId: '__me__', ownerName: currentUser?.displayName ?? 'Yo' })
    } else {
      for (const team of teams) {
        const member = team.members.find((m) => m.id === personId)
        if (member) {
          setFormData({ ...formData, ownerId: member.id, ownerName: member.displayName })
          return
        }
      }
    }
  }

  useEffect(() => {
    if (application) {
      queueMicrotask(() => {
        setFormData({
          name: application.name ?? '',
          description: application.description ?? '',
          ownerName: application.ownerName ?? '',
          ownerId: application.ownerId ?? '',
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
      ownerId: formData.ownerId || `user-${crypto.randomUUID()}`,
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
        <Button onClick={() => navigate('/catalog/applications')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </Button>
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

        <PersonSelect
          label="Owner"
          value={formData.ownerId}
          onChange={handlePersonChange}
          required
        />

        <div>
          <Select label="Business Unit *" required value={formData.businessUnitId} onChange={(v) => setFormData({ ...formData, businessUnitId: v })} options={[
            { value: '', label: 'Seleccionar...' },
            ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
          ]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="Criticidad *" required value={formData.criticality} onChange={(v) => setFormData({ ...formData, criticality: v as Criticality })} options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
              { value: 'critical', label: 'Crítica' },
            ]} />
          </div>

          <div>
            <Select label="Arquitectura" value={formData.architecture} onChange={(v) => setFormData({ ...formData, architecture: v as ArchitectureType })} options={[
              { value: 'monolith', label: 'Monolito' },
              { value: 'microservices', label: 'Microservicios' },
              { value: 'serverless', label: 'Serverless' },
              { value: 'soa', label: 'SOA' },
              { value: 'event_driven', label: 'Event Driven' },
              { value: 'hybrid', label: 'Híbrida' },
            ]} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="Estado *" required value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as ApplicationStatus })} options={[
              { value: 'active', label: 'Activa' },
              { value: 'deprecated', label: 'Deprecada' },
              { value: 'retired', label: 'Retirada' },
              { value: 'planned', label: 'Planificada' },
            ]} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha fin soporte</label>
            <DatePicker
              value={formData.supportEndDate}
              onChange={(v) => setFormData({ ...formData, supportEndDate: v })}
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
            enableDepsSearch={true}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate('/catalog/applications')}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            {application ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </div>
  )
}
