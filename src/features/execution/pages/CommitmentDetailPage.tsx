import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'
import type { CommitmentStatus } from '@/constants/enums'

const statusConfig: Record<CommitmentStatus, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-info/10 text-info' },
  at_risk: { label: 'En Riesgo', color: 'bg-warning/10 text-warning' },
  breached: { label: 'Incumplido', color: 'bg-danger/10 text-danger' },
  fulfilled: { label: 'Cumplido', color: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelado', color: 'bg-neutral-10 text-neutral-60' },
}

export function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const commitment = useLiveQuery(() => db.commitments.get(id!), [id])
  const team = useLiveQuery(() => commitment?.teamId ? db.teams.get(commitment.teamId) : undefined, [commitment])
  const app = useLiveQuery(() => commitment?.applicationId ? db.applications.get(commitment.applicationId) : undefined, [commitment])
  const objective = useLiveQuery(() => commitment?.objectiveId ? db.objectives.get(commitment.objectiveId) : undefined, [commitment])

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const daysInfo = useMemo(() => {
    if (!commitment) return null
    const d = new Date(commitment.commitmentDate)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: `${Math.abs(diff)}d vencido`, urgent: true }
    if (diff === 0) return { label: 'Hoy', urgent: true }
    if (diff <= 3) return { label: `En ${diff}d`, urgent: true }
    return { label: `En ${diff}d`, urgent: false }
  }, [commitment, today])

  if (!commitment || !daysInfo) {
    return <DetailLayout title="Compromiso no encontrado" onBack={() => navigate('/execution/commitments')}><p className="text-neutral-50">El compromiso no existe o ha sido eliminado.</p></DetailLayout>
  }

  const cfg = statusConfig[commitment.status]

  return (
    <DetailLayout
      title={commitment.title}
      subtitle={commitment.description}
      onBack={() => navigate('/execution/commitments')}
      backLabel="Compromisos"
      actions={
        <button
          onClick={() => navigate(`/execution/commitments/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Título" value={commitment.title} />
          <Field label="Descripción" value={commitment.description} />
          <Field label="Owner" value={commitment.ownerId} />
          <Field label="Responsable" value={commitment.accountableId} />
          <Field label="Equipo" value={team?.name ?? 'Sin asignar'} />
          <Field label="Aplicación" value={app?.name ?? 'Sin asignar'} />
          <Field label="OKR" value={objective?.title ?? 'Sin asignar'} />
        </Section>
        <Section title="Estado y Fechas">
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Estado</dt>
            <dd className={`text-sm font-medium px-2 py-0.5 rounded ${cfg.color}`}>{cfg.label}</dd>
          </div>
          <Field label="Fecha Compromiso" value={new Date(commitment.commitmentDate).toLocaleDateString('es-ES')} />
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Cuenta</dt>
            <dd className={`text-sm font-medium ${daysInfo.urgent ? 'text-danger' : 'text-neutral-90 dark:text-white'}`}>{daysInfo.label}</dd>
          </div>
          {commitment.fulfilledAt && <Field label="Cumplido" value={new Date(commitment.fulfilledAt).toLocaleDateString('es-ES')} />}
        </Section>
      </div>
    </DetailLayout>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white flex-1">{value || '—'}</dd>
    </div>
  )
}
