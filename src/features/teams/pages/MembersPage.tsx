import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { useNavigate } from 'react-router-dom'
import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import type { MemberStatus } from '@/types/domain'
import { Search, Filter, Users, Award, TrendingUp, TrendingDown, Star, Loader2, X } from 'lucide-react'
import { getGlobalMembersKPIs } from '@/services/performance/performanceService'

type TeamEntry = { id: string; name: string }

export function MembersPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const [globalData, setGlobalData] = useState<Awaited<ReturnType<typeof getGlobalMembersKPIs>> | null>(null)
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    setLoading(true)
    getGlobalMembersKPIs().then((d) => { setGlobalData(d); setLoading(false) })
  }, [])

  const allMembers = useMemo(() => {
    if (!globalData) return []
    const filtered = globalData.kpisList.filter((k) => {
      if (searchTerm && !k.member.displayName.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterTeam && k.team.id !== filterTeam) return false
      if (filterStatus && k.member.status !== filterStatus) return false
      return true
    })
    return filtered
  }, [globalData, searchTerm, filterTeam, filterStatus])

  const { page, setPage, totalPages, paginatedItems } = usePagination(allMembers, 10)

  const teamOptions: TeamEntry[] = useMemo(
    () => teams.map((t) => ({ id: t.id, name: t.name })),
    [teams]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  const kpi = globalData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Miembros</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp size={22} />}
          label="Mejor Rendimiento"
          value={kpi?.bestPerformer ? `${kpi.bestPerformer.kpis.efficiencyPct}%` : '—'}
          subtitle={kpi?.bestPerformer?.member.displayName}
          color="text-success"
        />
        <KpiCard
          icon={<TrendingDown size={22} />}
          label="Menor Rendimiento"
          value={kpi?.worstPerformer ? `${kpi.worstPerformer.kpis.efficiencyPct}%` : '—'}
          subtitle={kpi?.worstPerformer?.member.displayName}
          color="text-danger"
        />
        <KpiCard
          icon={<Star size={22} />}
          label="Más Story Points"
          value={kpi?.topSP ? `${kpi.topSP.kpis.totalSP}` : '—'}
          subtitle={kpi?.topSP?.member.displayName}
          color="text-warning"
        />
        <KpiCard
          icon={<Award size={22} />}
          label="Menos Story Points"
          value={kpi?.bottomSP ? `${kpi.bottomSP.kpis.totalSP}` : '—'}
          subtitle={kpi?.bottomSP?.member.displayName}
          color="text-neutral-50"
        />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar miembros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || filterTeam || filterStatus
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(filterTeam || filterStatus) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div>
              <label className="text-xs text-neutral-60 mr-2">Equipo</label>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
              >
                <option value="">Todos</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-60 mr-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {(filterTeam || filterStatus) && (
              <button
                onClick={() => { setFilterTeam(''); setFilterStatus('') }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger"
              >
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
        {paginatedItems.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-neutral-30 mb-3" />
            <p className="text-neutral-50">No se encontraron miembros</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {paginatedItems.map(({ member, team, kpis }) => {
              const statusColors: Record<MemberStatus, string> = {
                activo: 'bg-success/10 text-success',
                licencia: 'bg-warning/10 text-warning',
                vacaciones: 'bg-info/10 text-info',
                desvinculado: 'bg-danger/10 text-danger',
              }
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors cursor-pointer"
                  onClick={() => navigate(`/teams/${team.id}/performance/${member.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                        {member.displayName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-50">
                        <span>{MEMBER_ROLE_LABELS[member.role] ?? member.role}</span>
                        <span>·</span>
                        <span>{team.name}</span>
                        <span>·</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[member.status]}`}>
                          {MEMBER_STATUS_LABELS[member.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{kpis.totalSP}</p>
                      <p className="text-xs text-neutral-50">SP</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{kpis.efficiencyPct}%</p>
                      <p className="text-xs text-neutral-50">Efic.</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={allMembers.length}
        pageSize={10}
        onPageChange={setPage}
      />
    </div>
  )
}

function KpiCard({ icon, label, value, subtitle, color }: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string; color: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={color}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-1">{label}</p>
      {subtitle && (
        <p className="text-xs text-neutral-50 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  )
}
