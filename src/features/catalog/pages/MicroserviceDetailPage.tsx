import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import { TechSearch } from '@/components/ui/TechSearch'
import { Select } from '@/components/ui/Select'
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { RichTextViewer } from '@/components/rich-text/RichTextViewer'
import {
  ArrowLeft, Server, ExternalLink, Save, Plus,
  Check, Trash2, BookOpen, GitBranch,
  Calendar, AlertTriangle, Shield,
  Activity, FileWarning, Database,
} from 'lucide-react'
import type { MicroserviceFeature, MicroserviceRoadmapItem, MicroserviceLifecycleStatus, ServiceLevel } from '@/types/domain'
import { EntityAssociationList, type EntityType } from '@/features/catalog/components/EntityAssociationList'
import { DatabaseAssociationList } from '@/features/catalog/components/DatabaseAssociationList'

const lifecycleLabel: Record<MicroserviceLifecycleStatus, string> = {
  active: 'Activo',
  evolving: 'En Evolución',
  deprecated: 'Deprecado',
  decommissioned: 'Decomisionado',
  planned: 'Planificado',
}

const lifecycleColor: Record<MicroserviceLifecycleStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  evolving: 'bg-info/10 text-info border-info/30',
  deprecated: 'bg-warning/10 text-warning border-warning/30',
  decommissioned: 'bg-danger/10 text-danger border-danger/30',
  planned: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
}

const serviceLevelLabel: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

function EntitySection({ title, entityType, microserviceId }: { title: string; entityType: EntityType; microserviceId: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-90 dark:text-white">{title}</h2>
      <div className="bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-xl p-5">
        <EntityAssociationList entityType={entityType} microserviceId={microserviceId} />
      </div>
    </div>
  )
}

