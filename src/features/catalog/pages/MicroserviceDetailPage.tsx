import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useConfirm } from '@/hooks/useConfirm'
import {
  ArrowLeft,
  Server,
  ExternalLink,
  Save,
  BookOpen,
  Activity,
  Calendar,
  AlertTriangle,
  Shield,
  FileWarning,
  Database,
} from 'lucide-react'
import type {
  MicroserviceFeature,
  MicroserviceRoadmapItem,
  MicroserviceLifecycleStatus,
  ServiceLevel,
} from '@/types/domain'
import { EntitySection } from '../components/EntitySection'
import { MicroserviceInfoSection } from '../components/MicroserviceInfoSection'
import { MicroserviceDocsSection } from '../components/MicroserviceDocsSection'
import { MicroserviceDatabasesSection } from '../components/MicroserviceDatabasesSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { RoadmapSection } from '../components/RoadmapSection'
import { lifecycleLabel, lifecycleColor } from '../constants/microserviceConstants'

export function MicroserviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { confirm } = useConfirm()

  const isNew = !id
  const newAppId = isNew ? searchParams.get('appId') : null

  const ms = useLiveQuery(() => (id ? db.microservices.get(id) : undefined), [id])
  const app = useLiveQuery(
    () =>
      isNew && newAppId
        ? db.applications.get(newAppId)
        : ms
          ? db.applications.get(ms.applicationId)
          : undefined,
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
  const [activeSection, setActiveSection] = useState('info')

  const dbJunctions =
    useLiveQuery(
      () => (id ? db.appDatabaseMicroservices.where('microserviceId').equals(id).toArray() : []),
      [id],
    ) ?? []
  const vulnJunctions =
    useLiveQuery(
      () => (id ? db.vulnerabilityMicroservices.where('microserviceId').equals(id).toArray() : []),
      [id],
    ) ?? []
  const incJunctions =
    useLiveQuery(
      () => (id ? db.incidentMicroservices.where('microserviceId').equals(id).toArray() : []),
      [id],
    ) ?? []
  const riskJunctions =
    useLiveQuery(
      () => (id ? db.riskMicroservices.where('microserviceId').equals(id).toArray() : []),
      [id],
    ) ?? []
  const auditJunctions =
    useLiveQuery(
      () => (id ? db.auditFindingMicroservices.where('microserviceId').equals(id).toArray() : []),
      [id],
    ) ?? []

  const sectionCounts: Record<string, number> = {
    databases: dbJunctions.length,
    vulns: vulnJunctions.length,
    incidents: incJunctions.length,
    risks: riskJunctions.length,
    audit: auditJunctions.length,
    features: features.length,
    roadmap: roadmap.length,
  }

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

  const markDirty = () => {
    if (!dirty) setDirty(true)
  }

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

  const canGoBack = () =>
    dirty ? confirm('Hay cambios sin guardar. ¿Descartarlos?') : Promise.resolve(true)
  const handleBack = async () => {
    if (await canGoBack()) navigate(-1)
  }

  if (!isNew && !ms) {
    return (
      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <p className="text-muted">Microservicio no encontrado</p>
      </div>
    )
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
      <nav className="flex items-center gap-2 text-sm text-neutral-50">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 hover:text-neutral-90 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Volver
        </button>
        {app && (
          <>
            <span className="text-neutral-40">/</span>
            <button
              onClick={() => navigate(`/catalog/applications/${app.id}`)}
              className="hover:text-neutral-90 dark:hover:text-white transition-colors"
            >
              {app.name}
            </button>
          </>
        )}
        <span className="text-neutral-40">/</span>
        <span className="text-neutral-90 dark:text-white font-medium truncate max-w-[200px]">
          {isNew ? 'Nuevo Microservicio' : ms!.name}
        </span>
      </nav>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Server size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-90 dark:text-white flex items-center gap-3">
              {isNew ? 'Nuevo Microservicio' : ms!.name}
              {!isNew && (
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${lifecycleColor[lifecycleStatus]}`}
                >
                  {lifecycleLabel[lifecycleStatus]}
                </span>
              )}
            </h1>
            {app && (
              <button
                onClick={() => navigate(`/catalog/applications/${app.id}`)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors mt-0.5"
              >
                <ExternalLink size={14} /> {app.name}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isNew ? !name.trim() || saving : !dirty || saving || !name.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Guardando…' : isNew ? 'Crear Microservicio' : 'Guardar'}
        </button>
      </div>

      <div className="flex gap-8">
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
                <span className="truncate">{s.label}</span>
                <span
                  className={`ml-auto text-xs font-medium ${activeSection === s.id ? 'text-accent' : 'text-neutral-50'}`}
                >
                  {sectionCounts[s.id] ?? ''}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === 'info' && (
            <MicroserviceInfoSection
              {...{
                name,
                setName,
                description,
                setDescription,
                techIds,
                setTechIds,
                repository,
                setRepository,
                serviceLevel,
                setServiceLevel,
                technicalLead,
                setTechnicalLead,
                lifecycleStatus,
                setLifecycleStatus,
                decommissionPlan,
                setDecommissionPlan,
                markDirty,
                isNew,
              }}
            />
          )}
          {activeSection === 'docs' && (
            <MicroserviceDocsSection {...{ documentation, setDocumentation, markDirty }} />
          )}
          {activeSection === 'features' && (
            <FeaturesSection
              features={features}
              onChange={(fs) => {
                setFeatures(fs)
                markDirty()
              }}
            />
          )}
          {activeSection === 'roadmap' && (
            <RoadmapSection
              roadmap={roadmap}
              onChange={(r) => {
                setRoadmap(r)
                markDirty()
              }}
            />
          )}
          {activeSection === 'databases' && ms && (
            <MicroserviceDatabasesSection microserviceId={ms.id} applicationId={ms.applicationId} />
          )}
          {activeSection === 'vulns' && ms && (
            <EntitySection
              title="Vulnerabilidades Asociadas"
              entityType="vulns"
              microserviceId={ms.id}
            />
          )}
          {activeSection === 'incidents' && ms && (
            <EntitySection
              title="Incidentes Asociados"
              entityType="incidents"
              microserviceId={ms.id}
            />
          )}
          {activeSection === 'risks' && ms && (
            <EntitySection title="Riesgos Asociados" entityType="risks" microserviceId={ms.id} />
          )}
          {activeSection === 'audit' && ms && (
            <EntitySection
              title="Hallazgos de Auditoría Asociados"
              entityType="audit"
              microserviceId={ms.id}
            />
          )}
        </div>
      </div>
    </div>
  )
}
