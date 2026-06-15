import { InvalidLinkPage } from '@/components/sharing/InvalidLinkPage'
import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getShareInfo, getPublicPerformanceData, type PublicPerformanceData } from '@/services/share/publicShareService'
import { Clock, TrendingUp, Users, Award, Star, AlertTriangle, Brain, BarChart3 } from 'lucide-react'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { PrintButton } from '@/components/ui/PrintButton'
import { decryptData, type EncryptedPayload } from '@/services/share/encryptionService'
import { cn } from '@/lib/utils'

export function PublicMembersOverviewPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicPerformanceData | null>(null)
  const [pendingEncrypted, setPendingEncrypted] = useState<EncryptedPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }

    const tryDecryptOrShow = (raw: unknown) => {
      if (raw && typeof raw === 'object' && 'e' in raw && (raw as any).e === true) {
        setPendingEncrypted(raw as EncryptedPayload); setValid(true); setLoading(false)
      } else {
        setData(raw as PublicPerformanceData); setValid(true); setLoading(false)
      }
    }

    import('@/services/share/azureShareService').then(async ({ downloadShareFromAzure }) => {
      const azureData = await downloadShareFromAzure(hash)
      if (azureData) { tryDecryptOrShow(azureData); return }
      const info = getShareInfo(hash)
      if (info && info.type === 'members') {
        const d = await getPublicPerformanceData()
        setData(d); setValid(true)
      } else { setValid(false) }
      setLoading(false)
    })
  }, [hash])

  const analytics = useMemo(() => {
    if (!data) return null
    const memberNameMap = new Map<string, string>()
    for (const team of data.teams) {
      for (const tm of team.members ?? []) {
        if (!memberNameMap.has(tm.id)) memberNameMap.set(tm.id, tm.displayName)
      }
    }
    const membersWithStats = data.members.map((m) => {
      const msprints = data.sprints.filter((s) => s.memberId === m.id)
      const totalSP = msprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
      const avgCompletion = msprints.length
        ? Math.round(msprints.reduce((s, sp) => s + (sp.storyPointsCompleted / (sp.storyPointsCompleted + sp.storyPointsNotCompleted || 1)) * 100, 0) / msprints.length)
        : 0
      const oneOnOnes = data.oneOnOnes.filter((o) => o.memberId === m.id)
      const avgMood = oneOnOnes.length
        ? Math.round(oneOnOnes.reduce((s, o) => s + o.estadoAnimo, 0) / oneOnOnes.length * 10) / 10
        : 0
      const displayName = memberNameMap.get(m.id) ?? m.email.split('@')[0] ?? 'Miembro'
      return { member: m, displayName, totalSP, avgCompletion, avgMood, sprintCount: msprints.length, oneOnOneCount: oneOnOnes.length }
    })

    const sortedBySP = [...membersWithStats].sort((a, b) => b.totalSP - a.totalSP)
    const sortedByCompletion = [...membersWithStats].sort((a, b) => b.avgCompletion - a.avgCompletion)
    const sortedByMood = [...membersWithStats].sort((a, b) => b.avgMood - a.avgMood)
    const needsAttention = membersWithStats.filter((m) => (m.avgMood > 0 && m.avgMood < 3) || (m.avgCompletion > 0 && m.avgCompletion < 40))

    const avgSP = membersWithStats.length ? Math.round(membersWithStats.reduce((s, m) => s + m.totalSP, 0) / membersWithStats.length) : 0
    const avgCompl = membersWithStats.length
      ? Math.round(membersWithStats.reduce((s, m) => s + m.avgCompletion, 0) / membersWithStats.length)
      : 0
    const avgMoodAll = membersWithStats.filter((m) => m.avgMood > 0).length
      ? Math.round(membersWithStats.filter((m) => m.avgMood > 0).reduce((s, m) => s + m.avgMood, 0) / membersWithStats.filter((m) => m.avgMood > 0).length * 10) / 10
      : 0

    return {
      topSP: sortedBySP.slice(0, 3),
      topCompletion: sortedByCompletion.slice(0, 3),
      topMood: sortedByMood.slice(0, 3),
      needsAttention: needsAttention.slice(0, 5),
      all: membersWithStats,
      avgSP, avgCompl, avgMoodAll,
    }
  }, [data])

  if (loading) return <Loader />
  if (!valid) return <InvalidLinkPage />
  if (!data || !analytics) {
    if (pendingEncrypted) {
      return (
        <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90 flex items-center justify-center">
          <PassphraseModal title="Datos protegidos" description="Contenido cifrado. Ingresa la contraseña."
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
    <div id="printable-content" className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Rendimiento de Miembros</h1>
              <p className="text-xs text-neutral-50">Vista comparativa · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PrintButton />
            <Clock size={14} className="text-neutral-50" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary metrics */}
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard label="Miembros" value={analytics.all.length} icon={<Users size={18} />} color="primary" />
          <SummaryCard label="SP promedio" value={analytics.avgSP} icon={<BarChart3 size={18} />} color="info" />
          <SummaryCard label="Completitud prom." value={`${analytics.avgCompl}%`} icon={<TrendingUp size={18} />} color={analytics.avgCompl >= 70 ? 'success' : 'warning'} />
          <SummaryCard label="Ánimo promedio" value={analytics.avgMoodAll > 0 ? `${analytics.avgMoodAll}/5` : '—'} icon={<Brain size={18} />} color={analytics.avgMoodAll >= 4 ? 'success' : analytics.avgMoodAll >= 3 ? 'warning' : 'danger'} />
        </div>

        {/* Top performers grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CategoryCard title="Más Story Points" icon={<Award size={16} className="text-amber-500" />}>
            {analytics.topSP.map((item, i) => (
              <MemberRow key={item.member.id} rank={i + 1} name={item.displayName}
                rightLabel={`${item.totalSP} SP`} rightSublabel={`${item.sprintCount} sprints`} highlight={i === 0} />
            ))}
          </CategoryCard>

          <CategoryCard title="Mejor Completitud" icon={<TrendingUp size={16} className="text-success" />}>
            {analytics.topCompletion.map((item, i) => (
              <MemberRow key={item.member.id} rank={i + 1} name={item.displayName}
                rightLabel={`${item.avgCompletion}%`} rightSublabel={`${item.totalSP} SP totales`} highlight={i === 0} />
            ))}
          </CategoryCard>

          <CategoryCard title="Mejor Ánimo" icon={<Star size={16} className="text-primary" />}>
            {analytics.topMood.filter((m) => m.avgMood > 0).slice(0, 3).map((item, i) => (
              <MemberRow key={item.member.id} rank={i + 1} name={item.displayName}
                rightLabel={`${item.avgMood}/5`} rightSublabel={`${item.oneOnOneCount} reuniones`} highlight={i === 0} />
            ))}
            {analytics.topMood.filter((m) => m.avgMood > 0).length === 0 && (
              <p className="text-sm text-neutral-50 text-center py-4">Sin datos de ánimo</p>
            )}
          </CategoryCard>
        </div>

        {/* Needs attention */}
        {analytics.needsAttention.length > 0 && (
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-danger/20 dark:border-danger/30 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" />
              <h2 className="text-sm font-bold text-danger">Requiere Atención</h2>
              <span className="text-xs text-danger/70 ml-auto">{analytics.needsAttention.length} miembro{analytics.needsAttention.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-neutral-10 dark:divide-neutral-75">
              {analytics.needsAttention.map((item) => {
                const reasons: string[] = []
                if (item.avgCompletion > 0 && item.avgCompletion < 40) reasons.push(`Baja completitud (${item.avgCompletion}%)`)
                if (item.avgMood > 0 && item.avgMood < 3) reasons.push(`Ánimo bajo (${item.avgMood}/5)`)
                return (
                  <div key={item.member.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{item.displayName}</p>
                    </div>
                    <div className="text-xs text-right text-danger">
                      {reasons.map((r, i) => <p key={i}>{r}</p>)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Efficiency comparison chart */}
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            Eficiencia comparativa
          </h3>
          <div className="space-y-3">
            {analytics.all
              .map((item) => ({
                ...item,
                _score: Math.round(item.avgCompletion * 0.6 + Math.min(item.totalSP / 5, 100) * 0.4),
              }))
              .sort((a, b) => b._score - a._score)
              .slice(0, 8)
              .map((item) => (
                <div key={item.member.id} className="flex items-center gap-4">
                  <span className="text-sm text-neutral-70 dark:text-neutral-30 font-medium w-32 truncate">{item.displayName}</span>
                  <div className="flex-1 h-3 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden relative">
                    <div
                      className={cn('h-full rounded-full', item._score >= 80 ? 'bg-success' : item._score >= 50 ? 'bg-warning' : 'bg-danger')}
                      style={{ width: `${Math.min(item._score, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-90 dark:text-white w-16 text-right">{item._score}%</span>
                  <span className="text-xs text-neutral-50 w-20 text-right">{item.totalSP} SP</span>
                </div>
              ))}
          </div>
        </div>

        <div className="text-center text-xs text-neutral-40 dark:text-neutral-60 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform · Eficiencia = 60% completitud + 40% SP acumulados
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10', info: 'text-info bg-info/10',
    success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', danger: 'text-danger bg-danger/10',
  }
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <div className={cn('p-2 rounded-lg w-fit mb-2', colors[color] ?? colors.primary)}>{icon}</div>
      <p className="text-xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}

function CategoryCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 border-l-4 border-l-primary shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-20 dark:border-neutral-70 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-neutral-90 dark:text-white">{title}</h3>
      </div>
      <div className="p-2 space-y-1">{children}</div>
    </div>
  )
}

function MemberRow({ rank, name, rightLabel, rightSublabel, highlight }: {
  rank: number; name: string; rightLabel: string; rightSublabel: string; highlight: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors', highlight && 'bg-amber-50 dark:bg-amber-500/5')}>
      <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold',
        rank === 1 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' :
        rank === 2 ? 'bg-neutral-100 dark:bg-neutral-75 text-neutral-600' :
        'bg-neutral-50/20 text-neutral-500')}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-90 dark:text-white truncate">{name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-neutral-90 dark:text-white">{rightLabel}</p>
        <p className="text-xs text-neutral-50">{rightSublabel}</p>
      </div>
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

