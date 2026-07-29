import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { formatDuration } from '@/utils/technologyUtils'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Upload,
  Layers,
  Calendar,
  Shield,
  Network,
} from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import type { Technology, SupportStatus, TechCategory } from '@/types/domain'
import { computeAppTechMap } from '@/utils/technologyUtils'

export function ObsolescencePage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TechCategory | 'all'>('all')

  const rawTechnologies = useLiveQuery(() => db.technologies.toArray())
  const technologies = useMemo(() => rawTechnologies ?? [], [rawTechnologies])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])
  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])

  const filteredTechs = useMemo(() => {
    return technologies.filter((t) => {
      if (
        search &&
        !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.vendor.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (statusFilter !== 'all' && t.supportStatus !== statusFilter) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      return true
    })
  }, [technologies, search, statusFilter, categoryFilter])

  const appTechMap = useMemo(
    () => computeAppTechMap(applications, microservices),
    [applications, microservices],
  )

  const stats = useMemo(() => {
    const total = technologies.length
    const eol = technologies.filter((t) => t.supportStatus === 'eol').length
    const extended = technologies.filter((t) => t.supportStatus === 'extended').length
    const active = technologies.filter((t) => t.supportStatus === 'active').length

    const eolTechIds = new Set(
      technologies.filter((t) => t.supportStatus === 'eol').map((t) => t.id),
    )

    const appTechMap = computeAppTechMap(applications, microservices)
    const criticalAppsWithEol = applications.filter((app) => {
      const allTechIds = appTechMap.get(app.id) ?? app.technologies
      return (
        allTechIds.some((tId) => eolTechIds.has(tId)) &&
        (app.criticality === 'critical' || app.criticality === 'high')
      )
    })

    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    const nearEol = technologies.filter(
      (t) =>
        t.eolDate && new Date(t.eolDate) <= sixMonthsFromNow && new Date(t.eolDate) > new Date(),
    ).length

    return {
      total,
      eol,
      extended,
      active,
      criticalAppsWithEol: criticalAppsWithEol.length,
      nearEol,
    }
  }, [technologies, applications, microservices])

  const handleDelete = async (id: string) => {
    if (
      !(await confirm(
        '¿Eliminar esta tecnología? Se eliminará de todas las aplicaciones que la usen.',
      ))
    )
      return

    const affectedApps = applications.filter((app) => app.technologies.includes(id))
    for (const app of affectedApps) {
      await db.applications.update(app.id, {
        technologies: app.technologies.filter((tId) => tId !== id),
      })
    }

    await db.technologies.delete(id)
  }

  const getStatusStyle = (status: SupportStatus) => {
    switch (status) {
      case 'eol':
        return 'bg-danger/10 text-danger border-danger/30'
      case 'extended':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'active':
        return 'bg-success/10 text-success border-success/30'
      default:
        return 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60'
    }
  }

  const getStatusLabel = (status: SupportStatus) => {
    switch (status) {
      case 'eol':
        return 'EOL'
      case 'extended':
        return 'Soporte Extendido'
      case 'active':
        return 'Activo'
      default:
        return 'Desconocido'
    }
  }

  const getEolUrgency = (tech: Technology) => {
    if (tech.supportStatus === 'eol')
      return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
    if (!tech.eolDate) return { color: 'text-neutral-50', label: 'Sin fecha', dot: 'bg-neutral-40' }

    const now = new Date()
    const eol = new Date(tech.eolDate)
    const diffMs = eol.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
    const human = formatDuration(diffDays)
    if (diffDays < 180) return { color: 'text-warning', label: `En ${human}`, dot: 'bg-warning' }
    if (diffDays < 365)
      return { color: 'text-severity-high', label: `En ${human}`, dot: 'bg-severity-high' }
    return { color: 'text-success', label: `En ${human}`, dot: 'bg-success' }
  }

  const categories = useMemo(() => {
    const cats = new Set(technologies.map((t) => t.category))
    return Array.from(cats) as TechCategory[]
  }, [technologies])

  /** Progress toward EOL as percentage (0 = far away, 100 = expired) */
  const getLifecyclePct = (eolDate: Date): number => {
    const created = new Date(eolDate)
    created.setFullYear(created.getFullYear() - 5) // assume ~5 year lifecycle
    const total = eolDate.getTime() - created.getTime()
    const elapsed = Date.now() - created.getTime()
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  function LifecycleBar({ status }: { status: SupportStatus }) {
    const segments = [
      { id: 'active', label: 'Activo', color: 'bg-success', w: '1/3' },
      { id: 'extended', label: 'Extendido', color: 'bg-warning', w: '1/3' },
      { id: 'eol', label: 'EOL', color: 'bg-danger', w: '1/3' },
    ]
    const statusOrder = ['active', 'extended', 'eol', 'unknown']
    const currentIdx = statusOrder.indexOf(status)
    return (
      <div
        className="flex items-center gap-0.5 shrink-0"
        title={`Estado: ${getStatusLabel(status)}`}
      >
        {segments.map((seg, i) => {
          const filled = i <= currentIdx && status !== 'unknown'
          return (
            <div
              key={seg.id}
              className={`h-5 w-2 rounded-sm transition-colors ${
                filled ? seg.color : 'bg-neutral-20 dark:bg-neutral-70'
              } ${i === currentIdx && status !== 'unknown' ? 'ring-1 ring-offset-1 ring-offset-white dark:ring-offset-neutral-80 ring-black/20' : ''}`}
            />
          )
        })}
      </div>
    )
  }

  const categoryLabels: Record<string, string> = {
    framework: 'Framework',
    language: 'Lenguaje',
    database: 'BD',
    runtime: 'Runtime',
    cache: 'Cache',
    message_broker: 'Mensajería',
    library: 'Librería',
    tool: 'Herramienta',
    os: 'SO',
    web_server: 'Servidor Web',
    cloud_service: 'Cloud',
    other: 'Otro',
  }

  const columns: Column<Technology>[] = [
    {
      key: 'name',
      label: 'Tecnología',
      sortable: true,
      render: (tech) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name}</span>
      ),
    },
    {
      key: 'version',
      label: 'Versión',
      sortable: true,
      render: (tech) => <span className="text-sm text-secondary">{tech.version}</span>,
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (tech) => (
        <span className="text-xs px-2 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70 text-muted">
          {categoryLabels[tech.category] || tech.category}
        </span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (tech) => <span className="text-sm text-secondary">{tech.vendor}</span>,
    },
    {
      key: 'supportStatus',
      label: 'Ciclo de Vida',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <LifecycleBar status={tech.supportStatus} />
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusStyle(tech.supportStatus)}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                {getStatusLabel(tech.supportStatus)}
              </span>
              {tech.eolDate && tech.supportStatus !== 'active' && (
                <p className={`text-[10px] mt-0.5 ${urgency.color}`}>{urgency.label}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'eolDate',
      label: 'EOL Date',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        const eol = tech.eolDate ? new Date(tech.eolDate) : null
        const now = new Date()
        const remainingDays = eol
          ? Math.ceil((eol.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null
        const expired = remainingDays !== null && remainingDays < 0
        const pct = eol ? getLifecyclePct(eol) : 0
        return (
          <div className="min-w-[130px]">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={12} className="text-neutral-50 shrink-0" />
              <span className={`text-sm ${urgency.color}`}>
                {eol
                  ? eol.toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
            {eol && (
              <div className="space-y-0.5">
                <div className="h-1.5 bg-neutral-10 dark:bg-neutral-85 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      expired
                        ? 'bg-danger'
                        : remainingDays! < 180
                          ? 'bg-warning'
                          : remainingDays! < 365
                            ? 'bg-severity-high'
                            : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className={`text-[10px] leading-tight ${urgency.color}`}>
                  {expired
                    ? `Vencido hace ${formatDuration(remainingDays!)}`
                    : `${formatDuration(remainingDays!)} restantes`}
                </p>
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'apps',
      label: 'Apps',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (tech) => {
        const appCount = applications.filter((app) => {
          const techIds = appTechMap.get(app.id) ?? app.technologies
          return techIds.includes(tech.id)
        }).length
        return (
          <span
            className={`text-sm font-medium ${appCount > 0 ? 'text-neutral-90 dark:text-white' : 'text-neutral-50'}`}
          >
            {appCount}
          </span>
        )
      },
    },
    {
      key: 'cveList',
      label: 'CVEs',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (tech) => (
        <span
          className={`text-sm font-medium ${tech.cveList.length > 0 ? 'text-danger' : 'text-neutral-50'}`}
        >
          {tech.cveList.length || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (tech) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${tech.id}/edit`)
            }}
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(tech.id)
            }}
            variant="ghost"
            size="sm"
            className="p-1.5 hover:text-danger"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Obsolescencia</h2>
          <p className="text-sm text-muted">Gestión del ciclo de vida de tecnologías</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/import')} variant="secondary" size="sm">
            <Upload size={16} />
            Importar
          </Button>
          <Button onClick={() => navigate('map')} variant="secondary" size="sm">
            <Network size={16} />
            Mapa de Obsolescencias
          </Button>
          <Button
            onClick={() => navigate('new')}
            variant="primary"
            size="md"
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus size={18} />
            Nueva Tecnología
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Button
          variant="ghost"
          size="md"
          onClick={() => setStatusFilter('all')}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-muted">Total Tecnologías</p>
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setStatusFilter('active')}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
          <p className="text-xs text-muted">Activas</p>
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setStatusFilter('extended')}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.extended}</p>
          <p className="text-xs text-muted">Soporte Extendido</p>
          {stats.nearEol > 0 && (
            <p className="text-xs text-severity-high mt-1">{stats.nearEol} próx. a EOL</p>
          )}
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setStatusFilter('eol')}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <XCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.eol}</p>
          <p className="text-xs text-muted">EOL</p>
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            setStatusFilter('all')
            setSearch('')
          }}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.criticalAppsWithEol}</p>
          <p className="text-xs text-muted">Apps Críticas Afectadas</p>
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={() => setStatusFilter('all')}
          className="w-full justify-start p-4 rounded-2xl border border-boundary bg-card shadow-sm hover:shadow-md text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <Shield size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-info">{stats.total - stats.eol - stats.extended}</p>
          <p className="text-xs text-muted">Sin EOL / Seguras</p>
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <Input
              type="text"
              placeholder="Buscar por nombre o vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as SupportStatus | 'all')}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activo' },
              { value: 'extended', label: 'Soporte Extendido' },
              { value: 'eol', label: 'EOL' },
              { value: 'unknown', label: 'Desconocido' },
            ]}
            className="min-w-[180px]"
          />

          <Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as TechCategory | 'all')}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...categories.map((cat) => ({ value: cat, label: categoryLabels[cat] || cat })),
            ]}
            className="min-w-[180px]"
          />

          {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              variant="ghost"
              size="sm"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filteredTechs}
        onRowClick={(tech) => navigate(`${tech.id}`)}
        pageSize={5}
        emptyMessage={
          technologies.length === 0
            ? 'No hay tecnologías registradas. Crea la primera.'
            : 'No se encontraron tecnologías con los filtros seleccionados.'
        }
      />
    </div>
  )
}
