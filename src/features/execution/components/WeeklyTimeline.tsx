import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Activity, Commitment } from '@/types/domain'
import { Button } from '@/components/ui/Button'

interface WeeklyTimelineProps {
  activities: Activity[]
  commitments: Commitment[]
  today: Date
  selectedWeek: { start: Date; end: Date } | null
  onWeekSelect: (week: { start: Date; end: Date } | null) => void
}

interface WeekBucket {
  label: string
  shortLabel: string
  start: Date
  end: Date
  count: number
  overdueCount: number
  isCurrent: boolean
  isPast: boolean
}

export function WeeklyTimeline({ activities, commitments, today, selectedWeek, onWeekSelect }: WeeklyTimelineProps) {
  const [offset, setOffset] = useState(0)

  const weeks = useMemo(() => {
    return buildWeeks(today, activities, commitments, offset)
  }, [today, activities, commitments, offset])

  const maxCount = Math.max(1, ...weeks.map((w) => w.count))

  if (weeks.length === 0) return null

  const isSelected = (week: WeekBucket) =>
    selectedWeek && week.start.getTime() === selectedWeek.start.getTime()

  return (
    <div className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-20 dark:border-neutral-70">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">Roadmap Semanal</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setOffset((o) => o - 4)}
            className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors text-neutral-50 hover:text-neutral-90 dark:hover:text-white"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            onClick={() => setOffset((o) => o + 4)}
            className="p-1 rounded hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors text-neutral-50 hover:text-neutral-90 dark:hover:text-white"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="flex divide-x divide-neutral-20 dark:divide-neutral-70 overflow-x-auto">
        {weeks.map((week, i) => {
          const barHeight = Math.max(4, (week.count / maxCount) * 48)
          const isOverloaded = week.count > 3
          const selected = isSelected(week)

          return (
            <Button
              key={i}
              onClick={() => onWeekSelect(selected ? null : { start: week.start, end: week.end })}
              className={`flex-1 min-w-[90px] px-3 py-4 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                selected
                  ? 'bg-primary/10 ring-2 ring-inset ring-primary'
                  : week.isCurrent
                    ? 'bg-primary/[0.03] dark:bg-primary/[0.06]'
                    : week.isPast
                      ? 'opacity-50'
                      : 'hover:bg-neutral-10 dark:hover:bg-neutral-70/30'
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                selected ? 'text-primary' : 'text-neutral-60 dark:text-neutral-40'
              }`}>
                {week.shortLabel}
              </span>

              <div className="flex items-end h-12 gap-[3px]">
                <div
                  className={`w-4 rounded-t-sm transition-all duration-500 ${
                    week.isPast
                      ? 'bg-neutral-30 dark:bg-neutral-60'
                      : isOverloaded
                        ? 'bg-danger/60'
                        : 'bg-primary/60'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
                {week.overdueCount > 0 && (
                  <div
                    className="w-4 rounded-t-sm bg-danger/80"
                    style={{ height: `${Math.max(4, (week.overdueCount / maxCount) * 48)}px` }}
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${
                  selected
                    ? 'text-primary'
                    : week.isPast
                      ? 'text-neutral-40'
                      : isOverloaded
                        ? 'text-danger'
                        : 'text-neutral-90 dark:text-white'
                }`}>
                  {week.count}
                </span>
                {week.overdueCount > 0 && (
                  <span className="text-xs font-semibold text-danger/80">
                    +{week.overdueCount}
                  </span>
                )}
              </div>

              <span className="text-[10px] text-neutral-50">
                {week.start.getDate()}/{week.start.getMonth() + 1}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function buildWeeks(
  today: Date,
  activities: Activity[],
  commitments: Commitment[],
  offset: number,
): WeekBucket[] {
  const weeks: WeekBucket[] = []
  const now = new Date(today)

  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  now.setDate(now.getDate() + mondayOffset + offset * 7)

  const countByWeek = new Map<string, { count: number; overdue: number }>()

  const incWeek = (date: Date, isOverdue: boolean) => {
    const key = getWeekKey(date)
    const entry = countByWeek.get(key) ?? { count: 0, overdue: 0 }
    entry.count++
    if (isOverdue) entry.overdue++
    countByWeek.set(key, entry)
  }

  for (const act of activities) {
    if (!act.dueDate || act.status === 'completed' || act.status === 'cancelled') continue
    const d = new Date(act.dueDate)
    d.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < -7 || diffDays > 56) continue
    incWeek(d, diffDays < 0)
  }

  for (const c of commitments) {
    if (c.status !== 'active' && c.status !== 'at_risk') continue
    const d = new Date(c.commitmentDate)
    d.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < -7 || diffDays > 56) continue
    incWeek(d, diffDays < 0)
  }

  for (let w = 0; w < 8; w++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + w * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const key = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`
    const data = countByWeek.get(key) ?? { count: 0, overdue: 0 }

    weeks.push({
      label: `Sem ${getWeekNumber(weekStart)}`,
      shortLabel: weekStart === getMonday(today)
        ? 'Esta'
        : `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      start: weekStart,
      end: weekEnd,
      count: data.count,
      overdueCount: data.overdue,
      isCurrent: weekStart.getTime() === getMonday(today).getTime(),
      isPast: weekStart.getTime() < getMonday(today).getTime(),
    })
  }

  return weeks
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekKey(date: Date): string {
  return `${date.getFullYear()}-W${getWeekNumber(date)}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}
