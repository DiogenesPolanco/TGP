import { useState } from 'react'
import { db } from '@/services/db/database'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { X, Save } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Blocker } from '@/types/domain'
import type { BlockerSeverity, BlockerStatus } from '@/constants/enums'

interface BlockerFormProps {
  blocker: Blocker | null
  sourceType: 'task' | 'activity' | 'plan' | 'commitment'
  sourceId: string
  onClose: () => void
  onSave: () => void
}

export function BlockerForm({ blocker, sourceType, sourceId, onClose, onSave }: BlockerFormProps) {
  const [title, setTitle] = useState(blocker?.title ?? '')
  const [description, setDescription] = useState(blocker?.description ?? '')
  const [severity, setSeverity] = useState<BlockerSeverity>(blocker?.severity ?? 'medium')
  const [status, setStatus] = useState<BlockerStatus>(blocker?.status ?? 'open')
  const [assigneeId, setAssigneeId] = useState(blocker?.assigneeId ?? '')
  const [resolutionNotes, setResolutionNotes] = useState(blocker?.resolutionNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const now = new Date()
      const data = {
        sourceType,
        sourceId,
        title: title.trim(),
        description: description.trim(),
        severity,
        status,
        raisedById: blocker?.raisedById ?? 'unknown',
        assigneeId: assigneeId || null,
        escalatedAt: blocker?.escalatedAt ?? null,
        resolvedAt: status === 'resolved' ? now : (blocker?.resolvedAt ?? null),
        resolutionNotes: resolutionNotes || null,
        updatedAt: now,
      }

      if (blocker) {
        await db.blockers.update(blocker.id, data)
      } else {
        await db.blockers.add({
          id: crypto.randomUUID(),
          ...data,
          metadata: {},
          createdAt: now,
        })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {blocker ? 'Editar Bloqueo' : 'Reportar Bloqueo'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Titulo <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Certificado SSL vencido"
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripcion</label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Que esta bloqueando, desde cuando, que se necesita..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Severidad</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as BlockerSeverity)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Critica</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlockerStatus)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="open">Abierto</option>
              <option value="escalated">Escalado</option>
              <option value="resolved">Resuelto</option>
            </select>
          </div>

          <div className="col-span-2">
            <PersonSelect
              label="Asignado a"
              value={assigneeId}
              onChange={setAssigneeId}
            />
          </div>

          {blocker && status === 'resolved' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Notas de resolucion</label>
              <RichTextEditor
                value={resolutionNotes}
                onChange={(html) => setResolutionNotes(html)}
                placeholder="Notas de resolución..."
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : blocker ? 'Actualizar' : 'Reportar Bloqueo'}
          </button>
        </div>
      </div>
    </div>
  )
}
