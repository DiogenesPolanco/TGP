import { useState, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { createShareLink } from '@/services/share/publicShareService'
import { TermsModal } from '@/components/sharing/TermsModal'
import { PassphraseModal } from '@/components/sharing/PassphraseModal'
import { isTermsAccepted, acceptTerms } from '@/services/share/termsService'
import { encryptData } from '@/services/share/encryptionService'
import { ShareUrlBanner } from '@/components/sharing/ShareUrlBanner'
import { Download, Upload, Share2, Trash2, Eye, Pencil, Server } from 'lucide-react'
import type { Microservice, MicroserviceLifecycleStatus } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import {
  lifecycleLabel,
  lifecycleColor,
  lifecycleDotColor,
  lifecycleIcon,
} from '../components/microserviceConstants'
import { MicroserviceFilterBar } from '../components/MicroserviceFilterBar'
import { MicroserviceStatCards } from '../components/MicroserviceStatCards'

export function MicroservicesPage() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterLifecycle, setFilterLifecycle] = useState('')
  const [filterApp, setFilterApp] = useState('')
  const [filterRisk, setFilterRisk] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [sharePending, setSharePending] = useState<any>(null)

  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])

  const appMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const app of applications) map.set(app.id, app.name)
    return map
  }, [applications])

  const rawVulnJunction = useLiveQuery(() => db.vulnerabilityMicroservices.toArray())
  const vulnJunction = useMemo(() => rawVulnJunction ?? [], [rawVulnJunction])
  const rawIncidentJunction = useLiveQuery(() => db.incidentMicroservices.toArray())
  const incidentJunction = useMemo(() => rawIncidentJunction ?? [], [rawIncidentJunction])
  const rawAuditJunction = useLiveQuery(() => db.auditFindingMicroservices.toArray())
  const auditJunction = useMemo(() => rawAuditJunction ?? [], [rawAuditJunction])
  const rawRiskJunction = useLiveQuery(() => db.riskMicroservices.toArray())
  const riskJunction = useMemo(() => rawRiskJunction ?? [], [rawRiskJunction])
  const rawTechnologies = useLiveQuery(() => db.technologies.toArray())
  const technologies = useMemo(() => rawTechnologies ?? [], [rawTechnologies])

  const riskMap = useMemo(() => {
    const eolTechIds = new Set(
      technologies.filter((t) => t.supportStatus === 'eol').map((t) => t.id),
    )
    const vulns = new Map<string, number>()
    const incidents = new Map<string, number>()
    const audits = new Map<string, number>()
    const risks = new Map<string, number>()
    const eolCount = new Map<string, number>()

    for (const j of vulnJunction)
      vulns.set(j.microserviceId, (vulns.get(j.microserviceId) ?? 0) + 1)
    for (const j of incidentJunction)
      incidents.set(j.microserviceId, (incidents.get(j.microserviceId) ?? 0) + 1)
    for (const j of auditJunction)
      audits.set(j.microserviceId, (audits.get(j.microserviceId) ?? 0) + 1)
    for (const j of riskJunction)
      risks.set(j.microserviceId, (risks.get(j.microserviceId) ?? 0) + 1)
    for (const ms of microservices) {
      const count = (ms.technologies ?? []).filter((tId) => eolTechIds.has(tId)).length
      if (count > 0) eolCount.set(ms.id, count)
    }
    return { vulns, incidents, audits, risks, eolCount }
  }, [technologies, vulnJunction, incidentJunction, auditJunction, riskJunction, microservices])

  const riskStats = useMemo(
    () => ({
      withEol: riskMap.eolCount.size,
      withVuln: riskMap.vulns.size,
      withIncident: riskMap.incidents.size,
      withAudit: riskMap.audits.size,
      withRisk: riskMap.risks.size,
    }),
    [riskMap],
  )

  const filteredItems = useMemo(() => {
    return microservices.filter((ms) => {
      const matchesSearch =
        !searchTerm ||
        ms.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ms.technicalLead ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ms.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLifecycle = !filterLifecycle || ms.lifecycleStatus === filterLifecycle
      const matchesApp = !filterApp || ms.applicationId === filterApp
      if (filterRisk === 'eol' && (riskMap.eolCount.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'vuln' && (riskMap.vulns.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'incident' && (riskMap.incidents.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'audit' && (riskMap.audits.get(ms.id) ?? 0) === 0) return false
      if (filterRisk === 'risk' && (riskMap.risks.get(ms.id) ?? 0) === 0) return false
      return matchesSearch && matchesLifecycle && matchesApp
    })
  }, [microservices, searchTerm, filterLifecycle, filterApp, filterRisk, riskMap])

  const handleDelete = async (id: string) => {
    if (await confirm('¿Está seguro de eliminar este microservicio?')) {
      await db.microservices.delete(id)
      addNotification({ type: 'success', message: 'Microservicio eliminado correctamente' })
    }
  }

  const handleExport = () => {
    if (filteredItems.length === 0) {
      addNotification({ type: 'warning', message: 'No hay microservicios para exportar' })
      return
    }
    const data = filteredItems.map((ms) => ({
      name: ms.name,
      description: ms.description,
      application: appMap.get(ms.applicationId) ?? '',
      technicalLead: ms.technicalLead ?? '',
      lifecycleStatus: ms.lifecycleStatus ?? '',
      technologies: ms.technologies?.length ?? 0,
      repository: ms.repository ?? '',
      createdAt: ms.createdAt?.toISOString?.() ?? '',
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `microservicios-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ type: 'success', message: `${data.length} microservicios exportados` })
  }

  const doShare = useCallback(async () => {
    setSharePending({
      microservices: filteredItems.map((ms) => ({
        id: ms.id,
        name: ms.name,
        description: ms.description,
        application: appMap.get(ms.applicationId) ?? '',
        technicalLead: ms.technicalLead ?? '',
        lifecycleStatus: ms.lifecycleStatus ?? '',
        technologiesCount: ms.technologies?.length ?? 0,
      })),
      exportedAt: new Date().toISOString(),
    })
    setShowPassphrase(true)
  }, [filteredItems, appMap])

  const iconForStatus = (status: MicroserviceLifecycleStatus | undefined) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-10 dark:bg-neutral-70 text-neutral-50 dark:text-neutral-40">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-40" />
          Sin estado
        </span>
      )
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${lifecycleColor[status] || 'bg-neutral-10 dark:bg-neutral-70 text-muted'}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${lifecycleDotColor[status] || 'bg-neutral-40'}`}
        />
        <span className="shrink-0">{lifecycleIcon[status]}</span>
        {lifecycleLabel[status] || status}
      </span>
    )
  }

  const alertBadges = (ms: Microservice) => {
    const items = [
      { label: 'EOL', count: riskMap.eolCount.get(ms.id) ?? 0, color: 'bg-danger' },
      { label: 'Vuln', count: riskMap.vulns.get(ms.id) ?? 0, color: 'bg-severity-high' },
      { label: 'Inc', count: riskMap.incidents.get(ms.id) ?? 0, color: 'bg-warning' },
      { label: 'Aud', count: riskMap.audits.get(ms.id) ?? 0, color: 'bg-info' },
      { label: 'Riesgo', count: riskMap.risks.get(ms.id) ?? 0, color: 'bg-purple-500' },
    ]
    const active = items.filter((i) => i.count > 0)
    return active.length > 0 ? (
      <div className="flex items-center gap-1.5 flex-wrap">
        {active.map((i) => (
          <span
            key={i.label}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-10 dark:bg-neutral-70 text-secondary border border-neutral-20 dark:border-neutral-60"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${i.color}`} />
            {i.label} {i.count}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-xs text-neutral-50">Sin alertas</span>
    )
  }

  const columns: Column<Microservice>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      render: (ms) => (
        <>
          <Link
            to={`/catalog/microservices/${ms.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {ms.name}
          </Link>
          {ms.description && (
            <p className="text-xs text-neutral-50 mt-0.5 line-clamp-1">
              {ms.description.replace(/<[^>]*>/g, '').slice(0, 120)}
            </p>
          )}
        </>
      ),
    },
    {
      key: 'apps',
      label: 'Apps',
      sortable: true,
      render: (ms) => {
        const appName = appMap.get(ms.applicationId)
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${appName ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}
            >
              {appName ? 1 : 0}
            </span>
            {appName ? (
              <Link
                to={`/catalog/applications/${ms.applicationId}`}
                className="text-sm text-secondary hover:text-primary"
              >
                {appName}
              </Link>
            ) : (
              <span className="text-sm text-neutral-50">Sin app</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'technicalLead',
      label: 'Tech Lead',
      sortable: true,
      render: (ms) => <span className="text-sm text-secondary">{ms.technicalLead || '—'}</span>,
    },
    {
      key: 'lifecycleStatus',
      label: 'Estado',
      sortable: true,
      render: (ms) => iconForStatus(ms.lifecycleStatus as MicroserviceLifecycleStatus),
    },
    {
      key: 'technologies',
      label: 'Tecnologías',
      render: (ms) => (
        <span className="text-sm text-secondary">{ms.technologies?.length ?? 0} techs</span>
      ),
    },
    {
      key: 'indicators',
      label: 'Alertas',
      className: 'min-w-[120px]',
      render: (ms) => alertBadges(ms),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (ms) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/catalog/microservices/${ms.id}`}
            className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <Eye size={16} className="text-muted" />
          </Link>
          <Button
            onClick={() => navigate(`/catalog/microservices/${ms.id}`)}
            className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <Pencil size={16} className="text-muted" />
          </Button>
          <Button
            onClick={() => handleDelete(ms.id)}
            className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
          >
            <Trash2 size={16} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">
          Catálogo de Microservicios
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/catalog/microservices/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
          >
            <Server size={16} /> Nuevo Microservicio
          </Button>
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70"
          >
            <Upload size={16} /> Importar
          </Button>
          <Button
            onClick={async () => {
              if (!isTermsAccepted()) {
                setShowTerms(true)
                return
              }
              await doShare()
            }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70"
          >
            <Share2 size={16} /> Compartir
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70"
          >
            <Download size={16} /> Exportar
          </Button>
        </div>
      </div>

      {shareUrl && (
        <ShareUrlBanner
          url={shareUrl}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        />
      )}

      {showTerms && (
        <TermsModal
          onAccept={() => {
            acceptTerms()
            setShowTerms(false)
            doShare()
          }}
          onClose={() => setShowTerms(false)}
        />
      )}
      {showPassphrase && (
        <PassphraseModal
          title="Proteger enlace compartido"
          buttonLabel="Proteger"
          description="Opcional: agrega una contraseña para cifrar los datos."
          onSubmit={async (pass) => {
            const payload = pass ? await encryptData(sharePending, pass) : sharePending
            const { url } = await createShareLink(48, 'dashboard', undefined, payload)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onSkip={async () => {
            const { url } = await createShareLink(48, 'dashboard', undefined, sharePending)
            setShareUrl(url)
            setShowPassphrase(false)
            setSharePending(null)
          }}
          onClose={() => {
            setShowPassphrase(false)
            setSharePending(null)
          }}
        />
      )}

      <MicroserviceStatCards
        total={microservices.length}
        riskStats={riskStats}
        filterRisk={filterRisk}
        onFilterRisk={setFilterRisk}
      />

      <MicroserviceFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filterLifecycle={filterLifecycle}
        onFilterLifecycleChange={setFilterLifecycle}
        filterApp={filterApp}
        onFilterAppChange={setFilterApp}
        onClearFilters={() => {
          setFilterLifecycle('')
          setFilterApp('')
        }}
        hasActiveFilters={!!filterLifecycle || !!filterApp}
        applications={applications}
      />

      {!rawMicroservices ? (
        <SkeletonTable rows={8} />
      ) : filteredItems.length === 0 ? (
        <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm">
          <EmptyState
            icon={<Server size={22} className="text-neutral-50" />}
            title={
              searchTerm || filterLifecycle || filterApp
                ? 'Sin resultados'
                : 'No hay microservicios registrados'
            }
            description={
              searchTerm || filterLifecycle || filterApp
                ? 'Intenta con otros filtros o términos de búsqueda'
                : 'Los microservicios se crean desde la aplicación a la que pertenecen'
            }
          />
        </div>
      ) : (
        <SortableTable
          columns={columns}
          data={filteredItems}
          onRowClick={(ms) => navigate(`/catalog/microservices/${ms.id}`)}
          emptyMessage="No se encontraron microservicios"
        />
      )}
    </div>
  )
}
