import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, Save } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { MemberSelector } from '@/components/ui/MemberSelector'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import type { Commitment } from '@/types/domain'
import type { CommitmentStatus } from '@/constants/enums'
import { Button } from '@/components/ui/Button'

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
        ownerId: ownerId || 'unknown',
        accountableId: accountableId || 'unknown',
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
      <div className="w-full max-w-xl bg-card rounded-2xl border border-boundary shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {commitment ? 'Editar Compromiso' : 'Nuevo Compromiso'}
          </h3>
          <Button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1.5">
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

          <div className="col-span-2 overflow-hidden">
            <label className="block text-sm font-medium text-secondary mb-1.5">Descripcion</label>
            <RichTextEditor
              value={description}
              onChange={(html) => setDescription(html)}
              placeholder="Describe el compromiso..."
            />
          </div>

          <div>
            <MemberSelector
              label="Quien se compromete"
              value={ownerId}
              onChange={setOwnerId}
              required
            />
          </div>

          <div>
            <MemberSelector
              label="Responsable (stakeholder)"
              value={accountableId}
              onChange={setAccountableId}
              required
            />
          </div>

          <div>
            <Select
              label="Equipo"
              value={teamId}
              onChange={setTeamId}
              options={[
                { value: '', label: 'Sin equipo' },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Aplicación"
              value={applicationId}
              onChange={setApplicationId}
              options={[
                { value: '', label: 'Sin app' },
                ...applications.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>

          <div>
            <Select
              label="OKR asociado"
              value={objectiveId}
              onChange={setObjectiveId}
              options={[
                { value: '', label: 'Sin OKR' },
                ...objectives.map((o) => ({ value: o.id, label: o.title })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Entregable asociado"
              value={deliverableId}
              onChange={setDeliverableId}
              options={[
                { value: '', label: 'Sin entregable' },
                ...deliverables.map((d) => ({ value: d.id, label: d.title })),
              ]}
            />
          </div>

          <div>
            <Select
              label="Estado"
              value={status}
              onChange={(v) => setStatus(v as CommitmentStatus)}
              options={statusOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Fecha compromiso <span className="text-danger">*</span>
            </label>
            <DatePicker
              value={commitmentDate}
              onChange={setCommitmentDate}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !commitmentDate || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Guardando...' : commitment ? 'Actualizar' : 'Crear Compromiso'}
          </Button>
        </div>
      </div>
    </div>
  )
}
