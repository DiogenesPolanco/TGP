import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { MEMBER_ROLE_LABELS } from '@/constants/roleLabels'
import { TeamSprintsSection } from '@/features/teams/components/TeamSprintsSection'
import { ArrowLeft, Users, TrendingUp, Clock, Zap, AlertTriangle, Trash2, BarChart3 } from 'lucide-react'

type Tab = 'dora' | 'sprints'

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<Tab>('dora')

  const team = useLiveQuery(() => db.teams.get(id!), [id])
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray())

  if (!team) {
    return (
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <p className="text-neutral-60 dark:text-neutral-40">Equipo no encontrado</p>
      </div>
    )
  }

  const bu = businessUnits?.find((b) => b.id === team.businessUnitId)
  const metrics = team.currentMetrics

  const getDoraLevel = () => {
    if (!metrics) return { label: 'N/A', color: 'text-neutral-60', bg: 'bg-neutral-10' }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 1 && metrics.changeFailureRate <= 5 && metrics.mttrHours <= 1) {
      return { label: 'Elite', color: 'text-success', bg: 'bg-success/10' }
    }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 168 && metrics.changeFailureRate <= 10 && metrics.mttrHours <= 24) {
      return { label: 'Alto', color: 'text-info', bg: 'bg-info/10' }
    }
    if (metrics.deploymentFrequency >= 0.25 && metrics.leadTimeHours <= 720 && metrics.changeFailureRate <= 15 && metrics.mttrHours <= 168) {
      return { label: 'Medio', color: 'text-warning', bg: 'bg-warning/10' }
    }
    return { label: 'Bajo', color: 'text-danger', bg: 'bg-danger/10' }
  }

  const dora = getDoraLevel()

  const handleRemoveMember = async (memberId: string) => {
    if (!(await confirm('¿Eliminar este miembro del equipo?'))) return
    const updatedMembers = team.members.filter((m) => m.id !== memberId)
    await db.teams.update(team.id, { members: updatedMembers })
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dora', label: 'DORA y Miembros', icon: <Zap size={16} /> },
    { id: 'sprints', label: 'Sprints', icon: <BarChart3 size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/teams')}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">{team.name}</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40">{bu?.name} • {team.sourceSystem} • {team.members.length} miembros</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-neutral-20 dark:border-neutral-70">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-50 hover:text-neutral-90 hover:border-neutral-30'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dora' && (
        <>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${dora.bg}`}>
            <span className={`text-sm font-semibold ${dora.color}`}>Nivel DORA: {dora.label}</span>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DoraCard
                icon={<Zap size={24} />}
                label="Frecuencia de Despliegue"
                value={`${metrics.deploymentFrequency}/día`}
                benchmark={metrics.deploymentFrequency >= 1 ? 'Elite' : metrics.deploymentFrequency >= 0.25 ? 'Alto' : 'Bajo'}
                color={metrics.deploymentFrequency >= 1 ? 'text-success' : metrics.deploymentFrequency >= 0.25 ? 'text-info' : 'text-danger'}
              />
              <DoraCard
                icon={<Clock size={24} />}
                label="Tiempo de Entrega"
                value={`${metrics.leadTimeHours}h`}
                benchmark={metrics.leadTimeHours <= 1 ? 'Elite' : metrics.leadTimeHours <= 168 ? 'Alto' : 'Bajo'}
                color={metrics.leadTimeHours <= 1 ? 'text-success' : metrics.leadTimeHours <= 168 ? 'text-info' : 'text-danger'}
              />
              <DoraCard
                icon={<AlertTriangle size={24} />}
                label="Tasa de Fallos"
                value={`${metrics.changeFailureRate}%`}
                benchmark={metrics.changeFailureRate <= 5 ? 'Elite' : metrics.changeFailureRate <= 10 ? 'Alto' : 'Bajo'}
                color={metrics.changeFailureRate <= 5 ? 'text-success' : metrics.changeFailureRate <= 10 ? 'text-info' : 'text-danger'}
              />
              <DoraCard
                icon={<TrendingUp size={24} />}
                label="MTTR"
                value={`${metrics.mttrHours}h`}
                benchmark={metrics.mttrHours <= 1 ? 'Elite' : metrics.mttrHours <= 24 ? 'Alto' : 'Bajo'}
                color={metrics.mttrHours <= 1 ? 'text-success' : metrics.mttrHours <= 24 ? 'text-info' : 'text-danger'}
              />
            </div>
          )}

          <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Miembros del Equipo</h3>
            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member.id}
                  onClick={() => navigate(`/teams/${team.id}/performance/${member.id}`)}
                  className="flex items-center justify-between p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg group cursor-pointer hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-90 dark:text-white">{member.displayName}</p>
                      <p className="text-xs text-neutral-60 dark:text-neutral-40">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-60 dark:text-neutral-40">{member.allocationPct}%</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id) }}
                      className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Eliminar miembro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {team.members.length === 0 && (
                <p className="text-sm text-neutral-50 dark:text-neutral-50">No hay miembros</p>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'sprints' && (
        <TeamSprintsSection teamId={team.id} members={team.members} />
      )}
    </div>
  )
}

function DoraCard({ icon, label, value, benchmark, color }: {
  icon: React.ReactNode
  label: string
  value: string
  benchmark: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`${color}`}>{icon}</div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${color.replace('text-', 'bg-')}/10 ${color}`}>
          {benchmark}
        </span>
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40 mt-1">{label}</p>
    </div>
  )
}
