import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

function n(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export const consultarDependenciasTool: AiToolDefinition = {
  name: 'consultar_dependencias',
  description: 'Analizá las dependencias de una aplicación: qué aplicaciones consume y cuáles dependen de ella. Incluye estado de soporte de tecnologías y alertas de obsolescencia.',
  parameters: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID exacto de la aplicación (UUID)',
      },
      q: {
        type: 'string',
        description: 'Búsqueda parcial por nombre de aplicación (si no tenés el ID exacto)',
      },
    },
  },
  execute: async (params) => {
    const id = params.id as string | undefined
    const query = (params.q as string ?? '').trim()

    if (!id && !query) {
      return 'Error: proporcioná un `id` (UUID) o un `q` (nombre) para buscar la aplicación.'
    }

    let app: Record<string, unknown> | undefined
    if (id) {
      app = await db.applications.get(id) as Record<string, unknown> | undefined
    } else {
      const term = n(query)
      const all = await db.applications.toArray()
      app = all.find((a) => n(a.name).includes(term)) as Record<string, unknown> | undefined
    }

    if (!app) {
      const searchTerm = id ? `ID "${id}"` : `"${query}"`
      return `No se encontró una aplicación con ${searchTerm}. Usá \`buscar_aplicacion\` para encontrar el ID correcto.`
    }

    const appId = app.id as string
    const appName = app.name as string
    const output: string[] = []

    output.push(`🔗 **${appName}**`)
    output.push(`**Arquitectura:** ${app.architecture ?? '—'} · **Criticidad:** ${app.criticality ?? '—'} · **Estado:** ${app.status ?? '—'}`)
    output.push('')

    const techNames: string[] = (app.technologies as string[]) ?? []
    if (techNames.length > 0) {
      try {
        const allTechs = await db.technologies.toArray()
        const matched = allTechs.filter((t) => techNames.includes(t.name) || techNames.includes(t.id))

        const expired: string[] = []
        const expiring: string[] = []
        const healthy: string[] = []

        for (const t of matched) {
          const label = `${t.name} ${t.version}`
          if (t.supportStatus === 'eol' || (t.eolDate && new Date(t.eolDate) < new Date())) {
            expired.push(`    ⛔ ${label} — EOL: ${t.eolDate ? new Date(t.eolDate).toLocaleDateString('es-ES') : 'vencida'}${t.cveList.length ? ` · ${t.cveList.length} CVE` : ''}`)
          } else if (t.supportStatus === 'extended' || (t.eolDate && new Date(t.eolDate) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))) {
            expiring.push(`    ⚠️  ${label} — soporte: ${t.supportStatus}${t.eolDate ? `, EOL: ${new Date(t.eolDate).toLocaleDateString('es-ES')}` : ''}`)
          } else {
            healthy.push(`    ✅ ${label} — ${t.supportStatus ?? 'soporte activo'}`)
          }
        }

        if (expired.length > 0 || expiring.length > 0 || healthy.length > 0) {
          output.push(`**Stack tecnológico** (${matched.length} tecnologías):`)
          if (expired.length > 0) output.push(...expired)
          if (expiring.length > 0) output.push(...expiring)
          if (healthy.length > 0) output.push(...healthy)
          output.push('')
        }
      } catch { /* istanbul ignore next */ }
    }

    try {
      const depsOut = await db.applicationDependencies
        .where('applicationId')
        .equals(appId)
        .toArray()

      if (depsOut.length > 0) {
        const targetIds = [...new Set(depsOut.map((d) => d.dependsOnAppId))]
        const targetApps = await db.applications
          .where('id')
          .anyOf(targetIds)
          .toArray()
        const targetMap = new Map(targetApps.map((a) => [a.id, a.name]))

        output.push(`**Consume** (depende de ${depsOut.length} aplicación(es)):`)
        for (const d of depsOut) {
          const targetName = targetMap.get(d.dependsOnAppId) ?? d.dependsOnAppId
          const crit = d.criticality ? ` · ${d.criticality}` : ''
          output.push(`  → **${targetName}**${crit}`)
        }
        output.push('')
      }
    } catch { /* istanbul ignore next */ }

    try {
      const depsIn = await db.applicationDependencies
        .where('dependsOnAppId')
        .equals(appId)
        .toArray()

      if (depsIn.length > 0) {
        const sourceIds = [...new Set(depsIn.map((d) => d.applicationId))]
        const sourceApps = await db.applications
          .where('id')
          .anyOf(sourceIds)
          .toArray()
        const sourceMap = new Map(sourceApps.map((a) => [a.id, a.name]))

        output.push(`**Dependientes** (${depsIn.length} aplicación(es) la consumen):`)
        for (const d of depsIn) {
          const sourceName = sourceMap.get(d.applicationId) ?? d.applicationId
          const crit = d.criticality ? ` · ${d.criticality}` : ''
          output.push(`  ← **${sourceName}**${crit}`)
        }
        output.push('')
      }
    } catch { /* istanbul ignore next */ }

    if (output.length > 2) {
      output.push(`💡 Usá \`consultar_relaciones({ tabla: "applications", id: "${appId}" })\` para ver todos los datos vinculados.`)
    }

    return output.join('\n')
  },
}
