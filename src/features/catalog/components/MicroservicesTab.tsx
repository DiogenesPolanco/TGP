import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { TechSearch } from '@/components/ui/TechSearch'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import {
  Plus, X, Pencil, Trash2, Server,
  AlertTriangle,
} from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'

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

  const columns: Column<(typeof microservices)[number]>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (ms) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Server size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-90 dark:text-white">{ms.name}</p>
            {ms.description && (
              <p className="text-xs text-neutral-60 dark:text-neutral-40 line-clamp-1">{ms.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'technologies',
      label: 'Tecnologías',
      sortable: true,
      render: (ms) => {
        const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
        const eolCount = techs.filter((t) => t.supportStatus === 'eol').length
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-70 dark:text-neutral-30">{techs.length} techs</span>
            {eolCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={12} />
                {eolCount} EOL
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (ms) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingMs(ms.id); setShowForm(true) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(ms.id) }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [allTechnologies])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Microservicios <span className="text-neutral-50 text-base font-normal">({microservices.length})</span>
        </h4>
        <button
          onClick={() => { setEditingMs(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={16} />
          Nuevo Microservicio
        </button>
      </div>

      <SortableTable
        columns={columns}
        data={microservices}
        pageSize={10}
        emptyMessage="No hay microservicios registrados para esta aplicación"
      />

      {showForm && (
        <MicroserviceFormModal
          applicationId={applicationId}
          editingId={editingMs}
          onClose={() => { setShowForm(false); setEditingMs(null) }}
        />
      )}
    </div>
  )
}

/* ─── Microservice Form Modal ─── */

function MicroserviceFormModal({
  applicationId,
  editingId,
  onClose,
}: {
  applicationId: string
  editingId: string | null
  onClose: () => void
}) {
  const existing = useLiveQuery(
    () => db.microservices.get(editingId ?? ''),
    [editingId],
  )

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(existing?.technologies ?? [])
  const [saving, setSaving] = useState(false)

  // Sync form when existing data loads
  if (existing && !name) {
    setName(existing.name)
    setDescription(existing.description)
    setSelectedTechIds(existing.technologies)
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
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Propósito del microservicio..."
          />
        </div>

        {/* Technology Stack */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Stack Tecnológico
          </label>
          <TechSearch
            selectedIds={selectedTechIds}
            onChange={setSelectedTechIds}
            enableDepsSearch={true}
          />
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
