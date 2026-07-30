import { ArrowRight, ExternalLink, Search, Server, Box, Database, Users, Shield, Activity, FileWarning, BookOpen, CircleUser, Scale } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

interface RelatedData {
  apps: any[]
  microservices: any[]
  databases: any[]
  people: string[]
  vulns: any[]
  incidents: any[]
  risks: any[]
  auditFindings: any[]
}

const criticalityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

const criticalityColor: Record<string, string> = {
  critical: 'bg-danger/10 text-danger',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info',
  low: 'bg-success/10 text-success',
}

const lifecycleLabel: Record<string, string> = {
  active: 'Activo',
  evolving: 'Evolución',
  deprecated: 'Deprecado',
  decommissioned: 'Retirado',
  planned: 'Planificado',
}

const lifecycleColor: Record<string, string> = {
  active: 'bg-success/10 text-success',
  evolving: 'bg-info/10 text-info',
  deprecated: 'bg-warning/10 text-warning',
  decommissioned: 'bg-danger/10 text-danger',
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
}

function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    info: 'bg-info/10 text-info border-info/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    neutral: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  }
  const iconMap: Record<string, string> = {
    primary: 'text-primary',
    info: 'text-info',
    danger: 'text-danger',
    warning: 'text-warning',
    purple: 'text-purple-500',
    neutral: 'text-neutral-50',
  }
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${colorMap[color] || colorMap.neutral}`}
    >
      <span className={`shrink-0 ${iconMap[color] || iconMap.neutral}`}>{icon}</span>
      <div>
        <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
        <p className="text-xs leading-tight mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  )
}

function EntitySection({
  title,
  count,
  icon,
  color,
  empty,
  children,
}: {
  title: string
  count: number
  icon: React.ReactNode
  color: string
  empty: string
  children: React.ReactNode
}) {
  const accentColor =
    color === 'primary'
      ? 'bg-primary/10 border-primary/20'
      : color === 'info'
        ? 'bg-info/10 border-info/20'
        : color === 'purple'
          ? 'bg-purple-500/10 border-purple-500/20'
          : 'bg-neutral-10 dark:bg-neutral-70 border-neutral-30 dark:border-neutral-60'

  return (
    <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      <div
        className={`px-5 py-3 border-b border-boundary flex items-center justify-between ${count > 0 ? '' : 'opacity-60'}`}
      >
        <div className="flex items-center gap-2">
          <span className={`p-1 rounded-md ${count > 0 ? accentColor : ''}`}>{icon}</span>
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">{title}</h3>
          <span className="text-xs font-medium text-neutral-50 bg-neutral-10 dark:bg-neutral-70 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {count === 0 ? (
          <p className="text-xs text-neutral-50 py-4 text-center">{empty}</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function EntityCard({
  name,
  subtitle,
  badge,
  badgeColor,
  onClick,
}: {
  name: string
  subtitle: string
  badge: string
  badgeColor: string
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-neutral-5 dark:bg-neutral-85 border border-boundary hover:border-primary/30 hover:shadow-sm transition-all group text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-90 dark:text-white group-hover:text-primary transition-colors truncate">
            {name}
          </span>
          {badge && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-50 mt-0.5 truncate">{subtitle}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-neutral-40 group-hover:text-primary transition-colors shrink-0"
      />
    </Button>
  )
}

function ImpactCard({
  title,
  count,
  icon,
  color,
  items,
  linkLabel,
  onLink,
}: {
  title: string
  count: number
  icon: React.ReactNode
  color: string
  items: any[]
  linkLabel: string
  onLink: () => void
}) {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    danger: { bg: 'bg-danger/5 border-danger/20', text: 'text-danger', dot: 'bg-danger' },
    warning: { bg: 'bg-warning/5 border-warning/20', text: 'text-warning', dot: 'bg-warning' },
    neutral: {
      bg: 'bg-neutral-5 dark:bg-neutral-85 border-boundary',
      text: 'text-neutral-60',
      dot: 'bg-neutral-40',
    },
  }
  const style = colorMap[color] || colorMap.neutral

  return (
    <div className={`rounded-lg border p-4 ${style.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={style.text}>{icon}</span>
          <h4 className="text-sm font-semibold text-neutral-90 dark:text-white">{title}</h4>
        </div>
        <span className={`text-lg font-bold tabular-nums ${style.text}`}>{count}</span>
      </div>
      {items.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 text-xs text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
              <span className="truncate">{item.title || item.name || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-50 mb-3">Sin registros</p>
      )}
      {count > 0 && (
        <Button
          onClick={onLink}
          className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
        >
          {linkLabel}
          <ExternalLink size={12} />
        </Button>
      )}
    </div>
  )
}

