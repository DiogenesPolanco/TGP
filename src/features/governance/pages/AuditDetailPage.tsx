import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'

const severityLabel: Record<string, string> = { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Info' }
const statusLabel: Record<string, string> = { open: 'Abierto', in_progress: 'En Progreso', overdue: 'Vencido', resolved: 'Resuelto', closed: 'Cerrado' }
const categoryLabel: Record<string, string> = { security: 'Seguridad', compliance: 'Cumplimiento', architecture: 'Arquitectura', process: 'Proceso', data_governance: 'Data Gov.', access_control: 'Acceso', business_continuity: 'Continuidad' }

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const finding = useLiveQuery(() => db.auditFindings.get(id!), [id])
  const app = useLiveQuery(() => finding?.applicationId ? db.applications.get(finding.applicationId) : null, [finding])

  if (!finding) {
    return <DetailLayout title="Hallazgo no encontrado" onBack={() => navigate('/governance/audit')}><p className="text-neutral-50">El hallazgo no existe o ha sido eliminado.</p></DetailLayout>
  }

  // eslint-disable-next-line react-hooks/purity
  const slaDays = Math.ceil((new Date(finding.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const slaColor = slaDays < 0 ? 'text-danger' : slaDays <= 7 ? 'text-warning' : 'text-success'

  return (
    <DetailLayout
      title={finding.title}
      subtitle={`Ref: ${finding.auditReference}`}
      onBack={() => navigate('/governance/audit')}
      backLabel="Auditoría"
      actions={
        <button
          onClick={() => navigate(`/governance/audit/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Título" value={finding.title} />
          <Field label="Descripción" value={finding.description} />
          <Field label="Referencia" value={finding.auditReference} />
          <Field label="Categoría" value={categoryLabel[finding.category] ?? finding.category} />
          <Field label="Aplicación" value={app?.name ?? 'Sin asignar'} />
        </Section>
        <Section title="Clasificación">
          <Field label="Severidad" value={severityLabel[finding.severity] ?? finding.severity} />
          <Field label="Estado" value={statusLabel[finding.status] ?? finding.status} />
          <Field label="Vencimiento" value={new Date(finding.dueDate).toLocaleDateString('es-ES')} />
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">SLA</dt>
            <dd className={`text-sm font-medium ${slaColor}`}>{slaDays < 0 ? `${Math.abs(slaDays)}d vencido` : `${slaDays}d restantes`}</dd>
          </div>
        </Section>
      </div>

      {finding.actionPlan && (
        <div className="mt-6 pt-6 border-t border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-3">Plan de Acción</h3>
          <p className="text-sm text-neutral-70 dark:text-neutral-30 mb-4">{finding.actionPlan.description}</p>
          {finding.actionPlan.items.length > 0 && (
            <ul className="space-y-2">
              {finding.actionPlan.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.isCompleted ? 'bg-success border-success' : 'border-neutral-40'}`}>
                    {item.isCompleted && <span className="text-white text-[10px]">✓</span>}
                  </span>
                  <span className={`${item.isCompleted ? 'line-through text-neutral-50' : 'text-neutral-90 dark:text-white'}`}>{item.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
