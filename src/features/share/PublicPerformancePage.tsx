import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getShareType, getPublicPerformanceData, type PublicPerformanceData } from '@/services/share/publicShareService'
import { Clock, TrendingUp, Users, Award, BarChart3, Target, Zap } from 'lucide-react'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { PrintButton } from '@/components/ui/PrintButton'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { cn } from '@/lib/utils'

export function PublicPerformancePage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicPerformanceData | null>(null)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }

    const tryDecryptOrShow = (raw: unknown) => {
      if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
        setPendingEncrypted(raw as EncryptedPayload)
        setValid(true)
        setLoading(false)
      } else {
        setData(raw as PublicPerformanceData)
        setValid(true)
        setLoading(false)
      }
    }

    import('@/services/share/azureShareService').then(async ({ downloadShareFromAzure }) => {
      const azureData = await downloadShareFromAzure(hash)
      if (azureData) { tryDecryptOrShow(azureData); return }
      if (getShareType(hash) === 'performance') {
        const d = await getPublicPerformanceData()
        setData(d); setValid(true)
      } else { setValid(false) }
      setLoading(false)
    })
  }, [hash])

  const summary = useMemo(() => {
    if (!data) return null
    const totalMembers = data.members?.length ?? 0
    const teamsWithMetrics = data.teams.filter((t) => t.currentMetrics)
    const eliteTeams = teamsWithMetrics.filter((t) => (t.currentMetrics?.deploymentFrequency ?? 0) >= 1)
    const avgVelocity = teamsWithMetrics.length
      ? Math.round(teamsWithMetrics.reduce((s, t) => s + (t.currentMetrics?.velocity ?? 0), 0) / teamsWithMetrics.length)
      : 0
    const recentSprints = data.sprints.slice(-20)
    const avgCompletion = recentSprints.length
      ? Math.round(recentSprints.reduce((s, sp) => s + (sp.storyPointsCompleted / (sp.storyPointsCompleted + sp.storyPointsNotCompleted || 1)) * 100, 0) / recentSprints.length)
      : 0

    const memberNameMap = new Map<string, string>()
    for (const team of data.teams) {
      for (const tm of team.members ?? []) {
        if (!memberNameMap.has(tm.id)) memberNameMap.set(tm.id, tm.displayName)
      }
    }
    const topMembers = data.members
      .map((m) => {
        const memberSprints = data.sprints.filter((s) => s.memberId === m.id)
        const totalSP = memberSprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
        const avgMood = data.oneOnOnes.filter((o) => o.memberId === m.id)
          .reduce((s, o, _, arr) => s + o.estadoAnimo / arr.length, 0)
        const displayName = memberNameMap.get(m.id) ?? m.email.split('@')[0] ?? 'Miembro'
        return { member: m, displayName, totalSP, avgMood }
      })
      .sort((a, b) => b.totalSP - a.totalSP)
      .slice(0, 5)

    return { totalMembers, teamsWithMetrics: teamsWithMetrics.length, eliteTeams: eliteTeams.length, avgVelocity, avgCompletion, topMembers }
  }, [data])

  if (loading) return <Loader />
  if (!valid) return <InvalidLinkPage />
  if (!data || !summary) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
          <PassphraseModal
            title="Datos protegidos con contraseña"
            description="Este reporte fue compartido con cifrado de extremo a extremo."
            onSubmit={async (pass) => {
              const decrypted = await decryptData(pendingEncrypted, pass)
              if (decrypted) { setData(decrypted as any); setPendingEncrypted(null) }
              else { alert('Contraseña incorrecta') }
            }}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Rendimiento de Equipos</h1>
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
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Row 1: Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Miembros" value={summary.totalMembers} subtitle="En todos los equipos" icon={<Users size={18} />} color="primary" />
          <StatCard title="Equipos con métricas" value={summary.teamsWithMetrics} subtitle="DORA tracking activo" icon={<BarChart3 size={18} />} color="info" />
          <StatCard title="Elite DORA" value={`${summary.eliteTeams}/${summary.teamsWithMetrics}`} subtitle="Alto rendimiento" icon={<Zap size={18} />} color={summary.eliteTeams > 0 ? 'success' : 'warning'} />
          <StatCard title="Completitud sprints" value={`${summary.avgCompletion}%`} subtitle="Promedio últimos 20" icon={<Target size={18} />} color={summary.avgCompletion >= 70 ? 'success' : summary.avgCompletion >= 50 ? 'warning' : 'danger'} />
        </div>

        {/* Row 2: Teams */}
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
          <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
            <h2 className="text-sm font-bold text-neutral-90 dark:text-white">Equipos</h2>
          </div>
          <div className="divide-y divide-neutral-10 dark:divide-neutral-75">
            {data.teams.map((team) => {
              const m = team.currentMetrics
              const isElite = (m?.deploymentFrequency ?? 0) >= 1
              const memberCount = data.members.filter((mb) => mb.teamId === team.id).length
              return (
                <div key={team.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full', isElite ? 'bg-success' : 'bg-neutral-40')} />
                    <div>
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{team.name}</p>
                      <p className="text-xs text-neutral-50">{memberCount} miembros · {m ? `${m.velocity} SP/ sprint` : 'Sin métricas'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-60">
                    {m && (
                      <>
                        <span className="hidden sm:inline">Deploy: {m.deploymentFrequency}/día</span>
                        <span className="hidden sm:inline">Lead: {m.leadTimeHours}h</span>
                        <span className={cn('font-semibold', isElite ? 'text-success' : 'text-neutral-50')}>
                          {isElite ? 'Elite' : m ? `${m.changeFailureRate}% CFR` : '—'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Row 3: Top Members */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              Top contribuidores
            </h3>
            <div className="space-y-3">
              {summary.topMembers.map((item, i) => {
                const team = data.teams.find((t) => t.id === item.member.teamId)
                return (
                  <div key={item.member.id} className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
                      i === 1 ? 'bg-neutral-100 dark:bg-neutral-75 text-neutral-600' :
                      'bg-neutral-50/20 text-neutral-500'
                    )}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white truncate">{item.displayName}</p>
                      <p className="text-xs text-neutral-50">{team?.name ?? '—'} · {item.member.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neutral-90 dark:text-white">{item.totalSP} SP</p>
                      <p className="text-xs text-neutral-50">completados</p>
                    </div>
                  </div>
                )
              })}
              {summary.topMembers.length === 0 && (
                <p className="text-sm text-neutral-50 text-center py-4">Sin datos de contribución</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Métricas agregadas
            </h3>
            <div className="space-y-4">
              <MetricBar label="Completitud en sprints" value={summary.avgCompletion} />
              <MetricBar label="Entrega a tiempo" value={75} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-neutral-90 dark:text-white">{summary.avgVelocity}</p>
                  <p className="text-xs text-neutral-50">Velocidad promedio</p>
                </div>
                <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-neutral-90 dark:text-white">{summary.eliteTeams}/{summary.teamsWithMetrics}</p>
                  <p className="text-xs text-neutral-50">Equipos Elite / total</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-40 dark:text-neutral-60 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Datos en tu navegador
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


function StatCard({ title, value, subtitle, icon, color }: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode; color: 'success' | 'warning' | 'danger' | 'info' | 'primary'
}) {
  const colors = {
    success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10', info: 'text-info bg-info/10', primary: 'text-primary bg-primary/10',
  }
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
      <div className={cn('p-2 rounded-lg w-fit mb-3', colors[color])}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 font-medium mt-0.5">{title}</p>
      <p className="text-xs text-neutral-50 mt-1">{subtitle}</p>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-success' : value >= 60 ? 'bg-warning' : 'bg-danger'
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-neutral-70 dark:text-neutral-30">{label}</span>
        <span className="font-semibold text-neutral-90 dark:text-white">{value}%</span>
      </div>
      <div className="h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
