import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Download, Upload, GitCompare, Trash2, Pencil, Eye, X, AppWindow } from 'lucide-react'
import type { Application } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

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

  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])
  const rawBusinessUnits = useLiveQuery(() => db.businessUnits.toArray())
  const businessUnits = useMemo(() => rawBusinessUnits ?? [], [rawBusinessUnits])

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

  const columns: Column<Application>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      className: 'max-w-xs',
      render: (app) => (
        <div className="min-w-0">
          <Link to={`/catalog/applications/${app.id}`} className="text-sm font-medium text-primary hover:underline truncate block">
            {app.name}
          </Link>
          {app.description && <HtmlDescription html={app.description} lines={1} className="text-neutral-50 dark:text-neutral-50 mt-0.5" />}
        </div>
      ),
    },
    {
      key: 'ownerName',
      label: 'Owner',
      sortable: true,
      render: (app) => <span className="text-sm text-secondary">{app.ownerName}</span>,
    },
    {
      key: 'businessUnitId',
      label: 'BU',
      render: (app) => (
        <span className="text-sm text-secondary">
          {businessUnits.find((bu) => bu.id === app.businessUnitId)?.name || '-'}
        </span>
      ),
    },
    {
      key: 'criticality',
      label: 'Criticidad',
      sortable: true,
      render: (app) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCriticalityColor(app.criticality)}`}>
          {criticalityLabel[app.criticality]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (app) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
          {appStatusLabel[app.status]}
        </span>
      ),
    },
    {
      key: 'architecture',
      label: 'Arquitectura',
      sortable: true,
      render: (app) => <span className="text-sm text-secondary">{app.architecture}</span>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (app) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/catalog/applications/${app.id}`} className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors">
            <Eye size={16} className="text-muted" />
          </Link>
          <Link
            to={`/catalog/applications/${app.id}/edit`}
            className="p-1.5 rounded-md hover:bg-neutral-20 dark:hover:bg-neutral-60 transition-colors"
          >
            <Pencil size={16} className="text-muted" />
          </Link>
          <Button
            onClick={(e) => { e.stopPropagation(); handleDelete(app.id) }}
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
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Catálogo de Aplicaciones</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={() => navigate('/compare')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <GitCompare size={16} />
            Comparar
          </Button>
          <Button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nueva Aplicación
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
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
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || filterCriticality || filterStatus || filterBU
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(filterCriticality || filterStatus || filterBU) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-boundary">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Criticidad</label>
              <Select value={filterCriticality} onChange={(v) => setFilterCriticality(v)} options={[
                { value: '', label: 'Todas' },
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
              ]} className="min-w-[120px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select value={filterStatus} onChange={(v) => setFilterStatus(v)} options={[
                { value: '', label: 'Todos' },
                { value: 'active', label: 'Activo' },
                { value: 'deprecated', label: 'Deprecado' },
                { value: 'retired', label: 'Retirado' },
                { value: 'planned', label: 'Planeado' },
              ]} className="min-w-[120px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">BU</label>
              <Select value={filterBU} onChange={(v) => setFilterBU(v)} options={[
                { value: '', label: 'Todas' },
                ...businessUnits.map((bu) => ({ value: bu.id, label: bu.name })),
              ]} className="min-w-[120px]" />
            </div>
            {(filterCriticality || filterStatus || filterBU) && (
              <Button
                onClick={() => { setFilterCriticality(''); setFilterStatus(''); setFilterBU('') }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      {!rawApplications ? (
        <SkeletonTable rows={8} />
      ) : filteredApps.length === 0 ? (
        <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm">
          <EmptyState
            icon={<AppWindow size={22} className="text-neutral-50" />}
            title={searchTerm || filterCriticality || filterStatus || filterBU
              ? 'Sin resultados'
              : 'No hay aplicaciones registradas'}
            description={searchTerm || filterCriticality || filterStatus || filterBU
              ? 'Intenta con otros filtros o términos de búsqueda'
              : 'Crea tu primera aplicación para empezar'}
            action={
              !searchTerm && !filterCriticality && !filterStatus && !filterBU ? (
                <Button
                  onClick={() => navigate('new')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
                >
                  <Plus size={16} />
                  Nueva Aplicación
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <SortableTable
          columns={columns}
          data={filteredApps}
          onRowClick={(app) => navigate(`/catalog/applications/${app.id}`)}
          emptyMessage="No se encontraron aplicaciones"
        />
      )}
    </div>
  )
}
