import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

export const consultarMetricasSprintTool: AiToolDefinition = {
  name: 'consultar_metricas_sprint',
  description:
    'Salud de sprints con métricas DORA y rendimiento del equipo. Mostrá velocidad, completitud, calidad y tendencias por equipo o período.',
  parameters: {
    type: 'object',
    properties: {
      teamId: {
        type: 'string',
        description: 'Filtrar por ID de equipo',
      },
      year: {
        type: 'number',
        description: 'Filtrar por año',
      },
      quarter: {
        type: 'number',
        description: 'Filtrar por trimestre (1-4)',
      },
      incluirDORA: {
        type: ['boolean', 'string', 'number'],
        description:
          'Incluir métricas DORA del equipo (deploy frequency, lead time, MTTR, change failure rate)',
      },
    },
  },
  execute: async (params) => {
    const teamId = params.teamId as string | undefined
    const year = params.year as number | undefined
    const quarter = params.quarter as number | undefined
    const incluirDORA =
      typeof params.incluirDORA === 'boolean'
        ? params.incluirDORA
        : params.incluirDORA === 'true' || params.incluirDORA === '1'

    const output: string[] = []
    const teams = await db.teams.toArray()
    const teamMap = new Map(teams.map((t) => [t.id, t.name]))

    output.push('🏥 **Salud de Sprints**')
    output.push('')

    let sprints = await db.teamSprints.toArray()
    if (teamId) sprints = sprints.filter((s) => s.teamId === teamId)
    if (year) sprints = sprints.filter((s) => s.year === year)
    if (quarter) sprints = sprints.filter((s) => String(s.quarter) === String(quarter))

    if (sprints.length === 0) {
      return 'No se encontraron registros de sprint con los filtros indicados.'
    }

    const byTeam = new Map<string, typeof sprints>()
    for (const s of sprints) {
      const list = byTeam.get(s.teamId) ?? []
      list.push(s)
      byTeam.set(s.teamId, list)
    }

    for (const [tid, teamSprints] of byTeam) {
      const name = teamMap.get(tid) ?? tid
      const sorted = [...teamSprints].sort((a, b) => {
        const da = new Date(a.startDate ?? 0).getTime()
        const db_ = new Date(b.startDate ?? 0).getTime()
        return da - db_
      })

      const total = sorted.length
      const completed = sorted.filter((s) => s.completedSP > 0).length
      const avgCompletion =
        sorted.reduce((sum, s) => {
          const pct = s.plannedSP > 0 ? (s.completedSP / s.plannedSP) * 100 : 0
          return sum + pct
        }, 0) / total

      const avgVelocity = sorted.reduce((sum, s) => sum + (s.completedSP ?? 0), 0) / total

      output.push(`**${name}**`)
      output.push(`  📊 Sprints: ${total} (${completed} completados)`)
      output.push(`  🎯 Completitud promedio: ${avgCompletion.toFixed(1)}%`)
      output.push(`  ⚡ Velocidad promedio: ${avgVelocity.toFixed(1)} SP/sprint`)
      output.push(`  📈 Último sprint: ${sorted[sorted.length - 1]?.sprintName ?? '—'}`)

      if (sorted.length >= 3) {
        const last3 = sorted.slice(-3)
        const trend = last3.map((s) => (s.plannedSP > 0 ? s.completedSP / s.plannedSP : 0))
        const mejora = trend[2] > trend[0]
        output.push(
          `  ${mejora ? '📈' : '📉'} Tendencia (últimos 3): ${trend.map((t) => (t * 100).toFixed(0) + '%').join(' → ')}`,
        )
      }

      output.push('')
    }

    if (incluirDORA) {
      output.push('**Métricas DORA**')
      output.push('')

      try {
        // Las métricas DORA pueden estar en teamSprints o en team.currentMetrics
        const doraData = await db.teamSprints.toArray()
        if (teamId) doraData.filter((s) => s.teamId === teamId)

        const byTeam = new Map<string, { deploys: number; changes: number }>()
        for (const s of doraData) {
          const prev = byTeam.get(s.teamId) ?? { deploys: 0, changes: 0 }
          if (s.completedSP > 0) prev.deploys++
          prev.changes += s.notCompletedSP
          byTeam.set(s.teamId, prev)
        }

        if (byTeam.size > 0) {
          for (const [tid, data] of byTeam) {
            const name = teamMap.get(tid) ?? tid
            output.push(`**${name}**`)
            output.push(`  🚀 Deploy frequency: ${data.deploys} deploys`)
            output.push(
              `  💥 Change failure rate: ${data.changes > 0 ? ((data.changes / (data.deploys + data.changes)) * 100).toFixed(1) : 0}%`,
            )
            output.push('')
          }
        } else {
          output.push('_(No hay métricas DORA disponibles para este equipo/período)_')
          output.push('')
        }
      } catch {
        output.push('_(No hay métricas DORA disponibles)_')
        output.push('')
      }
    }

    if (!teamId) {
      const equiposConDatos = byTeam.size
      output.push(`**Resumen:** ${equiposConDatos} equipo(s) con datos de sprint en el período.`)
    }

    output.push(
      '💡 Usá filtros por teamId, year o quarter para acotar. Agregá incluirDORA=true para métricas de DevOps.',
    )
    return output.join('\n')
  },
}
