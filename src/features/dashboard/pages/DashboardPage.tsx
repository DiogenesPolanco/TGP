import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { db } from '@/services/db/database'
import { useThiCalculation } from '@/features/dashboard/hooks/useThiCalculation'
import { ThiGauge } from '@/components/charts/ThiGauge'
import { KpiCard } from '@/components/data-display/KpiCard'
import { generateExecutiveNarrative } from '@/services/thi/narrativeGenerator'
import { useFilterStore } from '@/stores/filterStore'
import {
  Shield,
  AlertTriangle,
  Package,
  AlertOctagon,
  Users,
  FileWarning,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartTooltipSimple } from '@/components/charts/ChartTooltip'
import { ChartGradients } from '@/components/charts/ChartGradients'

function getPeriodStartDate(period: '7d' | '30d' | '90d' | 'ytd' | 'custom'): Date {
  const now = new Date()
  switch (period) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'ytd': return new Date(now.getFullYear(), 0, 1)
    case 'custom': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

export function DashboardPage() {
  const { selectedBusinessUnitId, selectedPeriod } = useFilterStore()
  const periodStart = getPeriodStartDate(selectedPeriod)
  const thi = useThiCalculation(selectedBusinessUnitId)

  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const vulnerabilities = useLiveQuery(() => db.vulnerabilities.toArray()) ?? []
  const incidents = useLiveQuery(() => db.incidents.toArray()) ?? []
  const risks = useLiveQuery(() => db.risks.toArray()) ?? []
  const auditFindings = useLiveQuery(() => db.auditFindings.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const technologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []
  const blockers = useLiveQuery(() => db.blockers.toArray()) ?? []
  const plans = useLiveQuery(() => db.plans.toArray()) ?? []
  const commitments = useLiveQuery(() => db.commitments.toArray()) ?? []
  const activities = useLiveQuery(() => db.activities.toArray()) ?? []

  const vulnsInPeriod = vulnerabilities.filter((v) => v.createdAt >= periodStart)
  const incidentsInPeriod = incidents.filter((i) => i.createdAt >= periodStart)
  const risksInPeriod = risks.filter((r) => r.createdAt >= periodStart)

  const criticalVulns = vulnsInPeriod.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length
  const openIncidents = incidentsInPeriod.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length
  const overdueFindings = auditFindings.filter((f) => f.status === 'overdue').length
  const totalFindings = auditFindings.length
  const openFindings = auditFindings.filter((f) => f.status === 'open' || f.status === 'in_progress').length
  const closedFindings = auditFindings.filter((f) => f.status === 'closed' || f.status === 'resolved').length
  const complianceScore = thi?.complianceScore ?? 0
  const totalRiskScore = risksInPeriod.filter((r) => r.status === 'open').reduce((sum, r) => sum + r.riskScore, 0)
  const eliteTeams = teams.filter((t) => {
    if (!t.currentMetrics) return false
    return t.currentMetrics.deploymentFrequency >= 1 && t.currentMetrics.leadTimeHours <= 1
  }).length

  const activePlans = plans.filter((p) => p.status === 'in_progress' || p.status === 'planned').length
  const openBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'escalated').length
  const overdueCommitments = commitments.filter((c) => {
    if (c.status === 'breached') return true
    if (c.status === 'active' || c.status === 'at_risk') {
      return new Date(c.commitmentDate) < new Date()
    }
    return false
  }).length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const activitiesDueToday = activities.filter((a) => {
    if (!a.dueDate) return false
    const due = new Date(a.dueDate)
    due.setHours(0, 0, 0, 0)
    return due.getTime() === today.getTime() && a.status !== 'completed' && a.status !== 'cancelled'
  }).length

  const eolTechs = technologies.filter((t) => t.supportStatus === 'eol')
  const extendedTechs = technologies.filter((t) => t.supportStatus === 'extended')
  const techStatusData = [
    { name: 'Activas', value: technologies.filter((t) => t.supportStatus === 'active').length, color: '#36B37E' },
    { name: 'S. Extendido', value: extendedTechs.length, color: '#FFAB00' },
    { name: 'EOL', value: eolTechs.length, color: '#FF5630' },
    { name: 'Desconocido', value: technologies.filter((t) => t.supportStatus === 'unknown').length, color: '#A5ADBA' },
  ].filter((d) => d.value > 0)

  const buData = businessUnits
    .map((bu) => {
      const buApps = applications.filter((a) => a.businessUnitId === bu.id)
      if (buApps.length === 0) return null

      const buVulns = vulnerabilities.filter(
        (v) => v.applicationId && buApps.some((a) => a.id === v.applicationId)
      )
      const buIncidents = incidents.filter(
        (i) => i.applicationId && buApps.some((a) => a.id === i.applicationId)
      )
      const buRisks = risks.filter(
        (r) => r.applicationId && buApps.some((a) => a.id === r.applicationId)
      )

      const securityScore = (() => {
        const criticalHigh = buVulns.filter(
          (v) => (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed'
        )
        return Math.max(0, 100 - Math.min(criticalHigh.length * 5, 80))
      })()

      const availabilityScore = (() => {
        const totalDowntime = buIncidents
          .filter((i) => i.status === 'resolved')
          .reduce((sum, i) => sum + (i.downtimeMinutes ?? 0), 0)
        return Math.max(0, 100 - Math.min(totalDowntime / 60, 50))
      })()

      const obsolescenceScore = (() => {
        const appsWithEol = buApps.filter((app) =>
          app.technologies.some((techId) => {
            const tech = technologies.find((t) => t.id === techId)
            return tech?.supportStatus === 'eol'
          })
        )
        return buApps.length > 0
          ? Math.round((1 - appsWithEol.length / buApps.length) * 100)
          : 100
      })()

      const riskScore = (() => {
        const activeRisks = buRisks.filter((r) => r.status === 'open')
        const totalScore = activeRisks.reduce((sum, r) => sum + r.riskScore, 0)
        return Math.max(0, 100 - Math.min(totalScore / 5, 80))
      })()

      const dimensions = [securityScore, availabilityScore, obsolescenceScore, riskScore]
      const thi = Math.round(dimensions.reduce((a, b) => a + b, 0) / dimensions.length)

      return { name: bu.name, thi }
    })
    .filter((d): d is { name: string; thi: number } => d !== null)

  const narrative = useMemo(
    () => generateExecutiveNarrative({
      thi,
      applications,
      vulnerabilities,
      incidents,
      risks,
      auditFindings,
      teams,
      technologies,
      businessUnits,
      blockers,
      commitments,
      periodStart,
    }),
    [thi, applications, vulnerabilities, incidents, risks, auditFindings, teams, technologies, businessUnits, blockers, commitments, periodStart],
  )

  const alerts = useMemo(() => {
    const items: { type: 'critical' | 'warning' | 'success' | 'info'; message: string }[] = []

    if (narrative.flashBriefing) {
      items.push({ type: 'info', message: narrative.flashBriefing })
    }

    for (const insight of narrative.keyInsights) {
      const type = insight.icon === 'critical' ? 'critical'
        : insight.icon === 'warning' ? 'warning'
        : insight.icon === 'positive' ? 'success'
        : 'info'
      items.push({ type, message: insight.text })
    }

    for (const bu of narrative.buHighlights) {
      items.push({ type: 'info', message: `BU ${bu.name}: THI ${bu.thi} — ${bu.text}` })
    }

    for (const rec of narrative.recommendations) {
      items.push({ type: 'info', message: rec })
    }

    return items
  }, [narrative])

  const setAlerts = useAppStore((s) => s.setAlerts)
  useEffect(() => { setAlerts(alerts) }, [alerts, setAlerts])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">
            Technology Health Index
          </h2>
          <ThiGauge value={thi?.overallScore ?? 0} size={240} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {thi && (
              <>
                <ScoreBadge label="Delivery" value={thi.deliveryScore} />
                <ScoreBadge label="Quality" value={thi.qualityScore} />
                <ScoreBadge label="Security" value={thi.securityScore} />
                <ScoreBadge label="Availability" value={thi.availabilityScore} />
                <ScoreBadge label="Obsolescence" value={thi.obsolescenceScore} />
                <ScoreBadge label="Risk" value={thi.riskScore} />
                <ScoreBadge label="Compliance" value={thi.complianceScore} />
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Vulnerabilidades Críticas"
            value={criticalVulns}
            trend="up"
            trendValue="+3"
            icon={<Shield size={20} />}
            color="danger"
          />
          <KpiCard
            title="Incidentes P1"
            value={openIncidents}
            trend="down"
            trendValue="-1"
            icon={<AlertOctagon size={20} />}
            color="warning"
          />
          <KpiCard
            title="Total Aplicaciones"
            value={applications.length}
            icon={<Package size={20} />}
            color="primary"
          />
          <KpiCard
            title="Exposición de Riesgos"
            value={totalRiskScore}
            icon={<AlertTriangle size={20} />}
            color="danger"
          />
          <KpiCard
            title="Compliance Score"
            value={totalFindings > 0 ? `${Math.round(complianceScore)}%` : '—'}
            subtitle={totalFindings > 0 ? `${overdueFindings} vencidos · ${closedFindings} cerrados` : 'Sin hallazgos'}
            trend={complianceScore >= 80 ? 'up' : complianceScore >= 50 ? 'neutral' : 'down'}
            trendValue={complianceScore >= 80 ? 'saludable' : complianceScore >= 50 ? 'regular' : `${openFindings} abiertos`}
            icon={<FileWarning size={20} />}
            color={complianceScore >= 80 ? 'success' : complianceScore >= 50 ? 'warning' : 'danger'}
          />
          <KpiCard
            title="Equipos Elite DORA"
            value={eliteTeams}
            icon={<Users size={20} />}
            color="success"
          />
          <KpiCard
            title="THI Score"
            value={Math.round(thi?.overallScore ?? 0)}
            trend="up"
            trendValue="+2"
            icon={<TrendingUp size={20} />}
            color="success"
          />
          <KpiCard
            title="Tecnologías EOL"
            value={eolTechs.length}
            subtitle={`${extendedTechs.length} en soporte extendido`}
            icon={<XCircle size={20} />}
            color="danger"
          />
        </div>
      </div>

      {/* Execution metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Planes Activos"
          value={activePlans}
          icon={<TrendingUp size={20} />}
          color="primary"
        />
        <KpiCard
          title="Bloqueos Abiertos"
          value={openBlockers}
          trend={openBlockers > 0 ? 'up' : undefined}
          trendValue={openBlockers > 0 ? 'necesita atencion' : undefined}
          icon={<AlertTriangle size={20} />}
          color={openBlockers > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          title="Compromisos Vencidos"
          value={overdueCommitments}
          icon={<XCircle size={20} />}
          color={overdueCommitments > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          title="Actividades Hoy"
          value={activitiesDueToday}
          icon={<AlertOctagon size={20} />}
          color={activitiesDueToday > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-90 dark:text-white mb-4">
            THI por Business Unit
          </h3>
          {buData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buData} layout="vertical">
                <defs>
                  <ChartGradients id="bu-chart" />
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" strokeOpacity={0.6} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6B778C' }}
                  axisLine={{ stroke: '#DFE1E6', strokeOpacity: 0.5 }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12, fill: '#6B778C' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltipSimple />}
                  cursor={{ fill: '#F4F5F7', opacity: 0.5 }}
                />
                <Bar
                  dataKey="thi"
                  fill="url(#bu-chart-primary)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-neutral-50 py-8 text-center">
              No hay datos de aplicaciones para calcular THI por unidad de negocio
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-90 dark:text-white mb-4">
            Estado de Tecnologías
          </h3>
          {techStatusData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <defs>
                    <ChartGradients id="pie-chart" />
                  </defs>
                  <Pie
                    data={techStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    stroke="white"
                    strokeWidth={2}
                  >
                    {techStatusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ChartTooltipSimple />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {techStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-neutral-60 dark:text-neutral-40">{entry.name}</span>
                    </div>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white">{entry.value}</span>
                  </div>
                ))}
                <div className="border-t border-neutral-20 dark:border-neutral-70 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-60 dark:text-neutral-40">Total</span>
                    <span className="text-sm font-bold text-neutral-90 dark:text-white">{technologies.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-50">Sin datos de tecnologías</p>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-neutral-90 dark:text-white mb-4">
            Alertas ({alerts.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {alerts.length > 0 ? alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'critical'
                    ? 'bg-danger/10 border border-danger/20'
                    : alert.type === 'warning'
                    ? 'bg-warning/10 border border-warning/20'
                    : alert.type === 'success'
                    ? 'bg-success/10 border border-success/20'
                    : 'bg-info/10 border border-info/20'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    alert.type === 'critical'
                      ? 'bg-danger'
                      : alert.type === 'warning'
                      ? 'bg-warning'
                      : alert.type === 'success'
                      ? 'bg-success'
                      : 'bg-info'
                  }`}
                />
                <p className="text-sm text-neutral-80 dark:text-neutral-20">{alert.message}</p>
              </div>
            )) : (
              <p className="text-sm text-neutral-50 py-4 text-center">Sin alertas activas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val >= 80) return 'text-success'
    if (val >= 60) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
      <span className="text-xs text-neutral-60 dark:text-neutral-40">{label}</span>
      <span className={`text-sm font-semibold ${getColor(value)}`}>{Math.round(value)}</span>
    </div>
  )
}
