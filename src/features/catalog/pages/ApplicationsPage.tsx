import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, Upload, Trash2, Pencil, Eye, X } from 'lucide-react'

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

export function ApplicationsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterCriticality, setFilterCriticality] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBU, setFilterBU] = useState('')
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const applications = useLiveQuery(() => db.applications.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        !searchTerm ||
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCriticality = !filterCriticality || app.criticality === filterCriticality
      const matchesStatus = !filterStatus || app.status === filterStatus
      const matchesBU = !filterBU || app.businessUnitId === filterBU
      return matchesSearch && matchesCriticality && matchesStatus && matchesBU
    })
  }, [applications, searchTerm, filterCriticality, filterStatus, filterBU])

  const { page, setPage, totalPages, paginatedItems: paginatedApps } = usePagination(filteredApps, 5)

  const handleDelete = async (id: string) => {
    if (await confirm('¿Está seguro de eliminar esta aplicación?')) {
      await db.applications.delete(id)
      addNotification({ type: 'success', message: 'Aplicación eliminada correctamente' })
    }
  }

  const handleExport = () => {
    if (filteredApps.length === 0) {
      addNotification({ type: 'warning', message: 'No hay aplicaciones para exportar' })
      return
    }
    const data = filteredApps.map((app) => ({
      name: app.name,
      description: app.description,
      owner: app.ownerName,
      businessUnit: businessUnits.find((bu) => bu.id === app.businessUnitId)?.name ?? '',
      criticality: app.criticality,
      architecture: app.architecture,
      status: app.status,
      supportEndDate: app.supportEndDate ? new Date(app.supportEndDate).toISOString().split('T')[0] : '',
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aplicaciones-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ type: 'success', message: `${data.length} aplicaciones exportadas` })
  }

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
    }
    return colors[criticality] || 'bg-neutral-10 text-neutral-60'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-success/10 text-success',
      deprecated: 'bg-warning/10 text-warning',
      retired: 'bg-neutral-10 text-neutral-60',
      planned: 'bg-info/10 text-info',
    }
    return colors[status] || 'bg-neutral-10 text-neutral-60'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Catálogo de Aplicaciones</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nueva Aplicación
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar aplicaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || filterCriticality || filterStatus || filterBU
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(filterCriticality || filterStatus || filterBU) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Criticidad</label>
              <select
                value={filterCriticality}
                onChange={(e) => setFilterCriticality(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="deprecated">Deprecado</option>
                <option value="retired">Retirado</option>
                <option value="planned">Planeado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">BU</label>
              <select
                value={filterBU}
                onChange={(e) => setFilterBU(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todas</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
            {(filterCriticality || filterStatus || filterBU) && (
              <button
                onClick={() => { setFilterCriticality(''); setFilterStatus(''); setFilterBU('') }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Owner</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">BU</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Criticidad</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Arquitectura</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {paginatedApps.map((app) => (
              <tr key={app.id}
                onClick={() => navigate(`/catalog/applications/${app.id}`)}
                className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <Link to={`/catalog/applications/${app.id}`} className="text-sm font-medium text-primary hover:underline">
                    {app.name}
                  </Link>
                  <p className="text-xs text-neutral-50 dark:text-neutral-50 mt-0.5">{app.description}</p>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app.ownerName}</td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">
                  {businessUnits.find((bu) => bu.id === app.businessUnitId)?.name || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCriticalityColor(app.criticality)}`}>
                    {criticalityLabel[app.criticality]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                      {appStatusLabel[app.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app.architecture}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/catalog/applications/${app.id}`} className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
                      <Eye size={16} className="text-neutral-60 dark:text-neutral-40" />
                    </Link>
                    <Link
                      to={`/catalog/applications/${app.id}/edit`}
                      className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
                    >
                      <Pencil size={16} className="text-neutral-60 dark:text-neutral-40" />
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }}
                      className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 size={16} className="text-danger" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredApps.length}
          pageSize={5}
          onPageChange={setPage}
        />
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron aplicaciones</p>
          </div>
        )}
      </div>

    </div>
  )
}
