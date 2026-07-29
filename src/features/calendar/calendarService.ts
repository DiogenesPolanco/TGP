import { db } from '@/services/db/database'

export interface CalendarEvent {
  id: string
  date: Date
  title: string
  type: 'plan' | 'activity' | 'commitment' | 'deliverable' | 'blocker'
  status: string
  link: string
}

export async function getCalendarEvents(year: number, month: number): Promise<CalendarEvent[]> {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const events: CalendarEvent[] = []

  const [plans, activities, commitments, deliverables, blockers] = await Promise.all([
    db.plans.toArray(),
    db.activities.toArray(),
    db.commitments.toArray(),
    db.deliverables.toArray(),
    db.blockers.toArray(),
  ])

  for (const p of plans) {
    if (p.endDate) {
      const d = new Date(p.endDate)
      if (d >= startDate && d <= endDate) {
        events.push({
          id: `plan-${p.id}`,
          date: d,
          title: `Plan: ${p.title}`,
          type: 'plan',
          status: p.status,
          link: `/execution/plans/${p.id}`,
        })
      }
    }
    if (p.startDate) {
      const d = new Date(p.startDate)
      if (d >= startDate && d <= endDate) {
        events.push({
          id: `plan-start-${p.id}`,
          date: d,
          title: `Inicio Plan: ${p.title}`,
          type: 'plan',
          status: p.status,
          link: `/execution/plans/${p.id}`,
        })
      }
    }
  }

  for (const a of activities) {
    if (a.dueDate) {
      const d = new Date(a.dueDate)
      if (d >= startDate && d <= endDate) {
        events.push({
          id: `activity-${a.id}`,
          date: d,
          title: `Actividad: ${a.title}`,
          type: 'activity',
          status: a.status,
          link: a.planId ? `/execution/plans/${a.planId}` : '#',
        })
      }
    }
  }

  for (const c of commitments) {
    const d = new Date(c.commitmentDate)
    if (d >= startDate && d <= endDate) {
      events.push({
        id: `commitment-${c.id}`,
        date: d,
        title: `Compromiso: ${c.title}`,
        type: 'commitment',
        status: c.status,
        link: `/execution/commitments/${c.id}`,
      })
    }
  }

  for (const d of deliverables) {
    if (d.dueDate) {
      const due = new Date(d.dueDate)
      if (due >= startDate && due <= endDate) {
        events.push({
          id: `deliverable-${d.id}`,
          date: due,
          title: `Entregable: ${d.title}`,
          type: 'deliverable',
          status: d.status,
          link: `/catalog/deliverables/${d.id}`,
        })
      }
    }
  }

  for (const b of blockers) {
    if (b.createdAt) {
      const d = new Date(b.createdAt)
      if (d >= startDate && d <= endDate) {
        events.push({
          id: `blocker-${b.id}`,
          date: d,
          title: `Bloqueo: ${b.title}`,
          type: 'blocker',
          status: b.status,
          link: '#',
        })
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}
