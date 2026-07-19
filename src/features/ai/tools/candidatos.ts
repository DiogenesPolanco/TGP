import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

function n(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const EVAL_LABELS: Record<string, string> = {
  technical_knowledge: 'Conocimiento técnico',
  experience: 'Experiencia',
  communication: 'Comunicación',
  attitude: 'Actitud',
  problem_solving: 'Resolución de problemas',
  teamwork: 'Trabajo en equipo',
  leadership: 'Liderazgo',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  interviewed: 'Entrevistado',
  pre_selected: 'Preseleccionado',
  selected: 'Seleccionado',
  onboarding: 'Onboarding',
  rejected: 'Rechazado',
  no_show: 'No se presentó',
}

export const consultarCandidatoTool: AiToolDefinition = {
  name: 'consultar_candidato',
  description: 'Obtené el perfil completo de un candidato: datos personales, evaluaciones por categoría y tecnologías. Buscá por ID exacto o por nombre/email.',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID exacto del candidato (UUID)',
      },
      q: {
        type: 'string',
        description: 'Búsqueda parcial por nombre o email (si no tenés el ID exacto)',
      },
    },
  },
  execute: async (params) => {
    const id = params.id as string | undefined
    const query = (params.q as string ?? '').trim()

    if (!id && !query) {
      return 'Error: proporcioná un `id` (UUID) o un `q` (nombre/email) para buscar.'
    }

    let candidate: Record<string, unknown> | undefined

    if (id) {
      candidate = await db.candidates.get(id) as Record<string, unknown> | undefined
    } else {
      const term = n(query)
      const all = await db.candidates.toArray()
      candidate = all.find((c) => {
        const haystack = n([c.name, c.email, c.position].filter(Boolean).join(' '))
        return haystack.includes(term)
      }) as Record<string, unknown> | undefined
    }

    if (!candidate) {
      const searchTerm = id ? `ID "${id}"` : `"${query}"`
      return `No se encontró un candidato con ${searchTerm}. Usá \`buscar_candidato\` para encontrar el ID correcto.`
    }

    const candidateId = candidate.id as string
    const output: string[] = []

    const statusLabel = STATUS_LABELS[candidate.status as string] ?? candidate.status
    const interviewDate = candidate.interviewDate
      ? new Date(candidate.interviewDate as string).toLocaleDateString('es-ES', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : 'Pendiente'

    output.push(`📋 **${candidate.name}**`)
    output.push(`**Posición:** ${candidate.position}`)
    output.push(`**Estado:** ${statusLabel}${candidate.totalScore != null ? ` · Puntaje total: ${candidate.totalScore}` : ''}`)
    output.push(`**Email:** ${candidate.email ?? '—'}`)
    output.push(`**Teléfono:** ${candidate.phone ?? '—'}`)
    output.push(`**Entrevista:** ${interviewDate}`)
    if (candidate.comments) output.push(`**Comentarios:** ${candidate.comments}`)
    output.push('')

    try {
      const techs = await db.candidateTechnologies
        .where('candidateId')
        .equals(candidateId)
        .toArray()

      if (techs.length > 0) {
        output.push(`**Tecnologías** (${techs.length}):`)
        const sorted = techs.sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
        for (const t of sorted) {
          const bar = '█'.repeat(Math.round((t.points ?? 0) / 10)) + '░'.repeat(Math.max(0, 10 - Math.round((t.points ?? 0) / 10)))
          output.push(`  · ${t.name}: ${t.points}/100 ${bar}`)
        }
        output.push('')
      }
    } catch { /* istanbul ignore next */ }

    try {
      const evals = await db.candidateEvaluations
        .where('candidateId')
        .equals(candidateId)
        .toArray()

      if (evals.length > 0) {
        output.push(`**Evaluaciones** (${evals.length} categorías):`)
        const grouped = new Map<string, number[]>()
        for (const e of evals) {
          const existing = grouped.get(e.category) ?? []
          existing.push(e.points)
          grouped.set(e.category, existing)
        }

        const avg = (vals: number[]) => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)

        for (const [cat, pts] of grouped) {
          const label = EVAL_LABELS[cat] ?? cat
          const promedio = avg(pts)
          const bar = '█'.repeat(Math.round(promedio / 10)) + '░'.repeat(Math.max(0, 10 - Math.round(promedio / 10)))
          output.push(`  · ${label}: ${promedio}/100 ${bar}`)
        }
        output.push('')
      }
    } catch { /* istanbul ignore next */ }

    output.push(`💡 Usá \`buscar_candidato({ q: "${(candidate.name as string).split(' ')[0]}" })\` para buscar otros candidatos.`)

    return output.join('\n')
  },
}
