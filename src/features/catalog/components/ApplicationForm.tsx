import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useUserStore } from '@/stores/userStore'
import { X } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { TechSearch } from '@/components/ui/TechSearch'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Application } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { parseLocalDate } from '@/lib/utils'

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
      supportEndDate: formData.supportEndDate ? parseLocalDate(formData.supportEndDate) : null,
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
      <div className="bg-card rounded-xl border border-boundary shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-boundary">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {application ? 'Editar Aplicación' : 'Nueva Aplicación'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Descripción</label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
              placeholder="Describe la aplicación..."
            />
          </div>

          <MemberSelector
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
              <Select label="Criticidad *" required value={formData.criticality} onChange={(v) => setFormData({ ...formData, criticality: v as typeof formData.criticality })} options={[
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
                { value: 'critical', label: 'Crítica' },
              ]} />
            </div>

            <div>
              <Select label="Arquitectura" value={formData.architecture} onChange={(v) => setFormData({ ...formData, architecture: v as typeof formData.architecture })} options={[
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
              <Select label="Estado *" required value={formData.status} onChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })} options={[
                { value: 'active', label: 'Activa' },
                { value: 'deprecated', label: 'Deprecada' },
                { value: 'retired', label: 'Retirada' },
                { value: 'planned', label: 'Planificada' },
              ]} />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Fecha fin soporte</label>
              <DatePicker
                value={formData.supportEndDate}
                onChange={(v) => setFormData({ ...formData, supportEndDate: v })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Tecnologías <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
            </label>
            <TechSearch
              selectedIds={selectedTechIds}
              onChange={setSelectedTechIds}
              enableDepsSearch={true}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button"
              onClick={onClose} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
              Cancelar
            </Button>
            <Button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
              {application ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
