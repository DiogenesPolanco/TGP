import { db } from '@/services/db/database'
import type { Severity, VulnStatus } from '@/types/domain'

/* ─── CSV parsing ─── */

export interface FluidAttackRow {
  rowIndex: number
  raw: Record<string, string>
  location: string
  locationSegments: string[]
}

export interface FluidAttackMatch {
  row: FluidAttackRow
  applicationId: string | null
  applicationName: string
  microserviceId: string | null
  microserviceName: string
  matchedBy: string
}

export interface FluidAttackImportResult {
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  createdVulns: number
  errors: { row: number; message: string }[]
  matches: FluidAttackMatch[]
}

/* ─── Helpers ─── */

const SEVERITY_MAP: Record<string, Severity> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  info: 'info',
}

function mapSeverity(val: string | undefined): Severity {
  if (!val) return 'medium'
  return SEVERITY_MAP[val.trim().toLowerCase()] ?? 'medium'
}

const STATUS_MAP: Record<string, VulnStatus> = {
  // Inglés — FluidAttack
  open: 'open',
  'in progress': 'in_progress',
  mitigate: 'in_progress',
  'accept risk': 'accepted',
  'under review': 'in_progress',
  patch: 'in_progress',
  fixed: 'fixed',
  closed: 'fixed',
  resolved: 'fixed',
  done: 'fixed',
  // Español — variantes comunes
  abierto: 'open',
  abierta: 'open',
  'en progreso': 'in_progress',
  'en curso': 'in_progress',
  cerrado: 'fixed',
  cerrada: 'fixed',
  solucionado: 'fixed',
  solucionada: 'fixed',
  resuelto: 'fixed',
  resuelta: 'fixed',
  mitigado: 'in_progress',
  mitigada: 'in_progress',
  aceptado: 'accepted',
  aceptada: 'accepted',
  pendiente: 'open',
  parcheado: 'in_progress',
  parcheada: 'in_progress',
  'bajo revisión': 'in_progress',
}

function mapStatus(val: string | undefined): VulnStatus {
  if (!val) return 'open'
  return STATUS_MAP[val.trim().toLowerCase()] ?? 'open'
}

function severityToScore(severity: Severity): number {
  switch (severity) {
    case 'critical':
      return 9.0
    case 'high':
      return 7.5
    case 'medium':
      return 5.5
    case 'low':
      return 3.0
    case 'info':
      return 0
  }
}

function parseDate(str: string | undefined): Date {
  if (!str) return new Date()
  const d = new Date(str.trim())
  return isNaN(d.getTime()) ? new Date() : d
}

function normalizeLocation(location: string): string[] {
  return location
    .replace(/\\/g, '/')
    .split('/')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function calcSla(severity: Severity, detectedAt: Date): Date {
  const days = severity === 'critical' || severity === 'high' ? 30 : 90
  const sla = new Date(detectedAt)
  sla.setDate(sla.getDate() + days)
  return sla
}

/* ─── CSV parser ─── */

export function parseFluidAttackCSV(content: string): FluidAttackRow[] {
  const lines = content.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2)
    throw new Error('El archivo debe tener un header y al menos una fila de datos.')

  const headerLine = lines[0]
  const separator = headerLine.includes(';') ? ';' : ','

  function parseLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === separator && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseLine(lines[0]).map((h) => h.trim())

  function norm(key: string): string {
    return key
      .toLowerCase()
      .replace(/[\s_.-]+/g, '_')
      .replace(/^_|_$/g, '')
  }

  function getValue(row: Record<string, string>, normalizedKey: string): string | undefined {
    return row[norm(normalizedKey)]
  }

  const rows: FluidAttackRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length && j < fields.length; j++) {
      row[norm(headers[j])] = fields[j]
    }

    const location = getValue(row, 'location') ?? ''
    const locationSegments = normalizeLocation(location)

    rows.push({
      rowIndex: i + 1,
      raw: row,
      location,
      locationSegments,
    })
  }

  return rows
}

/* ─── Location → Microservice matching ─── */

