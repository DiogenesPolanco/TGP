import { db } from '@/services/db/database'
import { type AiToolDefinition } from '../types'

const NOW = new Date()
const IN_6M = new Date(NOW.getTime() + 180 * 24 * 60 * 60 * 1000)

const SUPPORT_ORDER: Record<string, number> = {
  active: 0,
  extended: 1,
  eol: 3,
  unknown: 2,
}

export const consultarObsolescenciaTool: AiToolDefinition = {
  name: 'consultar_obsolescencia',
  description:
    'Reporte de obsolescencia tecnológica. Mostrá tecnologías con soporte vencido o próximo a vencer, filtrado por categoría, vendor o estado de soporte. Sin filtros devuelve el panorama general ordenado por criticidad.',
  parameters: {
    type: 'object',
    properties: {
      categoria: {
        type: 'string',
        description:
          'Filtrar por categoría: lenguaje, framework, database, tool, platform, runtime, os, library, middleware',
      },
      vendor: {
        type: 'string',
        description: 'Filtrar por vendor (ej: "Microsoft", "Oracle", "Apache")',
      },
      estado: {
        type: 'string',
        enum: ['eol', 'extended', 'active', 'unknown'],
        description: 'Filtrar por estado de soporte específico',
      },
      soloCriticas: {
        type: ['boolean', 'string', 'number'],
        description: 'Solo tecnologías EOL (true)',
      },
      limit: { type: 'number', description: 'Máximo de resultados (default 50)' },
    },
  },
  execute: async (params) => {
    const categoria = params.categoria as string | undefined
    const vendor = params.vendor as string | undefined
    const estado = params.estado as string | undefined
    const soloCriticas =
      typeof params.soloCriticas === 'boolean'
        ? params.soloCriticas
        : params.soloCriticas === 'true' || params.soloCriticas === '1'
    const limit = Math.min(Math.max(1, (params.limit as number) ?? 50), 200)

    let techs = await db.technologies.toArray()

    if (categoria) techs = techs.filter((t) => t.category === categoria)
    if (vendor) techs = techs.filter((t) => n(t.vendor).includes(n(vendor)))
    if (estado) techs = techs.filter((t) => t.supportStatus === estado)

    const expired = techs.filter(
      (t) => t.supportStatus === 'eol' || (t.eolDate && new Date(t.eolDate) < NOW),
    )
    const expiring = techs.filter(
      (t) =>
        !expired.includes(t) &&
        (t.supportStatus === 'extended' ||
          (t.eolDate && new Date(t.eolDate) >= NOW && new Date(t.eolDate) <= IN_6M)),
    )
    const healthy = techs.filter((t) => !expired.includes(t) && !expiring.includes(t))

    const sortedExpired = expired.sort((a, b) => {
      const orderA = SUPPORT_ORDER[a.supportStatus] ?? 99
      const orderB = SUPPORT_ORDER[b.supportStatus] ?? 99
      if (orderA !== orderB) return orderB - orderA
      if (a.eolDate && b.eolDate)
        return new Date(a.eolDate).getTime() - new Date(b.eolDate).getTime()
      return 0
    })

    const showExpired = soloCriticas ? [] : sortedExpired
    const showExpiring = soloCriticas ? sortedExpired : expiring
    const display = [...showExpiring, ...showExpired].slice(0, limit)
    const output: string[] = []

    if (!categoria && !vendor && !estado && !soloCriticas) {
      output.push(`📊 **Panorama de obsolescencia tecnológica**`)
      output.push(`**Total tecnologías:** ${techs.length}`)
      output.push(`**⛔ Vencidas (EOL/Obsoletas):** ${expired.length}`)
      output.push(`**⚠️  Por vencer (≤6 meses):** ${expiring.length}`)
      output.push(`**✅ Saludables:** ${healthy.length}`)
      output.push('')
    }

    if (display.length === 0) {
      if (soloCriticas) {
        return '🎉 No se encontraron tecnologías críticas (EOL u obsoletas).'
      }
      return 'No se encontraron tecnologías con los filtros indicados.'
    }

    if (display.length > 0) {
      const title = soloCriticas
        ? '**Tecnologías críticas (EOL/Obsoletas):**'
        : expiring.length > 0 && expired.length > 0
          ? '**Tecnologías por estado de soporte:**'
          : '**Tecnologías:**'
      output.push(title)

      for (const t of display) {
        const cves = t.cveList.length ? ` · ${t.cveList.length} CVE` : ''
        const eol = t.eolDate ? ` · EOL: ${new Date(t.eolDate).toLocaleDateString('es-ES')}` : ''
        const icon =
          t.supportStatus === 'eol'
            ? '⛔'
            : t.supportStatus === 'extended'
              ? '⚡'
              : t.supportStatus === 'unknown'
                ? '❓'
                : '✅'
        output.push(
          `  ${icon} **${t.name}** ${t.version} · ${t.vendor} · ${t.supportStatus}${eol}${cves}`,
        )
      }
      output.push('')
    }

    if (!soloCriticas && expired.length > 0) {
      output.push(
        `💡 Usá \`consultar_obsolescencia({ soloCriticas: true })\` para ver solo las tecnologías críticas.`,
      )
    }
    output.push(
      `💡 Usá \`consultar_dependencias({ q: "..." })\` para ver qué aplicaciones usan una tecnología específica.`,
    )

    return output.join('\n')
  },
}

function n(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
