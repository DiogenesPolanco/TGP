import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import type { MemberStatus } from '@/types/domain'
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Loader2,
  X,
  Edit3,
  Share2,
  Check,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { getGlobalMembersKPIs, DEV_ROLES } from '@/services/performance/performanceService'
import { createShareLink, getPublicPerformanceData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { MemberEditModal } from '@/features/teams/components/MemberEditModal'
import { KpiCard } from '@/components/data-display/KpiCard'
import { Button } from '@/components/ui/Button'

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
  const [showTerms, setShowTerms] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const doShare = useCallback(async () => {
    const data = await getPublicPerformanceData()
    setSharePending(data)
    setShowPassphrase(true)
  }, [])

  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const [globalData, setGlobalData] = useState<Awaited<
    ReturnType<typeof getGlobalMembersKPIs>
  > | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGlobalMembersKPIs().then((d) => {
      setGlobalData(d)
      setLoading(false)
    })
  }, [])

  const allMembers = useMemo(() => {
    if (!globalData) return []
    const filtered = globalData.kpisList.filter((k) => {
      if (searchTerm && !k.member.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
        return false
      if (filterTeam && k.team.id !== filterTeam) return false
      if (filterStatus && k.member.status !== filterStatus) return false
      return true
    })
    return filtered
  }, [globalData, searchTerm, filterTeam, filterStatus])

  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedMembers = useMemo(() => {
    const sorted = [...allMembers]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.member.displayName.localeCompare(b.member.displayName)
          break
        case 'role':
          cmp = a.member.role.localeCompare(b.member.role)
          break
        case 'team':
          cmp = a.team.name.localeCompare(b.team.name)
          break
        case 'status':
          cmp = a.member.status.localeCompare(b.member.status)
          break
        case 'sp':
          cmp = a.kpis.totalSP - b.kpis.totalSP
          break
        case 'efficiency':
          cmp = a.kpis.efficiencyPct - b.kpis.efficiencyPct
          break
        case 'mood':
          cmp = a.kpis.avgMood - b.kpis.avgMood
          break
        case 'attention':
          cmp = a.kpis.attentionScore - b.kpis.attentionScore
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [allMembers, sortKey, sortDir])

  const { page, setPage, totalPages, pageSize, setPageSize, paginatedItems } = usePagination(
    sortedMembers,
    10,
  )

  const toggleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDir(key === 'name' ? 'asc' : 'desc')
      }
      setPage(1)
    },
    [sortKey, setPage],
  )

  const teamOptions: TeamEntry[] = useMemo(
    () => teams.map((t) => ({ id: t.id, name: t.name })),
    [teams],
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
      bestPerformer:
        withSP.length > 0
          ? withSP.reduce((a, b) => (a.kpis.efficiencyPct > b.kpis.efficiencyPct ? a : b))
          : null,
      worstPerformer:
        withSP.length > 0
          ? withSP.reduce((a, b) => (a.kpis.efficiencyPct < b.kpis.efficiencyPct ? a : b))
          : null,
      topSP:
        withSP.length > 0
          ? withSP.reduce((a, b) => (a.kpis.totalSP > b.kpis.totalSP ? a : b))
          : null,
      needsAttention:
        filtered.length > 0
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
        <Button
          onClick={async () => {
            if (!isTermsAccepted()) {
              setShowTerms(true)
              return
            }
            await doShare()
          }}
          className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <Share2 size={16} />
          Compartir
        </Button>
      </div>

      {shareUrl &&
        (() => {
          const cleanUrl = shareUrl.split('#')[0]
          return (
            <div className="bg-card rounded-xl border border-boundary p-4 flex items-center gap-3 max-w-full overflow-hidden">
              <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs bg-primary/5 dark:bg-primary/10 px-3 py-1.5 rounded-lg text-primary hover:text-primary-dark truncate font-mono min-w-0 hover:underline"
              >
                {cleanUrl}
              </a>
              <Button
                onClick={async () => {
                  navigator.clipboard.writeText(shareUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          )
        })()}

      {showTerms && (
        <TermsModal
          onAccept={() => {
            acceptTerms()
            setShowTerms(false)
            doShare()
          }}
          onClose={() => {
            setShowTerms(false)
          }}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace"
          buttonLabel="Proteger"
          onSubmit={async (pass) => {
            const data = sharePending
            const payload = pass ? await encryptData(data, pass) : data
            const { url } = await createShareLink(48, 'members', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'members', undefined, sharePending)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => {
            setShowPassphrase(false)
            setSharePending(null)
          }}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TrendingUp size={22} />}
          title="Mejor Rendimiento"
          value={
            filteredKpis?.bestPerformer ? `${filteredKpis.bestPerformer.kpis.efficiencyPct}%` : '—'
          }
          subtitle={filteredKpis?.bestPerformer?.member.displayName}
          color="success"
          onClick={
            filteredKpis?.bestPerformer
              ? () => {
                  const m = filteredKpis.bestPerformer!
                  setEditMemberId(m.member.id)
                  setEditMemberName(m.member.displayName)
                  setEditMemberTeamId(m.team.id)
                }
              : undefined
          }
        />
        <KpiCard
          icon={<TrendingDown size={22} />}
          title="Menor Rendimiento"
          value={
            filteredKpis?.worstPerformer
              ? `${filteredKpis.worstPerformer.kpis.efficiencyPct}%`
              : '—'
          }
          subtitle={filteredKpis?.worstPerformer?.member.displayName}
          color="danger"
          onClick={
            filteredKpis?.worstPerformer
              ? () => {
                  const m = filteredKpis.worstPerformer!
                  setEditMemberId(m.member.id)
                  setEditMemberName(m.member.displayName)
                  setEditMemberTeamId(m.team.id)
                }
              : undefined
          }
        />
        <KpiCard
          icon={<Star size={22} />}
          title="Más Story Points"
          value={filteredKpis?.topSP ? `${filteredKpis.topSP.kpis.totalSP}` : '—'}
          subtitle={filteredKpis?.topSP?.member.displayName}
          color="warning"
          onClick={
            filteredKpis?.topSP
              ? () => {
                  const m = filteredKpis.topSP!
                  setEditMemberId(m.member.id)
                  setEditMemberName(m.member.displayName)
                  setEditMemberTeamId(m.team.id)
                }
              : undefined
          }
        />
        <KpiCard
          icon={<AlertTriangle size={22} />}
          title="Requiere Atención"
          value={
            filteredKpis?.needsAttention
              ? `${filteredKpis.needsAttention.kpis.attentionScore}`
              : '—'
          }
          subtitle={filteredKpis?.needsAttention?.member.displayName}
          color="danger"
          onClick={
            filteredKpis?.needsAttention
              ? () => {
                  const m = filteredKpis.needsAttention!
                  setEditMemberId(m.member.id)
                  setEditMemberName(m.member.displayName)
                  setEditMemberTeamId(m.team.id)
                }
              : undefined
          }
          info={
            filteredKpis?.needsAttention
              ? (() => {
                  const k = filteredKpis.needsAttention!.kpis
                  const eff = Math.round(((100 - k.efficiencyPct) / 100) * 35)
                  const opps = k.openOpportunitiesCount
                  const oppScore = Math.round((Math.min(opps, 5) / 5) * 35)
                  const moodScore = k.oneOnOneCount > 0 ? Math.round(((5 - k.avgMood) / 4) * 20) : 0
                  const achScore = k.achievementCount === 0 ? 10 : 0
                  return (
                    <div className="space-y-2">
                      <p className="font-semibold text-xs mb-1">Composición del puntaje (0–100):</p>
                      <div>
                        <span className="text-neutral-30">Eficiencia baja</span>
                        <span className="float-right font-mono">{eff}/35</span>
                      </div>
                      <div>
                        <span className="text-neutral-30">Oportunidades de mejora ({opps})</span>
                        <span className="float-right font-mono">{oppScore}/35</span>
                      </div>
                      <div>
                        <span className="text-neutral-30">Ánimo bajo</span>
                        <span className="float-right font-mono">{moodScore}/20</span>
                      </div>
                      <div>
                        <span className="text-neutral-30">Sin logros</span>
                        <span className="float-right font-mono">{achScore}/10</span>
                      </div>
                    </div>
                  )
                })()
              : undefined
          }
        />
      </div>

      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar miembros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || filterTeam || filterStatus
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(filterTeam || filterStatus) && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-boundary">
            <div>
              <label className="text-xs text-neutral-60 mr-2">Equipo</label>
              <Select
                value={filterTeam}
                onChange={(v) => setFilterTeam(v)}
                options={[
                  { value: '', label: 'Todos' },
                  ...teamOptions.map((t) => ({ value: t.id, label: t.name })),
                ]}
                className="min-w-[140px]"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-60 mr-2">Estado</label>
              <Select
                value={filterStatus}
                onChange={(v) => setFilterStatus(v)}
                options={[
                  { value: '', label: 'Todos' },
                  ...Object.entries(MEMBER_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
                ]}
                className="min-w-[140px]"
              />
            </div>
            {(filterTeam || filterStatus) && (
              <Button
                onClick={async () => {
                  setFilterTeam('')
                  setFilterStatus('')
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger"
              >
                <X size={14} />
                Limpiar
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-boundary shadow-sm">
        {paginatedItems.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-neutral-30 mb-3" />
            <p className="text-neutral-50">No se encontraron miembros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-boundary">
                  <th className="text-left px-4 py-3 font-medium text-neutral-50 w-10"></th>
                  <SortTh
                    label="Nombre"
                    sortKey="name"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                  <SortTh
                    label="Rol"
                    sortKey="role"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                  <SortTh
                    label="Equipo"
                    sortKey="team"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                  <SortTh
                    label="Estado"
                    sortKey="status"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                  />
                  <SortTh
                    label="SP"
                    sortKey="sp"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                    align="right"
                  />
                  <SortTh
                    label="Eficiencia"
                    sortKey="efficiency"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                    align="right"
                  />
                  <SortTh
                    label="Aten."
                    sortKey="attention"
                    currentKey={sortKey}
                    dir={sortDir}
                    onToggle={toggleSort}
                    align="right"
                  />
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
                      <td className="px-4 py-3 font-medium text-neutral-90 dark:text-white">
                        {member.displayName}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {MEMBER_ROLE_LABELS[member.role] ?? member.role}
                      </td>
                      <td className="px-4 py-3 text-secondary">{team.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[member.status]}`}
                        >
                          {MEMBER_STATUS_LABELS[member.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-neutral-90 dark:text-white tabular-nums">
                            {kpis.totalSP}
                          </span>
                          <div className="w-12 h-1 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(100, kpis.totalSP)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              kpis.avgMood >= 7
                                ? 'bg-success'
                                : kpis.avgMood >= 4
                                  ? 'bg-warning'
                                  : 'bg-danger'
                            }`}
                            title={`Ánimo: ${kpis.avgMood}/10`}
                          />
                          <span
                            className={`font-semibold tabular-nums ${
                              kpis.efficiencyPct >= 75
                                ? 'text-success'
                                : kpis.efficiencyPct >= 50
                                  ? 'text-warning'
                                  : 'text-danger'
                            }`}
                          >
                            {kpis.efficiencyPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                              kpis.attentionScore <= 20
                                ? 'bg-success/10 text-success'
                                : kpis.attentionScore <= 50
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {kpis.attentionScore}
                          </span>
                          <Edit3 size={16} className="text-neutral-30" />
                        </div>
                      </td>
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
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <MemberEditModal
        memberId={editMemberId ?? ''}
        memberName={editMemberName}
        teamId={editMemberTeamId}
        open={editMemberId !== null}
        onClose={() => {
          setEditMemberId(null)
          setEditMemberTeamId('')
        }}
      />
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active)
    return (
      <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-60 transition-opacity" />
    )
  return dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
}

function SortTh({
  label,
  sortKey,
  currentKey,
  dir,
  onToggle,
  align,
}: {
  label: string
  sortKey: string
  currentKey: string
  dir: 'asc' | 'desc'
  onToggle: (k: string) => void
  align?: 'left' | 'right'
}) {
  const active = currentKey === sortKey
  return (
    <th
      onClick={() => onToggle(sortKey)}
      className={`group px-4 py-3 font-medium text-neutral-50 hover:text-neutral-90 dark:hover:text-white cursor-pointer select-none transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <span className={`${active ? 'text-primary' : ''}`}>
          <SortIcon active={active} dir={dir} />
        </span>
      </div>
    </th>
  )
}
