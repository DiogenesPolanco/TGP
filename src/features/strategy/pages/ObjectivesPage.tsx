import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import {
  Plus,
  Search,
  Filter,
  Upload,
  X,
  Pencil,
  Trash2,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  Calendar,
  Crosshair,
  HelpCircle,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'No iniciado',
  on_track: 'Encaminado',
  at_risk: 'En riesgo',
  behind: 'Atrasado',
  achieved: 'Logrado',
}

const STATUS_STYLE: Record<string, string> = {
  not_started:
    'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  on_track: 'bg-success/10 text-success border-success/20',
  at_risk: 'bg-warning/10 text-warning border-warning/20',
  behind: 'bg-danger/10 text-danger border-danger/20',
  achieved: 'bg-success/10 text-success border-success/20',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  on_track: <TrendingUp size={14} />,
  at_risk: <AlertCircle size={14} />,
  behind: <AlertCircle size={14} />,
  achieved: <CheckCircle2 size={14} />,
  not_started: <HelpCircle size={14} />,
}

const KR_STATUS_STYLE: Record<string, string> = {
  not_started: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30',
  on_track: 'bg-success/10 text-success border-success/30',
  at_risk: 'bg-warning/10 text-warning border-warning/30',
  behind: 'bg-danger/10 text-danger border-danger/30',
  achieved: 'bg-success/10 text-success border-success/30',
}

