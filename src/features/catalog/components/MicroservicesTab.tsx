import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { useAppStore } from '@/stores/appStore'
import { lookupDepsPackage } from '@/services/security/depsDevService'
import { DEPS_SYSTEMS } from '@/services/security/depsDevService'
import type { DepsPackageResult, DepsSystem } from '@/services/security/depsDevService'
import {
  Plus, Search, X, Pencil, Trash2, Server,
  Layers, ChevronDown, ChevronUp, Shield, Loader2,
  ExternalLink,
} from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import type { Technology, SupportStatus } from '@/types/domain'

const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60',
}

const statusLabel: Record<SupportStatus, string> = {
  active: 'Activo',
  extended: 'S. Extendido',
  eol: 'EOL',
  unknown: '?',
}

interface MicroservicesTabProps {
  applicationId: string
}

export function MicroservicesTab({ applicationId }: MicroservicesTabProps) {
  const microservices = useLiveQuery(
    () => db.microservices.where('applicationId').equals(applicationId).toArray(),
    [applicationId],
  ) ?? []
  const allTechnologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const { confirm } = useConfirm()

  const [showForm, setShowForm] = useState(false)
  const [editingMs, setEditingMs] = useState<string | null>(null)

  const handleDelete = async (msId: string) => {
    if (!(await confirm('¿Eliminar este microservicio?'))) return
    await db.microservices.delete(msId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-neutral-90 dark:text-white">
          Microservicios <span className="text-neutral-50 text-base font-normal">({microservices.length})</span>
        </h4>
        <button
          onClick={() => { setEditingMs(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          <Plus size={16} />
          Nuevo Microservicio
        </button>
      </div>

      <div className="space-y-3">
        {microservices.length === 0 && (
          <p className="text-sm text-neutral-50 dark:text-neutral-50">
            No hay microservicios registrados para esta aplicación.
          </p>
        )}

        {microservices.map((ms) => (
          <MicroserviceCard
            key={ms.id}
            microservice={ms}
            allTechnologies={allTechnologies}
            onEdit={() => { setEditingMs(ms.id); setShowForm(true) }}
            onDelete={() => handleDelete(ms.id)}
          />
        ))}
      </div>

      {showForm && (
        <MicroserviceFormModal
          applicationId={applicationId}
          editingId={editingMs}
          allTechnologies={allTechnologies}
          onClose={() => { setShowForm(false); setEditingMs(null) }}
        />
      )}
    </div>
  )
}

/* ─── Microservice Card ─── */

function MicroserviceCard({
  microservice: ms,
  allTechnologies,
  onEdit,
  onDelete,
}: {
  microservice: { id: string; name: string; description: string; technologies: string[] }
  allTechnologies: Technology[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const techs = allTechnologies.filter((t) => ms.technologies.includes(t.id))
  const eolCount = techs.filter((t) => t.supportStatus === 'eol').length

  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg bg-neutral-10 dark:bg-neutral-70/50 group">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Server size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-90 dark:text-white truncate">
                {ms.name}
              </span>
              {eolCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger shrink-0">
                  {eolCount} EOL
                </span>
              )}
            </div>
            {ms.description && (
              <p className="text-xs text-neutral-60 dark:text-neutral-40 truncate mt-0.5">
                {ms.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-50">{techs.length} tecnologías</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={onEdit}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 text-neutral-50 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded tech stack */}
      {expanded && (
        <div className="border-t border-neutral-20 dark:border-neutral-70 p-3 space-y-1.5">
          {techs.length === 0 ? (
            <p className="text-xs text-neutral-50">Sin tecnologías asignadas</p>
          ) : (
            techs.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers size={14} className="text-neutral-50 shrink-0" />
                  <span className="text-sm text-neutral-90 dark:text-white truncate">
                    {tech.name}
                  </span>
                  <span className="text-xs text-neutral-50 shrink-0">{tech.version}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                  {statusLabel[tech.supportStatus]}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Microservice Form Modal ─── */

function MicroserviceFormModal({
  applicationId,
  editingId,
  allTechnologies,
  onClose,
}: {
  applicationId: string
  editingId: string | null
  allTechnologies: Technology[]
  onClose: () => void
}) {
  const existing = useLiveQuery(
    () => db.microservices.get(editingId ?? ''),
    [editingId],
  )

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(existing?.technologies ?? [])
  const [techSearch, setTechSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [depsSystem, setDepsSystem] = useState<DepsSystem>('npm')
  const [depsSearching, setDepsSearching] = useState(false)
  const [depsError, setDepsError] = useState<string | null>(null)
  const [depsResult, setDepsResult] = useState<DepsPackageResult | null>(null)
  const [depsConfirming, setDepsConfirming] = useState<DepsPackageResult | null>(null)
  const [saving, setSaving] = useState(false)
  const { addNotification } = useAppStore()

  // Sync form when existing data loads
  if (existing && !name) {
    setName(existing.name)
    setDescription(existing.description)
    setSelectedTechIds(existing.technologies)
  }

  const selectedTechs = allTechnologies.filter((t) => selectedTechIds.includes(t.id))
  const availableTechs = allTechnologies.filter(
    (t) => !selectedTechIds.includes(t.id) &&
      (!techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase())),
  )

  const addTechnology = (techId: string) => {
    setSelectedTechIds((prev) => [...prev, techId])
    setTechSearch('')
    setShowDropdown(false)
  }

  const removeTechnology = (techId: string) => {
    setSelectedTechIds((prev) => prev.filter((id) => id !== techId))
  }

  const handleDepsSearch = async () => {
    if (!techSearch.trim()) return
    setDepsSearching(true)
    setDepsError(null)
    setDepsResult(null)
    try {
      const result = await lookupDepsPackage(techSearch.trim(), depsSystem)
      if (!result) {
        setDepsError('No se encontró el paquete en deps.dev')
        return
      }
      setDepsResult(result)
    } catch (err) {
      setDepsError(err instanceof Error ? err.message : 'Error al consultar deps.dev')
    } finally {
      setDepsSearching(false)
    }
  }

  const handleDepsSelect = async (result: DepsPackageResult) => {
    setDepsConfirming(result)
  }

  const handleDepsConfirm = async () => {
    const result = depsConfirming
    if (!result) return
    setDepsConfirming(null)
    setDepsSearching(true)

    try {
      const techId = crypto.randomUUID()
      const vendorLabel = DEPS_SYSTEMS.find((s) => s.value === result.system)?.label ?? result.system
      const newTech: Technology = {
        id: techId,
        name: result.name,
        version: result.version,
        category: 'library',
        vendor: vendorLabel,
        eolDate: null,
        supportStatus: result.supportStatus,
        cveList: result.cveList,
        metadata: {
          source: 'deps.dev',
          system: result.system,
          license: result.license,
          description: result.description,
          advisories: result.advisories,
          advisoryIds: result.advisoryIds,
        },
        createdAt: new Date(),
      }

      await db.technologies.add(newTech)
      setSelectedTechIds((prev) => [...prev, techId])
      setTechSearch('')
      setShowDropdown(false)
      setDepsResult(null)

      const vulnCount = result.cveList.length
      const advisoryCount = result.advisories.length
      addNotification({
        type: vulnCount > 0 ? 'warning' : 'success',
        message: `"${result.name}@${result.version}" (${vendorLabel}) agregado desde deps.dev` +
          (vulnCount > 0 ? ` · ${vulnCount} CVE, ${advisoryCount} advisories` : ' · sin vulnerabilidades'),
        duration: 5000,
      })
    } catch {
      addNotification({
        type: 'error',
        message: 'Error al crear la tecnología desde deps.dev',
        duration: 5000,
      })
    } finally {
      setDepsSearching(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        applicationId,
        name: name.trim(),
        description: description.trim(),
        technologies: selectedTechIds,
        updatedAt: new Date(),
      }

      if (editingId) {
        await db.microservices.update(editingId, data)
      } else {
        await db.microservices.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            {editingId ? 'Editar Microservicio' : 'Nuevo Microservicio'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <X size={20} className="text-neutral-50" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Nombre <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. auth-service, api-gateway"
            className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Descripción
          </label>
          <RichTextEditor
            value={description}
            onChange={(html) => setDescription(html)}
            placeholder="Propósito del microservicio..."
          />
        </div>

        {/* Technology Stack */}
        <div>
          <label className="block text-sm font-medium text-neutral-70 dark:text-neutral-30 mb-1.5">
            Stack Tecnológico
          </label>

          <div className="space-y-1.5 mb-3">
            {selectedTechs.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between p-2 bg-neutral-10 dark:bg-neutral-70 rounded-lg group">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers size={14} className="text-neutral-50 shrink-0" />
                  <span className="text-sm text-neutral-90 dark:text-white truncate">{tech.name}</span>
                  <span className="text-xs text-neutral-50">{tech.version}</span>
                  <span className="text-xs text-neutral-50">({tech.category})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[tech.supportStatus]}`}>
                    {statusLabel[tech.supportStatus]}
                  </span>
                  <button
                    onClick={() => removeTechnology(tech.id)}
                    className="p-0.5 rounded text-neutral-50 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {selectedTechs.length === 0 && (
              <p className="text-xs text-neutral-50">Selecciona las tecnologías que usa este microservicio</p>
            )}
          </div>

          {/* Add tech search */}
          <div className="relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
                <input
                  type="text"
                  placeholder={DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.placeholder ?? 'Buscar tecnología...'}
                  value={techSearch}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => { setTechSearch(e.target.value); setShowDropdown(true); setDepsError(null); setDepsResult(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !depsResult && !depsSearching && techSearch.trim()) { handleDepsSearch(); setShowDropdown(true) } }}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={depsSystem}
                onChange={(e) => { setDepsSystem(e.target.value as DepsSystem); setDepsResult(null); setDepsError(null) }}
                className="px-2 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
              >
                {DEPS_SYSTEMS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-80 border border-neutral-20 dark:border-neutral-70 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {availableTechs.length > 0 && availableTechs.map((tech) => (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => addTechnology(tech.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Plus size={14} className="text-primary shrink-0" />
                      <span className="text-neutral-90 dark:text-white truncate">{tech.name}</span>
                      <span className="text-neutral-50 shrink-0">{tech.version}</span>
                      <span className="text-xs text-neutral-50">({tech.vendor})</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusColors[tech.supportStatus]}`}>
                      {statusLabel[tech.supportStatus]}
                    </span>
                  </button>
                ))}

                {/* deps.dev section */}
                <div className="border-t border-neutral-20 dark:border-neutral-70">
                  {depsSearching ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-50">
                      <Loader2 size={14} className="animate-spin" />
                      Buscando en deps.dev ({DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.label})…
                    </div>
                  ) : depsResult ? (
                    <button
                      type="button"
                      onClick={() => handleDepsSelect(depsResult)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ExternalLink size={14} className="text-primary shrink-0" />
                        <span className="text-neutral-90 dark:text-white truncate">{depsResult.name}</span>
                        <span className="text-neutral-50 shrink-0">{depsResult.version}</span>
                        <span className="text-xs text-neutral-50">({DEPS_SYSTEMS.find((s) => s.value === depsResult.system)?.label ?? depsResult.system})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                        depsResult.supportStatus === 'eol' ? 'bg-danger/10 text-danger border-danger/30' :
                        depsResult.supportStatus === 'extended' ? 'bg-warning/10 text-warning border-warning/30' :
                        'bg-success/10 text-success border-success/30'
                      }`}>
                        {depsResult.supportStatus === 'eol' ? 'EOL' :
                         depsResult.supportStatus === 'extended' ? 'S. Extendido' : 'Activo'}
                      </span>
                    </button>
                  ) : depsError ? (
                    <div className="px-4 py-3">
                      <p className="text-xs text-danger mb-2">{depsError}</p>
                      <button
                        type="button"
                        onClick={handleDepsSearch}
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
                      >
                        <Shield size={14} />
                        Reintentar
                      </button>
                    </div>
                  ) : techSearch && availableTechs.length === 0 ? (
                    <div className="px-4 py-3">
                      <p className="text-sm text-neutral-50 mb-2">
                        No hay resultados locales para "{techSearch}"
                      </p>
                      <button
                        type="button"
                        onClick={handleDepsSearch}
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors"
                      >
                        <Shield size={14} />
                        Buscar en {DEPS_SYSTEMS.find((s) => s.value === depsSystem)?.label ?? depsSystem}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirm dialog for deps.dev result */}
        {depsConfirming && (
          <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20 dark:border-neutral-70 shadow-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Confirmar desde deps.dev</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-50">Sistema</span>
                  <span className="text-neutral-90 dark:text-white font-medium">{DEPS_SYSTEMS.find((s) => s.value === depsConfirming.system)?.label ?? depsConfirming.system}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-50">Paquete</span>
                  <span className="text-neutral-90 dark:text-white font-medium">{depsConfirming.name}@{depsConfirming.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-50">Licencia</span>
                  <span className="text-neutral-90 dark:text-white">{depsConfirming.license}</span>
                </div>
                {depsConfirming.description && (
                  <p className="text-neutral-60 text-xs mt-1">{depsConfirming.description}</p>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-50">CVEs</span>
                  <span className={depsConfirming.cveList.length > 0 ? 'text-danger font-medium' : 'text-success'}>
                    {depsConfirming.cveList.length || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-50">Advisories</span>
                  <span className={depsConfirming.advisories.length > 0 ? 'text-warning font-medium' : 'text-neutral-90 dark:text-white'}>
                    {depsConfirming.advisories.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-50">Estado</span>
                  <span className={`font-medium ${
                    depsConfirming.supportStatus === 'eol' ? 'text-danger' :
                    depsConfirming.supportStatus === 'extended' ? 'text-warning' : 'text-success'
                  }`}>
                    {depsConfirming.supportStatus === 'eol' ? 'EOL' :
                     depsConfirming.supportStatus === 'extended' ? 'Soporte Extendido' : 'Activo'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDepsConfirming(null)}
                  className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDepsConfirm}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Agregar Tecnología
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-70 dark:text-neutral-30 hover:bg-neutral-10 dark:hover:bg-neutral-70 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear Microservicio'}
          </button>
        </div>
      </div>
    </div>
  )
}
