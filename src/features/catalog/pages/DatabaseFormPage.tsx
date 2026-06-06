import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import type { SupportStatus, EnvironmentType } from '@/constants/enums'
import type { DatabaseType } from '@/types/domain'
import { ArrowLeft, Plus, X, Server, Box } from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'

const statusColors: Record<string, string> = {
  active: 'border-success/30 bg-success/5 text-success',
  extended: 'border-warning/30 bg-warning/5 text-warning',
  eol: 'border-danger/30 bg-danger/5 text-danger',
  unknown: 'border-neutral-30 bg-neutral-10 text-neutral-50',
}

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

const dbTypeLabel: Record<DatabaseType, string> = {
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

const environmentLabel: Record<EnvironmentType, string> = {
  dev: 'DEV',
  qa: 'QA',
  staging: 'STAGING',
  prod: 'PROD',
  dr: 'DR',
  test: 'TEST',
  uat: 'UAT',
  perf: 'PERF',
}

const DB_TYPES: DatabaseType[] = [
  'relational', 'document', 'key-value', 'graph', 'time-series',
  'search', 'cache', 'message_queue', 'vector', 'other',
]

const ENVIRONMENTS: EnvironmentType[] = ['dev', 'qa', 'staging', 'prod', 'dr', 'test', 'uat', 'perf']

const dbEngineExamples: Record<DatabaseType, string[]> = {
  relational: ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'SQLite', 'MariaDB'],
  document: ['MongoDB', 'Couchbase', 'Firestore', 'DynamoDB'],
  'key-value': ['Redis', 'Memcached', 'Etcd', 'Riak'],
  graph: ['Neo4j', 'ArangoDB', 'Amazon Neptune'],
  'time-series': ['InfluxDB', 'TimescaleDB', 'Prometheus', 'QuestDB'],
  search: ['Elasticsearch', 'Meilisearch', 'Typesense', 'Algolia'],
  cache: ['Redis', 'Memcached', 'Valkey'],
  message_queue: ['RabbitMQ', 'Kafka', 'Amazon SQS', 'NATS'],
  vector: ['Pinecone', 'Qdrant', 'Weaviate', 'Milvus'],
  other: ['Cassandra', 'CockroachDB', 'DuckDB'],
}

