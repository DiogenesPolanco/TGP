import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import {
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Layers,
  Calendar,
  Shield,
} from 'lucide-react'
import { TechnologyForm } from '../components/TechnologyForm'
import type { Technology, SupportStatus, TechCategory } from '@/types/domain'
import { computeAppTechMap } from '@/utils/technologyUtils'

export function ObsolescencePage() {
  const [showForm, setShowForm] = useState(false)
  const [editingTech, setEditingTech] = useState<Technology | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TechCategory | 'all'>('all')

  const technologies = useLiveQuery(() => db.technologies.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const microservices = useLiveQuery(() => db.microservices.toArray()) ?? []

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

    // Check app technologies INCLUDING inherited from microservices
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
    if (!confirm('¿Eliminar esta tecnología? Se eliminará de todas las aplicaciones que la usen.')) return

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Obsolescencia</h2>
          <p className="text-sm text-neutral-60 dark:text-neutral-40">
            Gestión del ciclo de vida de tecnologías
          </p>
        </div>
        <button
          onClick={() => { setEditingTech(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Nueva Tecnología
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-90 dark:text-white">{stats.total}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Total Tecnologías</p>
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{stats.active}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Activas</p>
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
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
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <XCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.eol}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">EOL</p>
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{stats.criticalAppsWithEol}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Apps Críticas Afectadas</p>
        </div>

        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <Shield size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-info">{stats.total - stats.eol - stats.extended}</p>
          <p className="text-xs text-neutral-60 dark:text-neutral-40">Sin EOL / Seguras</p>
        </div>
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

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-70">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Tecnología</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Versión</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Categoría</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">EOL Date</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Apps</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">CVEs</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
              {filteredTechs.map((tech) => {
                const urgency = getEolUrgency(tech)
                const appCount = applications.filter((app) => {
                  const techIds = appTechMap.get(app.id) ?? app.technologies
                  return techIds.includes(tech.id)
                }).length
                return (
                  <tr key={tech.id} className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-90 dark:text-white">{tech.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-70 dark:text-neutral-30">{tech.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40">
                        {categoryLabels[tech.category] || tech.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-70 dark:text-neutral-30">{tech.vendor}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${getStatusStyle(tech.supportStatus)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                        {getStatusLabel(tech.supportStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-neutral-50" />
                        <span className={`text-sm ${urgency.color}`}>
                          {tech.eolDate ? new Date(tech.eolDate).toLocaleDateString('es-ES') : '-'}
                        </span>
                      </div>
                      {tech.eolDate && (
                        <p className={`text-xs ${urgency.color} mt-0.5`}>{urgency.label}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${appCount > 0 ? 'text-neutral-90 dark:text-white' : 'text-neutral-50'}`}>
                        {appCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${tech.cveList.length > 0 ? 'text-danger' : 'text-neutral-50'}`}>
                        {tech.cveList.length || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingTech(tech); setShowForm(true) }}
                          className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-60 dark:text-neutral-40 hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tech.id)}
                          className="p-1.5 rounded-md hover:bg-neutral-10 dark:hover:bg-neutral-70 text-neutral-60 dark:text-neutral-40 hover:text-danger transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredTechs.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Layers size={40} className="mx-auto text-neutral-30 dark:text-neutral-60 mb-3" />
                    <p className="text-sm text-neutral-50">
                      {technologies.length === 0
                        ? 'No hay tecnologías registradas. Crea la primera.'
                        : 'No se encontraron tecnologías con los filtros seleccionados.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TechnologyForm
          technology={editingTech}
          onClose={() => { setShowForm(false); setEditingTech(null) }}
          onSave={() => { setShowForm(false); setEditingTech(null) }}
        />
      )}
    </div>
  )
}
