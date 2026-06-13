import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Server, ExternalLink, Layers, Box, Cpu, Database, Globe, Shield, ArrowRight, AlertTriangle, Wifi, Wrench, Plus, Unlink, Link } from 'lucide-react'
import type { SupportStatus, Criticality } from '@/types/domain'
import type { DependencyType } from '@/constants/enums'
import { Select } from '@/components/ui/Select'

const criticalityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

const appStatusLabel: Record<string, string> = {
  active: 'Activa',
  deprecated: 'Deprecada',
  retired: 'Retirada',
  planned: 'Planificada',
}

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  extended: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  eol: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  unknown: 'bg-neutral-500/20 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
}

const categoryIcons: Record<string, React.ReactNode> = {
  language: <Wrench size={14} />,
  framework: <Layers size={14} />,
  database: <Database size={14} />,
  runtime: <Cpu size={14} />,
  cloud: <Globe size={14} />,
  tool: <Wrench size={14} />,
  library: <Box size={14} />,
  'message-broker': <Wifi size={14} />,
  'web-server': <Server size={14} />,
}

interface ArchitectureTabProps {
  applicationId: string
}

export function ArchitectureTab({ applicationId }: ArchitectureTabProps) {
  const application = useLiveQuery(() => db.applications.get(applicationId), [applicationId])
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const dependencies = useLiveQuery(
    () => db.applicationDependencies.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allApps = useLiveQuery(() => db.applications.toArray()) ?? []

  const { addNotification } = useAppStore()
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)
  const [depSearch, setDepSearch] = useState('')
  const [depType, setDepType] = useState<DependencyType>('api')
  const [depCriticality, setDepCriticality] = useState<Criticality>('medium')
  const [depDescription, setDepDescription] = useState('')
  const [showDepForm, setShowDepForm] = useState(false)

  if (!application) return null

  const appTechnologies = allTechnologies.filter((t) => application.technologies.includes(t.id))
  const depAppIds = dependencies.map((d) => d.dependsOnAppId)
  const depApps = allApps.filter((a) => depAppIds.includes(a.id))

  const eolCount = appTechnologies.filter((t) => t.supportStatus === 'eol').length

  const alreadyDepIds = new Set(dependencies.map((d) => d.dependsOnAppId))
  const availableApps = allApps.filter(
    (a) => a.id !== applicationId && !alreadyDepIds.has(a.id) &&
      (!depSearch || a.name.toLowerCase().includes(depSearch.toLowerCase()))
  )

  const handleAddDependency = async (targetAppId: string) => {
    const exists = dependencies.find((d) => d.dependsOnAppId === targetAppId)
    if (exists) {
      addNotification({ type: 'warning', message: 'Esta dependencia ya existe' })
      return
    }
    await db.applicationDependencies.add({
      id: crypto.randomUUID(),
      applicationId,
      dependsOnAppId: targetAppId,
      dependencyType: depType,
      criticality: depCriticality,
      description: depDescription,
      createdAt: new Date(),
    })
    addNotification({ type: 'success', message: 'Dependencia agregada' })
    setDepSearch('')
    setDepDescription('')
    setShowDepForm(false)
  }

  const handleRemoveDependency = async (depId: string) => {
    await db.applicationDependencies.delete(depId)
    addNotification({ type: 'info', message: 'Dependencia eliminada' })
  }

  const dependencyTypes: { value: DependencyType; label: string }[] = [
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Base de Datos' },
    { value: 'library', label: 'Librería' },
    { value: 'infrastructure', label: 'Infraestructura' },
    { value: 'message', label: 'Mensajería' },
    { value: 'external', label: 'Sistema Externo' },
  ]

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-neutral-90 dark:text-white mb-1">Diagrama de Arquitectura C4</h4>
          <p className="text-xs text-neutral-50">
            {microservices.length} contenedores · {depApps.length} dependencias externas · {appTechnologies.length} tecnologías
            {eolCount > 0 && (
              <span className="text-red-500 ml-2">· {eolCount} EOL</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            Contenedor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-neutral-400" />
            Dependencia externa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
            Tecnología activa
          </span>
        </div>
      </div>

      {/* C4 Diagram */}
      <div className="relative bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        {/* Zoom/pan container */}
        <div className="overflow-auto p-8">
          {/* Level 1: System Boundary */}
          <div className="relative">
            {/* System Boundary Box */}
            <div className="relative border-2 border-blue-400/40 dark:border-blue-500/30 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 p-6 min-h-[400px]">
              {/* System Label */}
              <div className="absolute -top-3.5 left-6 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
                <Server size={12} />
                <span>Sistema: {application.name}</span>
              </div>

              {/* Metadata badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-1 bg-white dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 text-xs rounded-full border border-neutral-20 dark:border-neutral-60 shadow-sm">
                {application.architecture} · {criticalityLabel[application.criticality]}
              </div>

              {/* Tech tags row */}
              {appTechnologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6 mt-2">
                  {appTechnologies.map((tech) => (
                    <span
                      key={tech.id}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                        statusColors[tech.supportStatus]
                      } ${tech.supportStatus === 'eol' ? 'ring-1 ring-red-500/30' : ''}`}
                    >
                      {categoryIcons[tech.category] || <Box size={14} />}
                      {tech.name}
                      <span className="opacity-60">{tech.version}</span>
                    </span>
                  ))}
                </div>
              )}

              {appTechnologies.length === 0 && (
                <div className="mb-6 mt-2 text-xs text-neutral-50 italic">
                  Sin tecnologías registradas
                </div>
              )}

              {/* Level 2: Container Diagram — Microservices grid */}
              {microservices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {microservices.map((ms) => {
                    const msTechs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
                    const msEol = msTechs.filter((t) => t.supportStatus === 'eol')
                    const isHovered = hoveredElement === ms.id

                    return (
                      <div
                        key={ms.id}
                        className={`
                          relative rounded-xl border-2 bg-white dark:bg-neutral-80 shadow-sm
                          transition-all duration-200 cursor-default
                          ${isHovered
                            ? 'border-blue-400 shadow-lg shadow-blue-500/10 scale-[1.02]'
                            : 'border-neutral-20 dark:border-neutral-60 hover:border-blue-300 dark:hover:border-blue-600'
                          }
                        `}
                        onMouseEnter={() => setHoveredElement(ms.id)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        {/* Container header */}
                        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-20 dark:border-neutral-60 bg-gradient-to-r from-blue-500/5 to-transparent">
                          <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Box size={14} />
                          </div>
                          <span className="text-sm font-semibold text-neutral-90 dark:text-white truncate">
                            {ms.name}
                          </span>
                          {msEol.length > 0 && (
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500">
                              <AlertTriangle size={12} className="inline mr-0.5" />
                              {msEol.length}
                            </span>
                          )}
                        </div>

                        {/* Container body — tech tags */}
                        <div className="p-3 space-y-1.5">
                          {msTechs.length > 0 ? (
                            msTechs.map((tech) => (
                              <div
                                key={tech.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group"
                              >
                                <span className="text-neutral-50 shrink-0">
                                  {categoryIcons[tech.category] || <Box size={12} />}
                                </span>
                                <span className="text-xs text-neutral-70 dark:text-neutral-30 truncate flex-1">
                                  {tech.name}
                                </span>
                                <span className="text-[10px] text-neutral-50 shrink-0">{tech.version}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                                  tech.supportStatus === 'eol'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : tech.supportStatus === 'extended'
                                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }`}>
                                  {tech.supportStatus === 'active' ? '✓' : tech.supportStatus === 'eol' ? '!' : '~'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-neutral-50 italic">Sin tecnologías</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-50">
                  <Box size={40} className="mb-3 opacity-40" />
                  <p className="text-sm">No hay microservicios registrados</p>
                  <p className="text-xs mt-1">Agrega microservicios desde la pestaña Microservicios</p>
                </div>
              )}
            </div>
          </div>

          {/* External Dependencies — Level 1: Context Diagram */}
          {depApps.length > 0 && (
            <div className="mt-10">
              {/* Arrow indicator */}
              <div className="flex items-center justify-center gap-2 mb-4 text-neutral-40 dark:text-neutral-50">
                <div className="h-px flex-1 max-w-[100px] bg-neutral-30 dark:bg-neutral-60" />
                <ArrowRight size={16} />
                <span className="text-xs font-medium tracking-wider uppercase">Dependencias externas</span>
                <ArrowRight size={16} />
                <div className="h-px flex-1 max-w-[100px] bg-neutral-30 dark:bg-neutral-60" />
              </div>

              {/* External systems grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {depApps.map((dep) => {
                  const depInfo = dependencies.find((d) => d.dependsOnAppId === dep.id)
                  const isHovered = hoveredElement === dep.id

                  return (
                    <div
                      key={dep.id}
                      className={`
                        relative rounded-xl border-2 bg-neutral-50/50 dark:bg-neutral-75 shadow-sm
                        transition-all duration-200 cursor-default
                        ${isHovered
                          ? 'border-neutral-400 shadow-lg shadow-neutral-500/10 scale-[1.02]'
                          : 'border-neutral-20 dark:border-neutral-60'
                        }
                      `}
                      onMouseEnter={() => setHoveredElement(dep.id)}
                      onMouseLeave={() => setHoveredElement(null)}
                    >
                      {/* External system header */}
                      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-20 dark:border-neutral-60">
                        <div className="p-1 rounded-md bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400">
                          <ExternalLink size={14} />
                        </div>
                        <span className="text-sm font-semibold text-neutral-90 dark:text-white truncate">
                          {dep.name}
                        </span>
                        {depInfo?.dependencyType && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 uppercase font-mono">
                            {depInfo.dependencyType}
                          </span>
                        )}
                      </div>

                      {/* External system body */}
                      <div className="p-3 space-y-1.5">
                        {depInfo?.description && (
                          <p className="text-xs text-neutral-60 dark:text-neutral-40 line-clamp-2">
                            {depInfo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-neutral-50">
                          <Shield size={12} />
                          <span>{dep.architecture} · {appStatusLabel[dep.status]}</span>
                          {dep.criticality && (
                            <span className={`ml-auto px-1.5 py-0.5 rounded-full ${
                              dep.criticality === 'critical' ? 'bg-red-500/10 text-red-500' :
                              dep.criticality === 'high' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {criticalityLabel[dep.criticality]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state — no microservices and no dependencies */}
          {microservices.length === 0 && depApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-50">
              <Globe size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-medium text-neutral-60 dark:text-neutral-40">
                No hay datos para generar el diagrama de arquitectura
              </p>
              <p className="text-xs mt-1">
                Registra microservicios y dependencias para visualizar la arquitectura C4 de {application.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dependency Management */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-neutral-90 dark:text-white">
              Dependencias de Aplicación
            </h4>
            <p className="text-xs text-neutral-50 mt-0.5">{dependencies.length} registradas</p>
          </div>
          <button
            onClick={() => setShowDepForm(!showDepForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
          >
            <Plus size={16} />
            Agregar Dependencia
          </button>
        </div>

        {/* Add dependency form */}
        {showDepForm && (
          <div className="p-6 border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10/50 dark:bg-neutral-70/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Aplicación destino *</label>
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
                  <input
                    type="text"
                    placeholder="Buscar aplicación..."
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {depSearch && availableApps.length > 0 && (
                  <div className="mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {availableApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => handleAddDependency(app.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                      >
                        <span className="text-neutral-90 dark:text-white">{app.name}</span>
                        <span className="text-xs text-neutral-50">{app.architecture} · {appStatusLabel[app.status]}</span>
                      </button>
                    ))}
                  </div>
                )}
                {depSearch && availableApps.length === 0 && (
                  <p className="mt-1 text-xs text-neutral-50">Sin resultados</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Tipo</label>
                <Select value={depType} onChange={(v) => setDepType(v as DependencyType)} options={dependencyTypes.map((t) => ({ value: t.value, label: t.label }))} />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Criticidad</label>
                <Select value={depCriticality} onChange={(v) => setDepCriticality(v as Criticality)} options={[
                  { value: 'low', label: 'Baja' },
                  { value: 'medium', label: 'Media' },
                  { value: 'high', label: 'Alta' },
                  { value: 'critical', label: 'Crítica' },
                ]} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">Descripción</label>
              <input
                type="text"
                placeholder="ej. Consulta catálogo de productos vía REST"
                value={depDescription}
                onChange={(e) => setDepDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {depSearch && availableApps.length > 0 && (
              <p className="text-xs text-neutral-50">Selecciona una aplicación de la lista de resultados para agregar la dependencia</p>
            )}
          </div>
        )}

        {/* Current dependencies list */}
        <div className="p-6">
          {depApps.length > 0 ? (
            <div className="space-y-2">
              {depApps.map((dep) => {
                const depRel = dependencies.find((d) => d.dependsOnAppId === dep.id)
                return (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group hover:bg-neutral-20 dark:hover:bg-neutral-60/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 shrink-0">
                        <ExternalLink size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">{dep.name}</span>
                          {depRel?.dependencyType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 uppercase font-mono">
                              {depRel.dependencyType}
                            </span>
                          )}
                          {depRel?.criticality && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              depRel.criticality === 'critical' ? 'bg-red-500/10 text-red-500' :
                              depRel.criticality === 'high' ? 'bg-amber-500/10 text-amber-500' :
                              depRel.criticality === 'medium' ? 'bg-info/10 text-info' :
                              'bg-emerald-500/10 text-emerald-500'
                            }`}>
                              {criticalityLabel[depRel.criticality]}
                            </span>
                          )}
                        </div>
                        {depRel?.description && (
                          <p className="text-xs text-neutral-60 dark:text-neutral-40 truncate mt-0.5">{depRel.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => depRel && handleRemoveDependency(depRel.id)}
                      className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                      title="Eliminar dependencia"
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-50">
              <Unlink size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin dependencias registradas</p>
              <p className="text-xs mt-1">Las dependencias aparecerán como sistemas externos en el diagrama C4</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <h5 className="text-xs font-semibold text-neutral-70 dark:text-neutral-30 uppercase tracking-wider mb-3">
          Leyenda — Niveles C4
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Box size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Nivel 2: Contenedor</p>
              <p className="text-neutral-50 mt-0.5">Microservicios que componen la aplicación. Cada uno muestra su stack tecnológico y estado de soporte.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 shrink-0">
              <ExternalLink size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Nivel 1: Contexto</p>
              <p className="text-neutral-50 mt-0.5">Sistemas externos con los que la aplicación se comunica (APIs, bases de datos, servicios).</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Tecnologías</p>
              <p className="text-neutral-50 mt-0.5"><span className="text-emerald-500">✓</span> Activa · <span className="text-amber-500">~</span> Soporte extendido · <span className="text-red-500">!</span> EOL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
