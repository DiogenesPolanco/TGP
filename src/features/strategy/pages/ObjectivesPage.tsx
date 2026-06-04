import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, Search, Filter, Upload, X, Target, TrendingUp, AlertCircle, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { KeyResult } from '@/types/domain'

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

  const filteredObjectives = objectives.filter((o) =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || o.status === statusFilter)
  )

  const { page, setPage, totalPages, paginatedItems: paginatedObjectives } = usePagination(filteredObjectives, 5)

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar objetivo?')) {
      await db.objectives.delete(id)
      addNotification({ type: 'success', message: 'Objetivo eliminado' })
    }
  }

  const STATUS_LABELS: Record<string, string> = {
    not_started: 'No iniciado',
    on_track: 'On track',
    at_risk: 'En riesgo',
    behind: 'Atrasado',
    achieved: 'Logrado',
  }

  const stats = {
    total: objectives.length,
    onTrack: objectives.filter((o) => o.status === 'on_track').length,
    atRisk: objectives.filter((o) => o.status === 'at_risk').length,
    behind: objectives.filter((o) => o.status === 'behind').length,
    notStarted: objectives.filter((o) => o.status === 'not_started').length,
    achieved: objectives.filter((o) => o.status === 'achieved').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <TrendingUp size={16} className="text-success" />
      case 'at_risk': return <AlertCircle size={16} className="text-warning" />
      case 'behind': return <AlertCircle size={16} className="text-danger" />
      case 'achieved': return <CheckCircle2 size={16} className="text-success" />
      default: return <Target size={16} className="text-neutral-60" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-success/10 text-success'
      case 'at_risk': return 'bg-warning/10 text-warning'
      case 'behind': return 'bg-danger/10 text-danger'
      case 'achieved': return 'bg-success/10 text-success'
      default: return 'bg-neutral-10 text-neutral-60'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">OKRs / KPIs</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Objetivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <StatCard icon={<Target size={20} />} label="Total" value={stats.total} color="text-primary" onClick={() => { setStatusFilter('all'); setShowFilters(false) }} />
        <StatCard icon={<TrendingUp size={20} />} label="On Track" value={stats.onTrack} color="text-success" onClick={() => { setStatusFilter('on_track'); setShowFilters(true) }} />
        <StatCard icon={<AlertCircle size={20} />} label="En Riesgo" value={stats.atRisk} color="text-warning" onClick={() => { setStatusFilter('at_risk'); setShowFilters(true) }} />
        <StatCard icon={<AlertCircle size={20} />} label="Atrasado" value={stats.behind} color="text-danger" onClick={() => { setStatusFilter('behind'); setShowFilters(true) }} />
        <StatCard icon={<Target size={16} />} label="No Iniciado" value={stats.notStarted} color="text-neutral-50" onClick={() => { setStatusFilter('not_started'); setShowFilters(true) }} />
        <StatCard icon={<CheckCircle2 size={20} />} label="Logrado" value={stats.achieved} color="text-success" onClick={() => { setStatusFilter('achieved'); setShowFilters(true) }} />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar objetivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || statusFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {statusFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todos</option>
                <option value="not_started">No Iniciado</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">En Riesgo</option>
                <option value="behind">Atrasado</option>
                <option value="achieved">Logrado</option>
              </select>
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {paginatedObjectives.map((objective) => {
          const team = teams.find((t) => t.id === objective.teamId)
          const bu = businessUnits.find((b) => b.id === objective.businessUnitId)
          return (
            <div key={objective.id}
              onClick={() => navigate(`${objective.id}/edit`)}
              className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                      {getStatusIcon(objective.status)}
                      {STATUS_LABELS[objective.status] ?? objective.status}
                    </span>
                    <span className="text-xs text-neutral-50 dark:text-neutral-50">{objective.type.toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">{objective.title}</h3>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40">{objective.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-50 dark:text-neutral-50">
                    <span>{team?.name || bu?.name || 'Organización'}</span>
                    <span>{new Date(objective.periodStart).toLocaleDateString('es-ES')} - {new Date(objective.periodEnd).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-neutral-90 dark:text-white">{Math.round(objective.progress)}%</p>
                </div>
              </div>

              <div className="w-full bg-neutral-20 dark:bg-neutral-70 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${
                    objective.status === 'achieved' ? 'bg-success' :
                    objective.status === 'on_track' ? 'bg-success' :
                    objective.status === 'at_risk' ? 'bg-warning' :
                    'bg-danger'
                  }`}
                  style={{ width: `${objective.progress}%` }}
                />
              </div>

              {objective.keyResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-neutral-70 dark:text-neutral-30">Key Results</h4>
                  {objective.keyResults.map((kr) => (
                    <KrRow key={kr.id} objectiveId={objective.id} kr={kr} />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`${objective.id}/edit`) }}
                  className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(objective.id) }}
                  className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredObjectives.length}
        pageSize={5}
        onPageChange={setPage}
      />

      {filteredObjectives.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
          <p className="text-neutral-50 dark:text-neutral-50">No se encontraron objetivos</p>
        </div>
      )}

    </div>
  )
}

function KrRow({ objectiveId, kr }: { objectiveId: string; kr: KeyResult }) {
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const handleStatusChange = async (newStatus: string) => {
    const objective = await db.objectives.get(objectiveId)
    if (!objective) return
    const updatedKrs = objective.keyResults.map((k) =>
      k.id === kr.id ? { ...k, status: newStatus as KeyResult['status'] } : k
    )
    await db.objectives.update(objectiveId, { keyResults: updatedKrs, updatedAt: new Date() })
    addNotification({ type: 'success', message: `KR actualizado a "${newStatus}"` })
  }

  const handleDeleteKr = async () => {
    if (!(await confirm('¿Eliminar este Key Result?'))) return
    const objective = await db.objectives.get(objectiveId)
    if (!objective) return
    const updatedKrs = objective.keyResults.filter((k) => k.id !== kr.id)
    await db.objectives.update(objectiveId, { keyResults: updatedKrs, updatedAt: new Date() })
    addNotification({ type: 'success', message: 'Key Result eliminado' })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-success/10 text-success border-success/30'
      case 'at_risk': return 'bg-warning/10 text-warning border-warning/30'
      case 'behind': return 'bg-danger/10 text-danger border-danger/30'
      case 'achieved': return 'bg-success/10 text-success border-success/30'
      default: return 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60'
    }
  }

  return (
    <div className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
      <span className="text-sm text-neutral-70 dark:text-neutral-30">{kr.title}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-60 dark:text-neutral-40">{kr.current} / {kr.target} {kr.measure}</span>
        <select
          value={kr.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-xs px-2 py-0.5 rounded-full border font-medium cursor-pointer ${getStatusStyle(kr.status)}`}
        >
          <option value="not_started">No iniciado</option>
          <option value="on_track">On track</option>
          <option value="at_risk">En riesgo</option>
          <option value="behind">Atrasado</option>
          <option value="achieved">Logrado</option>
        </select>
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteKr() }}
          className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: number; color: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm${onClick ? ' cursor-pointer hover:shadow-md transition-all text-left' : ''}`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </Comp>
  )
}
