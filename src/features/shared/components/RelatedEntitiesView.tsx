import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  Server, Box, Shield, Activity, FileWarning,
  ArrowRight, Search, Database,
} from 'lucide-react'
import type { Application, Microservice, Vulnerability, Incident, Risk, AuditFinding } from '@/types/domain'

/* ─── Types ─── */

export interface RelatedData {
  apps: Application[]
  microservices: Microservice[]
  vulns: Vulnerability[]
  incidents: Incident[]
  risks: Risk[]
  auditFindings: AuditFinding[]
}

/* ─── Props ─── */

interface Props {
  data: RelatedData
  entityLabel: string
}

/* ─── Component ─── */

export function RelatedEntitiesView({ data, entityLabel }: Props) {
  const navigate = useNavigate()

  const counts = {
    apps: data.apps.length,
    ms: data.microservices.length,
    vulns: data.vulns.length,
    incidents: data.incidents.length,
    risks: data.risks.length,
    audit: data.auditFindings.length,
  }

  const totalImpact = data.vulns.length + data.incidents.length + data.risks.length + data.auditFindings.length

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-neutral-5 to-neutral-10 dark:from-neutral-85 dark:to-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Panorama General
            </h3>
            <p className="text-xs text-neutral-50 mt-0.5">
              Entidades vinculadas a {entityLabel} en todo el portafolio
            </p>
          </div>
          {totalImpact > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">{totalImpact}</p>
              <p className="text-xs text-neutral-50">Entidades vinculadas</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBadge icon={<Server size={16} />} value={counts.apps} label="Aplicaciones" color="primary" />
          <StatBadge icon={<Box size={16} />} value={counts.ms} label="Microservicios" color="info" />
          <StatBadge icon={<Shield size={16} />} value={counts.vulns} label="Vulnerabilidades" color={counts.vulns > 0 ? 'danger' : 'neutral'} />
          <StatBadge icon={<Activity size={16} />} value={counts.incidents} label="Incidentes" color={counts.incidents > 0 ? 'danger' : 'neutral'} />
          <StatBadge icon={<FileWarning size={16} />} value={counts.risks} label="Riesgos" color={counts.risks > 0 ? 'warning' : 'neutral'} />
          <StatBadge icon={<Database size={16} />} value={counts.audit} label="Auditoría" color={counts.audit > 0 ? 'warning' : 'neutral'} />
        </div>
      </div>

      {/* Entity sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EntitySection title="Aplicaciones" count={data.apps.length} icon={<Server size={16} />} color="primary" empty="Sin aplicaciones vinculadas">
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

        <EntitySection title="Microservicios" count={data.microservices.length} icon={<Box size={16} />} color="info" empty="Sin microservicios vinculados">
          {data.microservices.map((ms) => (
            <EntityCard
              key={ms.id}
              name={ms.name}
              subtitle={`Tech Lead: ${ms.technicalLead || '—'}`}
              badge={lifecycleLabel[ms.lifecycleStatus ?? ''] ?? ''}
              badgeColor={lifecycleColor[ms.lifecycleStatus ?? ''] ?? ''}
              onClick={() => navigate(`/catalog/microservices/${ms.id}`)}
            />
          ))}
        </EntitySection>

        <EntitySection title="Vulnerabilidades" count={data.vulns.length} icon={<Shield size={16} />} color={counts.vulns > 0 ? 'danger' : 'neutral'} empty="Sin vulnerabilidades">
          {data.vulns.map((v) => (
            <SimpleCard key={v.id} title={v.title} subtitle={severityLabel[v.severity] ?? v.severity} onClick={() => navigate(`/security/vulnerabilities/${v.id}`)} />
          ))}
        </EntitySection>

        <EntitySection title="Incidentes" count={data.incidents.length} icon={<Activity size={16} />} color={counts.incidents > 0 ? 'danger' : 'neutral'} empty="Sin incidentes">
          {data.incidents.map((i) => (
            <SimpleCard key={i.id} title={i.title} subtitle={severityLabel[i.severity] ?? i.severity} onClick={() => navigate(`/security/incidents/${i.id}`)} />
          ))}
        </EntitySection>

        <EntitySection title="Riesgos" count={data.risks.length} icon={<FileWarning size={16} />} color={counts.risks > 0 ? 'warning' : 'neutral'} empty="Sin riesgos">
          {data.risks.map((r) => (
            <SimpleCard key={r.id} title={r.title} subtitle={`Score: ${r.riskScore}`} onClick={() => navigate(`/governance/risks/${r.id}`)} />
          ))}
        </EntitySection>

        <EntitySection title="Hallazgos de Auditoría" count={data.auditFindings.length} icon={<Database size={16} />} color={counts.audit > 0 ? 'warning' : 'neutral'} empty="Sin hallazgos">
          {data.auditFindings.map((a) => (
            <SimpleCard key={a.id} title={a.title} subtitle={severityLabel[a.severity] ?? a.severity} onClick={() => navigate(`/governance/audit/${a.id}`)} />
          ))}
        </EntitySection>
      </div>
    </div>
  )
}

/* ─── Sub-components ─── */

const severityLabel: Record<string, string> = {
  critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', info: 'Info',
}
const criticalityColor: Record<string, string> = {
  critical: 'bg-danger/10 text-danger', high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info', low: 'bg-success/10 text-success',
}
const criticalityLabel: Record<string, string> = {
  critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja',
}
const lifecycleLabel: Record<string, string> = {
  active: 'Activo', evolving: 'Evolución', deprecated: 'Deprecado',
  decommissioned: 'Retirado', planned: 'Planificado',
}
const lifecycleColor: Record<string, string> = {
  active: 'bg-success/10 text-success', evolving: 'bg-info/10 text-info',
  deprecated: 'bg-warning/10 text-warning', decommissioned: 'bg-danger/10 text-danger',
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
}

function StatBadge({ icon, value, label, color }: { icon: ReactNode; value: number; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    info: 'text-info bg-info/10',
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
    neutral: 'text-neutral-60 bg-neutral-10 dark:bg-neutral-70',
    purple: 'text-purple-500 bg-purple-500/10',
  }
  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-85`}>
      <div className={`p-1.5 rounded-md ${colorMap[color] || colorMap.neutral}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold text-neutral-90 dark:text-white tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-neutral-50 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function EntitySection({ title, count, icon, color, empty, children }: {
  title: string; count: number; icon: ReactNode; color: string; empty: string; children: ReactNode
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary/5 border-primary/20', text: 'text-primary' },
    info: { bg: 'bg-info/5 border-info/20', text: 'text-info' },
    danger: { bg: 'bg-danger/5 border-danger/20', text: 'text-danger' },
    warning: { bg: 'bg-warning/5 border-warning/20', text: 'text-warning' },
    neutral: { bg: 'bg-neutral-5 dark:bg-neutral-85 border-neutral-20 dark:border-neutral-70', text: 'text-neutral-60' },
  }
  const style = colorMap[color] || colorMap.neutral
  return (
    <div className={`rounded-xl border ${style.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={style.text}>{icon}</span>
          <h4 className="text-sm font-semibold text-neutral-90 dark:text-white">{title}</h4>
        </div>
        <span className={`text-lg font-bold tabular-nums ${style.text}`}>{count}</span>
      </div>
      {count > 0 ? (
        <div className="space-y-1.5">{children}</div>
      ) : (
        <p className="text-xs text-neutral-50">{empty}</p>
      )}
    </div>
  )
}

function EntityCard({ name, subtitle, badge, badgeColor, onClick }: {
  name: string; subtitle: string; badge?: string; badgeColor?: string; onClick: () => void
}) {
  return (
    <Button variant="ghost" size="md" onClick={onClick}
      className="w-full justify-between px-3.5 py-2.5 rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-85 hover:border-primary/30 hover:shadow-sm group text-left">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-90 dark:text-white group-hover:text-primary transition-colors truncate">{name}</span>
          {badge && <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${badgeColor}`}>{badge}</span>}
        </div>
        <p className="text-xs text-neutral-50 mt-0.5 truncate">{subtitle}</p>
      </div>
      <ArrowRight size={14} className="text-neutral-40 group-hover:text-primary transition-colors shrink-0" />
    </Button>
  )
}

function SimpleCard({ title, subtitle, onClick }: { title: string; subtitle: string; onClick?: () => void }) {
  const content = (
    <>
      <span className={`text-sm truncate min-w-0 flex-1 ${onClick ? 'group-hover:text-primary transition-colors' : 'text-neutral-90 dark:text-white'}`}>{title}</span>
      <span className="text-xs text-neutral-50 shrink-0 ml-2">{subtitle}</span>
    </>
  )

  if (onClick) {
    return (
      <Button variant="ghost" size="md" onClick={onClick}
        className="w-full justify-between px-3.5 py-2 rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-85 hover:border-primary/30 hover:shadow-sm group">
        {content}
      </Button>
    )
  }

  return (
    <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-white dark:bg-neutral-85 border border-neutral-20 dark:border-neutral-70">
      {content}
    </div>
  )
}


