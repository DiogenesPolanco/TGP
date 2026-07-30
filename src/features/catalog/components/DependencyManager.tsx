import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { Plus, ExternalLink, Link, Unlink } from 'lucide-react'
import { appStatusLabel, criticalityLabel, dependencyTypes } from '@/features/catalog/constants/architectureConstants'
import type { Criticality, DependencyType } from '@/constants/enums'
import type { Application } from '@/types/domain'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

export function DependencyManager({ applicationId, allApps }: { applicationId: string; allApps: Application[] }) {
  const dependencies =
    useLiveQuery(
      () => db.applicationDependencies.where('applicationId').equals(applicationId).toArray(),
      [applicationId],
    ) ?? []

  const { addNotification } = useAppStore()
  const [depSearch, setDepSearch] = useState('')
  const [depType, setDepType] = useState<DependencyType>('api')
  const [depCriticality, setDepCriticality] = useState<Criticality>('medium')
  const [depDescription, setDepDescription] = useState('')
  const [showDepForm, setShowDepForm] = useState(false)

  const depAppIds = dependencies.map((d) => d.dependsOnAppId)
  const alreadyDepIds = new Set(depAppIds)
  const availableApps = allApps.filter(
    (a) =>
      a.id !== applicationId &&
      !alreadyDepIds.has(a.id) &&
      (!depSearch || a.name.toLowerCase().includes(depSearch.toLowerCase())),
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

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm">
      <div className="px-6 py-4 border-b border-boundary flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-neutral-90 dark:text-white">
            Dependencias de Aplicación
          </h4>
          <p className="text-xs text-neutral-50 mt-0.5">{dependencies.length} registradas</p>
        </div>
        <Button
          onClick={() => setShowDepForm(!showDepForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={16} />
          Agregar Dependencia
        </Button>
      </div>

      {showDepForm && (
        <div className="p-6 border-b border-boundary bg-neutral-10/50 dark:bg-neutral-70/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Aplicación destino *
              </label>
              <div className="relative">
                <Link
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
                />
                <input
                  type="text"
                  placeholder="Buscar aplicación..."
                  value={depSearch}
                  onChange={(e) => setDepSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {depSearch && availableApps.length > 0 && (
                <div className="mt-1 bg-card border border-boundary rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {availableApps.map((app) => (
                    <Button
                      key={app.id}
                      onClick={() => handleAddDependency(app.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <span className="text-neutral-90 dark:text-white">{app.name}</span>
                      <span className="text-xs text-neutral-50">
                        {app.architecture} · {appStatusLabel[app.status]}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              {depSearch && availableApps.length === 0 && (
                <p className="mt-1 text-xs text-neutral-50">Sin resultados</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Tipo</label>
              <Select
                value={depType}
                onChange={(v) => setDepType(v as DependencyType)}
                options={dependencyTypes.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Criticidad</label>
              <Select
                value={depCriticality}
                onChange={(v) => setDepCriticality(v as Criticality)}
                options={[
                  { value: 'low', label: 'Baja' },
                  { value: 'medium', label: 'Media' },
                  { value: 'high', label: 'Alta' },
                  { value: 'critical', label: 'Crítica' },
                ]}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-secondary mb-1.5">Descripción</label>
            <input
              type="text"
              placeholder="ej. Consulta catálogo de productos vía REST"
              value={depDescription}
              onChange={(e) => setDepDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {depSearch && availableApps.length > 0 && (
            <p className="text-xs text-neutral-50">
              Selecciona una aplicación de la lista de resultados para agregar la dependencia
            </p>
          )}
        </div>
      )}

      <div className="p-6">
        {depAppIds.length > 0 ? (
          <div className="space-y-2">
            {allApps
              .filter((a) => depAppIds.includes(a.id))
              .map((dep) => {
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
                          <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                            {dep.name}
                          </span>
                          {depRel?.dependencyType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-60 text-neutral-600 dark:text-neutral-400 uppercase font-mono">
                              {depRel.dependencyType}
                            </span>
                          )}
                          {depRel?.criticality && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                depRel.criticality === 'critical'
                                  ? 'bg-red-500/10 text-red-500'
                                  : depRel.criticality === 'high'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : depRel.criticality === 'medium'
                                      ? 'bg-info/10 text-info'
                                      : 'bg-emerald-500/10 text-emerald-500'
                              }`}
                            >
                              {criticalityLabel[depRel.criticality]}
                            </span>
                          )}
                        </div>
                        {depRel?.description && (
                          <p className="text-xs text-muted truncate mt-0.5">{depRel.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => depRel && handleRemoveDependency(depRel.id)}
                      className="p-1.5 rounded-md text-neutral-50 hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                      title="Eliminar dependencia"
                    >
                      <Unlink size={14} />
                    </Button>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-50">
            <Unlink size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin dependencias registradas</p>
            <p className="text-xs mt-1">
              Las dependencias aparecerán como sistemas externos en el diagrama C4
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
