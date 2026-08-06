import {
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { Activity } from '@/types/domain'
import type { DeliverableStatus } from '@/constants/enums'
import { Button } from '@/components/ui/Button'

export const statusIcon: Record<DeliverableStatus, React.ReactNode> = {
  pending: <Circle size={16} className="text-neutral-50" />,
  in_progress: <Clock size={16} className="text-info" />,
  completed: <CheckCircle2 size={16} className="text-success" />,
  cancelled: <XCircle size={16} className="text-neutral-50" />,
}

export const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const priorityColor: Record<string, string> = {
  low: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
}

export const priorityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export function buildActivityTooltip(
  activity: Activity,
  teamMap: Map<string, { name: string }>,
  appMap: Map<string, { name: string }>,
): string {
  const teamName = activity.teamId ? teamMap.get(activity.teamId)?.name : null
  const appName = activity.applicationId ? appMap.get(activity.applicationId)?.name : null
  return [
    activity.title,
    `Estado: ${statusLabel[activity.status]}`,
    `Prioridad: ${priorityLabel[activity.priority]}`,
    activity.dueDate ? `Vence: ${new Date(activity.dueDate).toLocaleDateString('es-ES')}` : null,
    activity.startDate
      ? `Inicio: ${new Date(activity.startDate).toLocaleDateString('es-ES')}`
      : null,
    activity.assigneeId ? `Asignado: ${activity.assigneeId}` : null,
    teamName ? `Equipo: ${teamName}` : null,
    appName ? `App: ${appName}` : null,
    activity.estimatedHours ? `Horas est.: ${activity.estimatedHours}` : null,
    activity.plannedPoints ? `Puntos planif.: ${activity.plannedPoints}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

interface ActivityGanttRowProps {
  activity: Activity
  timelineStart: Date
  totalDays: number
  dayWidth: number
  today: Date
  teamMap: Map<string, { name: string }>
  appMap: Map<string, { name: string }>
  onEdit: () => void
  onDelete: () => void
  hasChildren: boolean
  isExpanded: boolean
  onToggle: () => void
  readOnly?: boolean
  depth?: number
}

export function ActivityGanttRow({
  activity,
  timelineStart,
  totalDays,
  dayWidth,
  today,
  teamMap,
  appMap,
  onEdit,
  onDelete,
  hasChildren,
  isExpanded,
  onToggle,
  readOnly = false,
  depth = 0,
}: ActivityGanttRowProps) {
  const totalPixels = totalDays * (dayWidth / 7)
  const isOverdue =
    activity.dueDate &&
    new Date(activity.dueDate) < today &&
    activity.status !== 'completed' &&
    activity.status !== 'cancelled'
  const isCompleted = activity.status === 'completed'

  // Bar positioning
  const startDate = activity.startDate
    ? new Date(activity.startDate)
    : activity.dueDate
      ? new Date(activity.dueDate)
      : timelineStart
  const endDate = activity.dueDate
    ? new Date(activity.dueDate)
    : activity.startDate
      ? new Date(activity.startDate.getTime() + 7 * 86400000)
      : new Date(timelineStart.getTime() + 7 * 86400000)

  const barLeft = Math.max(
    0,
    ((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7),
  )
  const barWidth = Math.max(
    dayWidth / 7,
    ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7),
  )

  return (
    <div
      className={`flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors group ${depth > 0 ? 'bg-neutral-10/30 dark:bg-neutral-70/10' : ''}`}
    >
      {/* Label column */}
      <div
        className="w-56 shrink-0 px-4 py-3 border-r border-boundary flex items-center gap-2"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        {hasChildren ? (
          <Button
            onClick={onToggle}
            className="p-0.5 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp size={14} className="text-neutral-50" />
            ) : (
              <ChevronDown size={14} className="text-neutral-50" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span title={statusLabel[activity.status]}>{statusIcon[activity.status]}</span>
            <span
              title={activity.title}
              className={`text-sm font-medium truncate ${isCompleted ? 'text-neutral-50 line-through' : 'text-neutral-90 dark:text-white'}`}
            >
              {activity.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              title={`Prioridad: ${priorityLabel[activity.priority]}`}
              className={`text-[10px] px-1 py-0.5 rounded ${priorityColor[activity.priority]}`}
            >
              {priorityLabel[activity.priority]}
            </span>
            <span
              title={`Estado: ${statusLabel[activity.status]}`}
              className="text-[10px] text-neutral-50"
            >
              {statusLabel[activity.status]}
            </span>
            {activity.assigneeId && (
              <span
                title={`Asignado: ${activity.assigneeId}`}
                className="text-[10px] text-neutral-50"
              >
                {activity.assigneeId}
              </span>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={onEdit}
              className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary"
            >
              <Pencil size={12} />
            </Button>
            <Button
              onClick={onDelete}
              className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>

      {/* Gantt area */}
      <div className="relative flex-1 h-12" style={{ minWidth: `${totalPixels}px` }}>
        {/* Today line — hidden for completed activities */}
        {today >= timelineStart && !isCompleted && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-danger/70 z-10"
            style={{
              left: `${((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7)}px`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-danger absolute -top-0.5 -left-[2.5px]" />
          </div>
        )}

        {/* Activity bar */}
        <div
          title={buildActivityTooltip(activity, teamMap, appMap)}
          className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-1.5 overflow-hidden transition-all group-hover:shadow-sm cursor-pointer ${
            isOverdue ? 'ring-1 ring-danger/40' : ''
          }`}
          style={{
            left: `${barLeft}px`,
            width: `${Math.max(dayWidth / 7, barWidth)}px`,
            backgroundColor: isCompleted
              ? 'rgba(54, 179, 126, 0.15)'
              : isOverdue
                ? 'rgba(255, 86, 48, 0.12)'
                : activity.status === 'in_progress'
                  ? 'rgba(0, 184, 217, 0.12)'
                  : 'rgba(193, 199, 205, 0.2)',
            borderLeft: `3px solid ${
              isCompleted
                ? '#36B37E'
                : isOverdue
                  ? '#FF5630'
                  : activity.status === 'in_progress'
                    ? '#00B8D9'
                    : '#C1C7CD'
            }`,
          }}
          onClick={onEdit}
        >
          <span className="text-[10px] font-medium text-neutral-80 dark:text-neutral-20 truncate">
            {activity.title}
          </span>
        </div>
      </div>
    </div>
  )
}

interface GanttTaskRowProps {
  task: { id: string; title: string; status: string; priority: string; dueDate: Date | null }
  timelineStart: Date
  totalDays: number
  dayWidth: number
  today: Date
  onToggle: () => void
  depth?: number
}

export function GanttTaskRow({
  task,
  timelineStart,
  totalDays,
  dayWidth,
  today,
  onToggle,
  depth = 1,
}: GanttTaskRowProps) {
  const totalPixels = totalDays * (dayWidth / 7)

  return (
    <div className="flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors group">
      {/* Label */}
      <div
        className="w-56 shrink-0 px-4 py-2 border-r border-boundary flex items-center gap-2"
        style={{ paddingLeft: `${28 + depth * 24}px` }}
      >
        <Button onClick={onToggle} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <div
            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              task.status === 'done'
                ? 'bg-success border-success'
                : 'border-neutral-40 dark:border-neutral-50 group-hover:border-primary'
            }`}
          >
            {task.status === 'done' && <CheckCircle2 size={8} className="text-white" />}
          </div>
          <span
            title={task.title}
            className={`text-xs truncate ${task.status === 'done' ? 'line-through text-neutral-50' : 'text-secondary'}`}
          >
            {task.title}
          </span>
        </Button>
      </div>

      {/* Gantt area (empty for tasks — they don't have date ranges) */}
      <div className="relative flex-1 h-8" style={{ minWidth: `${totalPixels}px` }}>
        {task.dueDate &&
          (() => {
            const d = new Date(task.dueDate)
            return (
              d.getFullYear() === today.getFullYear() &&
              d.getMonth() === today.getMonth() &&
              d.getDate() === today.getDate()
            )
          })() && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-danger/40 z-10"
              style={{
                left: `${((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7)}px`,
              }}
            />
          )}
        {/* Minimal dot marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full ${
            task.status === 'done'
              ? 'bg-success'
              : task.priority === 'critical'
                ? 'bg-danger'
                : task.priority === 'high'
                  ? 'bg-warning'
                  : 'bg-neutral-40'
          }`}
        />
      </div>
    </div>
  )
}
