import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  isValidShareHash,
  getPublicDashboardData,
  type PublicDashboardData,
} from '@/services/share/publicShareService'
import {
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Building2,
  AlertOctagon,
  Target,
  CheckCircle2,
} from 'lucide-react'
import { ThiGauge } from '@/components/charts/ThiGauge'
import { cn } from '@/lib/utils'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { PrintButton } from '@/components/ui/PrintButton'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { Loader, MiniMetric, StatCard, computeDashboardKpis } from './publicDashboardComponents'

// ── Executive KPIs ──

export function PublicDashboardPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)

  useEffect(() => {
    if (!hash) {
      setValid(false)
      setLoading(false)
      return
    }
    ;(async () => {
      const tryDecryptOrShow = (raw: unknown) => {
        if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
          setPendingEncrypted(raw as EncryptedPayload)
          setValid(true)
          setLoading(false)
        } else {
          setData(raw as PublicDashboardData)
          setValid(true)
          setLoading(false)
        }
      }

      // 1. Try URL hash fragment (manifest)
      const rawHash = window.location.hash.replace(/^#/, '')
      if (rawHash) {
        try {
          const fragment = decodeURIComponent(rawHash)
          const { downloadUsingManifest } = await import('@/services/share/azureShareService')
          const azureData = await downloadUsingManifest(fragment)
          if (azureData) {
            tryDecryptOrShow(azureData)
            return
          }
          console.warn('[PublicDashboard] Manifest found but Azure returned no data')
        } catch (err) {
          console.error('[PublicDashboard] Azure download error:', err)
        }
      }

      // 2. Fallback: viewer's own Azure config
      try {
        const { downloadShareFromAzure } = await import('@/services/share/azureShareService')
        const viewerData = await downloadShareFromAzure(hash)
        if (viewerData) {
          tryDecryptOrShow(viewerData)
          return
        }
      } catch (err) {
        console.warn('[PublicDashboard] Viewer Azure config error:', err)
      }

      // 3. Last fallback: localStorage
      if (isValidShareHash(hash)) {
        const d = await getPublicDashboardData()
        setData(d)
        setValid(true)
      } else {
        setValid(false)
      }
      setLoading(false)
    })()
  }, [hash])

  const kpis = useMemo(() => data ? computeDashboardKpis(data) : null, [data])

  if (loading) return <Loader />
  if (!valid) return <InvalidLinkPage />
  if (!data || !kpis) {
    // Show passphrase modal if encrypted data is pending
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <PassphraseModal
            title="Datos protegidos con contraseña"
            description="Este dashboard fue compartido con cifrado de extremo a extremo. Ingresa la contraseña que el creador te proporcionó."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) {
                setData(decrypted as PublicDashboardData)
                setPendingEncrypted(null)
              } else {
                alert('Contraseña incorrecta. Intenta de nuevo.')
              }
            }}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div id="printable-content" className="min-h-screen bg-canvas">
      {/* ── Header ── */}
      <header className="bg-card border-b border-boundary">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">
                Executive Dashboard
              </h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <div className="flex items-center gap-2 text-xs text-neutral-50">
              <Clock size={14} />
              <span>Actualizado al momento del acceso</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Row 1: THI Score + Executive Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* THI Gauge */}
          <div className="lg:col-span-2 bg-card rounded-2xl border border-boundary p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
                Health Index
              </h2>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                  kpis.thiTrend > 0
                    ? 'bg-success/10 text-success'
                    : kpis.thiTrend < 0
                      ? 'bg-danger/10 text-danger'
                      : 'bg-neutral-10 dark:bg-neutral-75 text-neutral-50',
                )}
              >
                {kpis.thiTrend > 0 ? (
                  <TrendingUp size={14} />
                ) : kpis.thiTrend < 0 ? (
                  <TrendingDown size={14} />
                ) : null}
                {kpis.thiTrend !== 0 ? `${Math.abs(kpis.thiTrend)}pts` : 'Estable'}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ThiGauge value={kpis.overallScore} size={200} showLabel />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="lg:col-span-3 bg-card rounded-2xl border border-boundary p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
              Resumen Ejecutivo
            </h2>

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
                <p className="text-xs font-semibold text-neutral-50 uppercase tracking-wider mb-2">
                  Puntos de atención
                </p>
                <div className="space-y-1.5">
                  {kpis.redFlags.map((flag, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                        flag.severity === 'critical'
                          ? 'bg-danger/5 text-danger'
                          : flag.severity === 'warning'
                            ? 'bg-warning/5 text-warning'
                            : 'bg-info/5 text-info',
                      )}
                    >
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
                <span className="font-medium">
                  Sin alertas críticas. El portafolio se encuentra en estado saludable.
                </span>
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
            subtitle={`${kpis.totalTeams > 0 ? Math.round((kpis.eliteTeams / kpis.totalTeams) * 100) : 0}% del total`}
            icon={<Target size={18} />}
            color={
              kpis.totalTeams > 0 && kpis.eliteTeams / kpis.totalTeams >= 0.3
                ? 'success'
                : 'warning'
            }
          />
        </div>

        {/* ── Row 3: Technology & Risk Details ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-boundary p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">
              Tecnologías en uso por estado
            </h3>
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
                  const colors: Record<string, string> = {
                    active: 'bg-success',
                    extended: 'bg-warning',
                    eol: 'bg-danger',
                    unknown: 'bg-neutral-40',
                  }
                  const labels: Record<string, string> = {
                    active: 'Activas',
                    extended: 'Soporte extendido',
                    eol: 'EOL',
                    unknown: 'Desconocido',
                  }
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-60 w-28">{labels[status]}</span>
                      <div className="flex-1 h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', colors[status])}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-90 dark:text-white w-12 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-boundary p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">
              Distribución de riesgos
            </h3>
            <div className="space-y-3">
              {(
                [
                  { label: 'Crítico (15-25)', range: [15, 25] as const, color: 'bg-danger' },
                  { label: 'Alto (10-14)', range: [10, 14] as const, color: 'bg-warning' },
                  { label: 'Medio (5-9)', range: [5, 9] as const, color: 'bg-info' },
                  { label: 'Bajo (1-4)', range: [1, 4] as const, color: 'bg-success' },
                ] as const
              ).map(({ label, range, color }) => {
                const count = data.risks.filter(
                  (r: any) => (r.riskScore ?? 0) >= range[0] && (r.riskScore ?? 0) <= range[1],
                ).length
                const total = data.risks.length || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-60 w-28">{label}</span>
                    <div className="flex-1 h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-90 dark:text-white w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center text-xs text-neutral-40 dark:text-neutral-60 py-4 border-t border-boundary">
          TGP — Technology Governance Platform · Datos en tu navegador · Sin conexión externa
        </div>
      </main>
    </div>
  )
}


