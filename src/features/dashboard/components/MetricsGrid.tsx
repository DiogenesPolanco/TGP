import { useNavigate } from 'react-router-dom'
import { AlertTriangle, AlertOctagon, Users, FileWarning, TrendingUp, XCircle, Shield } from 'lucide-react'
import type { DashboardMetrics } from '../hooks/useDashboardMetrics'

interface MetricsGridProps {
  metrics: DashboardMetrics
  enabledWidgets?: Record<string, boolean>
}

function MetricGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-neutral-50 dark:text-neutral-40 uppercase tracking-wider mb-3 px-1">
        {label}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  )
}

export function MetricsGrid({ metrics, enabledWidgets = {} }: MetricsGridProps) {
  const navigate = useNavigate()
  const e = enabledWidgets

  return (
    <div className="space-y-6">
      {(e['kpi-risk-exposure'] !== false || e['kpi-compliance'] !== false || e['kpi-elite-teams'] !== false || e['kpi-overdue-findings'] !== false) && (
        <MetricGroup label="Gobierno y Riesgos">
          {e['kpi-risk-exposure'] !== false && (
            <SmallKpiCard
              title="Exposición de Riesgos"
              value={metrics.totalRiskScore}
              icon={<AlertTriangle size={16} />}
              color="danger"
              onClick={() => navigate('/governance/risks')}
            />
          )}
          {e['kpi-compliance'] !== false && (
            <SmallKpiCard
              title="Compliance Score"
              value={metrics.totalFindings > 0 ? `${Math.round(metrics.complianceScore)}%` : '—'}
              subtitle={metrics.totalFindings > 0 ? `${metrics.overdueFindings} vencidos · ${metrics.closedFindings} cerrados` : 'Sin hallazgos'}
              icon={<FileWarning size={16} />}
              color={metrics.complianceScore >= 80 ? 'success' : metrics.complianceScore >= 50 ? 'warning' : 'danger'}
              onClick={() => navigate('/governance/audit')}
            />
          )}
          {e['kpi-elite-teams'] !== false && (
            <SmallKpiCard
              title="Equipos Elite DORA"
              value={metrics.eliteTeams}
              icon={<Users size={16} />}
              color="success"
              onClick={() => navigate('/teams')}
            />
          )}
          {e['kpi-overdue-findings'] !== false && (
            <SmallKpiCard
              title="Hallazgos Vencidos"
              value={metrics.overdueFindings}
              icon={<Shield size={16} />}
              color={metrics.overdueFindings > 0 ? 'danger' : 'success'}
              subtitle={metrics.overdueFindings > 0 ? `${metrics.totalFindings} hallazgos totales` : undefined}
              onClick={() => navigate('/governance/audit')}
            />
          )}
        </MetricGroup>
      )}

      {(e['kpi-active-plans'] !== false || e['kpi-blockers'] !== false || e['kpi-overdue-commitments'] !== false || e['kpi-activities-today'] !== false) && (
        <MetricGroup label="Ejecución">
          {e['kpi-active-plans'] !== false && (
            <SmallKpiCard
              title="Planes Activos"
              value={metrics.activePlans}
              icon={<TrendingUp size={16} />}
              color="primary"
              onClick={() => navigate('/execution/plans')}
            />
          )}
          {e['kpi-blockers'] !== false && (
            <SmallKpiCard
              title="Bloqueos Abiertos"
              value={metrics.openBlockers}
              icon={<AlertTriangle size={16} />}
              color={metrics.openBlockers > 0 ? 'danger' : 'success'}
              onClick={() => navigate('/execution/daily')}
            />
          )}
          {e['kpi-overdue-commitments'] !== false && (
            <SmallKpiCard
              title="Compromisos Vencidos"
              value={metrics.overdueCommitments}
              icon={<XCircle size={16} />}
              color={metrics.overdueCommitments > 0 ? 'warning' : 'success'}
              onClick={() => navigate('/execution/commitments')}
            />
          )}
          {e['kpi-activities-today'] !== false && (
            <SmallKpiCard
              title="Actividades Hoy"
              value={metrics.activitiesDueToday}
              icon={<AlertOctagon size={16} />}
              color={metrics.activitiesDueToday > 0 ? 'warning' : 'success'}
              onClick={() => navigate('/execution/daily')}
            />
          )}
        </MetricGroup>
      )}
    </div>
  )
}

interface SmallKpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'danger' | 'warning' | 'success' | 'primary' | 'info'
  onClick?: () => void
}

function colorStyles(color: string) {
  const map = {
    danger: { icon: 'text-danger bg-danger/10', dot: 'bg-danger' },
    warning: { icon: 'text-warning bg-warning/10', dot: 'bg-warning' },
    success: { icon: 'text-success bg-success/10', dot: 'bg-success' },
    primary: { icon: 'text-primary bg-primary/10', dot: 'bg-primary' },
    info: { icon: 'text-info bg-info/10', dot: 'bg-info' },
  }
  return map[color as keyof typeof map] ?? map.primary
}

function SmallKpiCard({ title, value, subtitle, icon, color, onClick }: SmallKpiCardProps) {
  const styles = colorStyles(color)

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-neutral-10/50 via-transparent to-transparent dark:from-white/[0.02]" />
      <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-40 ${styles.dot}`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}>
            {icon}
          </div>
        </div>
        <h4 className="text-[11px] font-medium text-neutral-60 dark:text-neutral-40 mb-0.5 uppercase tracking-wider">
          {title}
        </h4>
        <p className="text-xl font-bold text-neutral-90 dark:text-white tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-neutral-50 dark:text-neutral-50 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
