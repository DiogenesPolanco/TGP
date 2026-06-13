import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Filter, Upload, X, Shield, AlertTriangle, Clock, Pencil, Trash2 } from 'lucide-react'
import type { Vulnerability } from '@/types/domain'

const severityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  info: 'Info',
}

const vulnStatusLabel: Record<string, string> = {
  open: 'Abierta',
  in_progress: 'En Progreso',
  fixed: 'Corregida',
  accepted: 'Aceptada',
}

export function VulnerabilitiesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const vulnerabilities = useLiveQuery(() => db.vulnerabilities.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredVulns = vulnerabilities.filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (severityFilter === 'all' || v.severity === severityFilter) &&
    (statusFilter === 'all' || v.status === statusFilter)
  )

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar vulnerabilidad?')) {
      await db.vulnerabilities.delete(id)
      addNotification({ type: 'success', message: 'Vulnerabilidad eliminada' })
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-danger/10 text-danger',
      high: 'bg-warning/10 text-warning',
      medium: 'bg-info/10 text-info',
      low: 'bg-success/10 text-success',
      info: 'bg-neutral-10 text-neutral-60',
    }
    return colors[severity] || 'bg-neutral-10 text-neutral-60'
  }

  const getSlaStatus = (vuln: Vulnerability) => {
    if (vuln.status === 'fixed' || vuln.status === 'accepted') return { label: '—', color: 'text-neutral-50' }
    const days = Math.ceil((new Date(vuln.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Vencido', color: 'text-danger' }
    if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
    return { label: `${days}d`, color: 'text-success' }
  }

  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter((v) => v.severity === 'critical' && v.status !== 'fixed').length,
    high: vulnerabilities.filter((v) => v.severity === 'high' && v.status !== 'fixed').length,
    slaBreached: vulnerabilities.filter((v) => v.status !== 'fixed' && v.status !== 'accepted' && new Date(v.slaDeadline) < new Date()).length,
  }

  const columns: Column<Vulnerability>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (vuln) => (
        <>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{vuln.title}</p>
          <p className="text-xs text-neutral-50 dark:text-neutral-50">{vuln.externalId}</p>
        </>
      ),
    },
    {
      key: 'applicationId',
      label: 'App',
      render: (vuln) => {
        const app = applications.find((a) => a.id === vuln.applicationId)
        return <span className="text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</span>
      },
    },
    {
      key: 'cvssScore',
      label: 'CVSS',
      sortable: true,
      render: (vuln) => <span className="text-sm font-medium text-neutral-90 dark:text-white">{vuln.cvssScore}</span>,
    },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (vuln) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
          {severityLabel[vuln.severity]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (vuln) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          vuln.status === 'fixed' ? 'bg-success/10 text-success' :
          vuln.status === 'in_progress' ? 'bg-info/10 text-info' :
          vuln.status === 'accepted' ? 'bg-neutral-10 text-neutral-60' :
          'bg-danger/10 text-danger'
        }`}>
          {vulnStatusLabel[vuln.status]}
        </span>
      ),
    },
    {
      key: 'slaDeadline',
      label: 'SLA',
      sortable: true,
      render: (vuln) => {
        const sla = getSlaStatus(vuln)
        return <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (vuln) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${vuln.id}/edit`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(vuln.id) }}
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
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Vulnerabilidades</h2>
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
            Nueva Vulnerabilidad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Shield size={20} />} label="Total" value={stats.total} color="text-primary" onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setShowFilters(false) }} />
        <StatCard icon={<AlertTriangle size={20} />} label="Críticas" value={stats.critical} color="text-danger" onClick={() => { setSeverityFilter('critical'); setStatusFilter('open'); setShowFilters(true) }} />
        <StatCard icon={<AlertTriangle size={20} />} label="Altas" value={stats.high} color="text-warning" onClick={() => { setSeverityFilter('high'); setShowFilters(true) }} />
        <StatCard icon={<Clock size={20} />} label="SLA Vencido" value={stats.slaBreached} color="text-danger" onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setShowFilters(false) }} />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar vulnerabilidades..."
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
                { value: 'open', label: 'Abierto' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'fixed', label: 'Corregido' },
                { value: 'accepted', label: 'Aceptado' },
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
        data={filteredVulns}
        onRowClick={(vuln) => navigate(`${vuln.id}/edit`)}
        emptyMessage="No se encontraron vulnerabilidades"
      />
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: number; color: string; onClick?: () => void }) {
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