export function DatabaseFormPage() {
  const { appId, id } = useParams<{ appId: string; id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const application = useLiveQuery(() => (appId ? db.applications.get(appId) : undefined), [appId])
  const existing = useLiveQuery(() => (id ? db.appDatabases.get(id) : undefined), [id])
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const microservices = useLiveQuery(
    () => (appId ? db.microservices.where('applicationId').equals(appId).toArray() : []),
    [appId],
  ) ?? []

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [engine, setEngine] = useState('')
  const [version, setVersion] = useState('')
  const [dbType, setDbType] = useState<DatabaseType>('relational')
  const [environment, setEnvironment] = useState<EnvironmentType>('dev')
  const [host, setHost] = useState('')
  const [port, setPort] = useState<number | null>(null)
  const [isManaged, setIsManaged] = useState(false)
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])
  const [selectedMsIds, setSelectedMsIds] = useState<string[]>([])
  const [techSearch, setTechSearch] = useState('')
  const [msSearch, setMsSearch] = useState('')
  const [showTechDropdown, setShowTechDropdown] = useState(false)
  const [showMsDropdown, setShowMsDropdown] = useState(false)

  useEffect(() => {
    if (existing) {
      queueMicrotask(() => {
        setName(existing.name)
        setDescription(existing.description)
        setEngine(existing.engine)
        setVersion(existing.version)
        setDbType(existing.dbType)
        setEnvironment(existing.environment)
        setHost(existing.host ?? '')
        setPort(existing.port)
        setIsManaged(existing.isManaged)
        setSelectedTechIds(existing.technologies)
        setSelectedMsIds(existing.microserviceIds)
      })
    }
  }, [existing])

  if (id && !existing) return <div className="p-6 text-neutral-50">Cargando...</div>
  if (!appId || !application) return <div className="p-6 text-neutral-50">Aplicación no encontrada</div>

  const selectedTechs = allTechnologies.filter((t) => selectedTechIds.includes(t.id))
  const availableTechs = allTechnologies.filter(
    (t) => !selectedTechIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase())),
  )
  const availableMs = microservices.filter(
    (ms) => !selectedMsIds.includes(ms.id) &&
      (!msSearch || ms.name.toLowerCase().includes(msSearch.toLowerCase())),
  )

  const addTechnology = (techId: string) => {
    setSelectedTechIds((prev) => [...prev, techId])
    setTechSearch('')
    setShowTechDropdown(false)
  }

  const removeTechnology = (techId: string) => {
    setSelectedTechIds((prev) => prev.filter((id) => id !== techId))
  }

  const addMicroservice = (msId: string) => {
    setSelectedMsIds((prev) => [...prev, msId])
    setMsSearch('')
    setShowMsDropdown(false)
  }

  const removeMicroservice = (msId: string) => {
    setSelectedMsIds((prev) => prev.filter((id) => id !== msId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !engine.trim()) return

    const data = {
      applicationId: appId,
      name: name.trim(),
      description,
      engine: engine.trim(),
      version: version.trim(),
      dbType,
      environment,
      host: host.trim() || null,
      port,
      isManaged,
      technologies: selectedTechIds,
      microserviceIds: selectedMsIds,
      updatedAt: new Date(),
    }

    if (existing) {
      await db.appDatabases.update(existing.id, data)
      addNotification({ type: 'success', message: 'Base de datos actualizada' })
    } else {
      await db.appDatabases.add({
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
      })
      addNotification({ type: 'success', message: 'Base de datos creada' })
    }
    navigate(`/catalog/applications/${appId}`)
  }

  const engineSuggestions = dbEngineExamples[dbType] ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/catalog/applications/${appId}`)}
          className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-60" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-90 dark:text-white">
            {existing ? 'Editar Base de Datos' : 'Nueva Base de Datos'}
          </h1>
          <p className="text-sm text-neutral-60 dark:text-neutral-40">
            {application.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm space-y-5">
        {/* Name + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. customer-db, logs-store"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Tipo <span className="text-danger">*</span>
            </label>
            <select
              required
              value={dbType}
              onChange={(e) => { setDbType(e.target.value as DatabaseType); setEngine('') }}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DB_TYPES.map((t) => (
                <option key={t} value={t}>{dbTypeLabel[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Environment */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
            Ambiente <span className="text-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  environment === env
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white border border-neutral-30 dark:border-neutral-60'
                }`}
              >
                {environmentLabel[env]}
              </button>
            ))}
          </div>
        </div>

        {/* Engine + Version */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Motor <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="ej. PostgreSQL, MongoDB..."
              list={`engine-suggestions-${dbType}`}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <datalist id={`engine-suggestions-${dbType}`}>
              {engineSuggestions.map((eng) => (
                <option key={eng} value={eng} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Versión
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="ej. 16, 8.0, 7.x"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Host + Port */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Host / Endpoint
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="ej. db.internal.com, localhost"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
              Puerto
            </label>
            <input
              type="number"
              value={port ?? ''}
              onChange={(e) => setPort(e.target.value ? parseInt(e.target.value, 10) : null)}
              placeholder="ej. 5432, 27017"
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Managed */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isManaged}
              onChange={(e) => setIsManaged(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-30 text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-medium text-neutral-70 dark:text-neutral-30">
              Servicio administrado (Managed) — RDS, Cloud SQL, Atlas, etc.
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1">
            Descripción
          </label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Propósito, tipo de datos, esquema principal..."
          />
        </div>

        {/* Technologies */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
            Tecnologías relacionadas <span className="text-neutral-50 font-normal">({selectedTechIds.length} seleccionadas)</span>
          </label>

          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTechs.map((tech) => (
              <span
                key={tech.id}
                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${statusColors[tech.supportStatus]}`}
              >
                <Box size={12} />
                {tech.name} {tech.version}
                <button
                  type="button"
                  onClick={() => removeTechnology(tech.id)}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {selectedTechs.length === 0 && (
              <span className="text-xs text-neutral-50 py-1">Ninguna tecnología seleccionada</span>
            )}
          </div>

          <div className="relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar tecnología para asociar..."
                value={techSearch}
                onFocus={() => setShowTechDropdown(true)}
                onChange={(e) => { setTechSearch(e.target.value); setShowTechDropdown(true) }}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
            </div>

            {showTechDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {availableTechs.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutral-50">
                    {techSearch ? 'Sin resultados' : 'Todas las tecnologías ya están seleccionadas'}
                  </p>
                ) : (
                  availableTechs.map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => addTechnology(tech.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-neutral-90 dark:text-white truncate">{tech.name}</span>
                        <span className="text-neutral-50 shrink-0">{tech.version}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                        {statusLabel[tech.supportStatus]}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Microservices */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-2">
            Microservicios relacionados <span className="text-neutral-50 font-normal">({selectedMsIds.length} seleccionados — opcional)</span>
          </label>

          <div className="flex flex-wrap gap-2 mb-2">
            {selectedMsIds.map((msId) => {
              const ms = microservices.find((m) => m.id === msId)
              if (!ms) return null
              return (
                <span
                  key={msId}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  <Server size={12} />
                  {ms.name}
                  <button
                    type="button"
                    onClick={() => removeMicroservice(msId)}
                    className="ml-0.5 hover:opacity-70 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </span>
              )
            })}
            {selectedMsIds.length === 0 && (
              <span className="text-xs text-neutral-50 py-1">Ningún microservicio asociado</span>
            )}
          </div>

          {microservices.length > 0 && (
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar microservicio para relacionar..."
                  value={msSearch}
                  onFocus={() => setShowMsDropdown(true)}
                  onChange={(e) => { setMsSearch(e.target.value); setShowMsDropdown(true) }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Plus size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-50" />
              </div>

              {showMsDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {availableMs.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-neutral-50">
                      {msSearch ? 'Sin resultados' : 'Todos los microservicios ya están asociados'}
                    </p>
                  ) : (
                    availableMs.map((ms) => (
                      <button
                        key={ms.id}
                        type="button"
                        onClick={() => addMicroservice(ms.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                      >
                        <Plus size={14} className="text-primary shrink-0" />
                        <span className="text-neutral-90 dark:text-white truncate">{ms.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {microservices.length === 0 && (
            <p className="text-xs text-neutral-50 flex items-center gap-1">
              <Server size={12} />
              No hay microservicios registrados. Puedes crearlos desde la pestaña Microservicios.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-20 dark:border-neutral-70">
          <button
            type="button"
            onClick={() => navigate(`/catalog/applications/${appId}`)}
            className="px-4 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            {existing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  )
}
