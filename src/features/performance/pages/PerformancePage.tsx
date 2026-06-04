import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { getTeamPerformanceIndicators } from '@/services/performance/performanceService'
import type { Team } from '@/types/domain'
import {
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Zap,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

export function PerformancePage() {
  const { id: teamId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [indicators, setIndicators] = useState<Awaited<ReturnType<typeof getTeamPerformanceIndicators>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    db.teams.get(teamId).then(async (t) => {
      if (!t) { setLoading(false); return }
      setTeam(t)
      const ind = await getTeamPerformanceIndicators(t)
      setIndicators(ind)
      setLoading(false)
    })
  }, [teamId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="p-6 text-center text-neutral-50">
        <p>Equipo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/teams/performance')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            Rendimiento — {team.name}
          </h1>
          <p className="text-neutral-60 dark:text-neutral-40 text-sm">
            {team.members?.length ?? 0} miembros
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Best Performer */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-50">
              Mejor Rendimiento
            </span>
          </div>
          {indicators?.bestPerformer ? (
            <>
              <p className="text-lg font-bold text-neutral-90 dark:text-white truncate">
                {indicators.bestPerformer.member.displayName}
              </p>
              <p className="text-sm text-neutral-50 mt-1">
                {indicators.bestPerformer.kpis.efficiencyPct}% eficiencia · {indicators.bestPerformer.kpis.totalSP} SP
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-40">Sin datos</p>
          )}
        </div>

        {/* Worst Performer */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <TrendingDown size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-50">
              Menor Rendimiento
            </span>
          </div>
          {indicators?.worstPerformer ? (
            <>
              <p className="text-lg font-bold text-neutral-90 dark:text-white truncate">
                {indicators.worstPerformer.member.displayName}
              </p>
              <p className="text-sm text-neutral-50 mt-1">
                {indicators.worstPerformer.kpis.efficiencyPct}% eficiencia · {indicators.worstPerformer.kpis.totalSP} SP
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-40">Sin datos</p>
          )}
        </div>

        {/* Top SP */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Zap size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-50">
              Más Story Points
            </span>
          </div>
          {indicators?.topSP ? (
            <>
              <p className="text-lg font-bold text-neutral-90 dark:text-white truncate">
                {indicators.topSP.member.displayName}
              </p>
              <p className="text-sm text-neutral-50 mt-1">
                {indicators.topSP.sp} SP completados
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-40">Sin datos</p>
          )}
        </div>

        {/* Bottom SP */}
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <BarChart3 size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-50">
              Menos Story Points
            </span>
          </div>
          {indicators?.bottomSP ? (
            <>
              <p className="text-lg font-bold text-neutral-90 dark:text-white truncate">
                {indicators.bottomSP.member.displayName}
              </p>
              <p className="text-sm text-neutral-50 mt-1">
                {indicators.bottomSP.sp} SP completados
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-40">Sin datos</p>
          )}
        </div>
      </div>

      {/* Member List */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
        <div className="px-5 py-4 border-b border-neutral-20 dark:border-neutral-70">
          <h2 className="font-semibold text-neutral-90 dark:text-white">Miembros del Equipo</h2>
        </div>
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {team.members && team.members.length > 0 ? team.members.map((member) => (
            <button
              key={member.id}
              onClick={() => navigate(`/teams/${teamId}/performance/${member.id}`)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-neutral-90 dark:text-white">{member.displayName}</p>
                  <p className="text-xs text-neutral-50">{member.role}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-30" />
            </button>
          )) : (
            <div className="px-5 py-8 text-center text-neutral-40">
              <Award size={32} className="mx-auto mb-2 opacity-50" />
              <p>No hay miembros en este equipo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
