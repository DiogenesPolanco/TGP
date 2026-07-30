import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import type { Activity } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { ActivityGanttRow, GanttTaskRow } from './ActivityGanttRow'

interface ActivityGanttProps {
  planId: string
  activities: Activity[]
  tasks: {
    id: string
    activityId: string | null
    title: string
    status: string
    priority: string
    dueDate: Date | null
  }[]
  teamMap: Map<string, { name: string }>
  appMap: Map<string, { name: string }>
  onEditActivity: (activityId: string) => void
  onDeleteActivity: (activity: Activity) => void
  onTaskToggle: (taskId: string, currentStatus: string) => void
  onNewActivity: () => void
  readOnly?: boolean
}

export function ActivityGantt({
  activities,
  tasks,
  teamMap,
  appMap,
  onEditActivity,
  onDeleteActivity,
  onTaskToggle,
  onNewActivity,
  readOnly = false,
}: ActivityGanttProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedActivities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activitiesByParent = useMemo(() => {
    const map = new Map<string | null, Activity[]>()
    for (const a of activities) {
      const parentId = a.parentActivityId ?? null
      const list = map.get(parentId) ?? []
      list.push(a)
      map.set(parentId, list)
    }
    // Sort each level by sortOrder
    for (const [key, list] of map) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      map.set(key, list)
    }
    return map
  }, [activities])

  const rootActivities = useMemo(() => activitiesByParent.get(null) ?? [], [activitiesByParent])

  const childActivities = (parentId: string) => activitiesByParent.get(parentId) ?? []

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
  const { timelineStart, totalDays } = useMemo(() => {
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
      return { timelineStart: fallbackStart, totalDays: 28 }
    }

    const start = new Date(min)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    const end = new Date(Math.max(max, today.getTime()))
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    const days = Math.max(28, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    return { timelineStart: start, totalDays: days }
  }, [activities])

  const today = new Date()
  const dayWidth = Math.max(24, Math.min(48, Math.floor(800 / totalDays)))

  /** Recursively renders an activity, its sub-activities (N levels), and its tasks */
  const renderActivityTree = (activity: Activity, depth: number = 0) => {
    const children = childActivities(activity.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedActivities.has(activity.id)
    const activityTasks = tasksByActivity.get(activity.id) ?? []
    const indent = depth * 16 // 16px per level for the nested border

    return (
      <div key={activity.id}>
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
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => toggleExpand(activity.id)}
          readOnly={readOnly}
          depth={depth}
        />

        {isExpanded && (
          <div className={`border-l-2 border-boundary`} style={{ marginLeft: `${24 + indent}px` }}>
            {/* Recursively render children */}
            {children.map((child) => renderActivityTree(child, depth + 1))}

            {/* Tasks for this activity (shown after children) */}
            {activityTasks.length > 0 && (
              <div className="pb-1">
                {activityTasks.map((task) => (
                  <GanttTaskRow
                    key={task.id}
                    task={task}
                    timelineStart={timelineStart}
                    totalDays={totalDays}
                    dayWidth={dayWidth}
                    today={today}
                    onToggle={() => onTaskToggle(task.id, task.status)}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-boundary shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-boundary">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Detalle del plan
          </h3>
          <span className="text-xs text-neutral-50 bg-neutral-10 dark:bg-neutral-70 px-2 py-0.5 rounded-full">
            {rootActivities.length} actividad{rootActivities.length !== 1 ? 'es' : ''}
          </span>
        </div>
        {!readOnly && (
          <Button
            onClick={onNewActivity}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus size={16} />
            Nueva Actividad
          </Button>
        )}
      </div>

      {/* Gantt header with time scale */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${15 + totalDays * (dayWidth / 7)}px` }}>
          {/* Month headers */}
          <div className="flex border-b border-boundary">
            <div className="w-56 shrink-0 border-r border-boundary" />
            <div className="flex">
              {buildMonthSegments(timelineStart, totalDays).map((seg, i) => (
                <div
                  key={i}
                  title={`${seg.label} — ${seg.days} días`}
                  className="text-center py-2 text-[11px] font-semibold text-neutral-50 uppercase tracking-wider border-r border-boundary"
                  style={{ width: `${seg.days * (dayWidth / 7)}px` }}
                >
                  {seg.label}
                </div>
              ))}
            </div>
          </div>

          {/* Week headers */}
          <div className="flex border-b border-boundary">
            <div className="w-56 shrink-0 border-r border-boundary" />
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
                      className={`text-center py-1.5 text-[10px] font-medium border-r border-boundary ${
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

          {/* Activity rows — recursive tree rendering */}
          <div className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {rootActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-50">
                No hay actividades. Crea la primera para empezar.
              </div>
            ) : (
              rootActivities.map((activity) => renderActivityTree(activity, 0))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-boundary bg-neutral-10/50 dark:bg-neutral-80/50">
        <span className="text-[11px] text-neutral-50 uppercase tracking-wider font-semibold">
          Leyenda
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-pending" /> Pendiente
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-info" /> En Progreso
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-success" /> Completado
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-3 h-3 rounded-sm bg-danger/50" /> Vencido
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="w-0.5 h-3 bg-danger" /> Hoy
        </span>
      </div>
    </div>
  )
}

function buildMonthSegments(start: Date, totalDays: number) {
  const segments: { label: string; days: number }[] = []
  const current = new Date(start)

  while (totalDays > 0) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const remainingInMonth = daysInMonth - current.getDate() + 1
    const days = Math.min(remainingInMonth, totalDays)

    const label = current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    segments.push({ label, days })
    totalDays -= days
    current.setDate(current.getDate() + days)
  }

  return segments
}
