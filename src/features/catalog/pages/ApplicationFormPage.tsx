import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Plus, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Technology, SupportStatus, Criticality, ArchitectureType, ApplicationStatus } from '@/types/domain'

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60',
}

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

export function ApplicationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const application = useLiveQuery(() => (id ? db.applications.get(id) : undefined), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []

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
  const [techSearch, setTechSearch] = useState('')
  const [showTechDropdown, setShowTechDropdown] = useState(false)

  useEffect(() => {
    if (application) {
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
    }
  }, [application])

  if (id && !application) return <div className="p-6 text-neutral-50">Cargando...</div>

  const availableTechs = allTechnologies.filter(
    (t) => !selectedTechIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.vendor.toLowerCase().includes(techSearch.toLowerCase()))
  )

  const selectedTechs = allTechnologies.filter((t) => selectedTechIds.includes(t.id))

  const addTechnology = (tech: Technology) => {
    setSelectedTechIds([...selectedTechIds, tech.id])
    setTechSearch('')
    setShowTechDropdown(false)
  }

  const removeTechnology = (techId: string) => {
    setSelectedTechIds(selectedTechIds.filter((id) => id !== techId))
  }

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
            Tecnologías <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
          </label>

          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTechs.map((tech) => (
              <span
                key={tech.id}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${statusColors[tech.supportStatus]}`}
              >
                {tech.supportStatus === 'eol' && <AlertTriangle size={12} />}
                {tech.name} {tech.version}
                <button
                  type="button"
                  onClick={() => removeTechnology(tech.id)}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {selectedTechs.length === 0 && (
              <span className="text-xs text-neutral-50 py-1">Ninguna tecnología seleccionada</span>
            )}
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar tecnología para agregar..."
                  value={techSearch}
                  onFocus={() => setShowTechDropdown(true)}
                  onChange={(e) => { setTechSearch(e.target.value); setShowTechDropdown(true) }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
              </div>
            </div>

            {showTechDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableTechs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están seleccionadas'}
                  </p>
                ) : (
                  availableTechs.map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => addTechnology(tech)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-90 dark:text-white">{tech.name}</span>
                        <span className="text-neutral-50">{tech.version}</span>
                        <span className="text-xs text-neutral-50">({tech.vendor})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                        {statusLabel[tech.supportStatus]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedTechs.some((t) => t.supportStatus === 'eol') && (
            <p className="text-xs text-danger mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              Esta aplicación usa tecnologías EOL sin soporte
            </p>
          )}
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
