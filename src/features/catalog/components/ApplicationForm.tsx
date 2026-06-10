import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useUserStore } from '@/stores/userStore'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { TechSearch } from '@/components/ui/TechSearch'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import type { Application } from '@/types/domain'

interface ApplicationFormProps {
  application: Application | null
  onClose: () => void
  onSave: () => void
}

export function ApplicationForm({ application, onClose, onSave }: ApplicationFormProps) {
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const currentUser = useUserStore((s) => s.currentUser)
  const [formData, setFormData] = useState({
    name: application?.name ?? '',
    description: application?.description ?? '',
    ownerName: application?.ownerName ?? '',
    ownerId: application?.ownerId ?? '',
    businessUnitId: application?.businessUnitId ?? '',
    criticality: application?.criticality ?? 'medium',
    architecture: application?.architecture ?? 'monolith',
    status: application?.status ?? 'active',
    supportEndDate: application?.supportEndDate ? new Date(application.supportEndDate).toISOString().split('T')[0] : '',
  })
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(application?.technologies ?? [])

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
    } else {
      await db.applications.add({ ...data, id: crypto.randomUUID() })
    }
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {application ? 'Editar Aplicación' : 'Nueva Aplicación'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as typeof formData.criticality })}
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
                onChange={(e) => setFormData({ ...formData, architecture: e.target.value as typeof formData.architecture })}
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
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
              <DatePicker
                value={formData.supportEndDate}
                onChange={(v) => setFormData({ ...formData, supportEndDate: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
              Tecnologías <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
            </label>
            <TechSearch
              selectedIds={selectedTechIds}
              onChange={setSelectedTechIds}
              enableDepsSearch={true}
            />
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
              {application ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
