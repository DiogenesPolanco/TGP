import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Commitment } from '@/types/domain'
import type { CommitmentStatus } from '@/constants/enums'

interface CommitmentFormProps {
  commitment: Commitment | null
  onClose: () => void
  onSave: () => void
}

const statusOptions: { value: CommitmentStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'at_risk', label: 'En Riesgo' },
  { value: 'breached', label: 'Incumplido' },
  { value: 'fulfilled', label: 'Cumplido' },
  { value: 'cancelled', label: 'Cancelado' },
]

export function CommitmentForm({ commitment, onClose, onSave }: CommitmentFormProps) {
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []
  const deliverables = useLiveQuery(() => db.deliverables.toArray()) ?? []

  const [title, setTitle] = useState(commitment?.title ?? '')
  const [description, setDescription] = useState(commitment?.description ?? '')
  const [ownerId, setOwnerId] = useState(commitment?.ownerId ?? '')
  const [accountableId, setAccountableId] = useState(commitment?.accountableId ?? '')
  const [teamId, setTeamId] = useState(commitment?.teamId ?? '')
  const [applicationId, setApplicationId] = useState(commitment?.applicationId ?? '')
  const [objectiveId, setObjectiveId] = useState(commitment?.objectiveId ?? '')
  const [deliverableId, setDeliverableId] = useState(commitment?.deliverableId ?? '')
  const [status, setStatus] = useState<CommitmentStatus>(commitment?.status ?? 'active')
  const [commitmentDate, setCommitmentDate] = useState(
    commitment?.commitmentDate
      ? new Date(commitment.commitmentDate).toISOString().split('T')[0]
      : '',
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !commitmentDate) return
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        ownerId: ownerId.trim() || 'unknown',
        accountableId: accountableId.trim() || 'unknown',
        teamId: teamId || null,
        applicationId: applicationId || null,
        objectiveId: objectiveId || null,
        deliverableId: deliverableId || null,
        status,
        commitmentDate: new Date(commitmentDate),
        fulfilledAt: status === 'fulfilled' ? new Date() : (commitment?.fulfilledAt ?? null),
        updatedAt: new Date(),
      }
      if (commitment) {
        await db.commitments.update(commitment.id, data)
      } else {
        await db.commitments.add({
          id: crypto.randomUUID(),
          ...data,
          metadata: {},
          createdAt: new Date(),
        })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {commitment ? 'Editar Compromiso' : 'Nuevo Compromiso'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
              Titulo <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Entregar plan de migracion antes del Q3"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripcion</label>
            <RichTextEditor
              value={description}
              onChange={(html) => setDescription(html)}
              placeholder="Describe el compromiso..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
              Quien se compromete <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="userPrincipal"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
              Responsable (stakeholder) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={accountableId}
              onChange={(e) => setAccountableId(e.target.value)}
              placeholder="userPrincipal"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Equipo</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin equipo</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Aplicacion</label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin app</option>
              {applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">OKR asociado</label>
            <select
              value={objectiveId}
              onChange={(e) => setObjectiveId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin OKR</option>
              {objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Entregable asociado</label>
            <select
              value={deliverableId}
              onChange={(e) => setDeliverableId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin entregable</option>
              {deliverables.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CommitmentStatus)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
              Fecha compromiso <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={commitmentDate}
              onChange={(e) => setCommitmentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !commitmentDate || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : commitment ? 'Actualizar' : 'Crear Compromiso'}
          </button>
        </div>
      </div>
    </div>
  )
}
