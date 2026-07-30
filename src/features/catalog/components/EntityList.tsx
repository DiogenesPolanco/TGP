import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Table } from 'dexie'
import { Search, Plus, Unlink } from 'lucide-react'
import { db } from '@/services/db/database'
import type { Vulnerability, Risk, Incident, AuditFinding } from '@/types/domain'
import { SortableTable, type Column } from '@/components/ui/SortableTable'

type EntityForList = Vulnerability | Risk | Incident | AuditFinding

const severityColorClass = (sev: string): string => {
  const colors: Record<string, string> = {
    critical: 'bg-danger/10 text-danger',
    high: 'bg-warning/10 text-warning',
    medium: 'bg-info/10 text-info',
    low: 'bg-success/10 text-success',
  }
  return colors[sev] || 'bg-neutral-10 text-neutral-60'
}

export function EntityList<T extends EntityForList>({
  title,
  entityType,
  items,
  applicationId,
  headers,
  renderCells,
  severityColor,
}: {
  title: string
  entityType: 'vulnerabilities' | 'risks' | 'incidents' | 'auditFindings'
  items: T[]
  applicationId: string
  headers: string[]
  renderCells: (item: T) => string[]
  severityColor: (item: T) => string | null
}) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const allItemsOfType =
    useLiveQuery(() => (db[entityType] as Table<Record<string, unknown>, string>).toArray(), [entityType]) ?? []

  const dissociate = async (item: T) => {
    const appId = (item as Record<string, unknown>).applicationId
    if (typeof appId !== 'string' || appId !== applicationId) return
    await (db[entityType] as Table<Record<string, unknown>, string>).update(item.id as string, { applicationId: null })
  }

  const associate = async (item: T) => {
    await (db[entityType] as Table<Record<string, unknown>, string>).update(item.id as string, { applicationId } as Record<string, unknown>)
    setSearch('')
    setShowDropdown(false)
  }

  const alreadyAssociatedIds = new Set(items.map((i) => i.id))
  const availableItems = allItemsOfType.filter(
    (item) =>
      !alreadyAssociatedIds.has(item.id) &&
      (!search || (renderCells(item as unknown as T)[0] ?? '').toLowerCase().includes(search.toLowerCase())),
  ) as unknown as T[]

  const columns: Column<T>[] = useMemo(() => {
    const cols: Column<T>[] = headers.map((header, idx) => ({
      key: `col-${idx}`,
      label: header,
      sortable: true,
      render: (item: T) => {
        const cells = renderCells(item)
        const cell = cells[idx] ?? ''
        const sev = severityColor(item)
        if (idx === 1 && sev) {
          return (
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${severityColorClass(sev)}`}>
              {cell}
            </span>
          )
        }
        return <span className="text-sm text-secondary">{cell}</span>
      },
    }))
    cols.push({
      key: 'actions',
      label: 'Acción',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item: T) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            dissociate(item)
          }}
          className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 transition-all"
          title="Desasociar"
        >
          <Unlink size={14} />
        </button>
      ),
    })
    return cols
  }, [headers, renderCells, severityColor])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">{title}</h4>
      </div>

      <div className="mb-4">
        <SortableTable
          columns={columns}
          data={items}
          pageSize={10}
          emptyMessage={`No hay ${title.toLowerCase()} asociados`}
        />
      </div>

      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
          <input
            type="text"
            placeholder={`Buscar ${title.toLowerCase()} para asociar...`}
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
            {availableItems.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-50">
                {search ? 'Sin resultados' : 'No hay más elementos disponibles'}
              </p>
            ) : (
              availableItems.map((item) => {
                const cells = renderCells(item)
                const sev = severityColor(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => associate(item)}
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
      </div>
    </div>
  )
}
