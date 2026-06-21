import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import {
  Database, Pencil, Trash2, ChevronDown, ChevronUp,
  Server, Box,
} from 'lucide-react'
import type { DatabaseType, EnvironmentType, SupportStatus, AppDatabase, Technology } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
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

const environmentColor: Record<EnvironmentType, string> = {
  dev: 'bg-neutral-200 dark:bg-neutral-60 text-neutral-700 dark:text-neutral-300',
  qa: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  staging: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  prod: 'bg-danger/10 text-danger',
  dr: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  test: 'bg-info/10 text-info',
  uat: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  perf: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
}

interface DatabasesTabProps {
  applicationId: string
  databases: AppDatabase[]
}

export function DatabasesTab({ applicationId, databases }: DatabasesTabProps) {
  const navigate = useNavigate()
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const { confirm } = useConfirm()

  const handleDelete = async (dbId: string) => {
    if (!(await confirm('¿Eliminar esta base de datos?'))) return
    await db.appDatabases.delete(dbId)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Bases de Datos <span className="text-neutral-50 text-base font-normal">({databases.length})</span>
          <p className="text-sm font-normal text-neutral-50 mt-0.5">Bases de datos heredadas de los microservicios de la aplicación.</p>
        </h4>
      </div>

      <div className="space-y-3">
        {databases.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">
            No hay bases de datos registradas para esta aplicación.
          </p>
        )}

        {databases.map((db_) => (
          <DatabaseCard
            key={db_.id}
            database={db_}
            microservices={microservices}
            allTechnologies={allTechnologies}
            onEdit={() => navigate(`/catalog/applications/${applicationId}/databases/${db_.id}/edit`)}
            onDelete={() => handleDelete(db_.id)}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Database Card ─── */

function DatabaseCard({
  database: db_,
  microservices,
  allTechnologies,
  onEdit,
  onDelete,
}: {
  database: AppDatabase
  microservices: { id: string; name: string }[]
  allTechnologies: Technology[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const techs = allTechnologies.filter((t) => db_.technologies.includes(t.id))
  const relatedMs = microservices.filter((ms) => db_.microserviceIds.includes(ms.id))
  const eolCount = techs.filter((t) => t.supportStatus === 'eol').length

  return (
    <div className="border border-boundary rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Database size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                {db_.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 font-mono">
                {db_.engine} {db_.version}
              </span>
              {eolCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger shrink-0">
                  {eolCount} EOL
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${environmentColor[db_.environment]}`}>
                {environmentLabel[db_.environment]}
              </span>
              <span className="text-xs text-muted">
                {dbTypeLabel[db_.dbType]}
              </span>
              {db_.isManaged && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info">
                  Managed
                </span>
              )}
              {db_.host && (
                <span className="text-[10px] text-neutral-50 truncate max-w-[200px]">
                  {db_.host}{db_.port ? `:${db_.port}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {relatedMs.length > 0 && (
            <span className="text-xs text-neutral-50">{relatedMs.length} microservicio(s)</span>
          )}
          <Button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          <Button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="Editar"
          >
            <Pencil size={14} />
          </Button>
          <Button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-boundary p-3 space-y-3">
          {db_.description && (
            <HtmlDescription html={db_.description} lines={2} />
          )}

          {relatedMs.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">
                Microservicios relacionados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {relatedMs.map((ms) => (
                  <span
                    key={ms.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    <Server size={10} />
                    {ms.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {techs.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">
                Tecnologías relacionadas
              </p>
              <div className="space-y-1">
                {techs.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Box size={14} className="text-neutral-50 shrink-0" />
                      <span className="text-sm text-neutral-90 dark:text-white truncate">
                        {tech.name}
                      </span>
                      <span className="text-xs text-neutral-50 shrink-0">{tech.version}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                      {statusLabel[tech.supportStatus]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {techs.length === 0 && relatedMs.length === 0 && (
            <p className="text-xs text-neutral-50 italic">Sin microservicios o tecnologías asociadas</p>
          )}
        </div>
      )}
    </div>
  )
}
