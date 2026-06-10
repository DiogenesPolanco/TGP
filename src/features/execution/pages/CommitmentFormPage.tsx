import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import type { CommitmentStatus } from '@/constants/enums'

const statusOptions: { value: CommitmentStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'at_risk', label: 'En Riesgo' },
  { value: 'breached', label: 'Incumplido' },
  { value: 'fulfilled', label: 'Cumplido' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function CommitmentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const commitment = useLiveQuery(() => (id ? db.commitments.get(id) : undefined), [id])
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []
  const deliverables = useLiveQuery(() => db.deliverables.toArray()) ?? []

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ownerId: '',
    accountableId: '',
    teamId: '',
    applicationId: '',
    objectiveId: '',
    deliverableId: '',
    status: 'active' as CommitmentStatus,
    commitmentDate: '',
  })

  useEffect(() => {
    if (commitment) {
      queueMicrotask(() => {
        setFormData({
          title: commitment.title ?? '',
          description: commitment.description ?? '',
          ownerId: commitment.ownerId ?? '',
          accountableId: commitment.accountableId ?? '',
          teamId: commitment.teamId ?? '',
          applicationId: commitment.applicationId ?? '',
          objectiveId: commitment.objectiveId ?? '',
          deliverableId: commitment.deliverableId ?? '',
          status: (commitment.status as CommitmentStatus) ?? 'active',
          commitmentDate: commitment.commitmentDate ? new Date(commitment.commitmentDate).toISOString().split('T')[0] : '',
        })
      })
    }
  }, [commitment])

  if (id && !commitment) return <div className="p-6 text-neutral-50">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.commitmentDate) return
    const data = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      ownerId: formData.ownerId || 'unknown',
      accountableId: formData.accountableId || 'unknown',
      teamId: formData.teamId || null,
      applicationId: formData.applicationId || null,
      objectiveId: formData.objectiveId || null,
      deliverableId: formData.deliverableId || null,
      status: formData.status,
      commitmentDate: new Date(formData.commitmentDate),
      fulfilledAt: formData.status === 'fulfilled' ? new Date() : (commitment?.fulfilledAt ?? null),
      metadata: commitment?.metadata ?? {},
      createdAt: commitment?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }
    if (commitment) {
      await db.commitments.update(commitment.id, data)
      addNotification({ type: 'success', message: 'Compromiso actualizado' })
    } else {
      await db.commitments.add({ id: crypto.randomUUID(), ...data })
      addNotification({ type: 'success', message: 'Compromiso creado' })
    }
    navigate('/execution/commitments')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/execution/commitments')} className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
          {commitment ? 'Editar Compromiso' : 'Nuevo Compromiso'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Título *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ej. Entregar plan de migración antes del Q3" className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Descripción</label>
          <RichTextEditor value={formData.description} onChange={(html) => setFormData({ ...formData, description: html })} placeholder="Describe el compromiso..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PersonSelect
            label="Quien se compromete"
            value={formData.ownerId}
            onChange={(id) => setFormData({ ...formData, ownerId: id })}
            required
          />
          <PersonSelect
            label="Responsable (stakeholder)"
            value={formData.accountableId}
            onChange={(id) => setFormData({ ...formData, accountableId: id })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Equipo</label>
            <select value={formData.teamId} onChange={(e) => setFormData({ ...formData, teamId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin equipo</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Aplicación</label>
            <select value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin app</option>
              {applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">OKR asociado</label>
            <select value={formData.objectiveId} onChange={(e) => setFormData({ ...formData, objectiveId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin OKR</option>
              {objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Entregable asociado</label>
            <select value={formData.deliverableId} onChange={(e) => setFormData({ ...formData, deliverableId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Sin entregable</option>
              {deliverables.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Estado</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CommitmentStatus })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">Fecha compromiso *</label>
            <DatePicker required value={formData.commitmentDate} onChange={(v) => setFormData({ ...formData, commitmentDate: v })} className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/execution/commitments')} className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">{commitment ? 'Actualizar' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
