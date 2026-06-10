import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import type { MemberStatus } from '@/types/domain'
import { Search, Filter, Users, TrendingUp, TrendingDown, Star, AlertTriangle, Info, Loader2, X, Edit3, Share2, Check, Copy } from 'lucide-react'
import { getGlobalMembersKPIs, DEV_ROLES } from '@/services/performance/performanceService'
import { createShareLink, getPublicPerformanceData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { MemberEditModal } from '@/features/teams/components/MemberEditModal'

type TeamEntry = { id: string; name: string }

export function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editMemberId, setEditMemberId] = useState<string | null>(null)
  const [editMemberName, setEditMemberName] = useState('')
  const [editMemberTeamId, setEditMemberTeamId] = useState<string>('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const [globalData, setGlobalData] = useState<Awaited<ReturnType<typeof getGlobalMembersKPIs>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const filteredKpis = useMemo(() => {
    if (!globalData) return null
    // Filtra por equipo y solo roles de desarrollo para los indicadores
    const filtered = globalData.kpisList.filter((k) => {
      if (filterTeam && k.team.id !== filterTeam) return false
      if (!DEV_ROLES.includes(k.member.role)) return false
      return true
    })
    const withSP = filtered.filter((k) => k.kpis.totalSP > 0)
    return {
      bestPerformer: withSP.length > 0
        ? withSP.reduce((a, b) => (a.kpis.efficiencyPct > b.kpis.efficiencyPct ? a : b))
        : null,
      worstPerformer: withSP.length > 0
        ? withSP.reduce((a, b) => (a.kpis.efficiencyPct < b.kpis.efficiencyPct ? a : b))
        : null,
      topSP: withSP.length > 0
        ? withSP.reduce((a, b) => (a.kpis.totalSP > b.kpis.totalSP ? a : b))
        : null,
      needsAttention: filtered.length > 0
        ? filtered.reduce((a, b) => (a.kpis.attentionScore > b.kpis.attentionScore ? a : b))
        : null,
    }
  }, [globalData, filterTeam])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Rendimiento</h2>
        <button
          onClick={async () => {
            const data = await getPublicPerformanceData()
            setSharePending(data)
            setShowPassphrase(true)
          }}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </button>
      </div>

      {shareUrl && (() => { const cleanUrl = shareUrl.split('#')[0]; return (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline">
            {cleanUrl}
          </a>
          <button onClick={async () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )})()}

      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace"
            buttonLabel="Proteger"
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'members', undefined, payload)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'members', undefined, sharePending)
            setShareUrl(url); setShowPassphrase(false); setSharePending(null)
          }}
          onClose={() => { setShowPassphrase(false); setSharePending(null) }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp size={22} />}
          label="Mejor Rendimiento"
          value={filteredKpis?.bestPerformer ? `${filteredKpis.bestPerformer.kpis.efficiencyPct}%` : '—'}
          subtitle={filteredKpis?.bestPerformer?.member.displayName}
          memberId={filteredKpis?.bestPerformer?.member.id}
          onMemberClick={(id) => { setEditMemberId(id); setEditMemberName(filteredKpis?.bestPerformer?.member.displayName ?? ''); setEditMemberTeamId(filteredKpis?.bestPerformer?.team.id ?? '') }}
          color="text-success"
        />
        <KpiCard
          icon={<TrendingDown size={22} />}
          label="Menor Rendimiento"
          value={filteredKpis?.worstPerformer ? `${filteredKpis.worstPerformer.kpis.efficiencyPct}%` : '—'}
          subtitle={filteredKpis?.worstPerformer?.member.displayName}
          memberId={filteredKpis?.worstPerformer?.member.id}
          onMemberClick={(id) => { setEditMemberId(id); setEditMemberName(filteredKpis?.worstPerformer?.member.displayName ?? ''); setEditMemberTeamId(filteredKpis?.worstPerformer?.team.id ?? '') }}
          color="text-danger"
        />
        <KpiCard
          icon={<Star size={22} />}
          label="Más Story Points"
          value={filteredKpis?.topSP ? `${filteredKpis.topSP.kpis.totalSP}` : '—'}
          subtitle={filteredKpis?.topSP?.member.displayName}
          memberId={filteredKpis?.topSP?.member.id}
          onMemberClick={(id) => { setEditMemberId(id); setEditMemberName(filteredKpis?.topSP?.member.displayName ?? ''); setEditMemberTeamId(filteredKpis?.topSP?.team.id ?? '') }}
          color="text-warning"
        />
        <KpiCard
          icon={<AlertTriangle size={22} />}
          label="Requiere Atención"
          value={filteredKpis?.needsAttention ? `${filteredKpis.needsAttention.kpis.attentionScore}` : '—'}
          subtitle={filteredKpis?.needsAttention?.member.displayName}
          memberId={filteredKpis?.needsAttention?.member.id}
          onMemberClick={(id) => { setEditMemberId(id); setEditMemberName(filteredKpis?.needsAttention?.member.displayName ?? ''); setEditMemberTeamId(filteredKpis?.needsAttention?.team.id ?? '') }}
          color="text-danger"
          info={filteredKpis?.needsAttention ? (() => {
            const k = filteredKpis.needsAttention!.kpis
            const eff = Math.round(((100 - k.efficiencyPct) / 100) * 35)
            const opps = k.openOpportunitiesCount
            const oppScore = Math.round((Math.min(opps, 5) / 5) * 35)
            const moodScore = k.oneOnOneCount > 0 ? Math.round(((5 - k.avgMood) / 4) * 20) : 0
            const achScore = k.achievementCount === 0 ? 10 : 0
            return (
              <div className="space-y-2">
                <p className="font-semibold text-xs mb-1">Composición del puntaje (0–100):</p>
                <div><span className="text-neutral-30">Eficiencia baja</span><span className="float-right font-mono">{eff}/35</span></div>
                <div><span className="text-neutral-30">Oportunidades de mejora ({opps})</span><span className="float-right font-mono">{oppScore}/35</span></div>
                <div><span className="text-neutral-30">Ánimo bajo</span><span className="float-right font-mono">{moodScore}/20</span></div>
                <div><span className="text-neutral-30">Sin logros</span><span className="float-right font-mono">{achScore}/10</span></div>
              </div>
            )
          })() : undefined}
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
                onClick={async () => { setFilterTeam(''); setFilterStatus('') }}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-20 dark:border-neutral-70">
                  <th className="text-left px-4 py-3 font-medium text-neutral-50 w-10"></th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-50">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-50">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-50">Equipo</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-50">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-50 w-20">SP</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-50 w-20">Efic.</th>
                  <th className="w-10 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                {paginatedItems.map(({ member, team, kpis }) => {
                  const statusColors: Record<MemberStatus, string> = {
                    activo: 'bg-success/10 text-success',
                    incorporacion: 'bg-primary/10 text-primary',
                    licencia: 'bg-warning/10 text-warning',
                    vacaciones: 'bg-info/10 text-info',
                    desvinculado: 'bg-danger/10 text-danger',
                  }
                  return (
                    <tr
                      key={member.id}
                      onClick={async () => {
                        setEditMemberId(member.id)
                        setEditMemberName(member.displayName)
                        setEditMemberTeamId(team.id)
                      }}
                      className="hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-90 dark:text-white">{member.displayName}</td>
                      <td className="px-4 py-3 text-neutral-70 dark:text-neutral-30">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</td>
                      <td className="px-4 py-3 text-neutral-70 dark:text-neutral-30">{team.name}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[member.status]}`}>{MEMBER_STATUS_LABELS[member.status]}</span></td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-90 dark:text-white">{kpis.totalSP}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-90 dark:text-white">{kpis.efficiencyPct}%</td>
                      <td className="px-4 py-3 text-neutral-30"><Edit3 size={16} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

      <MemberEditModal
        memberId={editMemberId ?? ''}
        memberName={editMemberName}
        teamId={editMemberTeamId}
        open={editMemberId !== null}
        onClose={() => { setEditMemberId(null); setEditMemberTeamId('') }}
      />
    </div>
  )
}

function KpiCard({ icon, label, value, subtitle, memberId, onMemberClick, color, info }: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string; memberId?: string; onMemberClick?: (id: string) => void; color: string; info?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm relative">
      <div className="flex items-center justify-between mb-3">
        <div className={color}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
        {info && (
          <div className="relative group">
            <Info size={13} className="text-neutral-50 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-56 p-3 rounded-lg bg-neutral-90 dark:bg-neutral-20 text-white dark:text-neutral-90 text-xs shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              {info}
              <div className="absolute left-3 top-full w-2 h-2 bg-neutral-90 dark:bg-neutral-20 rotate-45 -translate-y-1" />
            </div>
          </div>
        )}
      </div>
      {subtitle && memberId && onMemberClick && (
        <button
          type="button"
          onClick={() => onMemberClick(memberId)}
          className="mt-1.5 text-sm font-semibold text-primary hover:text-primary-dark hover:underline truncate w-full text-left cursor-pointer"
          title="Editar miembro"
        >
          {subtitle}
        </button>
      )}
      {subtitle && !(memberId && onMemberClick) && (
        <p className="text-xs text-neutral-50 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  )
}
