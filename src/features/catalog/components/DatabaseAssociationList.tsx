import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { associateToMicroservice, dissociateFromMicroservice } from '@/hooks/useMicroserviceEntities'
import { Search, Plus, Unlink, Database, ExternalLink, Pencil } from 'lucide-react'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import type { AppDatabase } from '@/types/domain'

const dbTypeLabel: Record<string, string> = {
  relational: 'Relacional',
  document: 'Documentos',
  'key-value': 'Clave-Valor',
  graph: 'Grafo',
  'time-series': 'Series de Tiempo',
  search: 'Búsqueda',
  cache: 'Caché',
  message_queue: 'Cola de Mensajes',
  vector: 'Vectorial',
  other: 'Otro',
}

const environmentLabel: Record<string, string> = {
  dev: 'DEV',
  qa: 'QA',
  staging: 'STAGING',
  prod: 'PROD',
  dr: 'DR',
  test: 'TEST',
  uat: 'UAT',
  perf: 'PERF',
}

interface Props {
  microserviceId: string
  applicationId: string
}

export function DatabaseAssociationList({ microserviceId, applicationId }: Props) {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const junctionRecords = useLiveQuery(
    () => db.appDatabaseMicroservices.where('microserviceId').equals(microserviceId).toArray(),
    [microserviceId],
  ) ?? []

  const associatedIds = useMemo(
    () => new Set(junctionRecords.map((r) => r.appDatabaseId)),
    [junctionRecords],
  )

  const associatedDatabases = useLiveQuery(
    () => associatedIds.size > 0
      ? db.appDatabases.where('id').anyOf([...associatedIds]).toArray()
          .then((items) => items.sort((a, b) => a.name.localeCompare(b.name)))
      : Promise.resolve([] as AppDatabase[]),
    [associatedIds.size],
  ) ?? []

  const allDatabases = useLiveQuery(
    () => db.appDatabases.toArray(),
    [],
  ) ?? []

  const availableDatabases = useMemo(
    () => allDatabases
      .filter((d) => !associatedIds.has(d.id))
      .filter((d) => !searchText || d.name.toLowerCase().includes(searchText.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [allDatabases, associatedIds, searchText],
  )

  const handleAssociate = async (entityId: string) => {
    await associateToMicroservice('appDatabaseMicroservices', 'appDatabaseId', entityId, microserviceId)
    setSearchText('')
    setShowSearch(false)
  }

  const handleDissociate = async (entityId: string) => {
    await dissociateFromMicroservice('appDatabaseMicroservices', 'appDatabaseId', entityId, microserviceId)
  }

  const columns: Column<AppDatabase>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (item: AppDatabase) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{item.name}</span>
      ),
    },
    {
      key: 'engine',
      label: 'Engine',
      sortable: true,
      render: (item: AppDatabase) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30 font-mono">{item.engine} {item.version}</span>
      ),
    },
    {
      key: 'dbType',
      label: 'Tipo',
      sortable: true,
      render: (item: AppDatabase) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">{dbTypeLabel[item.dbType] ?? item.dbType}</span>
      ),
    },
    {
      key: 'environment',
      label: 'Ambiente',
      sortable: true,
      render: (item: AppDatabase) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-60 text-neutral-700 dark:text-neutral-300 font-medium">
          {environmentLabel[item.environment] ?? item.environment}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acción',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item: AppDatabase) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/catalog/applications/${applicationId}/databases/${item.id}/edit?microserviceId=${microserviceId}`) }}
            className="p-1.5 rounded-md text-neutral-50 hover:text-primary hover:bg-primary/10 transition-all"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDissociate(item.id) }}
            className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 transition-all"
            title="Desasociar"
          >
            <Unlink size={14} />
          </button>
        </div>
      ),
    },
  ], [applicationId, microserviceId])

  return (
    <div className="space-y-4">
      {associatedDatabases.length > 0 ? (
        <SortableTable
          columns={columns}
          data={associatedDatabases}
          pageSize={10}
          emptyMessage=""
        />
      ) : (
        <p className="text-sm text-neutral-50">Sin bases de datos asociadas a este microservicio.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/catalog/applications/${applicationId}/databases/new?microserviceId=${microserviceId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={14} />
          Nueva Base de Datos
        </button>

        <button
          onClick={() => navigate(`/catalog/applications/${applicationId}`)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
        >
          <ExternalLink size={14} />
          Ver en aplicación
        </button>
      </div>

      <div className="relative">
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
          >
            <Plus size={14} />
            Asociar existente
          </button>
        ) : (
          <div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
              <input
                type="text"
                placeholder="Buscar base de datos para asociar..."
                value={searchText}
                autoFocus
                onFocus={() => setShowSearch(true)}
                onChange={(e) => { setSearchText(e.target.value); setShowSearch(true) }}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {showSearch && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableDatabases.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {searchText ? 'Sin resultados' : 'No hay más bases de datos disponibles'}
                  </p>
                ) : (
                  availableDatabases.map((db_) => (
                    <button
                      key={db_.id}
                      type="button"
                      onClick={() => handleAssociate(db_.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus size={14} className="text-primary shrink-0" />
                        <Database size={14} className="text-neutral-50 shrink-0" />
                        <span className="text-neutral-90 dark:text-white truncate">{db_.name}</span>
                      </div>
                      <span className="text-xs text-neutral-50 shrink-0 font-mono">{db_.engine} {db_.version}</span>
                    </button>
                  ))
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
