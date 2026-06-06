import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getShareInfo, getPublicMemberData, type PublicMemberData } from '@/services/share/publicShareService'
import { Lock, Clock, BarChart3, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PublicMemberPage() {
  const { hash } = useParams<{ hash: string }>()
  const [valid, setValid] = useState<boolean | null>(null)
  const [data, setData] = useState<PublicMemberData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hash) { setValid(false); setLoading(false); return }
    const info = getShareInfo(hash)
    if (info && info.type === 'member' && info.ref) {
      setValid(true)
      getPublicMemberData(info.ref).then((d) => { setData(d); setLoading(false) })
      return
    }
    import('@/services/share/azureShareService').then(async ({ downloadShareFromAzure }) => {
      const azureData = await downloadShareFromAzure(hash) as PublicMemberData | null
      if (azureData) { setData(azureData); setValid(true) } else { setValid(false) }
      setLoading(false)
    })
  }, [hash])

  const stats = useMemo(() => {
    if (!data) return null
    const totalSP = data.sprints.reduce((s, sp) => s + sp.storyPointsCompleted, 0)
    const avgMood = data.oneOnOnes.length
      ? Math.round(data.oneOnOnes.reduce((s, o) => s + o.estadoAnimo, 0) / data.oneOnOnes.length * 10) / 10
      : 0
    const achievements = data.achievements.length
    return { totalSP, avgMood, achievements, sprintCount: data.sprints.length, oneOnOneCount: data.oneOnOnes.length }
  }, [data])

  if (loading) return <Loader />
  if (!valid) return <InvalidLink />
  if (!data || !stats || !data.member) return null

  const { member, displayName, team, sprints, oneOnOnes } = data

  return (
    <div className="min-h-screen bg-neutral-10 dark:bg-neutral-90">
      <header className="bg-white dark:bg-neutral-80 border-b border-neutral-20 dark:border-neutral-70">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <img src="/favicon.svg" alt="TGP" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-90 dark:text-white">Perfil de miembro</h1>
              <p className="text-xs text-neutral-50">Vista compartida · Solo lectura</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-50">
            <Clock size={14} />
            <span>Actualizado al momento del acceso</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{displayName.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral-90 dark:text-white">{displayName}</h2>
              <p className="text-sm text-neutral-60 dark:text-neutral-40 capitalize">{member.role?.replace(/_/g, ' ')}</p>
              {team && <p className="text-xs text-neutral-50 mt-0.5">{team.name}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-neutral-90 dark:text-white">{stats.totalSP}</p>
                <p className="text-xs text-neutral-50">SP totales</p>
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-90 dark:text-white">{stats.sprintCount}</p>
                <p className="text-xs text-neutral-50">Sprints</p>
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-90 dark:text-white">
                  {stats.avgMood > 0 ? `${stats.avgMood}/5` : '—'}
                </p>
                <p className="text-xs text-neutral-50">Ánimo prom.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint history */}
        <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            Historial de sprints
          </h3>
          {sprints.length > 0 ? (
            <div className="space-y-2">
              {sprints.slice(-10).reverse().map((sp) => {
                const total = sp.storyPointsCompleted + sp.storyPointsNotCompleted
                const pct = total > 0 ? Math.round((sp.storyPointsCompleted / total) * 100) : 0
                return (
                  <div key={sp.id} className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-70 dark:text-neutral-30 font-medium w-20">{sp.sprintName}</span>
                    <div className="flex-1 h-2 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-danger')}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-neutral-90 dark:text-white font-medium w-16 text-right">
                      {sp.storyPointsCompleted}/{total}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-50 text-center py-4">Sin datos de sprints</p>
          )}
        </div>

        {/* 1:1s */}
        {oneOnOnes.length > 0 && (
          <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-90 dark:text-white mb-4 flex items-center gap-2">
              <Brain size={16} className="text-purple-500" />
              1:1 Recientes
            </h3>
            <div className="space-y-3">
              {oneOnOnes.slice(-3).reverse().map((oo) => (
                <div key={oo.id} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-5 dark:bg-neutral-85">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                    oo.estadoAnimo >= 4 ? 'bg-success/10 text-success' :
                    oo.estadoAnimo >= 3 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger')}>
                    {oo.estadoAnimo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-50">{new Date(oo.date).toLocaleDateString('es-ES')}</p>
                    <p className="text-sm text-neutral-80 dark:text-neutral-20 mt-0.5 line-clamp-2">
                      {oo.feedbackDelLider || 'Sin registro'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-neutral-40 dark:text-neutral-60 py-4 border-t border-neutral-20 dark:border-neutral-70">
          TGP — Technology Governance Platform
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
        <p className="text-sm text-neutral-60">Este enlace ha expirado o no es válido.</p>
      </div>
    </div>
  )
}