export async function matchLocations(rows: FluidAttackRow[]): Promise<FluidAttackMatch[]> {
  const allMicroservices = await db.microservices.toArray()
  const allApplications = await db.applications.toArray()
  const appMap = new Map(allApplications.map((a) => [a.id, a.name]))

  const msIndex = new Map<string, { msId: string; appId: string; msName: string }[]>()
  for (const ms of allMicroservices) {
    const normalized = ms.name.toLowerCase().trim()
    const entry = { msId: ms.id, appId: ms.applicationId, msName: ms.name }
    if (!msIndex.has(normalized)) msIndex.set(normalized, [])
    msIndex.get(normalized)!.push(entry)
  }

  const matches: FluidAttackMatch[] = []

  for (const row of rows) {
    let bestMatch: {
      appId: string
      appName: string
      msId: string
      msName: string
      matchedBy: string
    } | null = null

    for (const segment of row.locationSegments) {
      if (segment.length < 2) continue

      const exact = msIndex.get(segment)
      if (exact && exact.length > 0) {
        const ms = exact[0]
        bestMatch = {
          appId: ms.appId,
          appName: appMap.get(ms.appId) ?? ms.msName,
          msId: ms.msId,
          msName: ms.msName,
          matchedBy: `exact: ${segment} = ${ms.msName}`,
        }
        break
      }

      for (const [msName, entries] of msIndex) {
        if (segment.includes(msName) || msName.includes(segment)) {
          const ms = entries[0]
          bestMatch = {
            appId: ms.appId,
            appName: appMap.get(ms.appId) ?? ms.msName,
            msId: ms.msId,
            msName: ms.msName,
            matchedBy: `partial: ${segment} ~ ${ms.msName}`,
          }
          break
        }
      }
      if (bestMatch) break
    }

    if (!bestMatch) {
      for (const segment of row.locationSegments) {
        for (const app of allApplications) {
          const appNameLower = app.name.toLowerCase().trim()
          if (
            segment === appNameLower ||
            appNameLower.includes(segment) ||
            segment.includes(appNameLower)
          ) {
            bestMatch = {
              appId: app.id,
              appName: app.name,
              msId: '',
              msName: '',
              matchedBy: `app: ${segment} ~ ${app.name}`,
            }
            break
          }
        }
        if (bestMatch) break
      }
    }

    /* ─── 3er fallback: Root Nickname ─── */
    if (!bestMatch) {
      const nickname = (row.raw['root_nickname'] ?? '').trim().toLowerCase()
      if (nickname.length >= 2) {
        const exact = msIndex.get(nickname)
        if (exact && exact.length > 0) {
          const ms = exact[0]
          bestMatch = {
            appId: ms.appId,
            appName: appMap.get(ms.appId) ?? ms.msName,
            msId: ms.msId,
            msName: ms.msName,
            matchedBy: `root_nickname exact: ${nickname} = ${ms.msName}`,
          }
        } else {
          for (const [msName, entries] of msIndex) {
            if (nickname.includes(msName) || msName.includes(nickname)) {
              const ms = entries[0]
              bestMatch = {
                appId: ms.appId,
                appName: appMap.get(ms.appId) ?? ms.msName,
                msId: ms.msId,
                msName: ms.msName,
                matchedBy: `root_nickname partial: ${nickname} ~ ${ms.msName}`,
              }
              break
            }
          }
        }
        if (!bestMatch) {
          for (const app of allApplications) {
            const appNameLower = app.name.toLowerCase().trim()
            if (
              nickname === appNameLower ||
              appNameLower.includes(nickname) ||
              nickname.includes(appNameLower)
            ) {
              bestMatch = {
                appId: app.id,
                appName: app.name,
                msId: '',
                msName: '',
                matchedBy: `root_nickname app: ${nickname} ~ ${app.name}`,
              }
              break
            }
          }
        }
      }
    }

    matches.push({
      row,
      applicationId: bestMatch?.appId ?? null,
      applicationName: bestMatch?.appName ?? '(sin match)',
      microserviceId: bestMatch?.msId ?? null,
      microserviceName: bestMatch?.msName ?? '',
      matchedBy: bestMatch?.matchedBy ?? 'none',
    })
  }

  return matches
}

/* ─── Vulnerability creation ─── */

export async function importFluidAttackVulnerabilities(
  matches: FluidAttackMatch[],
): Promise<FluidAttackImportResult> {
  let createdVulns = 0
  const errors: { row: number; message: string }[] = []

  for (const match of matches) {
    if (!match.applicationId) continue

    const r = match.row.raw
    const vulnId = r['vulnerability_id'] ?? ''
    const weakness = r['weakness'] ?? ''
    const description = r['description'] ?? ''
    const severityRaw = r['severity_level'] ?? r['severity'] ?? ''
    const statusRaw = r['status'] ?? ''
    const reportDate = r['report_date'] ?? ''
    const closingDate = r['closing_date'] ?? ''
    const cvssVector = r['cvssv4_0_vector_string'] ?? ''
    const cve = r['cve'] ?? ''
    const recommendation = r['recommendation'] ?? ''
    const pkg = r['package'] ?? ''
    const vulnVersion = r['vulnerable_version'] ?? ''
    const cweIds = r['cwe_ids'] ?? ''
    const technique = r['technique'] ?? ''
    const rootNickname = r['root_nickname'] ?? ''

    try {
      const severity = mapSeverity(severityRaw)
      const status = mapStatus(statusRaw)
      const detectedAt = parseDate(reportDate)
      const fixedAt = closingDate ? parseDate(closingDate) : null
      const slaDeadline = calcSla(severity, detectedAt)

      const existing = await db.vulnerabilities.where('externalId').equals(vulnId).first()

      const now = new Date()
      const vuln = {
        id: existing?.id ?? crypto.randomUUID(),
        applicationId: match.applicationId,
        externalId: vulnId,
        title: weakness,
        description:
          description ||
          `Vulnerabilidad encontrada por FluidAttack en ${match.matchedBy}.${recommendation ? `\n\nRecomendación: ${recommendation}` : ''}`,
        cvssScore: severityToScore(severity),
        severity,
        source: 'fluid_attacks' as const,
        status,
        slaDeadline,
        detectedAt,
        fixedAt,
        metadata: {
          cvssVector,
          cve,
          recommendation,
          package: pkg,
          vulnerableVersion: vulnVersion,
          cweIds: cweIds || undefined,
          technique,
          rootNickname,
          fluidAttackLocation: match.row.location,
          matchedBy: match.matchedBy,
          microserviceName: match.microserviceName || undefined,
          applicationName: match.applicationName,
        },
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      if (existing) {
        await db.vulnerabilities.put(vuln)
      } else {
        await db.vulnerabilities.add(vuln)
      }
      createdVulns++
    } catch (err) {
      errors.push({
        row: match.row.rowIndex,
        message: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const matchedRows = matches.filter((m) => m.applicationId).length
  const unmatchedRows = matches.filter((m) => !m.applicationId).length

  return {
    totalRows: matches.length,
    matchedRows,
    unmatchedRows,
    createdVulns,
    errors,
    matches,
  }
}
