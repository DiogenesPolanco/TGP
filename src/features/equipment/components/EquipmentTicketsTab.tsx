import { Wrench, ClipboardList, ExternalLink, User, Pencil } from 'lucide-react'
import { TicketTypeBadge, TicketStatusBadge } from './equipmentDetailComponents'
import type { EquipmentTicket, MemberProfile, Team } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router'

export function EquipmentTicketsTab({
  tickets,
  members,
  teams,
  equipmentId,
}: {
  tickets: EquipmentTicket[]
  members: MemberProfile[]
  teams: Team[]
  equipmentId: string
}) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-50">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrado
          {tickets.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={() => navigate(`/equipment/${equipmentId}/tickets/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Wrench size={16} />
          Nuevo Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-neutral-50">
          <ClipboardList size={40} className="mx-auto mb-3 text-neutral-30" />
          <p className="text-sm">Sin tickets registrados para este equipo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const assigneeName = t.assigneeId
              ? (members.find((m) => m.id === t.assigneeId)?.email.split('@')[0] ??
                teams.flatMap((tm) => tm.members).find((m) => m.id === t.assigneeId)?.displayName ??
                null)
              : null
            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 bg-neutral-5 dark:bg-neutral-85 rounded-xl hover:bg-neutral-10 dark:hover:bg-neutral-75 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <TicketTypeBadge type={t.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                      {t.description.replace(/<[^>]*>/g, '').slice(0, 80)}
                    </p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                      {assigneeName && (
                        <span className="text-[11px] text-neutral-50 flex items-center gap-1">
                          <User size={10} />
                          {assigneeName}
                        </span>
                      )}
                      {t.startDate && (
                        <span className="text-[11px] text-neutral-50">
                          {new Date(t.startDate).toLocaleDateString('es')}
                          {t.endDate ? ` → ${new Date(t.endDate).toLocaleDateString('es')}` : ' →'}
                        </span>
                      )}
                      <TicketStatusBadge status={t.status} />
                      {t.priority && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            t.priority === 'critical'
                              ? 'bg-danger/10 text-danger'
                              : t.priority === 'high'
                                ? 'bg-warning/10 text-warning'
                                : t.priority === 'medium'
                                  ? 'bg-info/10 text-info'
                                  : 'bg-neutral-20 text-neutral-60'
                          }`}
                        >
                          {t.priority === 'critical'
                            ? 'Crítica'
                            : t.priority === 'high'
                              ? 'Alta'
                              : t.priority === 'medium'
                                ? 'Media'
                                : 'Baja'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.jiraTicketId && (
                    <span className="text-[11px] bg-neutral-20 dark:bg-neutral-70 px-2 py-0.5 rounded text-neutral-60 font-mono">
                      {t.jiraTicketId}
                    </span>
                  )}
                  {t.jiraTicketLink && (
                    <a
                      href={t.jiraTicketLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-neutral-50 hover:text-primary transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Button
                    onClick={() => navigate(`/equipment/${equipmentId}/tickets/${t.id}/edit`)}
                    className="p-1.5 text-neutral-50 hover:text-primary transition-colors"
                    title="Editar ticket"
                  >
                    <Pencil size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
