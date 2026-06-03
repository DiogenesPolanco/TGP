import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, TrendingUp, Award } from 'lucide-react'
import { TeamForm } from '../components/TeamForm'
import type { Team } from '@/types/domain'

export function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const { addNotification } = useAppStore()

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar equipo?')) {
      await db.teams.delete(id)
      addNotification({ type: 'success', message: 'Equipo eliminado' })
    }
  }

  const getDoraLevel = (metrics: { deploymentFrequency: number; leadTimeHours: number; changeFailureRate: number; mttrHours: number } | null) => {
    if (!metrics) return { label: 'N/A', color: 'bg-neutral-10 text-neutral-60' }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 1 && metrics.changeFailureRate <= 5 && metrics.mttrHours <= 1) {
      return { label: 'Elite', color: 'bg-success/10 text-success' }
    }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 168 && metrics.changeFailureRate <= 10 && metrics.mttrHours <= 24) {
      return { label: 'High', color: 'bg-info/10 text-info' }
    }
    if (metrics.deploymentFrequency >= 0.25 && metrics.leadTimeHours <= 720 && metrics.changeFailureRate <= 15 && metrics.mttrHours <= 168) {
      return { label: 'Medium', color: 'bg-warning/10 text-warning' }
    }
    return { label: 'Low', color: 'bg-danger/10 text-danger' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Equipos</h2>
        <button
          onClick={() => { setEditingTeam(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Equipos" value={teams.length} color="text-primary" />
        <StatCard icon={<Award size={20} />} label="Equipos Elite" value={teams.filter((t) => getDoraLevel(t.currentMetrics).label === 'Elite').length} color="text-success" />
        <StatCard icon={<TrendingUp size={20} />} label="Promedio Velocity" value={teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + (t.currentMetrics?.velocity ?? 0), 0) / teams.length) : 0} color="text-info" />
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => {
          const bu = businessUnits.find((b) => b.id === team.businessUnitId)
          const dora = getDoraLevel(team.currentMetrics)
          return (
            <div key={team.id} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link to={`/teams/${team.id}`} className="text-lg font-semibold text-primary hover:underline">
                    {team.name}
                  </Link>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40">{bu?.name} • {team.members.length} miembros</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${dora.color}`}>
                  {dora.label}
                </span>
              </div>

              {team.currentMetrics && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <MetricItem label="Velocity" value={team.currentMetrics.velocity} />
                  <MetricItem label="Lead Time" value={`${team.currentMetrics.leadTimeHours}h`} />
                  <MetricItem label="CFR" value={`${team.currentMetrics.changeFailureRate}%`} />
                  <MetricItem label="MTTR" value={`${team.currentMetrics.mttrHours}h`} />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
                <button
                  onClick={() => { setEditingTeam(team); setShowForm(true) }}
                  className="text-sm text-primary hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-sm text-danger hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
          <p className="text-neutral-50 dark:text-neutral-50">No se encontraron equipos</p>
        </div>
      )}

      {showForm && (
        <TeamForm
          team={editingTeam}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            setEditingTeam(null)
            addNotification({ type: 'success', message: editingTeam ? 'Equipo actualizado' : 'Equipo creado' })
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

function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-10 dark:bg-neutral-70 rounded-lg p-2">
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{value}</p>
    </div>
  )
}
