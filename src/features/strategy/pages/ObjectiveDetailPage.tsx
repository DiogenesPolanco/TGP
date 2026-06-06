import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'

const statusLabel: Record<string, string> = { on_track: 'En Camino', at_risk: 'En Riesgo', behind: 'Atrasado', achieved: 'Logrado', not_started: 'No Iniciado' }
const statusColor: Record<string, string> = { on_track: 'bg-success/10 text-success', at_risk: 'bg-warning/10 text-warning', behind: 'bg-danger/10 text-danger', achieved: 'bg-info/10 text-info', not_started: 'bg-neutral-10 text-neutral-60' }
const krStatusColor: Record<string, string> = { on_track: 'text-success', at_risk: 'text-warning', behind: 'text-danger', achieved: 'text-info', not_started: 'text-neutral-50' }

export function ObjectiveDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const objective = useLiveQuery(() => db.objectives.get(id!), [id])
  const team = useLiveQuery(() => objective?.teamId ? db.teams.get(objective.teamId) : null, [objective])
  const bu = useLiveQuery(() => objective?.businessUnitId ? db.businessUnits.get(objective.businessUnitId) : null, [objective])

  if (!objective) {
    return <DetailLayout title="Objetivo no encontrado" onBack={() => navigate('/strategy/objectives')}><p className="text-neutral-50">El objetivo no existe o ha sido eliminado.</p></DetailLayout>
  }

  return (
    <DetailLayout
      title={objective.title}
      subtitle={objective.description}
      onBack={() => navigate('/strategy/objectives')}
      backLabel="OKRs / KPIs"
      actions={
        <button
          onClick={() => navigate(`/strategy/objectives/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Section title="Información General">
          <Field label="Título" value={objective.title} />
          <Field label="Tipo" value={objective.type === 'okr' ? 'OKR' : objective.type === 'kpi' ? 'KPI' : 'Balanced Scorecard'} />
          <Field label="Equipo" value={team?.name ?? 'Sin asignar'} />
          <Field label="Unidad de Negocio" value={bu?.name ?? 'Sin asignar'} />
        </Section>
        <Section title="Período">
          <Field label="Inicio" value={new Date(objective.periodStart).toLocaleDateString('es-ES')} />
          <Field label="Fin" value={new Date(objective.periodEnd).toLocaleDateString('es-ES')} />
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Progreso</dt>
            <dd className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, objective.progress)}%` }} />
                </div>
                <span className="text-sm font-medium text-neutral-90 dark:text-white">{objective.progress}%</span>
              </div>
            </dd>
          </div>
          <Field label="Estado" value={statusLabel[objective.status] ?? objective.status} />
        </Section>
      </div>

      <div className="pt-6 border-t border-neutral-20 dark:border-neutral-70">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Key Results ({objective.keyResults.length})</h3>
        <div className="space-y-4">
          {objective.keyResults.map((kr) => {
            const pct = kr.target > kr.baseline ? Math.round(((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100) : 0
            return (
              <div key={kr.id} className="p-4 rounded-lg border border-neutral-20 dark:border-neutral-70">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{kr.title}</p>
                    <p className="text-xs text-neutral-50">{kr.measure}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[kr.status]}`}>{statusLabel[kr.status]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-50 mb-2">
                  <span>Baseline: {kr.baseline}</span>
                  <span>Current: <strong className={krStatusColor[kr.status]}>{kr.current}</strong></span>
                  <span>Target: {kr.target}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${kr.status === 'behind' ? 'bg-danger' : kr.status === 'at_risk' ? 'bg-warning' : kr.status === 'achieved' ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </div>
              </div>
            )
          })}
        </div>
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
