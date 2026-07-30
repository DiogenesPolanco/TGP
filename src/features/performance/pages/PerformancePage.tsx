import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import {
  getTeamPerformanceIndicators,
  getMemberKPIs,
} from '@/services/performance/performanceService'
import type { Team } from '@/types/domain'
import type { MemberKPIs } from '@/services/performance/performanceService'
import { useCatalogMap } from '@/hooks/useCatalog'
import { KpiCard } from '@/components/data-display/KpiCard'
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
  const roleLabels = useCatalogMap('member_role')
  const [team, setTeam] = useState<Team | null>(null)
  const [indicators, setIndicators] = useState<Awaited<
    ReturnType<typeof getTeamPerformanceIndicators>
  > | null>(null)
  const [memberKpis, setMemberKpis] = useState<Map<string, MemberKPIs>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    db.teams.get(teamId).then(async (t) => {
      if (!t) {
        setLoading(false)
        return
      }
      setTeam(t)
      const ind = await getTeamPerformanceIndicators(t)
      setIndicators(ind)

      // Fetch individual member KPIs
      if (t.members && t.members.length > 0) {
        const kpisArray = await Promise.all(t.members.map((m) => getMemberKPIs(m.id)))
        const map = new Map<string, MemberKPIs>()
        kpisArray.forEach((k) => map.set(k.memberId, k))
        setMemberKpis(map)
      }

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

  // Compute max SP for progress bar scaling
  const maxSP = Math.max(1, ...Array.from(memberKpis.values()).map((k) => k.totalSP))

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/teams/members')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Rendimiento — {team.name}
          </h1>
          <p className="text-muted text-sm">{team.members?.length ?? 0} miembros</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {indicators?.bestPerformer ? (
          <KpiCard
            title="Mejor Rendimiento"
            value={indicators.bestPerformer.kpis.efficiencyPct + '%'}
            subtitle={`${indicators.bestPerformer.member.displayName} · ${indicators.bestPerformer.kpis.totalSP} SP`}
            trend="up"
            trendValue={`${indicators.bestPerformer.kpis.efficiencyPct}%`}
            icon={<TrendingUp size={20} />}
            color="success"
          />
        ) : (
          <KpiCard
            title="Mejor Rendimiento"
            value="—"
            icon={<TrendingUp size={20} />}
            color="success"
          />
        )}

        {indicators?.worstPerformer ? (
          <KpiCard
            title="Menor Rendimiento"
            value={indicators.worstPerformer.kpis.efficiencyPct + '%'}
            subtitle={`${indicators.worstPerformer.member.displayName} · ${indicators.worstPerformer.kpis.totalSP} SP`}
            trend="down"
            trendValue={`${indicators.worstPerformer.kpis.efficiencyPct}%`}
            icon={<TrendingDown size={20} />}
            color="danger"
          />
        ) : (
          <KpiCard
            title="Menor Rendimiento"
            value="—"
            icon={<TrendingDown size={20} />}
            color="danger"
          />
        )}

        {indicators?.topSP ? (
          <KpiCard
            title="Más Story Points"
            value={String(indicators.topSP.sp)}
            subtitle={indicators.topSP.member.displayName}
            icon={<Zap size={20} />}
            color="primary"
          />
        ) : (
          <KpiCard title="Más Story Points" value="—" icon={<Zap size={20} />} color="primary" />
        )}

        {indicators?.bottomSP ? (
          <KpiCard
            title="Menos Story Points"
            value={String(indicators.bottomSP.sp)}
            subtitle={indicators.bottomSP.member.displayName}
            icon={<BarChart3 size={20} />}
            color="info"
          />
        ) : (
          <KpiCard
            title="Menos Story Points"
            value="—"
            icon={<BarChart3 size={20} />}
            color="info"
          />
        )}
      </div>

      {/* Member List */}
      <div className="bg-card rounded-2xl border border-boundary">
        <div className="px-5 py-4 border-b border-boundary">
          <h2 className="font-semibold text-neutral-90 dark:text-white">Miembros del Equipo</h2>
        </div>
        <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => {
              const kpis = memberKpis.get(member.id)
              const spPct = kpis && maxSP > 0 ? (kpis.totalSP / maxSP) * 100 : 0
              const effColor = !kpis
                ? 'neutral'
                : kpis.efficiencyPct >= 75
                  ? 'success'
                  : kpis.efficiencyPct >= 50
                    ? 'warning'
                    : 'danger'
              const moodColor = !kpis
                ? 'neutral'
                : kpis.avgMood >= 7
                  ? 'success'
                  : kpis.avgMood >= 4
                    ? 'warning'
                    : 'danger'

              return (
                <button
                  key={member.id}
                  onClick={() => navigate(`/teams/${teamId}/performance/${member.id}`)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-90 dark:text-white truncate">
                        {member.displayName}
                      </p>
                      <p className="text-xs text-neutral-50 truncate">
                        {roleLabels[member.role] ?? member.role}
                      </p>
                    </div>
                  </div>

                  {kpis && (
                    <div className="flex items-center gap-4 mr-2">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              effColor === 'success'
                                ? 'bg-success'
                                : effColor === 'warning'
                                  ? 'bg-warning'
                                  : effColor === 'danger'
                                    ? 'bg-danger'
                                    : 'bg-neutral-40'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              effColor === 'success'
                                ? 'text-success'
                                : effColor === 'warning'
                                  ? 'text-warning'
                                  : effColor === 'danger'
                                    ? 'text-danger'
                                    : 'text-neutral-50'
                            }`}
                          >
                            {kpis.efficiencyPct}%
                          </span>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-1">
                        <span
                          className={`text-xs ${
                            moodColor === 'success'
                              ? 'text-success'
                              : moodColor === 'warning'
                                ? 'text-warning'
                                : moodColor === 'danger'
                                  ? 'text-danger'
                                  : 'text-neutral-40'
                          }`}
                        >
                          {'●'.repeat(Math.max(1, Math.min(3, Math.ceil(kpis.avgMood / 3.5))))}
                        </span>
                      </div>

                      <div className="w-20 hidden md:block">
                        <div className="h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${spPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <ChevronRight size={18} className="text-neutral-30 shrink-0" />
                </button>
              )
            })
          ) : (
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
