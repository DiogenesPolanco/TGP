import { History, User } from 'lucide-react'
import { EquipmentConditionBadge } from '@/features/equipment/components/EquipmentStatusBadge'
import type { EquipmentAssignmentLog, MemberProfile, Team } from '@/types/domain'
import { useNavigate } from 'react-router'

export function EquipmentHistoryTab({
  assignments,
  members,
  teams,
}: {
  assignments: EquipmentAssignmentLog[]
  members: MemberProfile[]
  teams: Team[]
}) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-50">
        {assignments.length} asignacion{assignments.length !== 1 ? 'es' : ''} registrada
        {assignments.length !== 1 ? 's' : ''}
      </p>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-neutral-50">
          <History size={40} className="mx-auto mb-3 text-neutral-30" />
          <p className="text-sm">Sin asignaciones previas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const memberProfile = members.find((m) => m.id === a.assignedTo)
            const teamMember = !memberProfile
              ? teams.flatMap((t) => t.members).find((m) => m.id === a.assignedTo)
              : null
            const memberName =
              memberProfile?.email.split('@')[0] ?? teamMember?.displayName ?? a.assignedTo
            const memberTeamId =
              memberProfile?.teamId ??
              teams.find((t) => t.members.some((m) => m.id === a.assignedTo))?.id
            return (
              <div
                key={a.id}
                onClick={() =>
                  memberTeamId && navigate(`/teams/${memberTeamId}/performance/${a.assignedTo}`)
                }
                className={`flex items-center justify-between p-4 bg-neutral-5 dark:bg-neutral-85 rounded-xl ${
                  memberTeamId
                    ? 'cursor-pointer hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      a.returnedAt ? 'bg-neutral-20 text-neutral-60' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">
                      {memberName}
                    </p>
                    <p className="text-xs text-neutral-50">
                      {a.assignedAt.toLocaleDateString('es')}
                      {a.returnedAt ? ` → ${a.returnedAt.toLocaleDateString('es')}` : ' (Activo)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <p className="text-neutral-50">Entrega</p>
                    <EquipmentConditionBadge condition={a.conditionAtAssignment} />
                  </div>
                  {a.conditionAtReturn && (
                    <div className="text-right">
                      <p className="text-neutral-50">Devolución</p>
                      <EquipmentConditionBadge condition={a.conditionAtReturn} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
