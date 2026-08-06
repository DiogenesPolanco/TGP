import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Target,
  AlertOctagon,
  ArrowRight,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCalendarEvents, type CalendarEvent } from './calendarService'
import { Button } from '@/components/ui/Button'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const TYPE_DOTS: Record<string, string> = {
  plan: 'bg-blue-500',
  activity: 'bg-purple-500',
  commitment: 'bg-amber-500',
  deliverable: 'bg-emerald-500',
  blocker: 'bg-red-500',
}

const TYPE_LABELS: Record<string, string> = {
  plan: 'Plan',
  activity: 'Actividad',
  commitment: 'Compromiso',
  deliverable: 'Entregable',
  blocker: 'Bloqueo',
}

export function CalendarPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const navigate = useNavigate()

  const teamSprints = useLiveQuery(() => db.teamSprints.toArray()) ?? []

  useEffect(() => {
    setLoading(true)
    getCalendarEvents(currentYear, currentMonth).then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [currentYear, currentMonth])

  // ── Computed summaries ──
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000

  const summary = useMemo(() => {
    const overdue = events.filter((e) => new Date(e.date).getTime() < now && e.type !== 'blocker')
    const upcoming = events.filter((e) => {
      const t = new Date(e.date).getTime()
      return t >= now && t < now + thirtyDays
    })
    return {
      overdueTotal: overdue.length,
      overdueCommitments: overdue.filter((e) => e.type === 'commitment').length,
      upcomingDeliverables: upcoming.filter((e) => e.type === 'deliverable').length,
      upcomingPlans: upcoming.filter((e) => e.type === 'plan').length,
      upcomingTotal: upcoming.length,
    }
  }, [events, now, thirtyDays])

  // ── Sprint bars for current month ──
  const currentMonthSprints = teamSprints.filter((s) => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    const monthStart = new Date(currentYear, currentMonth, 1)
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    return start <= monthEnd && end >= monthStart
  })

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const getSprintSpan = (start: Date, end: Date) => {
    const monthStart = new Date(currentYear, currentMonth, 1).getTime()
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).getTime()
    const s = Math.max(start.getTime(), monthStart)
    const e = Math.min(end.getTime(), monthEnd)
    const left = ((s - monthStart) / (monthEnd - monthStart)) * 100
    const width = ((e - s) / (monthEnd - monthStart)) * 100
    return { left: `${left}%`, width: `${width}%` }
  }

  // ── Calendar grid ──
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()

  const getEventsForDay = (day: number) =>
    events.filter((e) => {
      const d = e.date
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

  const isToday = (day: number) => {
    const d = new Date()
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-1.5" />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEvents = getEventsForDay(d)
    const isOverdue = dayEvents.some(
      (e) => new Date(e.date).getTime() < now && e.type !== 'blocker',
    )
    const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === currentMonth
    const isPast = new Date(currentYear, currentMonth, d, 23, 59, 59).getTime() < now
    days.push(
      <Button
        key={d}
        onClick={() => setSelectedDate(new Date(currentYear, currentMonth, d))}
        className={cn(
          'relative p-1.5 rounded-lg text-center transition-all border',
          isToday(d) && 'border-primary/40 bg-primary/[0.04] font-bold',
          isSelected
            ? 'bg-primary/85 text-white font-semibold border-primary/60'
            : isOverdue
              ? 'bg-danger/[0.03] border-danger/15 hover:bg-danger/[0.06]'
              : 'border-transparent hover:bg-neutral-10 dark:hover:bg-neutral-75',
          !isSelected && 'text-neutral-80 dark:text-neutral-20',
          isPast && !isSelected && !isOverdue && 'opacity-40',
        )}
      >
        <span className={cn('text-sm font-medium', isSelected && 'text-white')}>{d}</span>
        {dayEvents.length > 0 && !isSelected && (
          <div className="flex justify-center gap-0.5 mt-0.5">
            {Array.from(new Set(dayEvents.map((e) => e.type)))
              .slice(0, 4)
              .map((type) => (
                <span key={type} className={cn('w-1.5 h-1.5 rounded-full', TYPE_DOTS[type])} />
              ))}
          </div>
        )}
      </Button>,
    )
  }

  // ── Upcoming events (all future, sorted) ──
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 8),
    [events, now],
  )

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : []

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-90 dark:text-white">
          Calendario Ejecutivo
        </h1>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Vencidos"
          value={summary.overdueTotal}
          subtitle={`${summary.overdueCommitments} compromisos`}
          icon={<AlertTriangle size={18} />}
          color={summary.overdueTotal > 0 ? 'danger' : 'success'}
        />
        <SummaryCard
          title="Próximos 30 días"
          value={summary.upcomingTotal}
          subtitle={`${summary.upcomingPlans} planes · ${summary.upcomingDeliverables} entregables`}
          icon={<Target size={18} />}
          color="primary"
        />
        <SummaryCard
          title="Sprints activos"
          value={currentMonthSprints.length}
          subtitle={`${new Set(currentMonthSprints.map((s) => s.teamId)).size} equipos`}
          icon={<BarChart3 size={18} />}
          color="info"
        />
        <SummaryCard
          title="Bloqueos"
          value={events.filter((e) => e.type === 'blocker').length}
          subtitle="Sin resolver"
          icon={<AlertOctagon size={18} />}
          color="warning"
        />
      </div>

      {/* ── Main grid: Calendar + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Month Calendar ── */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-boundary">
            <Button
              onClick={() =>
                setCurrentMonth((m) => (m === 0 ? (setCurrentYear((y) => y - 1), 11) : m - 1))
              }
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ChevronLeft size={20} className="text-neutral-60" />
            </Button>
            <h2 className="text-lg font-bold text-neutral-90 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <Button
              onClick={() =>
                setCurrentMonth((m) => (m === 11 ? (setCurrentYear((y) => y + 1), 0) : m + 1))
              }
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ChevronRight size={20} className="text-neutral-60" />
            </Button>
          </div>

          {currentMonthSprints.length > 0 && (
            <div className="px-5 pt-3 pb-1 space-y-1">
              {currentMonthSprints.map((sprint) => {
                const { left, width } = getSprintSpan(
                  new Date(sprint.startDate),
                  new Date(sprint.endDate),
                )
                const completion =
                  sprint.plannedSP > 0
                    ? Math.round((sprint.completedSP / sprint.plannedSP) * 100)
                    : 0
                return (
                  <div key={sprint.id} className="relative h-6">
                    <div className="absolute inset-0 bg-neutral-10 dark:bg-neutral-85 rounded-md" />
                    <div
                      className="absolute h-full rounded-md transition-all bg-primary/15"
                      style={{ left, width }}
                    />
                    <div className="absolute inset-0 flex items-center px-2.5 text-[11px] font-medium text-muted">
                      <span>{sprint.sprintName}</span>
                      <span className="ml-auto text-primary font-semibold">{completion}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-3 gap-1.5">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-neutral-50 uppercase tracking-wider py-1.5"
              >
                {d}
              </div>
            ))}
            {days}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-boundary bg-neutral-5 dark:bg-neutral-85 flex-wrap">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div
                key={type}
                className="flex items-center gap-1.5 text-[11px] font-medium text-muted"
              >
                <span className={cn('w-2 h-2 rounded-full', TYPE_DOTS[type])} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="space-y-4">
          {/* Selected day events */}
          <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon size={18} className="text-primary" />
              <h3 className="font-semibold text-neutral-90 dark:text-white">
                {selectedDate
                  ? `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`
                  : 'Hoy'}
              </h3>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-neutral-10 dark:bg-neutral-75 rounded-lg" />
                ))}
              </div>
            ) : selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => event.link !== '#' && navigate(event.link)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-5 dark:hover:bg-neutral-85 transition-colors cursor-pointer group"
                  >
                    <div
                      className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', TYPE_DOTS[event.type])}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-90 dark:text-white truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-50">
                          {TYPE_LABELS[event.type]}
                        </span>
                        <span className="text-neutral-30 dark:text-neutral-60">·</span>
                        <span
                          className={cn(
                            'text-[11px] capitalize',
                            event.status === 'open' ||
                              event.status === 'breached' ||
                              event.status === 'overdue'
                              ? 'text-danger/70'
                              : event.status === 'in_progress'
                                ? 'text-warning/70'
                                : 'text-neutral-50',
                          )}
                        >
                          {event.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-neutral-40 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <CalendarIcon
                  size={32}
                  className="mx-auto text-neutral-30 dark:text-neutral-60 mb-2"
                />
                <p className="text-sm text-neutral-50">Sin eventos este día</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon
                  size={32}
                  className="mx-auto text-neutral-30 dark:text-neutral-60 mb-2"
                />
                <p className="text-sm text-neutral-50">Selecciona un día para ver sus eventos</p>
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5">
            <h3 className="font-semibold text-neutral-90 dark:text-white mb-4">Próximos eventos</h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-1 py-2 border-b border-neutral-10 dark:border-neutral-75 last:border-0"
                  >
                    <div className="text-right min-w-[48px]">
                      <p className="text-xs font-bold text-neutral-90 dark:text-white">
                        {event.date.getDate()}
                      </p>
                      <p className="text-[10px] text-neutral-50">
                        {MONTHS[event.date.getMonth()].slice(0, 3)}
                      </p>
                    </div>
                    <div className={cn('w-2 h-2 rounded-full shrink-0', TYPE_DOTS[event.type])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-neutral-90 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-neutral-50">{TYPE_LABELS[event.type]}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-50 text-center py-4">No hay eventos próximos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  color: 'danger' | 'primary' | 'info' | 'warning' | 'success'
}) {
  const styles = {
    danger: { bg: 'bg-danger/[0.06]', text: 'text-danger', dot: 'bg-danger/40' },
    primary: { bg: 'bg-primary/[0.06]', text: 'text-primary', dot: 'bg-primary/40' },
    info: { bg: 'bg-info/[0.06]', text: 'text-info', dot: 'bg-info/40' },
    warning: { bg: 'bg-warning/[0.06]', text: 'text-warning', dot: 'bg-warning/40' },
    success: { bg: 'bg-success/[0.06]', text: 'text-success', dot: 'bg-success/40' },
  }
  const s = styles[color]
  return (
    <div className="bg-card rounded-2xl border border-boundary p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('p-2 rounded-lg', s.bg, s.text)}>{icon}</div>
        <div className={cn('h-1 w-12 rounded-full', s.dot)} />
      </div>
      <p className="text-xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted font-medium mt-0.5">{title}</p>
      <p className="text-[11px] text-neutral-50 mt-0.5">{subtitle}</p>
    </div>
  )
}
