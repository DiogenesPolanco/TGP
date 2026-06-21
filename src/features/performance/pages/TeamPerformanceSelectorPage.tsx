import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import type { Team } from '@/types/domain'
import { Users, ArrowRight } from 'lucide-react'

export function TeamPerformanceSelectorPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    db.teams.toArray().then(setTeams)
  }, [])

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">Rendimiento de Equipos</h1>
        <p className="text-muted mt-1">
          Selecciona un equipo para ver sus indicadores de rendimiento
        </p>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12 text-neutral-40">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay equipos registrados</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => navigate(`/teams/${team.id}/performance`)}
            className="flex items-center justify-between p-5 bg-card rounded-2xl border border-boundary hover:border-primary/50 dark:hover:border-primary/50 transition-all text-left group"
          >
            <div>
              <h3 className="font-semibold text-neutral-90 dark:text-white">{team.name}</h3>
              <p className="text-sm text-neutral-50 dark:text-neutral-40 mt-0.5">
                {team.members?.length ?? 0} miembros
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-neutral-30 group-hover:text-primary transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