export function MicroserviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const isNew = !id
  const newAppId = isNew ? searchParams.get('appId') : null

  const ms = useLiveQuery(() => (id ? db.microservices.get(id) : undefined), [id])
  const app = useLiveQuery(
    () => isNew && newAppId ? db.applications.get(newAppId) : (ms ? db.applications.get(ms.applicationId) : undefined),
    [isNew, newAppId, ms?.applicationId],
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [techIds, setTechIds] = useState<string[]>([])
  const [technicalLead, setTechnicalLead] = useState('')
  const [repository, setRepository] = useState('')
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('medium')
  const [documentation, setDocumentation] = useState('')
  const [features, setFeatures] = useState<MicroserviceFeature[]>([])
  const [roadmap, setRoadmap] = useState<MicroserviceRoadmapItem[]>([])
  const [lifecycleStatus, setLifecycleStatus] = useState<MicroserviceLifecycleStatus>('active')
  const [decommissionPlan, setDecommissionPlan] = useState('')

  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('info')
  const [newFeatureOpen, setNewFeatureOpen] = useState(false)
  const [newRoadmapOpen, setNewRoadmapOpen] = useState(false)
  const [featureForm, setFeatureForm] = useState({ name: '', description: '', category: 'other' as MicroserviceFeature['category'] })
  const [roadmapForm, setRoadmapForm] = useState({ title: '', description: '', type: 'upgrade' as MicroserviceRoadmapItem['type'], priority: 'medium' as MicroserviceRoadmapItem['priority'], targetDate: '' })

  const dbJunctions = useLiveQuery(
    () => id ? db.appDatabaseMicroservices.where('microserviceId').equals(id).toArray() : [],
    [id],
  ) ?? []
  const vulnJunctions = useLiveQuery(
    () => id ? db.vulnerabilityMicroservices.where('microserviceId').equals(id).toArray() : [],
    [id],
  ) ?? []
  const incJunctions = useLiveQuery(
    () => id ? db.incidentMicroservices.where('microserviceId').equals(id).toArray() : [],
    [id],
  ) ?? []
  const riskJunctions = useLiveQuery(
    () => id ? db.riskMicroservices.where('microserviceId').equals(id).toArray() : [],
    [id],
  ) ?? []
  const auditJunctions = useLiveQuery(
    () => id ? db.auditFindingMicroservices.where('microserviceId').equals(id).toArray() : [],
    [id],
  ) ?? []

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []

  const memberOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    for (const team of teams) {
      for (const member of team.members ?? []) {
        if (member.displayName) {
          options.push({ value: member.displayName, label: `${member.displayName} — ${team.name}` })
        }
      }
    }
    const seen = new Set<string>()
    return options.filter((o) => {
      if (seen.has(o.value)) return false
      seen.add(o.value)
      return true
    }).sort((a, b) => a.label.localeCompare(b.label))
  }, [teams])

  const sectionCounts: Record<string, number> = {
    databases: dbJunctions.length,
    vulns: vulnJunctions.length,
    incidents: incJunctions.length,
    risks: riskJunctions.length,
    audit: auditJunctions.length,
    features: features.length,
    roadmap: roadmap.length,
  }

  // Load ms data into form state
  if (ms && !dirty && !name) {
    setName(ms.name)
    setDescription(ms.description)
    setTechIds(ms.technologies)
    setTechnicalLead(ms.technicalLead ?? '')
    setRepository(ms.repository ?? '')
    setServiceLevel(ms.serviceLevel ?? 'medium')
    setDocumentation(ms.documentation ?? '')
    setFeatures(ms.features ?? [])
    setRoadmap(ms.roadmap ?? [])
    setLifecycleStatus(ms.lifecycleStatus ?? 'active')
    setDecommissionPlan(ms.decommissionPlan ?? '')
  }

  const markDirty = () => { if (!dirty) setDirty(true) }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        technologies: techIds,
        technicalLead: technicalLead.trim(),
        repository: repository.trim(),
        serviceLevel,
        documentation,
        features,
        roadmap,
        lifecycleStatus,
        decommissionPlan,
        updatedAt: new Date(),
      }

      if (isNew) {
        if (!newAppId) return
        const newId = crypto.randomUUID()
        await db.microservices.add({
          id: newId,
          applicationId: newAppId,
          ...data,
          createdAt: new Date(),
        })
        navigate(`/catalog/microservices/${newId}`)
      } else {
        await db.microservices.update(id!, data)
        setDirty(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const canGoBack = () => {
    if (dirty) return confirm('Hay cambios sin guardar. ¿Descartarlos?')
    return Promise.resolve(true)
  }

  const handleBack = async () => {
    if (await canGoBack()) navigate(-1)
  }

  const addFeature = () => {
    if (!featureForm.name.trim()) return
    const newFeat: MicroserviceFeature = {
      id: crypto.randomUUID(),
      name: featureForm.name.trim(),
      description: featureForm.description.trim(),
      status: 'planned',
      category: featureForm.category,
    }
    setFeatures([...features, newFeat])
    setFeatureForm({ name: '', description: '', category: 'other' })
    setNewFeatureOpen(false)
    markDirty()
  }

  const removeFeature = (featId: string) => {
    setFeatures(features.filter((f) => f.id !== featId))
    markDirty()
  }

  const toggleFeatureStatus = (featId: string) => {
    setFeatures(features.map((f) => {
      if (f.id !== featId) return f
      const cycle: MicroserviceFeature['status'][] = ['planned', 'in_progress', 'active', 'deprecated']
      const idx = cycle.indexOf(f.status)
      return { ...f, status: cycle[(idx + 1) % cycle.length] }
    }))
    markDirty()
  }

  const addRoadmapItem = () => {
    if (!roadmapForm.title.trim()) return
    const item: MicroserviceRoadmapItem = {
      id: crypto.randomUUID(),
      title: roadmapForm.title.trim(),
      description: roadmapForm.description.trim(),
      type: roadmapForm.type,
      priority: roadmapForm.priority,
      targetDate: roadmapForm.targetDate || null,
      status: 'planned',
    }
    setRoadmap([...roadmap, item])
    setRoadmapForm({ title: '', description: '', type: 'upgrade', priority: 'medium', targetDate: '' })
    setNewRoadmapOpen(false)
    markDirty()
  }

  const removeRoadmapItem = (itemId: string) => {
    setRoadmap(roadmap.filter((r) => r.id !== itemId))
    markDirty()
  }

  const toggleRoadmapStatus = (itemId: string) => {
    setRoadmap(roadmap.map((r) => {
      if (r.id !== itemId) return r
      const cycle: MicroserviceRoadmapItem['status'][] = ['planned', 'in_progress', 'completed', 'cancelled']
      const idx = cycle.indexOf(r.status)
      return { ...r, status: cycle[(idx + 1) % cycle.length] }
    }))
    markDirty()
  }

  if (!isNew && !ms) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <p className="text-muted">Microservicio no encontrado</p>
      </div>
    )
  }

  const featureStatusColor: Record<string, string> = {
    planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
    in_progress: 'bg-info/10 text-info',
    active: 'bg-success/10 text-success',
    deprecated: 'bg-warning/10 text-warning',
  }

  const roadmapStatusColor: Record<string, string> = {
    planned: 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60',
    in_progress: 'bg-info/10 text-info',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger',
  }

  const roadmapPriorityColor: Record<string, string> = {
    critical: 'text-danger',
    high: 'text-warning',
    medium: 'text-info',
    low: 'text-neutral-50',
  }

  const allSections = [
    { id: 'info', label: 'Info General', icon: Server },
    { id: 'docs', label: 'Documentación', icon: BookOpen },
    { id: 'features', label: 'Funcionalidades', icon: Activity },
    { id: 'roadmap', label: 'Hoja de Ruta', icon: Calendar },
    { id: 'databases', label: 'Bases de Datos', icon: Database },
    { id: 'vulns', label: 'Vulnerabilidades', icon: Shield },
    { id: 'incidents', label: 'Incidentes', icon: AlertTriangle },
    { id: 'risks', label: 'Riesgos', icon: FileWarning },
    { id: 'audit', label: 'Hallazgos Auditoría', icon: BookOpen },
  ]
  const sections = isNew
    ? allSections.filter((s) => ['info', 'docs', 'features', 'roadmap'].includes(s.id))
    : allSections

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-50">
        <button onClick={handleBack} className="flex items-center gap-1 hover:text-neutral-90 dark:hover:text-white transition-colors">
          <ArrowLeft size={14} />
          Volver
        </button>
        {app && (
          <>
            <span className="text-neutral-40">/</span>
            <button onClick={() => navigate(`/catalog/applications/${app.id}`)} className="hover:text-neutral-90 dark:hover:text-white transition-colors">
              {app.name}
            </button>
          </>
        )}
        <span className="text-neutral-40">/</span>
        <span className="text-neutral-90 dark:text-white font-medium truncate max-w-[200px]">
          {isNew ? 'Nuevo Microservicio' : ms!.name}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Server size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white flex items-center gap-3">
              {isNew ? 'Nuevo Microservicio' : ms!.name}
              {!isNew && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${lifecycleColor[lifecycleStatus]}`}>
                  {lifecycleLabel[lifecycleStatus]}
                </span>
              )}
            </h1>
            {app && (
              <button
                onClick={() => navigate(`/catalog/applications/${app.id}`)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors mt-0.5"
              >
                <ExternalLink size={14} />
                {app.name}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isNew ? (!name.trim() || saving) : (!dirty || saving || !name.trim())}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Guardando…' : isNew ? 'Crear Microservicio' : 'Guardar'}
        </button>
      </div>

      {/* Layout: Sidebar tabs + Content */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-44 shrink-0 space-y-1">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm transition-all ${
                  activeSection === s.id
                    ? 'bg-accent/10 text-accent font-medium shadow-sm'
                    : 'text-muted hover:text-neutral-90 dark:hover:text-white hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate flex-1 text-left">{s.label}</span>
                {sectionCounts[s.id] !== undefined && (
                  <span className={`text-xs font-medium tabular-nums shrink-0 ${
                    activeSection === s.id
                      ? 'text-accent'
                      : 'text-neutral-50 dark:text-neutral-50'
                  }`}>
                    {sectionCounts[s.id]}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-card rounded-xl border border-boundary shadow-sm p-8">
          {activeSection === 'info' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Información General</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); markDirty() }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <Select
                    label="Responsable Técnico"
                    value={technicalLead}
                    onChange={(v) => { setTechnicalLead(v); markDirty() }}
                    options={[
                      { value: '', label: 'Sin asignar' },
                      ...memberOptions,
                    ]}
                    placeholder="Seleccionar responsable"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Repositorio</label>
                  <div className="relative">
                    <GitBranch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
                    <input
                      type="text"
                      value={repository}
                      onChange={(e) => { setRepository(e.target.value); markDirty() }}
                      placeholder="https://github.com/org/repo"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Nivel de Servicio</label>
                  <select
                    value={serviceLevel}
                    onChange={(e) => { setServiceLevel(e.target.value as ServiceLevel); markDirty() }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(serviceLevelLabel).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Stack Tecnológico</label>
                <TechSearch selectedIds={techIds} onChange={(ids) => { setTechIds(ids); markDirty() }} enableDepsSearch />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Descripción</label>
                <RichTextEditor
                  value={description}
                  onChange={(html) => { setDescription(html); markDirty() }}
                  placeholder="Propósito y responsabilidades del microservicio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Estado del Ciclo de Vida</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(lifecycleLabel) as [MicroserviceLifecycleStatus, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setLifecycleStatus(key); markDirty() }}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        lifecycleStatus === key
                          ? `${lifecycleColor[key]} border-current font-medium`
                          : 'border-neutral-30 dark:border-neutral-60 text-muted hover:border-neutral-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(lifecycleStatus === 'decommissioned' || lifecycleStatus === 'deprecated') && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-warning" />
                    <label className="text-sm font-medium text-secondary">
                      Plan de Decomiso
                    </label>
                  </div>
                  <RichTextEditor
                    value={decommissionPlan}
                    onChange={(html) => { setDecommissionPlan(html); markDirty() }}
                    placeholder="Describe el plan de migración, datos a preservar, timelines, responsables..."
                  />
                  {decommissionPlan && (
                    <div className="mt-4 p-4 border border-warning/20 rounded-xl bg-warning/5">
                      <p className="text-xs font-medium text-warning uppercase tracking-wider mb-2">Plan registrado</p>
                      <RichTextViewer content={decommissionPlan} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSection === 'docs' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Documentación Técnica</h2>
              <p className="text-sm text-neutral-50">
                Documentación técnica del microservicio: arquitectura, API, integraciones, decisiones técnicas.
              </p>
              <RichTextEditor
                value={documentation}
                onChange={(html) => { setDocumentation(html); markDirty() }}
                placeholder="## Arquitectura&#10;&#10;Describe la arquitectura del microservicio...&#10;&#10;## API&#10;&#10;Endpoints principales...&#10;&#10;## Integraciones&#10;&#10;Sistemas con los que se comunica..."
              />
            </div>
          )}

          {activeSection === 'features' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Funcionalidades</h2>
                <button
                  onClick={() => setNewFeatureOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                >
                  <Plus size={14} />
                  Añadir funcionalidad
                </button>
              </div>

              {newFeatureOpen && (
                <div className="border border-boundary rounded-xl p-4 space-y-3 bg-card shadow-sm">
                  <div>
                    <label className="block text-xs font-medium text-neutral-50 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={featureForm.name}
                      onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                      placeholder="ej. Autenticación OAuth2"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-50 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={featureForm.description}
                      onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                      placeholder="Breve descripción"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={featureForm.category}
                      onChange={(e) => setFeatureForm({ ...featureForm, category: e.target.value as MicroserviceFeature['category'] })}
                      className="px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="api">API</option>
                      <option value="integration">Integración</option>
                      <option value="performance">Performance</option>
                      <option value="security">Seguridad</option>
                      <option value="observability">Observabilidad</option>
                      <option value="business">Funcionalidad</option>
                      <option value="other">Otro</option>
                    </select>
                    <button onClick={addFeature} className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
                      Agregar
                    </button>
                    <button onClick={() => setNewFeatureOpen(false)} className="px-3 py-1.5 text-sm text-neutral-50 hover:text-neutral-70 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {features.length === 0 && !newFeatureOpen && (
                <p className="text-sm text-neutral-50">Sin funcionalidades registradas. Añade la primera para describir las capacidades de este microservicio.</p>
              )}

              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-boundary bg-card shadow-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-90 dark:text-white">{f.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${featureStatusColor[f.status]}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            f.status === 'active' ? 'bg-current' :
                            f.status === 'in_progress' ? 'bg-current' :
                            f.status === 'deprecated' ? 'bg-current' : 'bg-current opacity-50'
                          }`} />
                          {f.status === 'planned' ? 'Planificado' : f.status === 'in_progress' ? 'En Progreso' : f.status === 'active' ? 'Activo' : 'Deprecado'}
                        </span>
                        <span className="text-xs text-neutral-50 capitalize">{f.category}</span>
                      </div>
                      {f.description && <p className="text-xs text-muted mt-0.5">{f.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => toggleFeatureStatus(f.id)}
                        className="p-1 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Cambiar estado"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => removeFeature(f.id)}
                        className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Eliminar funcionalidad"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'roadmap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Hoja de Ruta</h2>
                <button
                  onClick={() => setNewRoadmapOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                >
                  <Plus size={14} />
                  Añadir Item
                </button>
              </div>

              {newRoadmapOpen && (
                <div className="border border-boundary rounded-xl p-4 space-y-3 bg-card shadow-sm">
                  <div>
                    <label className="block text-xs font-medium text-neutral-50 mb-1">Título</label>
                    <input
                      type="text"
                      value={roadmapForm.title}
                      onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                      placeholder="ej. Migrar a PostgreSQL 16"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-50 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={roadmapForm.description}
                      onChange={(e) => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
                      placeholder="Detalle del plan"
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-50 mb-1">Tipo</label>
                      <select
                        value={roadmapForm.type}
                        onChange={(e) => setRoadmapForm({ ...roadmapForm, type: e.target.value as MicroserviceRoadmapItem['type'] })}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="upgrade">Upgrade</option>
                        <option value="migration">Migración</option>
                        <option value="decommission">Decomiso</option>
                        <option value="feature">Funcionalidad</option>
                        <option value="security">Seguridad</option>
<option value="performance">Rendimiento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-50 mb-1">Prioridad</label>
                      <select
                        value={roadmapForm.priority}
                        onChange={(e) => setRoadmapForm({ ...roadmapForm, priority: e.target.value as MicroserviceRoadmapItem['priority'] })}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="critical">Crítica</option>
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-50 mb-1">Fecha Objetivo</label>
                      <input
                        type="date"
                        value={roadmapForm.targetDate}
                        onChange={(e) => setRoadmapForm({ ...roadmapForm, targetDate: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={addRoadmapItem} className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors">
                      Agregar
                    </button>
                    <button onClick={() => setNewRoadmapOpen(false)} className="px-3 py-1.5 text-sm text-neutral-50 hover:text-neutral-70 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {roadmap.length === 0 && !newRoadmapOpen && (
                <p className="text-sm text-neutral-50">Sin items de roadmap. Planifica actualizaciones, migraciones o decomisos.</p>
              )}

              <div className="space-y-2">
                {roadmap.map((item) => {
                  const isOverdue = item.targetDate && new Date(item.targetDate) < new Date() && item.status !== 'completed' && item.status !== 'cancelled'
                  return (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-boundary bg-card shadow-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-neutral-90 dark:text-white">{item.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${roadmapStatusColor[item.status]}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              item.status === 'completed' || item.status === 'in_progress' ? 'bg-current' : 'bg-current opacity-50'
                            }`} />
                            {item.status === 'planned' ? 'Planificado' : item.status === 'in_progress' ? 'En Progreso' : item.status === 'completed' ? 'Completado' : 'Cancelado'}
                          </span>
                          <span className={`text-xs font-medium ${roadmapPriorityColor[item.priority]} flex items-center gap-1`}>
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              item.priority === 'critical' ? 'bg-danger' :
                              item.priority === 'high' ? 'bg-warning' :
                              item.priority === 'medium' ? 'bg-info' : 'bg-neutral-40'
                            }`} />
                            {item.priority}
                          </span>
                          <span className="text-xs text-neutral-50 capitalize bg-neutral-10 dark:bg-neutral-70 px-1.5 py-0.5 rounded">{item.type}</span>
                          {isOverdue && <span className="text-xs text-danger font-medium">Vencido</span>}
                        </div>
                        {item.description && <p className="text-xs text-muted mt-0.5">{item.description}</p>}
                        {item.targetDate && (
                          <p className="text-xs text-neutral-50 mt-0.5">
                            <Calendar size={12} className="inline mr-0.5" />
                            {new Date(item.targetDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => toggleRoadmapStatus(item.id)}
                          className="p-1 rounded text-neutral-50 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Cambiar estado"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => removeRoadmapItem(item.id)}
                          className="p-1 rounded text-neutral-50 hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Eliminar item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'databases' && ms && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Bases de Datos Asociadas</h2>
              <div className="bg-neutral-5 dark:bg-neutral-85 border border-boundary rounded-xl p-5">
                <DatabaseAssociationList microserviceId={ms.id} applicationId={ms.applicationId} />
              </div>
            </div>
          )}

          {activeSection === 'vulns' && ms && (
            <EntitySection title="Vulnerabilidades Asociadas" entityType="vulns" microserviceId={ms.id} />
          )}

          {activeSection === 'incidents' && ms && (
            <EntitySection title="Incidentes Asociados" entityType="incidents" microserviceId={ms.id} />
          )}

          {activeSection === 'risks' && ms && (
            <EntitySection title="Riesgos Asociados" entityType="risks" microserviceId={ms.id} />
          )}

          {activeSection === 'audit' && ms && (
            <EntitySection title="Hallazgos de Auditoría Asociados" entityType="audit" microserviceId={ms.id} />
          )}
        </div>
      </div>
    </div>
  )
}
