import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { isValidShareHash, getPublicDashboardData, type PublicDashboardData } from '@/services/share/publicShareService'
import { Shield, AlertTriangle, Package, Clock, Lock, AlertOctagon } from 'lucide-react'
import { KpiCard } from '@/components/data-display/KpiCard'
import { ThiGauge } from '@/components/charts/ThiGauge'

export function PublicDashboardPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) {
      setValid(false)
      setLoading(false)
      return
    }

    const ok = isValidShareHash(hash)
    setValid(ok)

    if (ok) {
      getPublicDashboardData().then((d) => {
        setData(d)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [hash])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-8 text-center space-y-4">
          <Lock size={48} className="mx-auto text-neutral-40" />
          <h1 className="text-xl font-bold text-neutral-90 dark:text-white">Enlace no válido</h1>
          <p className="text-sm text-neutral-60 dark:text-neutral-40">
            Este enlace ha expirado, ya fue utilizado o no es válido.
            Solicita un nuevo enlace al administrador de TGP.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const criticalVulns = data.vulnerabilities.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length
  const openIncidents = data.incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length
  const openRisks = data.risks.filter((r) => r.status === 'open')
  const totalRisk = openRisks.reduce((s, r) => s + r.riskScore, 0)
  const eolTechs = data.technologies.filter((t) => t.supportStatus === 'eol').length
  const eliteTeams = data.teams.filter((t) => t.currentMetrics?.deploymentFrequency ?? 0 >= 1).length

  const latestScore = data.healthHistory[data.healthHistory.length - 1]?.score ?? 0

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">TGP - Dashboard</h1>
            <p className="text-sm text-neutral-50">Vista compartida · Solo lectura</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-50 bg-white dark:bg-neutral-80 rounded-lg px-3 py-2 border border-neutral-20 dark:border-neutral-70">
            <Clock size={14} />
            Datos al momento del acceso
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="THI Score" value={Math.round(latestScore)} icon={<Package size={20} />} color="primary" />
          <KpiCard title="Vulnerabilidades Críticas" value={criticalVulns} icon={<Shield size={20} />} color={criticalVulns > 0 ? 'danger' : 'success'} />
          <KpiCard title="Tecnologías EOL" value={eolTechs} icon={<AlertOctagon size={20} />} color={eolTechs > 0 ? 'warning' : 'success'} />
          <KpiCard title="Exposición de Riesgos" value={totalRisk} icon={<AlertTriangle size={20} />} color={totalRisk > 50 ? 'danger' : totalRisk > 0 ? 'warning' : 'success'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-neutral-60 mb-4">THI General</h3>
            <ThiGauge value={latestScore} size={200} />
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6">
            <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-4">Resumen del Portafolio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricItem label="Aplicaciones" value={data.applications.length} />
              <MetricItem label="Tecnologías" value={data.technologies.length} />
              <MetricItem label="Equipos" value={data.teams.length} />
              <MetricItem label="Unidades de Negocio" value={data.businessUnits.length} />
              <MetricItem label="Incidentes Abiertos" value={openIncidents} />
              <MetricItem label="Equipos Elite" value={eliteTeams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-lg p-3">
      <p className="text-xs text-neutral-50">{label}</p>
      <p className="text-xl font-bold text-neutral-90 dark:text-white">{value}</p>
    </div>
  )
}
