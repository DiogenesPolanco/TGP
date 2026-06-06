import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, Search, Filter, Upload, X, FileWarning, CheckCircle, Clock, Pencil, Trash2 } from 'lucide-react'

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

  const filteredFindings = findings.filter((f) =>
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || f.status === statusFilter) &&
    (severityFilter === 'all' || f.severity === severityFilter)
  )

  const { page, setPage, totalPages, paginatedItems: paginatedFindings } = usePagination(filteredFindings, 5)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Auditoría</h2>
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
            Nuevo Hallazgo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<FileWarning size={20} />} label="Total" value={stats.total} color="text-primary" onClick={() => { setStatusFilter('all'); setSeverityFilter('all'); setShowFilters(false) }} />
        <StatCard icon={<Clock size={20} />} label="Abiertos" value={stats.open} color="text-warning" onClick={() => { setStatusFilter('open'); setShowFilters(true) }} />
        <StatCard icon={<FileWarning size={20} />} label="Vencidos" value={stats.overdue} color="text-danger" onClick={() => { setStatusFilter('overdue'); setShowFilters(true) }} />
        <StatCard icon={<CheckCircle size={20} />} label="Cerrados" value={stats.closed} color="text-success" onClick={() => { setStatusFilter('closed'); setShowFilters(true) }} />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar hallazgos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || statusFilter !== 'all' || severityFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(statusFilter !== 'all' || severityFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todos</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En Progreso</option>
                <option value="overdue">Vencido</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Severidad</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todas</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
            {(statusFilter !== 'all' || severityFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setSeverityFilter('all') }}
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Referencia</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Título</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">App</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Severidad</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Estado</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Vencimiento</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {paginatedFindings.map((finding) => {
              const sla = getSlaStatus(finding.dueDate)
              const app = applications.find((a) => a.id === finding.applicationId)
              return (
                <tr key={finding.id}
                  onClick={() => navigate(`${finding.id}/edit`)}
                  className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-90 dark:text-white">{finding.auditReference}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{finding.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      finding.category === 'compliance' ? 'bg-info/10 text-info' :
                      finding.category === 'security' ? 'bg-danger/10 text-danger' :
                      finding.category === 'architecture' ? 'bg-primary/10 text-primary' :
                      finding.category === 'data_governance' ? 'bg-warning/10 text-warning' :
                      'bg-neutral-10 dark:bg-neutral-70 text-neutral-60 dark:text-neutral-40'
                    }`}>
                      {finding.category === 'compliance' ? 'Cumplimiento' :
                       finding.category === 'security' ? 'Seguridad' :
                       finding.category === 'architecture' ? 'Arquitectura' :
                       finding.category === 'process' ? 'Proceso' :
                       finding.category === 'data_governance' ? 'Data Gov.' :
                       finding.category === 'access_control' ? 'Acceso' :
                       finding.category === 'business_continuity' ? 'Continuidad' :
                       finding.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      finding.severity === 'critical' ? 'bg-danger/10 text-danger' :
                      finding.severity === 'high' ? 'bg-warning/10 text-warning' :
                      finding.severity === 'medium' ? 'bg-info/10 text-info' :
                      'bg-success/10 text-success'
                    }`}>
                      {severityLabel[finding.severity]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      finding.status === 'open' ? 'bg-danger/10 text-danger' :
                      finding.status === 'in_progress' ? 'bg-info/10 text-info' :
                      finding.status === 'overdue' ? 'bg-danger/10 text-danger' :
                      'bg-success/10 text-success'
                    }`}>
                      {auditStatusLabel[finding.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${sla.color}`}>{sla.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`${finding.id}/edit`) }}
                        className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(finding.id) }}
                        className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredFindings.length}
          pageSize={5}
          onPageChange={setPage}
        />
        {filteredFindings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron hallazgos</p>
          </div>
        )}
      </div>

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
