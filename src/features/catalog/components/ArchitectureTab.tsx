import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { Server, ArrowRight, Box, Globe, Layers, ExternalLink } from 'lucide-react'
import type { SupportStatus } from '@/constants/enums'
import {
  criticalityLabel,
  statusColors,
  categoryIcons,
} from '@/features/catalog/constants/architectureConstants'
import { MicroserviceCard } from '@/features/catalog/components/MicroserviceCard'
import { DependencyCard } from '@/features/catalog/components/DependencyCard'
import { DependencyManager } from '@/features/catalog/components/DependencyManager'

interface ArchitectureTabProps {
  applicationId: string
}

export function ArchitectureTab({ applicationId }: ArchitectureTabProps) {
  const application = useLiveQuery(() => db.applications.get(applicationId), [applicationId])
  const microservices =
    useLiveQuery(
      () => db.microservices.where('applicationId').equals(applicationId).toArray(),
      [applicationId],
    ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const dependencies =
    useLiveQuery(
      () => db.applicationDependencies.where('applicationId').equals(applicationId).toArray(),
      [applicationId],
    ) ?? []
  const allApps = useLiveQuery(() => db.applications.toArray()) ?? []

  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  if (!application) return null

  const appTechnologies = allTechnologies.filter((t) => application.technologies.includes(t.id))
  const depAppIds = dependencies.map((d) => d.dependsOnAppId)
  const depApps = allApps.filter((a) => depAppIds.includes(a.id))
  const eolCount = appTechnologies.filter((t) => t.supportStatus === 'eol').length

  const handleHover = (id: string | null) => setHoveredElement(id)
  const techStatusColor = (status: SupportStatus) => statusColors[status]

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-neutral-90 dark:text-white mb-1">
            Diagrama de Arquitectura C4
          </h4>
          <p className="text-xs text-neutral-50">
            {microservices.length} contenedores · {depApps.length} dependencias externas ·{' '}
            {appTechnologies.length} tecnologías
            {eolCount > 0 && <span className="text-red-500 ml-2">· {eolCount} EOL</span>}
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
      <div className="relative bg-card rounded-2xl border border-boundary shadow-sm overflow-hidden">
        <div className="overflow-auto p-8">
          {/* System Boundary */}
          <div className="relative border-2 border-blue-400/40 dark:border-blue-500/30 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 p-6 min-h-[400px]">
            <div className="absolute -top-3.5 left-6 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
              <Server size={12} />
              <span>Sistema: {application.name}</span>
            </div>
            <div className="absolute -top-3.5 right-6 px-3 py-1 bg-white dark:bg-neutral-70 text-muted text-xs rounded-full border border-neutral-20 dark:border-neutral-60 shadow-sm">
              {application.architecture} · {criticalityLabel[application.criticality]}
            </div>

            {/* Tech tags */}
            {appTechnologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6 mt-2">
                {appTechnologies.map((tech) => (
                  <span
                    key={tech.id}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                      techStatusColor(tech.supportStatus)
                    } ${tech.supportStatus === 'eol' ? 'ring-1 ring-danger/30' : ''}`}
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

            {/* Microservices grid */}
            {microservices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {microservices.map((ms) => {
                  const msTechs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
                  return (
                    <MicroserviceCard
                      key={ms.id}
                      ms={ms}
                      technologies={msTechs}
                      isHovered={hoveredElement === ms.id}
                      onMouseEnter={() => handleHover(ms.id)}
                      onMouseLeave={() => handleHover(null)}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-50">
                <Box size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No hay microservicios registrados</p>
                <p className="text-xs mt-1">
                  Agrega microservicios desde la pestaña Microservicios
                </p>
              </div>
            )}
          </div>

          {/* External Dependencies */}
          {depApps.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-center gap-2 mb-4 text-neutral-40 dark:text-neutral-50">
                <div className="h-px flex-1 max-w-[100px] bg-neutral-30 dark:bg-neutral-60" />
                <ArrowRight size={16} />
                <span className="text-xs font-medium tracking-wider uppercase">
                  Dependencias externas
                </span>
                <ArrowRight size={16} />
                <div className="h-px flex-1 max-w-[100px] bg-neutral-30 dark:bg-neutral-60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {depApps.map((dep) => {
                  const depInfo = dependencies.find((d) => d.dependsOnAppId === dep.id)
                  return (
                    <DependencyCard
                      key={dep.id}
                      dep={dep}
                      depInfo={depInfo}
                      isHovered={hoveredElement === dep.id}
                      onMouseEnter={() => handleHover(dep.id)}
                      onMouseLeave={() => handleHover(null)}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {microservices.length === 0 && depApps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-50">
              <Globe size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-medium text-muted">
                No hay datos para generar el diagrama de arquitectura
              </p>
              <p className="text-xs mt-1">
                Registra microservicios y dependencias para visualizar la arquitectura C4 de{' '}
                {application.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dependency Management */}
      <DependencyManager applicationId={applicationId} allApps={allApps} />

      {/* Legend */}
      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <h5 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
          Leyenda — Niveles C4
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Box size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Nivel 2: Contenedor</p>
              <p className="text-neutral-50 mt-0.5">
                Microservicios que componen la aplicación. Cada uno muestra su stack tecnológico y
                estado de soporte.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 shrink-0">
              <ExternalLink size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Nivel 1: Contexto</p>
              <p className="text-neutral-50 mt-0.5">
                Sistemas externos con los que la aplicación se comunica (APIs, bases de datos,
                servicios).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <p className="font-medium text-neutral-90 dark:text-white">Tecnologías</p>
              <p className="text-neutral-50 mt-0.5">
                <span className="text-emerald-500">✓</span> Activa ·{' '}
                <span className="text-amber-500">~</span> Soporte extendido ·{' '}
                <span className="text-red-500">!</span> EOL
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
