import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { Plus, Search, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { CommitmentForm } from '../components/CommitmentForm'
import { runEscalation } from '../services/escalationService'
import type { Commitment } from '@/types/domain'
import type { CommitmentStatus } from '@/constants/enums'

const statusConfig: Record<CommitmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Activo', color: 'bg-info/10 text-info', icon: <Clock size={14} /> },
  at_risk: { label: 'En Riesgo', color: 'bg-warning/10 text-warning', icon: <AlertTriangle size={14} /> },
  breached: { label: 'Incumplido', color: 'bg-danger/10 text-danger', icon: <XCircle size={14} /> },
  fulfilled: { label: 'Cumplido', color: 'bg-success/10 text-success', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Cancelado', color: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60', icon: <XCircle size={14} /> },
}

export function CommitmentsPage() {
  const { confirm } = useConfirm()

  useEffect(() => { runEscalation() }, [])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Commitment | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'all'>('all')

  const commitments = useLiveQuery(() => db.commitments.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const appMap = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const filtered = commitments.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!c.title.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Sort: breached first, then at_risk, then by date ascending
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { breached: 0, at_risk: 1, active: 2, fulfilled: 3, cancelled: 4 }
    const diff = (order[a.status] ?? 5) - (order[b.status] ?? 5)
    if (diff !== 0) return diff
    return new Date(a.commitmentDate).getTime() - new Date(b.commitmentDate).getTime()
  })

  const stats = useMemo(() => ({
    total: commitments.length,
    active: commitments.filter((c) => c.status === 'active').length,
    atRisk: commitments.filter((c) => c.status === 'at_risk').length,
    breached: commitments.filter((c) => c.status === 'breached').length,
    fulfilled: commitments.filter((c) => c.status === 'fulfilled').length,
  }), [commitments])

  const handleDelete = async (c: Commitment) => {
    if (!(await confirm(`Eliminar compromiso "${c.title}"?`))) return
    await db.commitments.delete(c.id)
  }

  const handleQuickStatus = async (id: string, newStatus: CommitmentStatus) => {
    await db.commitments.update(id, {
      status: newStatus,
      fulfilledAt: newStatus === 'fulfilled' ? new Date() : undefined,
      updatedAt: new Date(),
    })
  }

  const getDaysInfo = (commitmentDate: Date) => {
    const d = new Date(commitmentDate)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: `${Math.abs(diff)}d vencido`, urgent: true }
    if (diff === 0) return { label: 'Hoy', urgent: true }
    if (diff <= 3) return { label: `En ${diff}d`, urgent: true }
    if (diff <= 7) return { label: `En ${diff}d`, urgent: false }
    return { label: `${diff}d`, urgent: false }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Compromisos</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Seguimiento de compromisos, promesas y deadlines cross-equipo
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nuevo Compromiso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Total</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-info">{stats.active}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Activos</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-warning/20 p-4 shadow-sm">
          <p className="text-2xl font-bold text-warning">{stats.atRisk}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">En Riesgo</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-danger/20 p-4 shadow-sm">
          <p className="text-2xl font-bold text-danger">{stats.breached}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Incumplidos</p>
        </div>
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <p className="text-2xl font-bold text-success">{stats.fulfilled}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Cumplidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar compromisos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommitmentStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="at_risk">En Riesgo</option>
            <option value="breached">Incumplidos</option>
            <option value="fulfilled">Cumplidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-50">
            No hay compromisos que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Compromiso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Owner / Stakeholder</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Equipo / App</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Fecha</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-60 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {sorted.map((c) => {
                const daysInfo = getDaysInfo(c.commitmentDate)
                const cfg = statusConfig[c.status]
                const isOverdue = (c.status === 'active' || c.status === 'at_risk') &&
                  new Date(c.commitmentDate) < today

                return (
                  <tr key={c.id} className={`hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors group ${
                    isOverdue ? 'bg-danger/5' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-90 dark:text-white">{c.title}</p>
                      {c.description && (
                        <p className="text-xs text-neutral-50 mt-0.5 line-clamp-1">{c.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-70 dark:text-neutral-30">{c.ownerId}</p>
                      <p className="text-xs text-neutral-50">a: {c.accountableId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-70 dark:text-neutral-30">
                        {teamMap.get(c.teamId ?? '')?.name ?? '-'}
                      </p>
                      <p className="text-xs text-neutral-50">{appMap.get(c.applicationId ?? '')?.name ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleQuickStatus(c.id, e.target.value as CommitmentStatus)}
                        className={`text-xs px-2 py-1 rounded-full border font-medium cursor-pointer ${cfg.color}`}
                      >
                        <option value="active">Activo</option>
                        <option value="at_risk">En Riesgo</option>
                        <option value="breached">Incumplido</option>
                        <option value="fulfilled">Cumplido</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-70 dark:text-neutral-30">
                          {c.commitmentDate.toLocaleDateString('es-ES')}
                        </span>
                        <span className={`text-xs font-medium ${daysInfo.urgent ? 'text-danger' : 'text-neutral-50'}`}>
                          ({daysInfo.label})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setEditing(c); setShowForm(true) }}
                          className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
                          title="Eliminar"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <CommitmentForm
          commitment={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSave={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
