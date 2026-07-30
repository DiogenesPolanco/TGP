import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { usePagination } from '@/hooks/usePagination'
import type { MemberStatus } from '@/constants/enums'
import { Pagination } from '@/components/ui/Pagination'
import { useCatalogMap } from '@/hooks/useCatalog'
import { Users, Loader2, Edit3, Share2 } from 'lucide-react'
import { getGlobalMembersKPIs, DEV_ROLES } from '@/services/performance/performanceService'
import { createShareLink, getPublicPerformanceData } from '@/services/share/publicShareService'
import { encryptData } from '@/services/share/encryptionService'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { TermsModal } from '@/components/sharing/TermsModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { MemberEditModal } from '@/features/teams/components/MemberEditModal'
import { Button } from '@/components/ui/Button'
import { SortTh } from '@/features/teams/components/MembersTableHeader'
import { MembersKpiCards } from '@/features/teams/components/MembersKpiCards'
import { ShareUrlBanner } from '@/components/sharing/ShareUrlBanner'
import { MembersFilterBar } from '@/features/teams/components/MembersFilterBar'

export function MembersPage() {
  const roleLabels = useCatalogMap('member_role')
  const statusLabels = useCatalogMap('member_status')
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

  const handleEditMember = useCallback((id: string, name: string, teamId: string) => {
    setEditMemberId(id)
    setEditMemberName(name)
    setEditMemberTeamId(teamId)
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
    return globalData.kpisList.filter((k) => {
      if (searchTerm && !k.member.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
        return false
      if (filterTeam && k.team.id !== filterTeam) return false
      if (filterStatus && k.member.status !== filterStatus) return false
      return true
    })
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
      if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      else {
        setSortKey(key)
        setSortDir(key === 'name' ? 'asc' : 'desc')
      }
      setPage(1)
    },
    [sortKey, setPage],
  )

  const teamOptions = useMemo(() => teams.map((t) => ({ id: t.id, name: t.name })), [teams])

  const filteredKpis = useMemo(() => {
    if (!globalData) return null
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

  const statusColors: Record<MemberStatus, string> = {
    activo: 'bg-success/10 text-success',
    incorporacion: 'bg-primary/10 text-primary',
    licencia: 'bg-warning/10 text-warning',
    vacaciones: 'bg-info/10 text-info',
    desvinculado: 'bg-danger/10 text-danger',
  }

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
          <Share2 size={16} /> Compartir
        </Button>
      </div>

      {shareUrl && (
        <ShareUrlBanner
          url={shareUrl}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        />
      )}

      {showTerms && (
        <TermsModal
          onAccept={() => {
            acceptTerms()
            setShowTerms(false)
            doShare()
          }}
          onClose={() => setShowTerms(false)}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace"
          buttonLabel="Proteger"
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
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

      <MembersKpiCards filteredKpis={filteredKpis} onEditMember={handleEditMember} />

      <MembersFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterTeam={filterTeam}
        onFilterTeamChange={setFilterTeam}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        teamOptions={teamOptions}
        onClearFilters={() => {
          setFilterTeam('')
          setFilterStatus('')
        }}
        hasActiveFilters={!!filterTeam || !!filterStatus}
      />

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
                  <th className="text-left px-4 py-3 font-medium text-neutral-50 w-10" />
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
                {paginatedItems.map(({ member, team, kpis }) => (
                  <tr
                    key={member.id}
                    onClick={() => handleEditMember(member.id, member.displayName, team.id)}
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
                      {roleLabels[member.role] ?? member.role}
                    </td>
                    <td className="px-4 py-3 text-secondary">{team.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[member.status]}`}
                      >
                        {statusLabels[member.status]}
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
                          className={`w-2 h-2 rounded-full shrink-0 ${kpis.avgMood >= 7 ? 'bg-success' : kpis.avgMood >= 4 ? 'bg-warning' : 'bg-danger'}`}
                          title={`Animo: ${kpis.avgMood}/10`}
                        />
                        <span
                          className={`font-semibold tabular-nums ${kpis.efficiencyPct >= 75 ? 'text-success' : kpis.efficiencyPct >= 50 ? 'text-warning' : 'text-danger'}`}
                        >
                          {kpis.efficiencyPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums ${kpis.attentionScore <= 20 ? 'bg-success/10 text-success' : kpis.attentionScore <= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}
                        >
                          {kpis.attentionScore}
                        </span>
                        <Edit3 size={16} className="text-neutral-30" />
                      </div>
                    </td>
                  </tr>
                ))}
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
