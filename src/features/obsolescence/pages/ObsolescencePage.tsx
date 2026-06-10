import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
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
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.vendor.toLowerCase().includes(search.toLowerCase())) return false
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
      return allTechIds.some((tId) => eolTechIds.has(tId)) &&
        (app.criticality === 'critical' || app.criticality === 'high')
    })

    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    const nearEol = technologies.filter(
      (t) => t.eolDate && new Date(t.eolDate) <= sixMonthsFromNow && new Date(t.eolDate) > new Date()
    ).length

    return { total, eol, extended, active, criticalAppsWithEol: criticalAppsWithEol.length, nearEol }
  }, [technologies, applications, microservices])

  const handleDelete = async (id: string) => {
    if (!(await confirm('¿Eliminar esta tecnología? Se eliminará de todas las aplicaciones que la usen.'))) return

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
      case 'eol': return 'bg-danger/10 text-danger border-danger/30'
      case 'extended': return 'bg-warning/10 text-warning border-warning/30'
      case 'active': return 'bg-success/10 text-success border-success/30'
      default: return 'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40 border-neutral-30 dark:border-neutral-60'
    }
  }

  const getStatusLabel = (status: SupportStatus) => {
    switch (status) {
      case 'eol': return 'EOL'
      case 'extended': return 'Soporte Extendido'
      case 'active': return 'Activo'
      default: return 'Desconocido'
    }
  }

  const getEolUrgency = (tech: Technology) => {
    if (tech.supportStatus === 'eol') return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
    if (!tech.eolDate) return { color: 'text-neutral-50', label: 'Sin fecha', dot: 'bg-neutral-40' }

    const now = new Date()
    const eol = new Date(tech.eolDate)
    const diffMs = eol.getTime() - now.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return { color: 'text-danger', label: 'Vencido', dot: 'bg-danger' }
    if (diffDays < 180) return { color: 'text-warning', label: `En ${Math.round(diffDays / 30)} meses`, dot: 'bg-warning' }
    if (diffDays < 365) return { color: 'text-severity-high', label: `En ${Math.round(diffDays / 30)} meses`, dot: 'bg-severity-high' }
    return { color: 'text-success', label: `En ${Math.round(diffDays / 30)} meses`, dot: 'bg-success' }
  }

  const categories = useMemo(() => {
    const cats = new Set(technologies.map((t) => t.category))
    return Array.from(cats) as TechCategory[]
  }, [technologies])

  const categoryLabels: Record<string, string> = {
    framework: 'Framework', language: 'Lenguaje', database: 'BD',
    runtime: 'Runtime', cache: 'Cache', message_broker: 'Mensajería',
    library: 'Librería', tool: 'Herramienta', os: 'SO',
    web_server: 'Servidor Web', cloud_service: 'Cloud', other: 'Otro',
  }

  const columns: Column<Technology>[] = [
    {
      key: 'name',
      label: 'Tecnología',
      sortable: true,
      render: (tech) => <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name}</span>,
    },
    {
      key: 'version',
      label: 'Versión',
      sortable: true,
      render: (tech) => <span className="text-sm text-neutral-70 dark:text-neutral-30">{tech.version}</span>,
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (tech) => (
        <span className="text-xs px-2 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40">
          {categoryLabels[tech.category] || tech.category}
        </span>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      sortable: true,
      render: (tech) => <span className="text-sm text-neutral-70 dark:text-neutral-30">{tech.vendor}</span>,
    },
    {
      key: 'supportStatus',
      label: 'Estado',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        return (
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${getStatusStyle(tech.supportStatus)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
            {getStatusLabel(tech.supportStatus)}
          </span>
        )
      },
    },
    {
      key: 'eolDate',
      label: 'EOL Date',
      sortable: true,
      render: (tech) => {
        const urgency = getEolUrgency(tech)
        return (
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-neutral-50" />
              <span className={`text-sm ${urgency.color}`}>
                {tech.eolDate ? new Date(tech.eolDate).toLocaleDateString('es-ES') : '-'}
              </span>
            </div>
            {tech.eolDate && (
              <p className={`text-xs ${urgency.color} mt-0.5`}>{urgency.label}</p>
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
          <span className={`text-sm font-medium ${appCount > 0 ? 'text-neutral-90 dark:text-white' : 'text-neutral-50'}`}>
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
        <span className={`text-sm font-medium ${tech.cveList.length > 0 ? 'text-danger' : 'text-neutral-50'}`}>
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
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${tech.id}/edit`) }}
            className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-60 dark:text-neutral-40 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(tech.id) }}
            className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-60 dark:text-neutral-40 hover:text-danger transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Obsolescencia</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40">
            Gestión del ciclo de vida de tecnologías
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={() => navigate('map')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Network size={16} />
            Mapa de Obsolescencias
          </button>
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nueva Tecnología
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <button onClick={() => setStatusFilter('all')} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Total Tecnologías</p>
        </button>

        <button onClick={() => setStatusFilter('active')} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Activas</p>
        </button>

        <button onClick={() => setStatusFilter('extended')} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-warning">{stats.extended}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Soporte Extendido</p>
          {stats.nearEol > 0 && (
            <p className="text-xs text-severity-high mt-1">{stats.nearEol} próx. a EOL</p>
          )}
        </button>

        <button onClick={() => setStatusFilter('eol')} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <XCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.eol}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">EOL</p>
        </button>

        <button onClick={() => { setStatusFilter('all'); setSearch('') }} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.criticalAppsWithEol}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Apps Críticas Afectadas</p>
        </button>

        <button onClick={() => setStatusFilter('all')} className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <Shield size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-info">{stats.total - stats.eol - stats.extended}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Sin EOL / Seguras</p>
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar por nombre o vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupportStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="extended">Soporte Extendido</option>
            <option value="eol">EOL</option>
            <option value="unknown">Desconocido</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TechCategory | 'all')}
            className="px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all') }}
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filteredTechs}
        onRowClick={(tech) => navigate(`${tech.id}/edit`)}
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
