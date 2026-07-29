import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'
import { Plus, Search, Upload, Pencil, Trash2 } from 'lucide-react'
import { runEscalation } from '../services/escalationService'
import type { CommitmentStatus } from '@/constants/enums'
import type { Commitment } from '@/types/domain'

export function CommitmentsPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  useEffect(() => {
    runEscalation()
  }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommitmentStatus | 'all'>('all')

  const rawCommitments = useLiveQuery(() => db.commitments.toArray())
  const commitments = useMemo(() => rawCommitments ?? [], [rawCommitments])
  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const appMap = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const filtered = useMemo(
    () =>
      commitments.filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (search) {
          const q = search.toLowerCase()
          if (!c.title.toLowerCase().includes(q)) return false
        }
        return true
      }),
    [commitments, statusFilter, search],
  )

  const stats = useMemo(
    () => ({
      total: commitments.length,
      active: commitments.filter((c) => c.status === 'active').length,
      atRisk: commitments.filter((c) => c.status === 'at_risk').length,
      breached: commitments.filter((c) => c.status === 'breached').length,
      fulfilled: commitments.filter((c) => c.status === 'fulfilled').length,
    }),
    [commitments],
  )

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
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Compromisos</h2>
          <p className="text-sm text-muted mt-1">
            Seguimiento de compromisos, promesas y deadlines cross-equipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={() => navigate('/execution/commitments/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Compromiso
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Button
          onClick={() => setStatusFilter('all')}
          className="bg-card rounded-2xl border border-boundary p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left"
        >
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-muted">Total</p>
        </Button>
        <Button
          onClick={() => setStatusFilter('active')}
          className="bg-card rounded-2xl border border-boundary p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left"
        >
          <p className="text-2xl font-bold text-info">{stats.active}</p>
          <p className="text-xs text-muted">Activos</p>
        </Button>
        <Button
          onClick={() => setStatusFilter('at_risk')}
          className="bg-card rounded-2xl border border-warning/20 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left"
        >
          <p className="text-2xl font-bold text-warning">{stats.atRisk}</p>
          <p className="text-xs text-muted">En Riesgo</p>
        </Button>
        <Button
          onClick={() => setStatusFilter('breached')}
          className="bg-card rounded-2xl border border-danger/20 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left"
        >
          <p className="text-2xl font-bold text-danger">{stats.breached}</p>
          <p className="text-xs text-muted">Incumplidos</p>
        </Button>
        <Button
          onClick={() => setStatusFilter('fulfilled')}
          className="bg-card rounded-2xl border border-boundary p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left"
        >
          <p className="text-2xl font-bold text-success">{stats.fulfilled}</p>
          <p className="text-xs text-muted">Cumplidos</p>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar compromisos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as CommitmentStatus | 'all')}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'active', label: 'Activos' },
                { value: 'at_risk', label: 'En Riesgo' },
                { value: 'breached', label: 'Incumplidos' },
                { value: 'fulfilled', label: 'Cumplidos' },
                { value: 'cancelled', label: 'Cancelados' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {(() => {
        const daysInfoMap = new Map(filtered.map((c) => [c.id, getDaysInfo(c.commitmentDate)]))
        const columns: Column<Commitment>[] = [
          {
            key: 'title',
            label: 'Compromiso',
            sortable: true,
            className: 'max-w-xs',
            render: (c) => (
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                  {c.title}
                </p>
                {c.description && <HtmlDescription html={c.description} lines={1} />}
              </div>
            ),
          },
          {
            key: 'ownerId',
            label: 'Owner / Stakeholder',
            sortable: true,
            render: (c) => (
              <>
                <p className="text-sm text-secondary">{c.ownerId}</p>
                <p className="text-xs text-neutral-50">a: {c.accountableId}</p>
              </>
            ),
          },
          {
            key: 'teamId',
            label: 'Equipo / App',
            sortable: true,
            render: (c) => (
              <>
                <p className="text-sm text-secondary">{teamMap.get(c.teamId ?? '')?.name ?? '-'}</p>
                <p className="text-xs text-neutral-50">
                  {appMap.get(c.applicationId ?? '')?.name ?? ''}
                </p>
              </>
            ),
          },
          {
            key: 'status',
            label: 'Estado',
            sortable: true,
            render: (c) => (
              <Select
                value={c.status}
                onChange={(v) => handleQuickStatus(c.id, v as CommitmentStatus)}
                options={[
                  { value: 'active', label: 'Activo' },
                  { value: 'at_risk', label: 'En Riesgo' },
                  { value: 'breached', label: 'Incumplido' },
                  { value: 'fulfilled', label: 'Cumplido' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
              />
            ),
          },
          {
            key: 'commitmentDate',
            label: 'Fecha',
            sortable: true,
            render: (c) => {
              const daysInfo = daysInfoMap.get(c.id)!
              return (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">
                    {new Date(c.commitmentDate).toLocaleDateString('es-ES')}
                  </span>
                  <span
                    className={`text-xs font-medium ${daysInfo.urgent ? 'text-danger' : 'text-neutral-50'}`}
                  >
                    ({daysInfo.label})
                  </span>
                </div>
              )
            },
          },
          {
            key: 'actions',
            label: 'Acciones',
            sortable: false,
            className: 'text-right',
            render: (c) => (
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/execution/commitments/${c.id}/edit`)
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-1.5"
                  title="Editar"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(c)
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 text-neutral-50 hover:text-danger"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ),
          },
        ]
        return (
          <SortableTable
            columns={columns}
            data={filtered}
            onRowClick={(c) => navigate(`/execution/commitments/${c.id}/edit`)}
            pageSize={5}
            emptyMessage="No hay compromisos que coincidan con los filtros."
            rowClassName={(c) => {
              const isOverdue =
                (c.status === 'active' || c.status === 'at_risk') &&
                new Date(c.commitmentDate) < today
              return isOverdue ? 'bg-danger/5' : undefined
            }}
          />
        )
      })()}
    </div>
  )
}
