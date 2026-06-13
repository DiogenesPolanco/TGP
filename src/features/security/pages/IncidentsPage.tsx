import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Filter, Upload, X, Clock, Activity, AlertOctagon, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Incident } from '@/types/domain'

function statusLabel(status: string | null | undefined): string {
  const map: Record<string, string> = {
    detected: 'Detectado',
    acknowledged: 'Reconocido',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  }
  return map[status?.toLowerCase() ?? ''] ?? '—'
}

function statusColor(status: string | null | undefined): string {
  if (!status) return 'bg-neutral-10 dark:bg-neutral-70 text-neutral-50'
  const s = status.toLowerCase()
  if (s === 'detected' || s === 'acknowledged' || s === 'in_progress') return 'bg-danger/10 text-danger'
  if (s === 'resolved') return 'bg-success/10 text-success'
  if (s === 'closed') return 'bg-neutral-10 text-neutral-60'
  return 'bg-neutral-10 dark:bg-neutral-70 text-neutral-50'
}

export function IncidentsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const incidents = useLiveQuery(() => db.incidents.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredIncidents = incidents.filter((i) =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (severityFilter === 'all' || i.severity === severityFilter) &&
    (statusFilter === 'all' || i.status === statusFilter)
  )

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar incidente?')) {
      await db.incidents.delete(id)
      addNotification({ type: 'success', message: 'Incidente eliminado' })
    }
  }

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length,
    p1: incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length,
    avgMttr: incidents.filter((i) => i.status === 'resolved').length > 0
      ? Math.round(incidents.filter((i) => i.status === 'resolved').reduce((sum, i) => sum + (i.downtimeMinutes ?? 0), 0) / incidents.filter((i) => i.status === 'resolved').length)
      : 0,
  }

  const columns: Column<Incident>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (incident) => (
        <>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{incident.title}</p>
          <p className="text-xs text-neutral-50 dark:text-neutral-50">{incident.externalId}</p>
        </>
      ),
    },
    {
      key: 'applicationId',
      label: 'App',
      render: (incident) => {
        const app = applications.find((a) => a.id === incident.applicationId)
        return <span className="text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</span>
      },
    },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (incident) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          incident.severity === 'critical' ? 'bg-danger/10 text-danger' :
          incident.severity === 'high' ? 'bg-warning/10 text-warning' :
          incident.severity === 'medium' ? 'bg-info/10 text-info' :
          'bg-success/10 text-success'
        }`}>
          {incident.severity === 'critical' ? 'Crítica' :
           incident.severity === 'high' ? 'Alta' :
           incident.severity === 'medium' ? 'Media' :
           'Baja'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (incident) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(incident.status)}`}>
          {statusLabel(incident.status)}
        </span>
      ),
    },
    {
      key: 'detectedAt',
      label: 'Detectado',
      sortable: true,
      render: (incident) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {new Date(incident.detectedAt).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'downtimeMinutes',
      label: 'Downtime',
      sortable: true,
      render: (incident) => (
        <span className="text-sm text-neutral-70 dark:text-neutral-30">
          {incident.downtimeMinutes ? `${incident.downtimeMinutes} min` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (incident) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${incident.id}`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${incident.id}/edit`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(incident.id) }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
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
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Incidentes</h2>
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
            Nuevo Incidente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Activity size={20} />} label="Total" value={stats.total} color="text-primary" onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setShowFilters(false) }} />
        <StatCard icon={<AlertOctagon size={20} />} label="Abiertos" value={stats.open} color="text-warning" onClick={() => { setSeverityFilter('all'); setStatusFilter('detected'); setShowFilters(true) }} />
        <StatCard icon={<AlertOctagon size={20} />} label="P1 Abiertos" value={stats.p1} color="text-danger" onClick={() => { setSeverityFilter('critical'); setStatusFilter('all'); setShowFilters(true) }} />
        <StatCard icon={<Clock size={20} />} label="MTTR Promedio" value={`${stats.avgMttr}m`} color="text-info" />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar incidentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || severityFilter !== 'all' || statusFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(severityFilter !== 'all' || statusFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Severidad</label>
              <Select value={severityFilter} onChange={(v) => setSeverityFilter(v)} options={[
                { value: 'all', label: 'Todas' },
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
              ]} className="min-w-[120px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} options={[
                { value: 'all', label: 'Todos' },
                { value: 'detected', label: 'Detectado' },
                { value: 'acknowledged', label: 'Reconocido' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'resolved', label: 'Resuelto' },
                { value: 'closed', label: 'Cerrado' },
              ]} className="min-w-[120px]" />
            </div>
            {(severityFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setSeverityFilter('all'); setStatusFilter('all') }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <SortableTable
        columns={columns}
        data={filteredIncidents}
        onRowClick={(incident) => navigate(`${incident.id}`)}
        emptyMessage="No se encontraron incidentes"
      />
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: string | number; color: string; onClick?: () => void }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm${onClick ? ' cursor-pointer hover:shadow-md transition-all text-left' : ''}`}
    >
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
    </Comp>
  )
}