export function ObjectivesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const stats = useMemo(
    () => ({
      total: objectives.length,
      onTrack: objectives.filter((o) => o.status === 'on_track').length,
      atRisk: objectives.filter((o) => o.status === 'at_risk').length,
      behind: objectives.filter((o) => o.status === 'behind').length,
      notStarted: objectives.filter((o) => o.status === 'not_started').length,
      achieved: objectives.filter((o) => o.status === 'achieved').length,
    }),
    [objectives],
  )

  const filteredObjectives = objectives.filter(
    (o) =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || o.status === statusFilter),
  )

  const {
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedItems: paginatedObjectives,
  } = usePagination(filteredObjectives, 5)

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar objetivo?')) {
      await db.objectives.delete(id)
      addNotification({ type: 'success', message: 'Objetivo eliminado' })
    }
  }

  const StatCard = ({
    icon,
    label,
    value,
    color,
    active,
    onClick,
  }: {
    icon: React.ReactNode
    label: string
    value: number
    color: string
    active?: boolean
    onClick?: () => void
  }) => {
    const iconClasses: Record<string, string> = {
      'text-primary': 'bg-primary/10 text-primary',
      'text-success': 'bg-success/10 text-success',
      'text-warning': 'bg-warning/10 text-warning',
      'text-danger': 'bg-danger/10 text-danger',
      'text-neutral-50': 'bg-neutral-50/10 text-neutral-50',
    }
    const Comp = onClick ? 'button' : 'div'
    return (
      <Comp
        onClick={onClick}
        className={`rounded-2xl border p-4 flex items-center justify-center gap-3 transition-all ${
          active
            ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
            : 'bg-card border-boundary shadow-sm hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
        }${onClick ? ' cursor-pointer' : ''}`}
      >
        <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </Comp>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">OKRs / KPIs</h2>
          <p className="text-sm text-muted mt-0.5">Objetivos y resultados clave del portafolio</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/import')}>
            <Upload size={16} />
            Importar
          </Button>
          <Button onClick={() => navigate('new')}>
            <Plus size={18} />
            Nuevo Objetivo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Target size={20} />}
          label="Total Objetivos"
          value={stats.total}
          color="text-primary"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Encaminados"
          value={stats.onTrack}
          color="text-success"
          active={statusFilter === 'on_track'}
          onClick={() => setStatusFilter(statusFilter === 'on_track' ? 'all' : 'on_track')}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="En Riesgo"
          value={stats.atRisk}
          color="text-warning"
          active={statusFilter === 'at_risk'}
          onClick={() => setStatusFilter(statusFilter === 'at_risk' ? 'all' : 'at_risk')}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Atrasados"
          value={stats.behind}
          color="text-danger"
          active={statusFilter === 'behind'}
          onClick={() => setStatusFilter(statusFilter === 'behind' ? 'all' : 'behind')}
        />
        <StatCard
          icon={<HelpCircle size={20} />}
          label="No Iniciados"
          value={stats.notStarted}
          color="text-neutral-50"
          active={statusFilter === 'not_started'}
          onClick={() => setStatusFilter(statusFilter === 'not_started' ? 'all' : 'not_started')}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Logrados"
          value={stats.achieved}
          color="text-success"
          active={statusFilter === 'achieved'}
          onClick={() => setStatusFilter(statusFilter === 'achieved' ? 'all' : 'achieved')}
        />
      </div>

      {/* Search + Filters */}
      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar objetivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            Filtros
            {statusFilter !== 'all' && <span className="w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-boundary">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'not_started', label: 'No Iniciado' },
                  { value: 'on_track', label: 'Encaminado' },
                  { value: 'at_risk', label: 'En Riesgo' },
                  { value: 'behind', label: 'Atrasado' },
                  { value: 'achieved', label: 'Logrado' },
                ]}
                className="min-w-[120px]"
              />
            </div>
            {statusFilter !== 'all' && (
              <Button
                onClick={() => setStatusFilter('all')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Objective Cards */}
      <div className="space-y-4">
        {paginatedObjectives.map((objective) => {
          const team = teams.find((t) => t.id === objective.teamId)
          const bu = businessUnits.find((b) => b.id === objective.businessUnitId)

          const barColor =
            objective.status === 'achieved' || objective.status === 'on_track'
              ? 'bg-success'
              : objective.status === 'at_risk'
                ? 'bg-warning'
                : 'bg-danger'

          return (
            <div
              key={objective.id}
              className="bg-card rounded-xl border border-boundary shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate(`${objective.id}/edit`)}
            >
              {/* Colored top accent */}
              <div
                className={`h-1 w-full ${objective.status === 'achieved' ? 'bg-success' : objective.status === 'on_track' ? 'bg-success' : objective.status === 'at_risk' ? 'bg-warning' : objective.status === 'behind' ? 'bg-danger' : 'bg-neutral-40'}`}
              />

              <div className="p-5">
                {/* Top row: badges + progress */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[objective.status]}`}
                    >
                      {STATUS_ICON[objective.status] || <Target size={14} />}
                      {STATUS_LABELS[objective.status] ?? objective.status}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-50 dark:text-neutral-50 uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-10 dark:bg-neutral-70">
                      {objective.type === 'okr' ? 'OKR' : objective.type === 'kpi' ? 'KPI' : 'BSC'}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-2xl font-bold text-neutral-90 dark:text-white tabular-nums">
                      {Math.round(objective.progress)}
                      <span className="text-sm font-normal text-neutral-50">%</span>
                    </p>
                  </div>
                </div>

                {/* Title + Description */}
                <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-1">
                  {objective.title}
                </h3>
                {objective.description && (
                  <p className="text-sm text-muted line-clamp-2 mb-3">
                    {objective.description.replace(/<[^>]*>/g, '').slice(0, 150)}
                  </p>
                )}

                {/* Progress bar */}
                <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, objective.progress)}%` }}
                  />
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-neutral-50 dark:text-neutral-50 mb-4">
                  {(team || bu) && (
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {team?.name || bu?.name || 'Organización'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(objective.periodStart).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    —{' '}
                    {new Date(objective.periodEnd).toLocaleDateString('es-ES', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Key Results */}
                {objective.keyResults.length > 0 && (
                  <div className="border-t border-boundary pt-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Crosshair size={14} className="text-neutral-50" />
                      <h4 className="text-xs font-semibold text-neutral-50 uppercase tracking-wider">
                        Key Results ({objective.keyResults.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {objective.keyResults.map((kr) => {
                        const pct =
                          kr.target > kr.baseline
                            ? Math.round(
                                ((kr.current - kr.baseline) / (kr.target - kr.baseline)) * 100,
                              )
                            : 0
                        const krBarColor =
                          kr.status === 'achieved'
                            ? 'bg-success'
                            : kr.status === 'on_track'
                              ? 'bg-success'
                              : kr.status === 'at_risk'
                                ? 'bg-warning'
                                : kr.status === 'behind'
                                  ? 'bg-danger'
                                  : 'bg-neutral-40'
                        return (
                          <div
                            key={kr.id}
                            className="bg-neutral-10 dark:bg-neutral-70/50 rounded-lg border border-boundary p-3"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-neutral-90 dark:text-white truncate min-w-0 flex-1">
                                {kr.title}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ml-2 ${KR_STATUS_STYLE[kr.status]}`}
                              >
                                {STATUS_LABELS[kr.status]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-50 mb-2">
                              <span className="tabular-nums font-medium text-neutral-90 dark:text-white">
                                {kr.current}
                              </span>
                              <span>/</span>
                              <span>{kr.target}</span>
                              {kr.measure && <span className="text-neutral-50">{kr.measure}</span>}
                            </div>
                            <div className="w-full h-1.5 bg-neutral-20 dark:bg-neutral-70 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${krBarColor} transition-all duration-300`}
                                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-boundary">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`${objective.id}/edit`)
                    }}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(objective.id)
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredObjectives.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {filteredObjectives.length === 0 && (
        <div className="text-center py-16 bg-card rounded-xl border border-boundary">
          <Target size={32} className="mx-auto text-neutral-40 mb-3" />
          <p className="text-muted font-medium">No se encontraron objetivos</p>
          <p className="text-sm text-neutral-50 mt-1">
            Intenta con otros filtros o términos de búsqueda
          </p>
        </div>
      )}
    </div>
  )
}
