import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Circle, Clock, CheckCircle2, XCircle, Pencil, Trash2, Plus } from 'lucide-react'
import type { Activity } from '@/types/domain'
import type { DeliverableStatus } from '@/constants/enums'

interface ActivityGanttProps {
  planId: string
  activities: Activity[]
  tasks: { id: string; activityId: string | null; title: string; status: string; priority: string }[]
  teamMap: Map<string, { name: string }>
  appMap: Map<string, { name: string }>
  onEditActivity: (activityId: string) => void
  onDeleteActivity: (activity: Activity) => void
  onTaskToggle: (taskId: string, currentStatus: string) => void
  onNewActivity: () => void
  readOnly?: boolean
}

const statusIcon: Record<DeliverableStatus, React.ReactNode> = {
  pending: <Circle size={16} className="text-neutral-50" />,
  in_progress: <Clock size={16} className="text-info" />,
  completed: <CheckCircle2 size={16} className="text-success" />,
  cancelled: <XCircle size={16} className="text-neutral-50" />,
}

const statusLabel: Record<DeliverableStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusColor: Record<string, string> = {
  pending: 'bg-neutral-30 dark:bg-neutral-60',
  in_progress: 'bg-info',
  completed: 'bg-success',
  cancelled: 'bg-neutral-40 dark:bg-neutral-60',
}

const priorityColor: Record<string, string> = {
  low: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
}

const priorityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export function ActivityGantt({
  planId, activities, tasks, teamMap, appMap,
  onEditActivity, onDeleteActivity, onTaskToggle, onNewActivity,
  readOnly = false,
}: ActivityGanttProps) {
  const navigate = useNavigate()
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const rootActivities = activities.filter((a) => !a.parentActivityId)
  const childActivities = (parentId: string) => activities.filter((a) => a.parentActivityId === parentId)

  const tasksByActivity = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const t of tasks) {
      if (t.activityId) {
        const existing = map.get(t.activityId) ?? []
        existing.push(t)
        map.set(t.activityId, existing)
      }
    }
    return map
  }, [tasks])

  // Timeline range
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    const today = new Date()

    // Look at all activities with dates
    let hasDates = false
    for (const a of activities) {
      if (a.dueDate) {
        const d = new Date(a.dueDate)
        if (d.getTime() < min) min = d.getTime()
        if (d.getTime() > max) max = d.getTime()
        hasDates = true
      }
      if (a.startDate) {
        const d = new Date(a.startDate)
        if (d.getTime() < min) min = d.getTime()
        hasDates = true
      }
    }

    // Fallback if no dates
    if (!hasDates) {
      const fallbackStart = new Date(today)
      fallbackStart.setDate(fallbackStart.getDate() - 14)
      const fallbackEnd = new Date(today)
      fallbackEnd.setDate(fallbackEnd.getDate() + 14)
      return { timelineStart: fallbackStart, timelineEnd: fallbackEnd, totalDays: 28 }
    }

    const start = new Date(min)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    const end = new Date(Math.max(max, today.getTime()))
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    const days = Math.max(28, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    return { timelineStart: start, timelineEnd: end, totalDays: days }
  }, [activities])

  const today = new Date()
  const dayWidth = Math.max(24, Math.min(48, Math.floor(800 / totalDays)))

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Detalle del plan
          </h3>
          <span className="text-xs text-neutral-50 bg-neutral-10 dark:bg-neutral-70 px-2 py-0.5 rounded-full">
            {rootActivities.length} actividad{rootActivities.length !== 1 ? 'es' : ''}
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={onNewActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus size={16} />
            Nueva Actividad
          </button>
        )}
      </div>

      {/* Gantt header with time scale */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${15 + totalDays * (dayWidth / 7)}px` }}>
          {/* Month headers */}
          <div className="flex border-b border-neutral-20 dark:border-neutral-70">
            <div className="w-56 shrink-0 border-r border-neutral-20 dark:border-neutral-70" />
            <div className="flex">
              {buildMonthSegments(timelineStart, totalDays).map((seg, i) => (
                <div
                  key={i}
                  title={`${seg.label} — ${seg.days} días`}
                  className="text-center py-2 text-[11px] font-semibold text-neutral-50 uppercase tracking-wider border-r border-neutral-20 dark:border-neutral-70"
                  style={{ width: `${seg.days * (dayWidth / 7)}px` }}
                >
                  {seg.label}
                </div>
              ))}
            </div>
          </div>

          {/* Week headers */}
          <div className="flex border-b border-neutral-20 dark:border-neutral-70">
            <div className="w-56 shrink-0 border-r border-neutral-20 dark:border-neutral-70" />
            <div className="flex">
              {(() => {
                let currentMonth = -1
                let weekInMonth = 0
                return Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => {
                  const weekDate = new Date(timelineStart)
                  weekDate.setDate(weekDate.getDate() + i * 7)
                  const weekEnd = new Date(weekDate)
                  weekEnd.setDate(weekDate.getDate() + 6)
                  const isThisWeek = today >= weekDate && today <= weekEnd
                  const month = weekDate.getMonth()
                  if (month !== currentMonth) {
                    currentMonth = month
                    weekInMonth = 1
                  } else {
                    weekInMonth++
                  }
                  return (
                    <div
                      key={i}
                      title={`Semana del ${weekDate.toLocaleDateString('es-ES')} al ${weekEnd.toLocaleDateString('es-ES')}`}
                      className={`text-center py-1.5 text-[10px] font-medium border-r border-neutral-20 dark:border-neutral-70 ${
                        isThisWeek ? 'bg-primary/[0.04] text-primary' : 'text-neutral-50'
                      }`}
                      style={{ width: `${dayWidth}px` }}
                    >
                      S{weekInMonth}
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Activity rows */}
          <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {rootActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-50">
                No hay actividades. Crea la primera para empezar.
              </div>
            ) : (
              rootActivities.map((activity) => (
                <div key={activity.id}>
                  {/* Parent activity row */}
                  <ActivityGanttRow
                    activity={activity}
                    timelineStart={timelineStart}
                    totalDays={totalDays}
                    dayWidth={dayWidth}
                    today={today}
                    teamMap={teamMap}
                    appMap={appMap}
                    onEdit={() => onEditActivity(activity.id)}
                    onDelete={() => onDeleteActivity(activity)}
                    hasChildren={childActivities(activity.id).length > 0}
                    isExpanded={expandedActivities.has(activity.id)}
                    onToggle={() => toggleExpand(activity.id)}
                    readOnly={readOnly}
                  />

                  {/* Sub-activities + tasks */}
                  {(expandedActivities.has(activity.id)) && (
                    <div className="ml-8 border-l-2 border-neutral-20 dark:border-neutral-70">
                      {/* Sub-activities */}
                      {childActivities(activity.id).map((child) => (
                        <div key={child.id}>
                          <ActivityGanttRow
                            activity={child}
                            timelineStart={timelineStart}
                            totalDays={totalDays}
                            dayWidth={dayWidth}
                            today={today}
                            teamMap={teamMap}
                            appMap={appMap}
                            onEdit={() => onEditActivity(child.id)}
                            onDelete={() => onDeleteActivity(child)}
                            hasChildren={false}
                            isExpanded={false}
                            onToggle={() => {}}
                            isSub={true}
                            readOnly={readOnly}
                          />
                          {/* Tasks for this child */}
                          {(tasksByActivity.get(child.id) ?? []).length > 0 && (
                            <div className="ml-10 pb-1">
                              {tasksByActivity.get(child.id)!.map((task) => (
                                <GanttTaskRow
                                  key={task.id}
                                  task={task}
                                  timelineStart={timelineStart}
                                  totalDays={totalDays}
                                  dayWidth={dayWidth}
                                  today={today}
                                  onToggle={() => onTaskToggle(task.id, task.status)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Tasks directly under parent */}
                      {(tasksByActivity.get(activity.id) ?? []).length > 0 && (
                        <div className="ml-10 pb-1">
                          {tasksByActivity.get(activity.id)!.map((task) => (
                            <GanttTaskRow
                              key={task.id}
                              task={task}
                              timelineStart={timelineStart}
                              totalDays={totalDays}
                              dayWidth={dayWidth}
                              today={today}
                              onToggle={() => onTaskToggle(task.id, task.status)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-neutral-20 dark:border-neutral-70 bg-neutral-10/50 dark:bg-neutral-80/50">
        <span className="text-[11px] text-neutral-50 uppercase tracking-wider font-semibold">Leyenda</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-pending" /> Pendiente</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-info" /> En Progreso</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-success" /> Completado</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-danger/50" /> Vencido</span>
        <span className="flex items-center gap-1.5 text-xs"><span className="w-0.5 h-3 bg-danger" /> Hoy</span>
      </div>
    </div>
  )
}

function ActivityGanttRow({
  activity, timelineStart, totalDays, dayWidth, today,
  teamMap, appMap, onEdit, onDelete,
  hasChildren, isExpanded, onToggle, isSub,
  readOnly = false,
}: {
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
  isSub?: boolean
  readOnly?: boolean
}) {
  const totalPixels = totalDays * (dayWidth / 7)
  const isOverdue = activity.dueDate && new Date(activity.dueDate) < today && activity.status !== 'completed' && activity.status !== 'cancelled'
  const isCompleted = activity.status === 'completed'

  // Bar positioning
  const startDate = activity.startDate ? new Date(activity.startDate) : activity.dueDate ? new Date(activity.dueDate) : timelineStart
  const endDate = activity.dueDate ? new Date(activity.dueDate) : activity.startDate ? new Date(activity.startDate.getTime() + 7 * 86400000) : new Date(timelineStart.getTime() + 7 * 86400000)

  const barLeft = Math.max(0, ((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7))
  const barWidth = Math.max(dayWidth / 7, ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7))

  return (
    <div className={`flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors group ${isSub ? 'bg-neutral-10/30 dark:bg-neutral-70/10' : ''}`}>
      {/* Label column */}
      <div className={`w-56 shrink-0 px-4 py-3 border-r border-neutral-20 dark:border-neutral-70 flex items-center gap-2 ${isSub ? 'pl-10' : ''}`}>
        {hasChildren ? (
          <button onClick={onToggle} className="p-0.5 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            {isExpanded ? <ChevronUp size={14} className="text-neutral-50" /> : <ChevronDown size={14} className="text-neutral-50" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span title={statusLabel[activity.status]}>{statusIcon[activity.status]}</span>
            <span title={activity.title} className={`text-sm font-medium truncate ${isCompleted ? 'text-neutral-50 line-through' : 'text-neutral-90 dark:text-white'}`}>
              {activity.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span title={`Prioridad: ${priorityLabel[activity.priority]}`} className={`text-[10px] px-1 py-0.5 rounded ${priorityColor[activity.priority]}`}>
              {priorityLabel[activity.priority]}
            </span>
            <span title={`Estado: ${statusLabel[activity.status]}`} className="text-[10px] text-neutral-50">{statusLabel[activity.status]}</span>
            {activity.assigneeId && <span title={`Asignado: ${activity.assigneeId}`} className="text-[10px] text-neutral-50">{activity.assigneeId}</span>}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary">
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger">
              <Trash2 size={12} />
            </button>
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
              isCompleted ? '#36B37E' : isOverdue ? '#FF5630' : activity.status === 'in_progress' ? '#00B8D9' : '#C1C7CD'
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

function GanttTaskRow({
  task, timelineStart, totalDays, dayWidth, today, onToggle,
}: {
  task: { id: string; title: string; status: string; priority: string; dueDate: Date | null }
  timelineStart: Date
  totalDays: number
  dayWidth: number
  today: Date
  onToggle: () => void
}) {
  const totalPixels = totalDays * (dayWidth / 7)

  return (
    <div className="flex items-center hover:bg-neutral-10 dark:hover:bg-neutral-70/30 transition-colors group">
      {/* Label */}
      <div className="w-56 shrink-0 px-4 py-2 border-r border-neutral-20 dark:border-neutral-70 flex items-center gap-2 pl-14">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
        >
          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            task.status === 'done'
              ? 'bg-success border-success'
              : 'border-neutral-40 dark:border-neutral-50 group-hover:border-primary'
          }`}>
            {task.status === 'done' && <CheckCircle2 size={8} className="text-white" />}
          </div>
          <span title={task.title} className={`text-xs truncate ${task.status === 'done' ? 'line-through text-neutral-50' : 'text-neutral-70 dark:text-neutral-30'}`}>
            {task.title}
          </span>
        </button>
      </div>

      {/* Gantt area (empty for tasks - they don't have date ranges) */}
      <div className="relative flex-1 h-8" style={{ minWidth: `${totalPixels}px` }}>
        {task.dueDate && (() => {
          const d = new Date(task.dueDate)
          return d.getFullYear() === today.getFullYear() &&
                 d.getMonth() === today.getMonth() &&
                 d.getDate() === today.getDate()
        })() && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-danger/40 z-10"
            style={{
              left: `${((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) * (dayWidth / 7)}px`,
            }}
          />
        )}
        {/* Minimal dot marker */}
        <div className={`absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full ${
          task.status === 'done' ? 'bg-success' : task.priority === 'critical' ? 'bg-danger' : task.priority === 'high' ? 'bg-warning' : 'bg-neutral-40'
        }`} />
      </div>
    </div>
  )
}

function buildActivityTooltip(
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
    activity.startDate ? `Inicio: ${new Date(activity.startDate).toLocaleDateString('es-ES')}` : null,
    activity.assigneeId ? `Asignado: ${activity.assigneeId}` : null,
    teamName ? `Equipo: ${teamName}` : null,
    appName ? `App: ${appName}` : null,
    activity.estimatedHours ? `Horas est.: ${activity.estimatedHours}` : null,
    activity.plannedPoints ? `Puntos planif.: ${activity.plannedPoints}` : null,
  ].filter(Boolean).join(' · ')
}

function buildMonthSegments(start: Date, totalDays: number) {
  const segments: { label: string; days: number }[] = []
  let current = new Date(start)

  while (totalDays > 0) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysFromStart = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const remainingInMonth = daysInMonth - current.getDate() + 1
    const days = Math.min(remainingInMonth, totalDays)

    const label = current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    segments.push({ label, days })
    totalDays -= days
    current.setDate(current.getDate() + days)
  }

  return segments
}
