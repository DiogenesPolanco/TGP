import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { DetailLayout } from '@/components/ui/DetailLayout'
import { Pencil } from 'lucide-react'

const supportStatusLabel: Record<string, string> = { active: 'Activo', extended: 'Soporte Extendido', eol: 'EOL', unknown: 'Desconocido' }
const supportStatusColor: Record<string, string> = { active: 'bg-success/10 text-success', extended: 'bg-warning/10 text-warning', eol: 'bg-danger/10 text-danger', unknown: 'bg-neutral-10 text-neutral-60' }
const categoryLabel: Record<string, string> = {
  framework: 'Framework', language: 'Lenguaje', database: 'Base de Datos', os: 'OS',
  runtime: 'Runtime', library: 'Librería', message_broker: 'Message Broker', cache: 'Cache',
  web_server: 'Web Server', cloud_service: 'Cloud Service', tool: 'Herramienta', other: 'Otro',
}

export function TechnologyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const tech = useLiveQuery(() => db.technologies.get(id!), [id])

  if (!tech) {
    return <DetailLayout title="Tecnología no encontrada" onBack={() => navigate('/catalog/obsolescence')}><p className="text-neutral-50">La tecnología no existe o ha sido eliminada.</p></DetailLayout>
  }

  const now = new Date()
  const eolDate = tech.eolDate ? new Date(tech.eolDate) : null
  const daysUntilEol = eolDate ? Math.ceil((eolDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <DetailLayout
      title={`${tech.name} ${tech.version}`}
      subtitle={`${tech.vendor} · ${categoryLabel[tech.category] ?? tech.category}`}
      onBack={() => navigate('/catalog/obsolescence')}
      backLabel="Obsolescencia"
      actions={
        <button
          onClick={() => navigate(`/catalog/obsolescence/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Pencil size={16} />
          Editar
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Información General">
          <Field label="Nombre" value={tech.name} />
          <Field label="Versión" value={tech.version} />
          <Field label="Vendor" value={tech.vendor} />
          <Field label="Categoría" value={categoryLabel[tech.category] ?? tech.category} />
        </Section>
        <Section title="Ciclo de Vida">
          <div className="flex items-start gap-2">
            <dt className="text-xs font-medium text-neutral-50 uppercase tracking-wider min-w-[100px] pt-0.5">Estado</dt>
            <dd className={`text-sm font-medium px-2 py-0.5 rounded ${supportStatusColor[tech.supportStatus]}`}>{supportStatusLabel[tech.supportStatus]}</dd>
          </div>
          <Field label="EOL Date" value={tech.eolDate ? new Date(tech.eolDate).toLocaleDateString('es-ES') : 'No definido'} />
          {daysUntilEol !== null && (
            <Field label="Días restantes" value={daysUntilEol >= 0 ? `${daysUntilEol} días` : `Vencido hace ${Math.abs(daysUntilEol)} días`} />
          )}
        </Section>
      </div>
      {tech.cveList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-20 dark:border-neutral-70">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-3">CVEs ({tech.cveList.length})</h3>
          <div className="flex flex-wrap gap-2">
            {tech.cveList.map((cve) => (
              <span key={cve} className="text-xs px-2 py-1 rounded bg-danger/10 text-danger font-mono">{cve}</span>
            ))}
          </div>
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
