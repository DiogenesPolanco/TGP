import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import {
  Plus,
  Search,
  Filter,
  Upload,
  X,
  FileWarning,
  CheckCircle,
  Clock,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { AuditFinding } from '@/types/domain'
import { Button } from '@/components/ui/Button'

const severityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
  info: 'Info',
}

const auditStatusLabel: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  overdue: 'Vencido',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

export function AuditPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const findings = useLiveQuery(() => db.auditFindings.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredFindings = findings.filter(
    (f) =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || f.status === statusFilter) &&
      (severityFilter === 'all' || f.severity === severityFilter),
  )

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar hallazgo?')) {
      await db.auditFindings.delete(id)
      addNotification({ type: 'success', message: 'Hallazgo eliminado' })
    }
  }

  const stats = {
    total: findings.length,
    open: findings.filter((f) => f.status === 'open' || f.status === 'in_progress').length,
    overdue: findings.filter((f) => f.status === 'overdue').length,
    closed: findings.filter((f) => f.status === 'closed' || f.status === 'resolved').length,
  }

  const getSlaStatus = (dueDate: Date) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Vencido', color: 'text-danger' }
    if (days <= 7) return { label: `${days}d`, color: 'text-warning' }
    return { label: `${days}d`, color: 'text-success' }
  }

  const categoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      compliance: 'bg-info/10 text-info',
      security: 'bg-danger/10 text-danger',
      architecture: 'bg-primary/10 text-primary',
      data_governance: 'bg-warning/10 text-warning',
    }
    const labels: Record<string, string> = {
      compliance: 'Cumplimiento',
      security: 'Seguridad',
      architecture: 'Arquitectura',
      process: 'Proceso',
      data_governance: 'Data Gov.',
      access_control: 'Acceso',
      business_continuity: 'Continuidad',
    }
    return {
      className: styles[category] || 'bg-neutral-10 dark:bg-neutral-70 text-muted',
      label: labels[category] || category,
    }
  }

  const columns: Column<AuditFinding>[] = [
    {
      key: 'auditReference',
      label: 'Referencia',
      sortable: true,
      render: (finding) => (
        <span className="text-sm font-medium text-neutral-90 dark:text-white">
          {finding.auditReference}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (finding) => (
        <p className="text-sm font-medium text-neutral-90 dark:text-white">{finding.title}</p>
      ),
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (finding) => {
        const b = categoryBadge(finding.category)
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${b.className}`}>
            {b.label}
          </span>
        )
      },
    },
    {
      key: 'applicationId',
      label: 'App',
      render: (finding) => {
        const app = applications.find((a) => a.id === finding.applicationId)
        return <span className="text-sm text-secondary">{app?.name || '-'}</span>
      },
    },
    {
      key: 'severity',
      label: 'Severidad',
      sortable: true,
      render: (finding) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            finding.severity === 'critical'
              ? 'bg-danger/10 text-danger'
              : finding.severity === 'high'
                ? 'bg-warning/10 text-warning'
                : finding.severity === 'medium'
                  ? 'bg-info/10 text-info'
                  : 'bg-success/10 text-success'
          }`}
        >
          {severityLabel[finding.severity]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (finding) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            finding.status === 'open'
              ? 'bg-danger/10 text-danger'
              : finding.status === 'in_progress'
                ? 'bg-info/10 text-info'
                : finding.status === 'overdue'
                  ? 'bg-danger/10 text-danger'
                  : 'bg-success/10 text-success'
          }`}
        >
          {auditStatusLabel[finding.status]}
        </span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimiento',
      sortable: true,
      render: (finding) => {
        const sla = getSlaStatus(finding.dueDate)
        return <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (finding) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${finding.id}`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${finding.id}/edit`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(finding.id)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
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
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Auditoría</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </Button>
          <Button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Hallazgo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<FileWarning size={20} />}
          label="Total"
          value={stats.total}
          color="text-primary"
          onClick={() => {
            setStatusFilter('all')
            setSeverityFilter('all')
            setShowFilters(false)
          }}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Abiertos"
          value={stats.open}
          color="text-warning"
          onClick={() => {
            setStatusFilter('open')
            setShowFilters(true)
          }}
        />
        <StatCard
          icon={<FileWarning size={20} />}
          label="Vencidos"
          value={stats.overdue}
          color="text-danger"
          onClick={() => {
            setStatusFilter('overdue')
            setShowFilters(true)
          }}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Cerrados"
          value={stats.closed}
          color="text-success"
          onClick={() => {
            setStatusFilter('closed')
            setShowFilters(true)
          }}
        />
      </div>

      <div className="bg-card rounded-xl border border-boundary p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <input
              type="text"
              placeholder="Buscar hallazgos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || statusFilter !== 'all' || severityFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(statusFilter !== 'all' || severityFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-boundary">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'open', label: 'Abierto' },
                  { value: 'in_progress', label: 'En Progreso' },
                  { value: 'overdue', label: 'Vencido' },
                  { value: 'resolved', label: 'Resuelto' },
                  { value: 'closed', label: 'Cerrado' },
                ]}
                className="min-w-[120px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Severidad</label>
              <Select
                value={severityFilter}
                onChange={(v) => setSeverityFilter(v)}
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'critical', label: 'Crítica' },
                  { value: 'high', label: 'Alta' },
                  { value: 'medium', label: 'Media' },
                  { value: 'low', label: 'Baja' },
                ]}
                className="min-w-[120px]"
              />
            </div>
            {(statusFilter !== 'all' || severityFilter !== 'all') && (
              <Button
                onClick={() => {
                  setStatusFilter('all')
                  setSeverityFilter('all')
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>

      <SortableTable
        columns={columns}
        data={filteredFindings}
        onRowClick={(finding) => navigate(`${finding.id}`)}
        emptyMessage="No se encontraron hallazgos"
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  onClick?: () => void
}) {
  const iconClasses: Record<string, string> = {
    'text-primary': 'bg-primary/10 text-primary',
    'text-warning': 'bg-warning/10 text-warning',
    'text-danger': 'bg-danger/10 text-danger',
    'text-success': 'bg-success/10 text-success',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`bg-card rounded-2xl border border-boundary p-4 shadow-sm flex items-center justify-center gap-3${onClick ? ' cursor-pointer hover:shadow-md transition-all' : ''}`}
    >
      <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Comp>
  )
}
