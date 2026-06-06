import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { isValidShareHash, getPublicDashboardData, type PublicDashboardData } from '@/services/share/publicShareService'
import {
  Shield, AlertTriangle, Lock, Clock, TrendingUp, TrendingDown,
  Users, Package, Building2, AlertOctagon, Target, CheckCircle2,
} from 'lucide-react'
import { ThiGauge } from '@/components/charts/ThiGauge'
import { cn } from '@/lib/utils'

// ── Executive KPIs — what a VP/Gerente actually needs ──

export function PublicDashboardPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }

    const load = async () => {
      // 1. Try URL hash fragment (manifest)
      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash) {
        try {
          const fragment = decodeURIComponent(rawHash)
          const { downloadUsingManifest } = await import('@/services/share/azureShareService')
          const azureData = await downloadUsingManifest(fragment) as PublicDashboardData | null
          if (azureData) { setData(azureData); setValid(true); setLoading(false); return }
          console.warn('[PublicDashboard] Manifest found but Azure returned no data')
        } catch (err) {
          console.error('[PublicDashboard] Azure download error:', err)
        }
      }

      // 2. Fallback: viewer's own Azure config
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash) as PublicDashboardData | null
        if (viewerData) { setData(viewerData); setValid(true); setLoading(false); return }
      } catch (err) {
        console.warn('[PublicDashboard] Viewer Azure config error:', err)
      }

      // 3. Last fallback: localStorage (same-browser dev/testing)
      if (isValidShareHash(hash)) {
        const d = await getPublicDashboardData()
        setData(d); setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    }
    load()
  }, [hash])

  const kpis = useMemo(() => {
    if (!data) return null
    const criticalVulns = data.vulnerabilities.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length
    const highVulns = data.vulnerabilities.filter((v) => v.severity === 'high' && v.status !== 'fixed').length
    const openIncidents = data.incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length
    const p1Incidents = data.incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length
    const openRisks = data.risks.filter((r) => r.status === 'open')
    const criticalRisks = openRisks.filter((r) => r.riskScore >= 15).length
    const totalRisk = openRisks.reduce((s, r) => s + r.riskScore, 0)
    const eolTechs = data.technologies.filter((t) => t.supportStatus === 'eol').length
    const eliteTeams = data.teams.filter((t) => (t.currentMetrics?.deploymentFrequency ?? 0) >= 1).length
    const totalTeams = data.teams.length

    // THI calculation: same 7-dimension formula as main dashboard
    const deliveryScore = data.teams.length === 0 ? 50
      : Math.round(data.teams.reduce((s, t) => {
          const m = t.currentMetrics
          if (!m) return s + 50
          return s + (Math.min(m.velocity / 50, 1) * 100
            + Math.max(0, 100 - (m.leadTimeHours / 168) * 100)
            + Math.max(0, 100 - m.changeFailureRate * 5)
            + Math.max(0, 100 - (m.mttrHours / 24) * 100)) / 4
        }, 0) / data.teams.length)
    const qualityScore = 75
    const criticalHighOpen = data.vulnerabilities.filter((v) =>
      (v.severity === 'critical' || v.severity === 'high') && v.status !== 'fixed'
    ).length
    const securityScore = data.applications.length === 0 ? 100
      : Math.max(0, 100 - Math.min(criticalHighOpen * 5, 80))
    const totalDowntime = data.incidents.filter((i) => i.status === 'resolved')
      .reduce((s, i) => s + ((i as any).downtimeMinutes ?? 0), 0)
    const availabilityScore = data.applications.length === 0 ? 100
      : Math.max(0, 100 - Math.min(totalDowntime / 60, 50))
    const appsWithEol = data.applications.filter((a) =>
      a.technologies?.some((tId: string) => data.technologies.some((t) => t.id === tId && t.supportStatus === 'eol'))
    ).length
    const obsolescenceScore = data.applications.length === 0 ? 100
      : Math.round((1 - appsWithEol / data.applications.length) * 100)
    const activeRiskScore = data.risks.filter((r) => r.status === 'open')
      .reduce((s, r) => s + r.riskScore, 0)
    const riskScore = data.applications.length === 0 ? 100
      : Math.max(0, 100 - Math.min(activeRiskScore / 5, 80))
    const af = (data as any).auditFindings
    let complianceScore = 75
    if (af && af.length > 0) {
      const closedOk = af.filter((f: any) =>
        (f.status === 'closed' || f.status === 'resolved') && new Date(f.dueDate) >= new Date()
      ).length
      complianceScore = Math.round((closedOk / af.length) * 100)
    }
    const overallScore = Math.round(
      (deliveryScore * 20 + qualityScore * 15 + securityScore * 20
        + availabilityScore * 15 + obsolescenceScore * 10 + riskScore * 10
        + complianceScore * 10) / 100
    )

    const thiTrend = data.healthHistory.length >= 2
      ? data.healthHistory[data.healthHistory.length - 1].score - data.healthHistory[0].score
      : 0

    const redFlags: { icon: React.ReactNode; text: string; severity: 'critical' | 'warning' | 'info' }[] = []
    if (criticalVulns > 0) redFlags.push({ icon: <Shield size={14} />, text: `${criticalVulns} vulnerabilidad${criticalVulns > 1 ? 'es' : ''} crítica${criticalVulns > 1 ? 's' : ''} sin corregir`, severity: 'critical' })
    if (p1Incidents > 0) redFlags.push({ icon: <AlertOctagon size={14} />, text: `${p1Incidents} incidente${p1Incidents > 1 ? 's' : ''} P1 activo${p1Incidents > 1 ? 's' : ''}`, severity: 'critical' })
    if (criticalRisks > 0) redFlags.push({ icon: <AlertTriangle size={14} />, text: `${criticalRisks} riesgo${criticalRisks > 1 ? 's' : ''} crítico${criticalRisks > 1 ? 's' : ''} sin mitigar`, severity: 'warning' })
    if (eolTechs > 5) redFlags.push({ icon: <Package size={14} />, text: `${eolTechs} tecnologías EOL en uso`, severity: 'warning' })
    if (totalTeams > 0 && eliteTeams / totalTeams < 0.3) redFlags.push({ icon: <Users size={14} />, text: `Solo ${Math.round(eliteTeams / totalTeams * 100)}% de equipos clasifican Elite DORA`, severity: 'info' })

    return {
      overallScore, criticalVulns, highVulns, openIncidents, p1Incidents,
      totalRisk, criticalRisks, eolTechs, eliteTeams, totalTeams, thiTrend,
      redFlags,
      thiLabel: overallScore >= 90 ? 'Excelente' : overallScore >= 70 ? 'Saludable' : overallScore >= 50 ? 'Regular' : overallScore >= 30 ? 'En Riesgo' : 'Crítico',
      thiColor: overallScore >= 90 ? '#36B37E' : overallScore >= 70 ? '#57D9A3' : overallScore >= 50 ? '#FFAB00' : overallScore >= 30 ? '#FF8B00' : '#FF5630',
    }
  }, [data])

  if (loading) return <Loader />
  if (!valid) return <InvalidLink />
  if (!data || !kpis) return null

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      {/* ── Header ── */}
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Executive Dashboard</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-50">
            <Clock size={14} />
            <span>Actualizado al momento del acceso</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Row 1: THI Score + Executive Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* THI Gauge */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Health Index</h2>
              <div className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                kpis.thiTrend > 0 ? 'bg-success/10 text-success' : kpis.thiTrend < 0 ? 'bg-danger/10 text-danger' : 'bg-neutral-10 dark:bg-neutral-75 text-neutral-50'
              )}>
                {kpis.thiTrend > 0 ? <TrendingUp size={14} /> : kpis.thiTrend < 0 ? <TrendingDown size={14} /> : null}
                {kpis.thiTrend !== 0 ? `${Math.abs(kpis.thiTrend)}pts` : 'Estable'}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ThiGauge value={kpis.overallScore} size={200} showLabel />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="lg:col-span-3 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider mb-4">Resumen Ejecutivo</h2>

            {/* Top-line metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <MiniMetric
                label="Portafolio"
                value={`${data.applications.length} apps`}
                subtitle={`${data.businessUnits.length} BU`}
                icon={<Building2 size={16} />}
                color="primary"
              />
              <MiniMetric
                label="Seguridad"
                value={`${kpis.criticalVulns + kpis.highVulns} abiertas`}
                subtitle={`${kpis.criticalVulns} críticas`}
                icon={<Shield size={16} />}
                color={kpis.criticalVulns > 0 ? 'danger' : 'success'}
              />
              <MiniMetric
                label="Riesgos"
                value={`${kpis.totalRisk} pts`}
                subtitle={`${kpis.criticalRisks} críticos`}
                icon={<AlertTriangle size={16} />}
                color={kpis.criticalRisks > 0 ? 'warning' : 'success'}
              />
              <MiniMetric
                label="Equipos"
                value={`${kpis.eliteTeams}/${kpis.totalTeams}`}
                subtitle="Elite DORA"
                icon={<Users size={16} />}
                color={kpis.eliteTeams / Math.max(kpis.totalTeams, 1) > 0.3 ? 'success' : 'warning'}
              />
            </div>

            {/* Red flags */}
            {kpis.redFlags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-2">Puntos de atención</p>
                <div className="space-y-1.5">
                  {kpis.redFlags.map((flag, i) => (
                    <div key={i} className={cn(
                      'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                      flag.severity === 'critical' ? 'bg-danger/5 text-danger' :
                      flag.severity === 'warning' ? 'bg-warning/5 text-warning' :
                      'bg-info/5 text-info'
                    )}>
                      {flag.icon}
                      <span className="font-medium">{flag.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All clear */}
            {kpis.redFlags.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-success py-4">
                <CheckCircle2 size={18} />
                <span className="font-medium">Sin alertas críticas. El portafolio se encuentra en estado saludable.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Portfolio metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Vulnerabilidades Críticas"
            value={kpis.criticalVulns}
            subtitle="Requieren acción inmediata"
            icon={<Shield size={18} />}
            color={kpis.criticalVulns > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Incidentes P1"
            value={kpis.p1Incidents}
            subtitle="Disponibilidad del servicio"
            icon={<AlertOctagon size={18} />}
            color={kpis.p1Incidents > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Tecnologías EOL"
            value={kpis.eolTechs}
            subtitle={`${kpis.eolTechs} tecnologías`}
            icon={<Package size={18} />}
            color={kpis.eolTechs > 5 ? 'warning' : kpis.eolTechs > 0 ? 'info' : 'success'}
          />
          <StatCard
            title="Equipos Elite DORA"
            value={`${kpis.eliteTeams}/${kpis.totalTeams}`}
            subtitle={`${kpis.totalTeams > 0 ? Math.round(kpis.eliteTeams / kpis.totalTeams * 100) : 0}% del total`}
            icon={<Target size={18} />}
            color={kpis.totalTeams > 0 && kpis.eliteTeams / kpis.totalTeams >= 0.3 ? 'success' : 'warning'}
          />
        </div>

        {/* ── Row 3: Technology & Risk Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías en uso por estado</h3>
            <div className="space-y-3">
              {(() => {
                const usedTechIds = new Set<string>()
                for (const app of data.applications) {
                  for (const tId of (app as any).technologies ?? []) usedTechIds.add(tId)
                }
                const usedTechs = data.technologies.filter((t) => usedTechIds.has(t.id))
                const total = usedTechs.length || 1
                return ['active', 'extended', 'eol', 'unknown'].map((status) => {
                  const count = usedTechs.filter((t) => t.supportStatus === status).length
                  const pct = Math.round((count / total) * 100)
                const colors: Record<string, string> = { active: 'bg-success', extended: 'bg-warning', eol: 'bg-danger', unknown: 'bg-neutral-40' }
                const labels: Record<string, string> = { active: 'Activas', extended: 'Soporte extendido', eol: 'EOL', unknown: 'Desconocido' }
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-60 w-28">{labels[status]}</span>
                    <div className="flex-1 h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', colors[status])} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white w-12 text-right">{count}</span>
                  </div>
                )
              })
            })()}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">Distribución de riesgos</h3>
            <div className="space-y-3">
              {([
                { label: 'Crítico (15-25)', range: [15, 25] as const, color: 'bg-danger' },
                { label: 'Alto (10-14)', range: [10, 14] as const, color: 'bg-warning' },
                { label: 'Medio (5-9)', range: [5, 9] as const, color: 'bg-info' },
                { label: 'Bajo (1-4)', range: [1, 4] as const, color: 'bg-success' },
              ] as const).map(({ label, range, color }) => {
                const count = data.risks.filter((r) => r.riskScore >= range[0] && r.riskScore <= range[1]).length
                const total = data.risks.length || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-60 w-28">{label}</span>
                    <div className="flex-1 h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center text-xs text-neutral-40 dark:text-neutral-60 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos en tu navegador · Sin conexión externa
        </div>
      </main>
    </div>
  )
}

function Loader() {
  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-8 text-center space-y-4">
        <Lock size={40} className="mx-auto text-neutral-40" />
        <h1 className="text-lg font-bold text-neutral-90 dark:text-white">Enlace no válido</h1>
        <p className="text-sm text-neutral-60 dark:text-neutral-40 leading-relaxed">
          Este enlace ha expirado o no es válido. Solicita uno nuevo al administrador de TGP.
        </p>
      </div>
    </div>
  )
}

function MiniMetric({ label, value, subtitle, icon, color }: {
  label: string; value: string; subtitle: string; icon: React.ReactNode; color: string
}) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
  }
  const s = colors[color] ?? colors.primary
  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('p-1.5 rounded-lg', s)}>{icon}</div>
      </div>
      <p className="text-lg font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 font-medium">{label}</p>
      <p className="text-[11px] text-neutral-50 mt-0.5">{subtitle}</p>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode; color: 'danger' | 'warning' | 'success' | 'info' | 'primary'
}) {
  const dots: Record<string, string> = {
    danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success', info: 'bg-info', primary: 'bg-primary',
  }
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', {
          'bg-danger/10 text-danger': color === 'danger',
          'bg-warning/10 text-warning': color === 'warning',
          'bg-success/10 text-success': color === 'success',
          'bg-info/10 text-info': color === 'info',
          'bg-primary/10 text-primary': color === 'primary',
        })}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 font-medium mt-0.5">{title}</p>
      <p className="text-xs text-neutral-50 mt-1">{subtitle}</p>
      <div className={cn('mt-3 h-0.5 rounded w-full', dots[color])} style={{ opacity: 0.3 }} />
    </div>
  )
}
