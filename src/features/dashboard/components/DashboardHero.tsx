import { useNavigate } from 'react-router'
import { ThiGauge } from '@/components/charts/ThiGauge'
import { ThiSparkline } from './ThiSparkline'
import type { DashboardMetrics } from '../hooks/useDashboardMetrics'

interface DashboardHeroProps {
  metrics: DashboardMetrics
  enabledWidgets?: Record<string, boolean>
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'neutral') return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        trend === 'up' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}
    >
      <span className="text-base leading-none">{trend === 'up' ? '↑' : '↓'}</span>
      {trend === 'up' ? 'Mejorando' : 'Declinando'}
    </span>
  )
}

export function DashboardHero({ metrics, enabledWidgets = {} }: DashboardHeroProps) {
  const { thi, thiHistory, thiTrend, loading } = metrics
  const score = Math.round(thi?.overallScore ?? 0)
  const navigate = useNavigate()

  const navigateToVulns = () => navigate('/security/vulnerabilities')
  const navigateToIncidents = () => navigate('/security/incidents')
  const navigateToApps = () => navigate('/catalog/applications')
  const navigateToObsolescence = () => navigate('/catalog/obsolescence')

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-1 bg-card rounded-2xl p-6 h-80" />
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5 h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {enabledWidgets['thi-gauge'] !== false && (
        <div className="lg:col-span-1 relative overflow-hidden bg-card rounded-2xl border border-boundary p-6 shadow-sm">
          {/* Subtle background gradient mesh */}
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-[0.04] dark:opacity-[0.08]"
            style={{
              background: `radial-gradient(circle, ${
                score >= 70 ? '#36B37E' : score >= 50 ? '#FFAB00' : '#FF5630'
              } 0%, transparent 70%)`,
            }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-secondary tracking-wide uppercase">
                Technology Health Index
              </h2>
              <TrendBadge trend={thiTrend} />
            </div>

            <div className="flex flex-col items-center">
              <ThiGauge value={score} size={220} showLabel />
            </div>

            {/* Sparkline + narrative */}
            {thiHistory.length >= 2 && (
              <div className="mt-4 pt-4 border-t border-boundary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-neutral-50 dark:text-neutral-40 uppercase tracking-wider">
                    Tendencia
                  </span>
                  <span className="text-[11px] text-neutral-40 dark:text-neutral-50">
                    Últimos {thiHistory.length} registros
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ThiSparkline
                      data={thiHistory}
                      width={160}
                      height={36}
                      color={score >= 70 ? '#36B37E' : score >= 50 ? '#FFAB00' : '#FF5630'}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-50">Anterior</div>
                    <div className="text-sm font-semibold tabular-nums text-secondary">
                      {Math.round(thiHistory[thiHistory.length - 2]?.score ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-2 gap-4">
        {enabledWidgets['kpi-critical-vulns'] !== false && (
          <KpiHeroCard
            title="Vulnerabilidades Críticas"
            value={metrics.criticalVulns}
            trend={metrics.vulnTrend}
            trendLabel={
              metrics.vulnTrend === 'up'
                ? 'Aumentando'
                : metrics.vulnTrend === 'down'
                  ? 'Disminuyendo'
                  : 'Estable'
            }
            color={metrics.criticalVulns > 0 ? 'danger' : 'success'}
            subtitle={
              metrics.vulnTrend === 'up' && metrics.criticalVulns > 0
                ? 'Requiere atención inmediata'
                : undefined
            }
            onClick={navigateToVulns}
          />
        )}
        {enabledWidgets['kpi-p1-incidents'] !== false && (
          <KpiHeroCard
            title="Incidentes P1"
            value={metrics.openIncidents}
            trend={metrics.incidentTrend}
            trendLabel={
              metrics.incidentTrend === 'up'
                ? 'Aumentando'
                : metrics.incidentTrend === 'down'
                  ? 'Disminuyendo'
                  : 'Estable'
            }
            color={metrics.openIncidents > 0 ? 'warning' : 'success'}
            subtitle={
              metrics.openIncidents > 0 ? `${metrics.openIncidents} sin resolver` : undefined
            }
            onClick={navigateToIncidents}
          />
        )}
        {enabledWidgets['kpi-thi-score'] !== false && (
          <KpiHeroCard
            title="Total Aplicaciones"
            value={metrics.applications.length}
            trend={
              metrics.applications.length > 10
                ? 'up'
                : metrics.applications.length > 5
                  ? 'neutral'
                  : 'down'
            }
            trendLabel={`${metrics.businessUnits.length} BU`}
            color="primary"
            onClick={navigateToApps}
          />
        )}
        {enabledWidgets['kpi-eol-techs'] !== false && (
          <KpiHeroCard
            title="Tecnologías EOL"
            value={metrics.eolTechs}
            trend={metrics.eolTechs > 5 ? 'up' : metrics.eolTechs > 0 ? 'neutral' : 'down'}
            trendLabel={
              metrics.eolTechs > 5 ? 'Crítico' : metrics.eolTechs > 0 ? 'Atención' : 'Sin riesgo'
            }
            color={metrics.eolTechs > 5 ? 'danger' : metrics.eolTechs > 0 ? 'warning' : 'success'}
            subtitle={`${metrics.extendedTechs} en soporte extendido`}
            onClick={navigateToObsolescence}
          />
        )}
      </div>
    </div>
  )
}

interface KpiHeroCardProps {
  title: string
  value: number
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  color: 'danger' | 'warning' | 'success' | 'primary' | 'info'
  subtitle?: string
  valueSuffix?: string
  onClick?: () => void
}

function colorMap(color: string) {
  const map = {
    danger: {
      dot: 'bg-danger',
      bg: 'bg-danger/5 dark:bg-danger/10',
      border: 'border-danger/20 dark:border-danger/30',
      text: 'text-danger',
      icon: 'text-danger bg-danger/10',
      gradient: 'from-danger/5 via-transparent to-transparent',
    },
    warning: {
      dot: 'bg-warning',
      bg: 'bg-warning/5 dark:bg-warning/10',
      border: 'border-warning/20 dark:border-warning/30',
      text: 'text-warning',
      icon: 'text-warning bg-warning/10',
      gradient: 'from-warning/5 via-transparent to-transparent',
    },
    success: {
      dot: 'bg-success',
      bg: 'bg-success/5 dark:bg-success/10',
      border: 'border-success/20 dark:border-success/30',
      text: 'text-success',
      icon: 'text-success bg-success/10',
      gradient: 'from-success/5 via-transparent to-transparent',
    },
    primary: {
      dot: 'bg-primary',
      bg: 'bg-primary/5 dark:bg-primary/10',
      border: 'border-primary/20 dark:border-primary/30',
      text: 'text-primary',
      icon: 'text-primary bg-primary/10',
      gradient: 'from-primary/5 via-transparent to-transparent',
    },
    info: {
      dot: 'bg-info',
      bg: 'bg-info/5 dark:bg-info/10',
      border: 'border-info/20 dark:border-info/30',
      text: 'text-info',
      icon: 'text-info bg-info/10',
      gradient: 'from-info/5 via-transparent to-transparent',
    },
  }
  return map[color as keyof typeof map] ?? map.primary
}

function KpiHeroCard({
  title,
  value,
  trend,
  trendLabel,
  color,
  subtitle,
  valueSuffix,
  onClick,
}: KpiHeroCardProps) {
  const styles = colorMap(color)
  const TrendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-2xl border border-boundary p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden cursor-pointer"
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${styles.gradient}`}
      />

      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 opacity-60 ${styles.dot}`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h3>
          {trend && (
            <span className={`flex items-center gap-1 text-xs font-medium ${styles.text}`}>
              <span className="text-base leading-none">{TrendIcon}</span>
              <span>{trendLabel}</span>
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold tracking-tight tabular-nums ${styles.text}`}>
            {value}
          </span>
          {valueSuffix && (
            <span className="text-sm font-medium text-neutral-50">{valueSuffix}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
