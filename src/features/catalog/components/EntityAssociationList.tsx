import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { associateToMicroservice, dissociateFromMicroservice } from '@/hooks/useMicroserviceEntities'
import { Search, Plus, Unlink } from 'lucide-react'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import type { Vulnerability, Risk, Incident, AuditFinding } from '@/types/domain'
import type { Table } from 'dexie'

type EntityRecord = Vulnerability | Risk | Incident | AuditFinding

export type EntityType = 'vulns' | 'incidents' | 'risks' | 'audit'

interface Props {
  entityType: EntityType
  microserviceId: string
}

const ENTITY_CONFIG: Record<EntityType, {
  junctionTable: 'vulnerabilityMicroservices' | 'incidentMicroservices' | 'auditFindingMicroservices' | 'riskMicroservices'
  entityTable: 'vulnerabilities' | 'incidents' | 'auditFindings' | 'risks'
  entityIdKey: 'vulnerabilityId' | 'incidentId' | 'auditFindingId' | 'riskId'
  headers: string[]
  renderCells: (item: EntityRecord) => string[]
}> = {
  vulns: {
    junctionTable: 'vulnerabilityMicroservices', entityTable: 'vulnerabilities', entityIdKey: 'vulnerabilityId',
    headers: ['Título', 'Severidad', 'CVSS', 'Estado'],
    renderCells: (item) => {
      const v = item as Vulnerability
      return [v.title, v.severity, v.cvssScore.toString(), v.status]
    },
  },
  incidents: {
    junctionTable: 'incidentMicroservices', entityTable: 'incidents', entityIdKey: 'incidentId',
    headers: ['Título', 'Severidad', 'Estado', 'Downtime'],
    renderCells: (item) => {
      const i = item as Incident
      return [i.title, i.severity, i.status, `${i.downtimeMinutes ?? 0} min`]
    },
  },
  risks: {
    junctionTable: 'riskMicroservices', entityTable: 'risks', entityIdKey: 'riskId',
    headers: ['Título', 'Categoría', 'Score', 'Estado'],
    renderCells: (item) => {
      const r = item as Risk
      return [r.title, r.category, r.riskScore.toString(), r.status]
    },
  },
  audit: {
    junctionTable: 'auditFindingMicroservices', entityTable: 'auditFindings', entityIdKey: 'auditFindingId',
    headers: ['Título', 'Severidad', 'Estado', 'Vencimiento'],
    renderCells: (item) => {
      const f = item as AuditFinding
      return [f.title, f.severity, f.status, new Date(f.dueDate).toLocaleDateString('es-ES')]
    },
  },
}

const ENTITY_LABELS: Record<EntityType, string> = {
  vulns: 'vulnerabilidad',
  incidents: 'incidente',
  risks: 'riesgo',
  audit: 'hallazgo',
}

function severityColorClass(sev: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-danger/10 text-danger',
    high: 'bg-warning/10 text-warning',
    medium: 'bg-info/10 text-info',
    low: 'bg-success/10 text-success',
  }
  return colors[sev] || 'bg-neutral-10 text-neutral-60'
}

function getSeverity(item: EntityRecord): string | null {
  return 'severity' in item ? (item as Vulnerability | Incident | AuditFinding).severity : null
}

export function EntityAssociationList({ entityType, microserviceId }: Props) {
  const config = ENTITY_CONFIG[entityType]
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const junctionTable = db[config.junctionTable] as unknown as Table<{ id: string; microserviceId: string; [key: string]: string }, string>
  const junctionRecords = useLiveQuery(
    () => junctionTable.where('microserviceId').equals(microserviceId).toArray(),
    [microserviceId],
  ) ?? []

  const associatedIds = useMemo(
    () => new Set(junctionRecords.map((r) => r[config.entityIdKey] as string)),
    [junctionRecords, config.entityIdKey],
  )

  const entityTable = db[config.entityTable] as unknown as Table<EntityRecord, string>

  const associatedEntities = useLiveQuery(
    () => associatedIds.size > 0
      ? entityTable.where('id').anyOf([...associatedIds]).toArray()
          .then((items) => items.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')))
      : Promise.resolve([] as EntityRecord[]),
    [associatedIds.size],
  ) ?? []

  const allEntities = useLiveQuery(
    () => entityTable.toArray(),
    [],
  ) ?? []

  const availableEntities = useMemo(
    () => allEntities
      .filter((e) => !associatedIds.has(e.id))
      .filter((e) => !searchText || (e.title ?? '').toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')),
    [allEntities, associatedIds, searchText],
  )

  const handleAssociate = async (entityId: string) => {
    await associateToMicroservice(config.junctionTable, config.entityIdKey, entityId, microserviceId)
    setSearchText('')
    setShowSearch(false)
  }

  const handleDissociate = async (entityId: string) => {
    await dissociateFromMicroservice(config.junctionTable, config.entityIdKey, entityId, microserviceId)
  }

  const columns: Column<EntityRecord>[] = useMemo(() => {
    const cols: Column<EntityRecord>[] = config.headers.map((header, idx) => ({
      key: `col-${idx}`,
      label: header,
      sortable: true,
      render: (item: EntityRecord) => {
        const cells = config.renderCells(item)
        const cell = cells[idx] ?? ''
        const sev = getSeverity(item)
        if (idx === 1 && sev) {
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${severityColorClass(sev)}`}>
              {cell}
            </span>
          )
        }
        return <span className="text-sm text-neutral-70 dark:text-neutral-30">{cell}</span>
      },
    }))
    cols.push({
      key: 'actions',
      label: 'Acción',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item: EntityRecord) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDissociate(item.id) }}
          className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 transition-all"
          title="Desasociar"
        >
          <Unlink size={14} />
        </button>
      ),
    })
    return cols
  }, [config.headers, config.renderCells])

  return (
    <div className="space-y-4">
      {associatedEntities.length > 0 ? (
        <SortableTable
          columns={columns}
          data={associatedEntities}
          pageSize={10}
          emptyMessage=""
        />
      ) : (
        <p className="text-sm text-neutral-50">Sin entidades asociadas en esta categoría.</p>
      )}

      <div className="relative">
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
          >
            <Plus size={14} />
            Asociar {ENTITY_LABELS[entityType]}
          </button>
        ) : (
          <div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
              <input
                type="text"
                placeholder={`Buscar ${ENTITY_LABELS[entityType]} para asociar...`}
                value={searchText}
                autoFocus
                onFocus={() => setShowSearch(true)}
                onChange={(e) => { setSearchText(e.target.value); setShowSearch(true) }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {showSearch && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableEntities.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {searchText ? 'Sin resultados' : 'No hay más elementos disponibles'}
                  </p>
                ) : (
                  availableEntities.map((entity) => {
                    const cells = config.renderCells(entity)
                    const sev = getSeverity(entity)
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => handleAssociate(entity.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={14} className="text-primary shrink-0" />
                          <span className="text-neutral-90 dark:text-white truncate">{cells[0]}</span>
                        </div>
                        {sev && (
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${severityColorClass(sev)}`}>
                            {cells[1]}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}

            <button
              onClick={() => { setShowSearch(false); setSearchText('') }}
              className="mt-1 text-xs text-neutral-50 hover:text-neutral-70 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
