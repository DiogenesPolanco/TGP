import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface PlanPredictability {
  planId: string
  planTitle: string
  teamId: string | null
  estimatedPoints: number
  completedPoints: number
  predictability: number
  startDate: Date
  endDate: Date
  status: string
}

export interface PredictabilityPeriod {
  periodKey: string
  label: string
  avgPredictability: number
  totalEstimated: number
  totalActual: number
  planCount: number
  plans: PlanPredictability[]
  color: 'success' | 'warning' | 'danger'
}

export type PeriodGranularity = 'monthly' | 'quarterly' | 'yearly'

export function usePredictability(teamId?: string | null) {
  const plans = useLiveQuery(() => db.plans.toArray()) ?? []
  const activities = useLiveQuery(() => db.activities.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const plansWithPredictability = useMemo<PlanPredictability[]>(() => {
    const relevantPlans = plans.filter((p) => {
      if (p.status !== 'completed' && p.status !== 'in_progress') return false
      if (teamId && p.teamId !== teamId) return false
      return true
    })

    return relevantPlans.map((plan) => {
      const planActivities = activities.filter((a) => a.planId === plan.id)

      const estimatedPoints = planActivities
        .filter((a) => a.status !== 'cancelled' && a.plannedPoints != null)
        .reduce((sum, a) => sum + (a.plannedPoints ?? 0), 0)

      const completedPoints = planActivities
        .filter((a) => a.status === 'completed' && a.completedPoints != null)
        .reduce((sum, a) => sum + (a.completedPoints ?? 0), 0)

      const predictability = estimatedPoints > 0
        ? Math.round((completedPoints / estimatedPoints) * 100)
        : 0

      return {
        planId: plan.id,
        planTitle: plan.title,
        teamId: plan.teamId,
        estimatedPoints,
        completedPoints,
        predictability,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
      }
    }).filter((p) => p.estimatedPoints > 0)
  }, [plans, activities, teamId])

  const aggregateByPeriod = useMemo(() => {
    function aggregate(granularity: PeriodGranularity) {
      const groups = new Map<string, PlanPredictability[]>()

      for (const p of plansWithPredictability) {
        let key: string

        switch (granularity) {
          case 'monthly': {
            key = format(p.endDate, 'yyyy-MM', { locale: es })
            break
          }
          case 'quarterly': {
            const q = Math.ceil((p.endDate.getMonth() + 1) / 3)
            key = `${p.endDate.getFullYear()}-Q${q}`
            break
          }
          case 'yearly': {
            key = String(p.endDate.getFullYear())
            break
          }
        }

        const existing = groups.get(key) ?? []
        existing.push(p)
        groups.set(key, existing)
      }

      return Array.from(groups.entries())
        .map(([periodKey, periodPlans]) => {
          const totalEstimated = periodPlans.reduce((s, p) => s + p.estimatedPoints, 0)
          const totalActual = periodPlans.reduce((s, p) => s + p.completedPoints, 0)
          const avgPredictability = totalEstimated > 0
            ? Math.round((totalActual / totalEstimated) * 100)
            : 0

          const color = avgPredictability >= 80 && avgPredictability <= 120
            ? 'success'
            : avgPredictability >= 50 && avgPredictability <= 150
              ? 'warning'
              : 'danger'

          let label: string
          switch (granularity) {
            case 'monthly': {
              const l = format(periodPlans[0].endDate, "MMMM yyyy", { locale: es })
              label = l.charAt(0).toUpperCase() + l.slice(1)
              break
            }
            case 'quarterly': {
              const q = Math.ceil((periodPlans[0].endDate.getMonth() + 1) / 3)
              label = `Q${q} ${periodPlans[0].endDate.getFullYear()}`
              break
            }
            case 'yearly':
              label = String(periodPlans[0].endDate.getFullYear())
              break
          }

          return {
            periodKey,
            label,
            avgPredictability,
            totalEstimated,
            totalActual,
            planCount: periodPlans.length,
            plans: periodPlans,
            color,
          }
        })
        .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
    }

    return {
      monthly: aggregate('monthly'),
      quarterly: aggregate('quarterly'),
      yearly: aggregate('yearly'),
    }
  }, [plansWithPredictability])

  const teamOptions = useMemo(() => {
    return teams.map((t) => ({ id: t.id, name: t.name }))
  }, [teams])

  return {
    plansWithPredictability,
    periods: aggregateByPeriod,
    teamOptions,
    teams,
    teamMap,
  }
}

export function getPredictabilityColor(value: number): string {
  if (value >= 80 && value <= 120) return 'text-success'
  if (value >= 50 && value <= 150) return 'text-warning'
  return 'text-danger'
}

export function getPredictabilityBg(value: number): string {
  if (value >= 80 && value <= 120) return 'bg-success/10'
  if (value >= 50 && value <= 150) return 'bg-warning/10'
  return 'bg-danger/10'
}
