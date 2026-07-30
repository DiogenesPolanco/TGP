import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Plus, ExternalLink, Unlink } from 'lucide-react'
import { db } from '@/services/db/database'
import type { Vulnerability } from '@/types/domain'
import { SortableTable, type Column } from '@/components/ui/SortableTable'

const severityClass = (sev: string): string => {
  const colors: Record<string, string> = {
    critical: 'bg-danger/10 text-danger',
    high: 'bg-warning/10 text-warning',
    medium: 'bg-info/10 text-info',
    low: 'bg-success/10 text-success',
    info: 'bg-neutral-10 text-neutral-60',
  }
  return colors[sev] || 'bg-neutral-10 text-neutral-60'
}

function severityBadge(sev: string) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${severityClass(sev)}`}>
      {sev}
    </span>
  )
}

const statusLabel: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En Progreso',
  fixed: 'Corregida',
  accepted: 'Aceptada',
}

function getSlaStatus(vuln: Vulnerability) {
  const days = Math.ceil(
    (new Date(vuln.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  if (days < 0) return { label: 'Vencido', color: 'text-danger' }
  if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
  return { label: `${days}d`, color: 'text-success' }
}

export function VulnerabilitiesTab({
  vulnerabilities,
  applicationId,
}: {
  vulnerabilities: Vulnerability[]
  applicationId: string
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const allVulns = useLiveQuery(() => db.vulnerabilities.toArray(), []) ?? []

  const activeVulns = useMemo(
    () => vulnerabilities.filter((v) => v.status !== 'fixed'),
    [vulnerabilities],
  )

  const dissociate = async (vuln: Vulnerability) => {
    if (vuln.applicationId !== applicationId) return
    await db.vulnerabilities.update(vuln.id, { applicationId: null })
  }

  const associate = async (vuln: Vulnerability) => {
    await db.vulnerabilities.update(vuln.id, { applicationId })
    setSearch('')
    setShowDropdown(false)
  }

  const alreadyAssociatedIds = new Set(vulnerabilities.map((v) => v.id))
  const availableVulns = allVulns.filter(
    (v) =>
      !alreadyAssociatedIds.has(v.id) &&
      (!search || v.title.toLowerCase().includes(search.toLowerCase())),
  )

  const vulnColumns: Column<Vulnerability>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (v) => (
        <div>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{v.title}</p>
          <p className="text-xs text-neutral-50">{v.externalId}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (v) => severityBadge(v.severity),
    },
    {
      key: 'cvssScore',
      label: 'CVSS',
      sortable: true,
      render: (v) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{v.cvssScore}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (v) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            v.status === 'in_progress'
              ? 'bg-info/10 text-info'
              : v.status === 'accepted'
                ? 'bg-neutral-10 text-neutral-60'
                : 'bg-danger/10 text-danger'
          }`}
        >
          {statusLabel[v.status]}
        </span>
      ),
    },
    {
      key: 'slaDeadline',
      label: 'SLA',
      sortable: true,
      render: (v) => {
        const sla = getSlaStatus(v)
        return <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/security/vulnerabilities/${v.id}`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver vulnerabilidad"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              dissociate(v)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Desasociar"
          >
            <Unlink size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Vulnerabilidades
          {vulnerabilities.length > activeVulns.length && (
            <span className="ml-2 text-sm font-normal text-neutral-50">
              ({activeVulns.length} activas, {vulnerabilities.length - activeVulns.length} corregidas ocultas)
            </span>
          )}
        </h4>
      </div>

      {activeVulns.length === 0 ? (
        <p className="text-sm text-neutral-50 dark:text-neutral-50 mb-4">
          No hay vulnerabilidades activas asociadas
          {vulnerabilities.length > 0 && (
            <> — {vulnerabilities.length} corregidas fueron filtradas</>
          )}
        </p>
      ) : (
        <div className="mb-4">
          <SortableTable
            columns={vulnColumns}
            data={activeVulns}
            pageSize={10}
            onRowClick={(v) => navigate(`/security/vulnerabilities/${v.id}`)}
          />
        </div>
      )}

      {/* Asociar vulnerabilidad */}
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder="Buscar vulnerabilidades para asociar..."
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowDropdown(true)
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-card border border-boundary rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {availableVulns.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {search ? 'Sin resultados' : 'No hay más vulnerabilidades disponibles'}
              </p>
            ) : (
              availableVulns.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => associate(v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Plus size={14} className="text-primary shrink-0" />
                    <span className="text-neutral-90 dark:text-white truncate">{v.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${severityClass(v.severity)}`}>
                    {v.severity}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
