import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Upload, Target, AlertCircle, CheckCircle, PauseCircle, XCircle, Pencil, Trash2 } from 'lucide-react'
import type { ProjectStatus } from '@/constants/enums'
import type { Plan } from '@/types/domain'
import { Button } from '@/components/ui/Button'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planned: { label: 'Planificado', color: 'bg-info/10 text-info border-info/30', icon: <Target size={16} /> },
  in_progress: { label: 'En Progreso', color: 'bg-success/10 text-success border-success/30', icon: <AlertCircle size={16} /> },
  on_hold: { label: 'En Pausa', color: 'bg-warning/10 text-warning border-warning/30', icon: <PauseCircle size={16} /> },
  completed: { label: 'Completado', color: 'bg-success/10 text-success border-success/30', icon: <CheckCircle size={16} /> },
  cancelled: { label: 'Cancelado', color: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 border-neutral-30', icon: <XCircle size={16} /> },
}

const healthColor: Record<string, string> = {
  green: 'bg-success',
  yellow: 'bg-warning',
  red: 'bg-danger',
}

export function PlansPage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')

  const rawPlans = useLiveQuery(() => db.plans.toArray())
  const plans = useMemo(() => rawPlans ?? [], [rawPlans])
  const rawTeams = useLiveQuery(() => db.teams.toArray())
  const teams = useMemo(() => rawTeams ?? [], [rawTeams])
  const rawBusinessUnits = useLiveQuery(() => db.businessUnits.toArray())
  const businessUnits = useMemo(() => rawBusinessUnits ?? [], [rawBusinessUnits])
  const rawActivities = useLiveQuery(() => db.activities.toArray())
  const activities = useMemo(() => rawActivities ?? [], [rawActivities])

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const buMap = useMemo(() => new Map(businessUnits.map((b) => [b.id, b])), [businessUnits])

  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.title.toLowerCase().includes(q)) return false
    }
    return true
  })

  const { page, setPage, totalPages, pageSize, setPageSize, paginatedItems: paginatedPlans } = usePagination(filteredPlans, 5)

  const getActivityStats = (planId: string) => {
    const planActivities = activities.filter((a) => a.planId === planId)
    return {
      total: planActivities.length,
      completed: planActivities.filter((a) => a.status === 'completed').length,
      inProgress: planActivities.filter((a) => a.status === 'in_progress').length,
    }
  }

  const handleDelete = async (plan: Plan) => {
    const actCount = activities.filter((a) => a.planId === plan.id).length
    const msg = actCount > 0
      ? `"${plan.title}" tiene ${actCount} actividad(es). Eliminar todo?`
      : `Eliminar "${plan.title}"?`
    if (!(await confirm(msg))) return
    const planActivities = activities.filter((a) => a.planId === plan.id)
    for (const act of planActivities) {
      await db.tasks.where('activityId').equals(act.id).delete()
    }
    await db.activities.where('planId').equals(plan.id).delete()
    await db.plans.delete(plan.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Planes de Trabajo</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40 mt-1">
            Gestiona sprints, trimestres e iniciativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={() => navigate('/execution/plans/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar planes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="min-w-[170px]">
            <Select value={statusFilter} onChange={(v) => setStatusFilter(v as ProjectStatus | 'all')} options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'planned', label: 'Planificado' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'on_hold', label: 'En Pausa' },
              { value: 'completed', label: 'Completado' },
              { value: 'cancelled', label: 'Cancelado' },
            ]} />
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginatedPlans.map((plan) => {
          const stats = getActivityStats(plan.id)
          const daysTotal = Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24))
          // eslint-disable-next-line react-hooks/purity
          const daysLeft = Math.ceil((new Date(plan.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const progress = daysTotal > 0 ? Math.round(((daysTotal - Math.max(0, daysLeft)) / daysTotal) * 100) : 0
          const cfg = statusConfig[plan.status]

          return (
            <div
              key={plan.id}
              className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/execution/plans/${plan.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${healthColor[plan.health]}`} />
                </div>
                <span className="text-xs text-neutral-50">
                  {daysLeft > 0 ? `${daysLeft}d restantes` : daysLeft === 0 ? 'Hoy vence' : `${Math.abs(daysLeft)}d vencido`}
                </span>
              </div>

              <h3 className="text-base font-semibold text-neutral-90 dark:text-white mb-1 group-hover:text-primary transition-colors">
                {plan.title}
              </h3>
              {plan.description && (
                <p className="text-sm text-neutral-60 dark:text-neutral-40 line-clamp-2 mb-3">{plan.description}</p>
              )}

              {/* Progress bar */}
              <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-1.5 mb-3">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    plan.health === 'red' ? 'bg-danger' : plan.health === 'yellow' ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-neutral-60 dark:text-neutral-40">
                  <span>{teamMap.get(plan.teamId ?? '')?.name ?? buMap.get(plan.businessUnitId ?? '')?.name ?? 'Sin asignar'}</span>
                  <span>{stats.completed}/{stats.total} acts</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={(e) => { e.stopPropagation(); navigate(`/execution/plans/${plan.id}/edit`) }}
                    className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleDelete(plan) }}
                    className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
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
        totalItems={filteredPlans.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70">
          <Target size={40} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
          <p className="text-sm text-neutral-50">
            {plans.length === 0 ? 'No hay planes. Crea tu primer plan de trabajo.' : 'No se encontraron planes con los filtros seleccionados.'}
          </p>
        </div>
      )}

    </div>
  )
}
