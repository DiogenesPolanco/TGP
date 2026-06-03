import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Plus, Search, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ObjectiveForm } from '../components/ObjectiveForm'
import type { Objective } from '@/types/domain'

export function ObjectivesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const { addNotification } = useAppStore()

  const objectives = useLiveQuery(() => db.objectives.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredObjectives = objectives.filter((o) =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar objetivo?')) {
      await db.objectives.delete(id)
      addNotification({ type: 'success', message: 'Objetivo eliminado' })
    }
  }

  const stats = {
    total: objectives.length,
    onTrack: objectives.filter((o) => o.status === 'on_track').length,
    atRisk: objectives.filter((o) => o.status === 'at_risk').length,
    behind: objectives.filter((o) => o.status === 'behind').length,
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
        <button
          onClick={() => { setEditingObjective(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nuevo Objetivo
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<Target size={20} />} label="Total" value={stats.total} color="text-primary" />
        <StatCard icon={<TrendingUp size={20} />} label="On Track" value={stats.onTrack} color="text-success" />
        <StatCard icon={<AlertCircle size={20} />} label="At Risk" value={stats.atRisk} color="text-warning" />
        <StatCard icon={<AlertCircle size={20} />} label="Behind" value={stats.behind} color="text-danger" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Achieved" value={stats.achieved} color="text-success" />
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
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
      </div>

      <div className="space-y-4">
        {filteredObjectives.map((objective) => {
          const team = teams.find((t) => t.id === objective.teamId)
          const bu = businessUnits.find((b) => b.id === objective.businessUnitId)
          return (
            <div key={objective.id} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(objective.status)}`}>
                      {getStatusIcon(objective.status)}
                      {objective.status}
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
                    <div key={kr.id} className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                      <span className="text-sm text-neutral-70 dark:text-neutral-30">{kr.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-60 dark:text-neutral-40">{kr.current} / {kr.target} {kr.measure}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(kr.status)}`}>
                          {kr.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
                <button
                  onClick={() => { setEditingObjective(objective); setShowForm(true) }}
                  className="text-sm text-primary hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(objective.id)}
                  className="text-sm text-danger hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredObjectives.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
          <p className="text-neutral-50 dark:text-neutral-50">No se encontraron objetivos</p>
        </div>
      )}

      {showForm && (
        <ObjectiveForm
          objective={editingObjective}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            setEditingObjective(null)
            addNotification({ type: 'success', message: editingObjective ? 'Objetivo actualizado' : 'Objetivo creado' })
          }}
        />
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </div>
  )
}
