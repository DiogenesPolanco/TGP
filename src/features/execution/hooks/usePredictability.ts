import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface SprintPredictability {
  sprintId: string
  sprintName: string
  teamId: string
  plannedSP: number
  completedSP: number
  notCompletedSP: number
  predictability: number
  endDate: Date
  quarter: string
  year: number
}

export interface PredictabilityPeriod {
  periodKey: string
  label: string
  avgPredictability: number
  totalEstimated: number
  totalActual: number
  planCount: number
  sprints: SprintPredictability[]
  color: 'success' | 'warning' | 'danger'
}

export type PeriodGranularity = 'monthly' | 'quarterly' | 'yearly'

export function usePredictability(teamId?: string | null) {
  const teamSprints = useLiveQuery(() => db.teamSprints.toArray()) ?? []
  const teams = useLiveQuery(() => db.teams.toArray()) ?? []

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const predictabilitySprints = useMemo<SprintPredictability[]>(() => {
    const filtered = teamSprints.filter((s) => {
      if (teamId && s.teamId !== teamId) return false
      return true
    })

    return filtered
      .map((s) => {
        const predictability = s.plannedSP > 0
          ? Math.round((s.completedSP / s.plannedSP) * 100)
          : 0

        return {
          sprintId: s.id,
          sprintName: s.sprintName,
          teamId: s.teamId,
          plannedSP: s.plannedSP,
          completedSP: s.completedSP,
          notCompletedSP: s.notCompletedSP,
          predictability,
          endDate: s.endDate instanceof Date ? s.endDate : new Date(s.endDate),
          quarter: s.quarter,
          year: s.year,
        }
      })
      .filter((s) => s.plannedSP > 0)
  }, [teamSprints, teamId])

  const aggregateByPeriod = useMemo(() => {
    function aggregate(granularity: PeriodGranularity) {
      const groups = new Map<string, SprintPredictability[]>()

      for (const s of predictabilitySprints) {
        let key: string

        switch (granularity) {
          case 'monthly': {
            key = format(s.endDate, 'yyyy-MM', { locale: es })
            break
          }
          case 'quarterly': {
            key = `${s.year}-${s.quarter}`
            break
          }
          case 'yearly': {
            key = String(s.year)
            break
          }
        }

        const existing = groups.get(key) ?? []
        existing.push(s)
        groups.set(key, existing)
      }

      return Array.from(groups.entries())
        .map(([periodKey, periodSprints]) => {
          const totalEstimated = periodSprints.reduce((sum, s) => sum + s.plannedSP, 0)
          const totalActual = periodSprints.reduce((sum, s) => sum + s.completedSP, 0)
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
              const d = new Date(periodSprints[0].endDate)
              const l = format(d, 'MMMM yyyy', { locale: es })
              label = l.charAt(0).toUpperCase() + l.slice(1)
              break
            }
            case 'quarterly': {
              label = `${periodSprints[0].quarter} ${periodSprints[0].year}`
              break
            }
            case 'yearly':
              label = String(periodSprints[0].year)
              break
          }

          return {
            periodKey,
            label,
            avgPredictability,
            totalEstimated,
            totalActual,
            planCount: periodSprints.length,
            sprints: periodSprints,
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
  }, [predictabilitySprints])

  const teamOptions = useMemo(() => {
    return teams.map((t) => ({ id: t.id, name: t.name }))
  }, [teams])

  return {
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
