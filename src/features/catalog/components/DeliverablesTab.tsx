import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { Plus, X, Save, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import type { Deliverable, DeliverableStatus, Objective } from '@/types/domain'

const statusColors: Record<DeliverableStatus, string> = {
  pending: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60',
  in_progress: 'bg-info/10 text-info border-info/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-danger/10 text-danger border-danger/30',
}

const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export function DeliverablesTab({ applicationId }: { applicationId: string }) {
  const deliverables = useLiveQuery(
    () => db.deliverables.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []

  const allObjectives = useLiveQuery(() => db.objectives.toArray()) ?? []
  const { confirm } = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!(await confirm('¿Eliminar este entregable?'))) return
    await db.deliverables.delete(id)
  }

  const columns: Column<Deliverable>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (d) => (
        <div>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{d.title}</p>
          {d.description && (
            <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-0.5 line-clamp-1">{d.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (d) => (
        <span className={cn('text-xs px-2 py-0.5 rounded-full border', statusColors[d.status])}>
          {statusLabel[d.status]}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Fecha Límite',
      sortable: true,
      render: (d) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {d.dueDate ? new Date(d.dueDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'objectiveId',
      label: 'OKR',
      sortable: true,
      render: (d) => {
        const obj = allObjectives.find((o) => o.id === d.objectiveId)
        return <span className="text-sm text-neutral-70 dark:text-neutral-30">{obj?.title || '—'}</span>
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingId(editingId === d.id ? null : d.id) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(d.id) }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [allObjectives, editingId])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Entregables
        </h4>
      </div>

      {/* New deliverable form */}
      <DeliverableForm applicationId={applicationId} allObjectives={allObjectives} />

      <div className="mt-4">
        <SortableTable
          columns={columns}
          data={deliverables}
          pageSize={10}
          emptyMessage="No hay entregables registrados"
        />
      </div>

      {editingId && (
        <InlineEditDeliverable
          deliverable={deliverables.find((d) => d.id === editingId)!}
          allObjectives={allObjectives}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

/* ─── New deliverable form ─── */

function DeliverableForm({
  applicationId,
  allObjectives,
}: {
  applicationId: string
  allObjectives: Objective[]
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await db.deliverables.add({
        id: crypto.randomUUID(),
        applicationId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        objectiveId: objectiveId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setObjectiveId('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors rounded-lg"
      >
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <Plus size={16} />
        Nuevo entregable
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-20 dark:border-neutral-70 pt-3">
          <input
            type="text"
            placeholder="Título del entregable"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Descripción (opcional)"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Fecha límite</label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-50 mb-1">Objetivo relacionado</label>
              <Select value={objectiveId} onChange={(v) => setObjectiveId(v)} options={[
                { value: '', label: 'Sin objetivo' },
                ...allObjectives.map((obj) => ({ value: obj.id, label: obj.title })),
              ]} className="text-xs" />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InlineEditDeliverable({
  deliverable,
  allObjectives,
  onClose,
}: {
  deliverable: Deliverable
  allObjectives: Objective[]
  onClose: () => void
}) {
  const [status, setStatus] = useState(deliverable.status)
  const [dueDate, setDueDate] = useState(
    deliverable.dueDate ? new Date(deliverable.dueDate).toISOString().split('T')[0] : '',
  )
  const [objectiveId, setObjectiveId] = useState(deliverable.objectiveId ?? '')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await db.deliverables.update(deliverable.id, {
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        objectiveId: objectiveId || null,
        updatedAt: new Date(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 p-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-90 dark:text-white min-w-0 flex-1 truncate">
          Editando: {deliverable.title}
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
          className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent"
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent w-32"
        />
        <select
          value={objectiveId}
          onChange={(e) => setObjectiveId(e.target.value)}
          className="px-2 py-1 text-xs rounded border border-neutral-30 dark:border-neutral-60 bg-transparent max-w-[140px]"
        >
          <option value="">Sin OKR</option>
          {allObjectives.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="p-1.5 rounded text-success hover:bg-success/10 transition-colors disabled:opacity-50"
          title="Guardar"
        >
          <Save size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-neutral-50 hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          title="Cancelar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
