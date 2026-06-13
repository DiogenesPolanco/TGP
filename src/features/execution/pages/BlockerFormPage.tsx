import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft, Save } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Select } from '@/components/ui/Select'

import type { BlockerSeverity, BlockerStatus } from '@/constants/enums'

export function BlockerFormPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()

  const blocker = useLiveQuery(() => (id ? db.blockers.get(id) : undefined), [id])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<BlockerSeverity>('medium')
  const [status, setStatus] = useState<BlockerStatus>('open')
  const [assigneeId, setAssigneeId] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [sourceType, setSourceType] = useState<'task' | 'activity' | 'plan' | 'commitment'>('plan')
  const [sourceId, setSourceId] = useState('')
  const [saving, setSaving] = useState(false)

  const isNew = !id

  useEffect(() => {
    if (blocker) {
      queueMicrotask(() => {
        setTitle(blocker.title ?? '')
        setDescription(blocker.description ?? '')
        setSeverity(blocker.severity ?? 'medium')
        setStatus(blocker.status ?? 'open')
        setAssigneeId(blocker.assigneeId ?? '')
        setResolutionNotes(blocker.resolutionNotes ?? '')
        setSourceType(blocker.sourceType)
        setSourceId(blocker.sourceId)
      })
    } else if (isNew) {
      const urlSourceType = searchParams.get('sourceType') as 'task' | 'activity' | 'plan' | 'commitment' | null
      const urlSourceId = searchParams.get('sourceId')
      if (urlSourceType && urlSourceId) {
        queueMicrotask(() => {
          setSourceType(urlSourceType)
          setSourceId(urlSourceId)
        })
      }
    }
  }, [blocker, isNew, searchParams])

  if (id && !blocker) return <div className="p-6 text-neutral-50">Cargando…</div>

  const handleSave = async () => {
    if (!title.trim() || (isNew && !sourceId.trim())) return
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
        addNotification({ type: 'success', message: 'Bloqueo actualizado' })
      } else {
        await db.blockers.add({
          id: crypto.randomUUID(),
          ...data,
          metadata: {},
          createdAt: now,
        })
        addNotification({ type: 'success', message: 'Bloqueo reportado' })
      }
      navigate('/execution/daily')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/execution/daily')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {blocker ? 'Editar Bloqueo' : 'Reportar Bloqueo'}
        </h1>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Título <span className="text-danger">*</span>
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
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripción</label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Qué está bloqueando, desde cuándo, qué se necesita…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select label="Severidad" value={severity} onChange={(v) => setSeverity(v as BlockerSeverity)} options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
              { value: 'critical', label: 'Crítica' },
            ]} />
          </div>

          <div>
            <Select label="Estado" value={status} onChange={(v) => setStatus(v as BlockerStatus)} options={[
              { value: 'open', label: 'Abierto' },
              { value: 'escalated', label: 'Escalado' },
              { value: 'resolved', label: 'Resuelto' },
            ]} />
          </div>

          {isNew && (
            <>
              <div>
                <Select label="Tipo de Origen" value={sourceType} onChange={(v) => setSourceType(v as 'task' | 'activity' | 'plan' | 'commitment')} options={[
                  { value: 'plan', label: 'Plan' },
                  { value: 'activity', label: 'Actividad' },
                  { value: 'task', label: 'Tarea' },
                  { value: 'commitment', label: 'Compromiso' },
                ]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
                  ID del Origen <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  placeholder="ID de la entidad"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          <div className="col-span-2">
            <PersonSelect
              label="Asignado a"
              value={assigneeId}
              onChange={setAssigneeId}
            />
          </div>

          {blocker && status === 'resolved' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Notas de resolución</label>
              <RichTextEditor
                value={resolutionNotes}
                onChange={(html) => setResolutionNotes(html)}
                placeholder="Notas de resolución…"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/execution/daily')}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || (isNew && !sourceId.trim()) || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando…' : blocker ? 'Actualizar' : 'Reportar Bloqueo'}
          </button>
        </div>
      </div>
    </div>
  )
}
