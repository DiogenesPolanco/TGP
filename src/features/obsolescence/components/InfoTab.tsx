import { formatDuration } from '@/utils/technologyUtils'
import { CheckCircle, Clock, XCircle, HelpCircle, Server, Calendar, Bug } from 'lucide-react'
import { CveInfoPanel } from '@/features/security/components/CveInfoPanel'

const supportStatusLabel: Record<string, string> = {
  active: 'Activo',
  extended: 'Soporte Extendido',
  eol: 'EOL',
  unknown: 'Desconocido',
}

const supportStatusColor: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown:
    'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30 dark:border-neutral-60',
}

const categoryLabel: Record<string, string> = {
  framework: 'Framework',
  language: 'Lenguaje',
  database: 'Base de Datos',
  os: 'OS',
  runtime: 'Runtime',
  library: 'Librería',
  message_broker: 'Message Broker',
  cache: 'Cache',
  web_server: 'Web Server',
  cloud_service: 'Cloud Service',
  tool: 'Herramienta',
  other: 'Otro',
}

function EolBar({ eolDate }: { eolDate: Date | string }) {
  const eol = new Date(eolDate)
  const now = new Date()
  const totalMs = eol.getTime() - new Date(0).getTime()
  const elapsedMs = now.getTime() - new Date(0).getTime()
  const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100))
  const expired = now > eol
  const barColor = expired
    ? 'bg-danger'
    : pct > 80
      ? 'bg-warning'
      : pct > 50
        ? 'bg-severity-high'
        : 'bg-success'
  const remainingDays = Math.ceil((eol.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = Math.ceil((eol.getTime() - new Date(0).getTime()) / (1000 * 60 * 60 * 24))
  const usedDays = totalDays - remainingDays

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-neutral-50">
        <span>{usedDays > 0 ? `Desde hace ${formatDuration(usedDays)}` : 'Inicio'}</span>
        <span className="font-medium">
          {expired ? 'Vencido' : `${formatDuration(remainingDays)} restantes`}
        </span>
      </div>
      <div className="h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, expired ? 100 : pct))}%` }}
        />
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
        {icon && <span className="text-neutral-50">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function MiniField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-medium text-neutral-40 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-neutral-90 dark:text-white">
        {typeof value === 'string' ? value || '—' : value}
      </dd>
    </div>
  )
}

export function InfoTab({
  tech,
  daysUntilEol,
  eolExpired,
}: {
  tech: any
  daysUntilEol: number | null
  eolExpired: boolean
}) {
  const eolDate = tech.eolDate ? new Date(tech.eolDate) : null
  const statusKey = tech.supportStatus as string
  const statusBgColor: Record<string, string> = {
    active: 'bg-success',
    extended: 'bg-warning',
    eol: 'bg-danger',
    unknown: 'bg-neutral-40',
  }

  return (
    <div className="space-y-6">
      {/* Hero status banner */}
      <div
        className={`rounded-xl border p-5 ${supportStatusColor[statusKey] || 'bg-neutral-10'} border-current/20`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${statusBgColor[statusKey] || 'bg-neutral-40'} flex items-center justify-center`}
            >
              {statusKey === 'active' ? (
                <CheckCircle size={24} className="text-white" />
              ) : statusKey === 'extended' ? (
                <Clock size={24} className="text-white" />
              ) : statusKey === 'eol' ? (
                <XCircle size={24} className="text-white" />
              ) : (
                <HelpCircle size={24} className="text-white" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">
                Estado Actual
              </p>
              <p className="text-xl font-bold">{supportStatusLabel[statusKey] || 'Desconocido'}</p>
              {eolDate && (
                <p className="text-sm opacity-80 mt-0.5">
                  {eolExpired
                    ? `EOL vencido el ${eolDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : `EOL: ${eolDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                </p>
              )}
            </div>
          </div>
          {daysUntilEol !== null && (
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums ${eolExpired ? 'opacity-70' : ''}`}>
                {formatDuration(daysUntilEol)}
              </p>
              <p className="text-xs opacity-80">{eolExpired ? 'vencido' : 'restantes'}</p>
            </div>
          )}
        </div>
        {tech.eolDate && (
          <div className="mt-4">
            <EolBar eolDate={tech.eolDate} />
          </div>
        )}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Información General" icon={<Server size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <MiniField label="Nombre" value={tech.name} />
            <MiniField label="Versión" value={tech.version} />
            <MiniField label="Vendor" value={tech.vendor} />
            <MiniField label="Categoría" value={categoryLabel[tech.category] ?? tech.category} />
          </div>
        </Section>

        <Section title="Ciclo de Vida" icon={<Calendar size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <MiniField
              label="Estado"
              value={
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${supportStatusColor[tech.supportStatus]}`}
                >
                  {supportStatusLabel[tech.supportStatus]}
                </span>
              }
            />
            <MiniField
              label="EOL Date"
              value={
                tech.eolDate
                  ? eolDate!.toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No definido'
              }
            />
            {daysUntilEol !== null && (
              <MiniField
                label="Tiempo restante"
                value={
                  eolExpired
                    ? `Vencido hace ${formatDuration(daysUntilEol)}`
                    : formatDuration(daysUntilEol)
                }
              />
            )}
            <MiniField
              label="CVE(s)"
              value={`${tech.cveList?.length ?? 0} conocido${tech.cveList?.length !== 1 ? 's' : ''}`}
            />
          </div>
        </Section>
      </div>

      {tech.cveList.length > 0 && (
        <Section title={`CVEs (${tech.cveList.length})`} icon={<Bug size={18} />}>
          <div className="space-y-3">
            {/* Badge list */}
            <div className="flex flex-wrap gap-2">
              {tech.cveList.map((cve: string) => (
                <span
                  key={cve}
                  className="text-xs px-2.5 py-1 rounded-full bg-danger/10 text-danger font-mono border border-danger/20 hover:bg-danger/20 transition-colors cursor-default"
                >
                  {cve}
                </span>
              ))}
            </div>
            {/* Detail panels */}
            <div className="space-y-2">
              {tech.cveList.map((cve: string) => (
                <CveInfoPanel key={cve} cveId={cve} />
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
