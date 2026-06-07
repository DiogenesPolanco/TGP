import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import { Plus, Search, Users, UserCheck, Calendar, Star } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-warning/10 text-warning' },
  interviewed: { label: 'Entrevistado', color: 'bg-info/10 text-info' },
  selected: { label: 'Seleccionado', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rechazado', color: 'bg-danger/10 text-danger' },
}

export function RecruitmentPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const candidates = useLiveQuery(() =>
    db.candidates.orderBy('createdAt').reverse().toArray(),
  ) ?? []

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []

  const filtered = candidates.filter((c) => {
    const roleLabel = MEMBER_ROLE_LABELS[c.position as keyof typeof MEMBER_ROLE_LABELS] ?? ''
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      roleLabel.toLowerCase().includes(search.toLowerCase())
  })

  const { page, setPage, totalPages, paginatedItems } = usePagination(filtered, 10)

  const statusBadge = (status: string) => {
    const cfg = statusConfig[status] ?? { label: status, color: 'bg-neutral-10 text-neutral-60' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Reclutamiento</h2>
        <button
          onClick={() => navigate('/teams/recruitment/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nuevo Candidato
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Total" value={candidates.length} color="text-primary" />
        <StatCard icon={<Calendar size={20} />} label="Pendientes" value={candidates.filter((c) => c.status === 'pending').length} color="text-warning" />
        <StatCard icon={<UserCheck size={20} />} label="Entrevistados" value={candidates.filter((c) => c.status === 'interviewed').length} color="text-info" />
        <StatCard icon={<Star size={20} />} label="Seleccionados" value={candidates.filter((c) => c.status === 'selected').length} color="text-success" />
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
        <input
          type="text"
          placeholder="Buscar candidatos por nombre o posición..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-5 dark:bg-neutral-85">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Posición</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Entrevista</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-60 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {paginatedItems.map((c) => {
                const team = teams.find((t) => t.id === c.teamId)
                return (
                  <tr key={c.id} className="hover:bg-neutral-5 dark:hover:bg-neutral-75/50 transition-colors cursor-pointer" onClick={() => navigate(`/teams/recruitment/${c.id}`)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white">{c.name}</p>
                      {c.email && <p className="text-xs text-neutral-50">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-70 dark:text-neutral-30">{MEMBER_ROLE_LABELS[c.position as keyof typeof MEMBER_ROLE_LABELS] ?? c.position}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${c.totalScore}%` }} />
                        </div>
                        <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30">{c.totalScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-60">
                      {c.interviewDate ? new Date(c.interviewDate).toLocaleDateString('es') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== 'selected' && team && (
                        <span className="text-xs text-neutral-50">{team.name}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-50">No se encontraron candidatos</div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={10} onPageChange={setPage} />
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
