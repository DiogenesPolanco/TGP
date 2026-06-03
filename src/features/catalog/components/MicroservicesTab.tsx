import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import {
  Plus, Search, X, Edit, Trash2, Server,
  Layers, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { Technology, SupportStatus } from '@/types/domain'

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

interface MicroservicesTabProps {
  applicationId: string
}

export function MicroservicesTab({ applicationId }: MicroservicesTabProps) {
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const { confirm } = useConfirm()

  const [showForm, setShowForm] = useState(false)
  const [editingMs, setEditingMs] = useState<string | null>(null)

  const handleDelete = async (msId: string) => {
    if (!(await confirm('¿Eliminar este microservicio?'))) return
    await db.microservices.delete(msId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-neutral-70 dark:text-neutral-30">
          Microservicios ({microservices.length})
        </h4>
        <button
          onClick={() => { setEditingMs(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={16} />
          Nuevo Microservicio
        </button>
      </div>

      <div className="space-y-3">
        {microservices.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">
            No hay microservicios registrados para esta aplicación.
          </p>
        )}

        {microservices.map((ms) => (
          <MicroserviceCard
            key={ms.id}
            microservice={ms}
            allTechnologies={allTechnologies}
            onEdit={() => { setEditingMs(ms.id); setShowForm(true) }}
            onDelete={() => handleDelete(ms.id)}
          />
        ))}
      </div>

      {showForm && (
        <MicroserviceFormModal
          applicationId={applicationId}
          editingId={editingMs}
          allTechnologies={allTechnologies}
          onClose={() => { setShowForm(false); setEditingMs(null) }}
        />
      )}
    </div>
  )
}

/* ─── Microservice Card ─── */

function MicroserviceCard({
  microservice: ms,
  allTechnologies,
  onEdit,
  onDelete,
}: {
  microservice: { id: string; name: string; description: string; technologies: string[] }
  allTechnologies: Technology[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
  const eolCount = techs.filter((t) => t.supportStatus === 'eol').length

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Server size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                {ms.name}
              </span>
              {eolCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger shrink-0">
                  {eolCount} EOL
                </span>
              )}
            </div>
            {ms.description && (
              <p className="text-xs text-neutral-60 dark:text-neutral-40 truncate mt-0.5">
                {ms.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-50">{techs.length} tecnologías</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="Editar"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded tech stack */}
      {expanded && (
        <div className="border-t border-neutral-20 dark:border-neutral-70 p-3 space-y-1.5">
          {techs.length === 0 ? (
            <p className="text-xs text-neutral-50">Sin tecnologías asignadas</p>
          ) : (
            techs.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers size={14} className="text-neutral-50 shrink-0" />
                  <span className="text-sm text-neutral-90 dark:text-white truncate">
                    {tech.name}
                  </span>
                  <span className="text-xs text-neutral-50 shrink-0">{tech.version}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                  {statusLabel[tech.supportStatus]}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Microservice Form Modal ─── */

function MicroserviceFormModal({
  applicationId,
  editingId,
  allTechnologies,
  onClose,
}: {
  applicationId: string
  editingId: string | null
  allTechnologies: Technology[]
  onClose: () => void
}) {
  const existing = useLiveQuery(
    () => db.microservices.get(editingId ?? ''),
    [editingId],
  )

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(existing?.technologies ?? [])
  const [techSearch, setTechSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync form when existing data loads
  if (existing && !name) {
    setName(existing.name)
    setDescription(existing.description)
    setSelectedTechIds(existing.technologies)
  }

  const selectedTechs = allTechnologies.filter((t) => selectedTechIds.includes(t.id))
  const availableTechs = allTechnologies.filter(
    (t) => !selectedTechIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase())),
  )

  const addTechnology = (techId: string) => {
    setSelectedTechIds((prev) => [...prev, techId])
    setTechSearch('')
    setShowDropdown(false)
  }

  const removeTechnology = (techId: string) => {
    setSelectedTechIds((prev) => prev.filter((id) => id !== techId))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        applicationId,
        name: name.trim(),
        description: description.trim(),
        technologies: selectedTechIds,
        updatedAt: new Date(),
      }

      if (editingId) {
        await db.microservices.update(editingId, data)
      } else {
        await db.microservices.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {editingId ? 'Editar Microservicio' : 'Nuevo Microservicio'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. auth-service, api-gateway"
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Propósito del microservicio..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Technology Stack */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Stack Tecnológico
          </label>

          <div className="space-y-1.5 mb-3">
            {selectedTechs.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers size={14} className="text-neutral-50 shrink-0" />
                  <span className="text-sm text-neutral-90 dark:text-white truncate">{tech.name}</span>
                  <span className="text-xs text-neutral-50">{tech.version}</span>
                  <span className="text-xs text-neutral-50">({tech.category})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                    {statusLabel[tech.supportStatus]}
                  </span>
                  <button
                    onClick={() => removeTechnology(tech.id)}
                    className="p-0.5 rounded text-neutral-50 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {selectedTechs.length === 0 && (
              <p className="text-xs text-neutral-50">Selecciona las tecnologías que usa este microservicio</p>
            )}
          </div>

          {/* Add tech search */}
          <div className="relative">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
              <input
                type="text"
                placeholder="Agregar tecnología (lenguaje, BD, SO...)"
                value={techSearch}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => { setTechSearch(e.target.value); setShowDropdown(true) }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableTechs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están asignadas'}
                  </p>
                ) : (
                  availableTechs.map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => addTechnology(tech.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus size={14} className="text-primary shrink-0" />
                        <span className="text-neutral-90 dark:text-white truncate">{tech.name}</span>
                        <span className="text-neutral-50 shrink-0">{tech.version}</span>
                        <span className="text-xs text-neutral-50">({tech.vendor})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                        {statusLabel[tech.supportStatus]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear Microservicio'}
          </button>
        </div>
      </div>
    </div>
  )
}