function countSeverity(items: any[]): string {
  if (items.length === 0) return 'neutral'
  const critical = items.filter((i) => i.severity === 'critical' || i.severity === 'high').length
  const medium = items.filter((i) => i.severity === 'medium').length
  if (critical > 0) return 'danger'
  if (medium > 0) return 'warning'
  return 'neutral'
}

export function RelationsTab({ data }: { data: RelatedData }) {
  const navigate = useNavigate()

  const counts = {
    apps: data.apps.length,
    ms: data.microservices.length,
    dbs: data.databases.length,
    vulns: data.vulns.length,
    incidents: data.incidents.length,
    risks: data.risks.length,
    audit: data.auditFindings.length,
    people: data.people.length,
  }

  const totalImpact =
    data.vulns.length + data.incidents.length + data.risks.length + data.auditFindings.length

  return (
    <div className="space-y-6">
      {/* Hero section — Quick overview */}
      <div className="bg-gradient-to-br from-neutral-5 to-neutral-10 dark:from-neutral-85 dark:to-neutral-80 rounded-xl border border-boundary p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Panorama General de Impacto
            </h3>
            <p className="text-xs text-neutral-50 mt-0.5">
              Componentes vinculados a esta tecnología en todo el portafolio
            </p>
          </div>
          {totalImpact > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">
                {totalImpact}
              </p>
              <p className="text-xs text-neutral-50">Entidades vinculadas</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatBadge icon={<Server size={16} />} value={counts.apps} label="Aplicaciones" color="primary" />
          <StatBadge icon={<Box size={16} />} value={counts.ms} label="Microservicios" color="info" />
          <StatBadge icon={<Database size={16} />} value={counts.dbs} label="Bases de Datos" color="purple" />
          <StatBadge icon={<Shield size={16} />} value={counts.vulns} label="Vulnerabilidades" color={counts.vulns > 0 ? 'danger' : 'neutral'} />
          <StatBadge icon={<Activity size={16} />} value={counts.incidents} label="Incidentes" color={counts.incidents > 0 ? 'danger' : 'neutral'} />
          <StatBadge icon={<FileWarning size={16} />} value={counts.risks} label="Riesgos" color={counts.risks > 0 ? 'warning' : 'neutral'} />
          <StatBadge icon={<BookOpen size={16} />} value={counts.audit} label="Auditoría" color={counts.audit > 0 ? 'warning' : 'neutral'} />
          <StatBadge icon={<Users size={16} />} value={counts.people} label="Personas" color="primary" />
        </div>
      </div>

      {/* Entity sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EntitySection
          title="Aplicaciones"
          count={data.apps.length}
          icon={<Server size={16} />}
          color="primary"
          empty="Sin aplicaciones usando esta tecnología"
        >
          {data.apps.map((app) => (
            <EntityCard
              key={app.id}
              name={app.name}
              subtitle={`Owner: ${app.ownerName || '—'}`}
              badge={criticalityLabel[app.criticality] || ''}
              badgeColor={criticalityColor[app.criticality] || ''}
              onClick={() => navigate(`/catalog/applications/${app.id}`)}
            />
          ))}
        </EntitySection>

        <EntitySection
          title="Microservicios"
          count={data.microservices.length}
          icon={<Box size={16} />}
          color="info"
          empty="Sin microservicios usando esta tecnología"
        >
          {data.microservices.map((ms) => (
            <EntityCard
              key={ms.id}
              name={ms.name}
              subtitle={`Tech Lead: ${ms.technicalLead || '—'}`}
              badge={lifecycleLabel[ms.lifecycleStatus] || ''}
              badgeColor={lifecycleColor[ms.lifecycleStatus] || ''}
              onClick={() => navigate(`/catalog/microservices/${ms.id}`)}
            />
          ))}
        </EntitySection>

        <EntitySection
          title="Bases de Datos"
          count={data.databases.length}
          icon={<Database size={16} />}
          color="purple"
          empty="Sin bases de datos usando esta tecnología"
        >
          {data.databases.map((db) => (
            <EntityCard
              key={db.id}
              name={db.name}
              subtitle={`${db.engine} ${db.version} · ${db.environment === 'production' ? 'Producción' : db.environment === 'staging' ? 'Staging' : 'Desarrollo'}`}
              badge={db.dbType || ''}
              badgeColor="bg-neutral-10 dark:bg-neutral-70 text-muted"
              onClick={() => navigate(`/catalog/applications/${db.applicationId}`)}
            />
          ))}
        </EntitySection>

        <EntitySection
          title="Personas"
          count={data.people.length}
          icon={<Users size={16} />}
          color="primary"
          empty="Sin personas responsables identificadas"
        >
          <div className="flex flex-wrap gap-2">
            {data.people.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-10 dark:bg-neutral-70 border border-neutral-20 dark:border-neutral-60 hover:border-primary/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <CircleUser size={16} />
                </div>
                <span className="text-sm font-medium text-neutral-90 dark:text-white">{name}</span>
              </div>
            ))}
          </div>
        </EntitySection>
      </div>

      {/* Security & Governance section */}
      {data.vulns.length + data.incidents.length + data.risks.length + data.auditFindings.length > 0 && (
        <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-boundary bg-gradient-to-r from-transparent via-neutral-5 to-transparent dark:via-neutral-85">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
              <Scale size={16} className="text-primary" />
              Seguridad y Gobierno — Entidades Vinculadas
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ImpactCard
                title="Vulnerabilidades"
                count={data.vulns.length}
                icon={<Shield size={20} />}
                color={countSeverity(data.vulns)}
                items={data.vulns.slice(0, 4)}
                linkLabel="Ver vulnerabilidades"
                onLink={() => navigate('/security/vulnerabilities')}
              />
              <ImpactCard
                title="Incidentes"
                count={data.incidents.length}
                icon={<Activity size={20} />}
                color={countSeverity(data.incidents)}
                items={data.incidents.slice(0, 4)}
                linkLabel="Ver incidentes"
                onLink={() => navigate('/security/incidents')}
              />
              <ImpactCard
                title="Riesgos"
                count={data.risks.length}
                icon={<FileWarning size={20} />}
                color={countSeverity(data.risks)}
                items={data.risks.slice(0, 4)}
                linkLabel="Ver riesgos"
                onLink={() => navigate('/governance/risks')}
              />
              <ImpactCard
                title="Hallazgos de Auditoría"
                count={data.auditFindings.length}
                icon={<BookOpen size={20} />}
                color={countSeverity(data.auditFindings)}
                items={data.auditFindings.slice(0, 4)}
                linkLabel="Ver hallazgos"
                onLink={() => navigate('/governance/audit')}
              />
            </div>
          </div>
        </div>
      )}

      {/* No data at all */}
      {data.apps.length === 0 &&
        data.microservices.length === 0 &&
        data.databases.length === 0 &&
        data.people.length === 0 &&
        totalImpact === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-boundary shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-neutral-10 dark:bg-neutral-70 flex items-center justify-center mb-4">
              <Search size={24} className="text-neutral-50" />
            </div>
            <p className="text-sm font-medium text-neutral-90 dark:text-white">
              Sin entidades relacionadas
            </p>
            <p className="text-xs text-neutral-50 mt-1">
              Esta tecnología no está vinculada a ninguna aplicación, microservicio u otra entidad
              del portafolio.
            </p>
          </div>
        )}
    </div>
  )
}
