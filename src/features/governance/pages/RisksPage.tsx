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
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle,
  Server,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { Risk } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { HtmlDescription } from '@/components/ui/HtmlDescription'

const statusLabel: Record<string, string> = {
  open: 'Abierto',
  mitigated: 'Mitigado',
  accepted: 'Aceptado',
  closed: 'Cerrado',
}

const statusColor: Record<string, string> = {
  open: 'bg-danger/10 text-danger border-danger/20',
  mitigated: 'bg-info/10 text-info border-info/20',
  accepted: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  closed: 'bg-success/10 text-success border-success/20',
}

const statusIcon: Record<string, React.ReactNode> = {
  open: <AlertTriangle size={20} />,
  mitigated: <Shield size={20} />,
  accepted: <CheckCircle size={20} />,
  closed: <CheckCircle size={20} />,
}

export function RisksPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showHeatMap, setShowHeatMap] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ prob: number; impact: number } | null>(null)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const risks = useLiveQuery(() => db.risks.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const statusCounts = {
    total: risks.length,
    open: risks.filter((r) => r.status === 'open').length,
    mitigated: risks.filter((r) => r.status === 'mitigated').length,
    accepted: risks.filter((r) => r.status === 'accepted').length,
    closed: risks.filter((r) => r.status === 'closed').length,
  }

  const filteredRisks = risks.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (categoryFilter === 'all' || r.category === categoryFilter) &&
      (!selectedCell || (r.probability === selectedCell.prob && r.impact === selectedCell.impact)),
  )

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar riesgo?')) {
      await db.risks.delete(id)
      addNotification({ type: 'success', message: 'Riesgo eliminado' })
    }
  }

  const getCellColor = (prob: number, impact: number) => {
    const score = prob * impact
    if (score >= 20) return 'bg-danger/20 border-danger'
    if (score >= 15) return 'bg-warning/20 border-warning'
    if (score >= 10) return 'bg-orange-100 border-orange-300'
    if (score >= 5) return 'bg-yellow-100 border-yellow-300'
    return 'bg-success/10 border-success'
  }

  const getCellRisks = (prob: number, impact: number) => {
    return risks.filter((r) => r.probability === prob && r.impact === impact)
  }

  const columns: Column<Risk>[] = [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      className: 'max-w-xs',
      render: (risk) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-90 dark:text-white truncate">
            {risk.title}
          </p>
          {risk.description && (
            <HtmlDescription
              html={risk.description}
              lines={1}
              className="text-neutral-50 dark:text-neutral-50"
            />
          )}
        </div>
      ),
    },
    {
      key: 'applicationId',
      label: 'App',
      render: (risk) => {
        const app = applications.find((a) => a.id === risk.applicationId)
        return <span className="text-sm text-secondary">{app?.name || '-'}</span>
      },
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (risk) => <span className="text-sm text-secondary">{risk.category}</span>,
    },
    {
      key: 'riskScore',
      label: 'Score',
      sortable: true,
      render: (risk) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            risk.riskScore >= 20
              ? 'bg-danger/10 text-danger'
              : risk.riskScore >= 15
                ? 'bg-warning/10 text-warning'
                : risk.riskScore >= 10
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-success/10 text-success'
          }`}
        >
          {risk.riskScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (risk) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            statusColor[risk.status] || 'bg-neutral-10 text-neutral-60'
          }`}
        >
          {statusLabel[risk.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (risk) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${risk.id}`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`${risk.id}/edit`)
            }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(risk.id)
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

  const StatCard = ({
    icon,
    label,
    value,
    color,
    active,
    onClick,
  }: {
    icon: React.ReactNode
    label: string
    value: number
    color: string
    active?: boolean
    onClick?: () => void
  }) => {
    const iconClasses: Record<string, string> = {
      'text-primary': 'bg-primary/10 text-primary',
      'text-danger': 'bg-danger/10 text-danger',
      'text-warning': 'bg-warning/10 text-warning',
      'text-info': 'bg-info/10 text-info',
      'text-success': 'bg-success/10 text-success',
      'text-neutral-60': 'bg-neutral-60/10 text-neutral-60',
    }
    const Comp = onClick ? 'button' : 'div'
    return (
      <Comp
        onClick={onClick}
        className={`rounded-2xl border p-4 flex items-center justify-center gap-3 transition-all ${
          active
            ? 'ring-2 ring-primary/40 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
            : 'bg-card border-boundary shadow-sm hover:shadow-md hover:border-neutral-30 dark:hover:border-neutral-60'
        }${onClick ? ' cursor-pointer' : ''}`}
      >
        <div className={`p-2 rounded-lg ${iconClasses[color] || 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-neutral-90 dark:text-white">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </Comp>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Riesgos</h2>
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
            Nuevo Riesgo
          </Button>
        </div>
      </div>

      {/* KPI Cards by Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Server size={20} />}
          label="Total Riesgos"
          value={statusCounts.total}
          color="text-primary"
          active={statusFilter === 'all' && !selectedCell}
          onClick={() => {
            setStatusFilter('all')
            setSelectedCell(null)
          }}
        />
        <StatCard
          icon={statusIcon.open}
          label="Abiertos"
          value={statusCounts.open}
          color="text-danger"
          active={statusFilter === 'open'}
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
        />
        <StatCard
          icon={statusIcon.mitigated}
          label="Mitigados"
          value={statusCounts.mitigated}
          color="text-info"
          active={statusFilter === 'mitigated'}
          onClick={() => setStatusFilter(statusFilter === 'mitigated' ? 'all' : 'mitigated')}
        />
        <StatCard
          icon={statusIcon.accepted}
          label="Aceptados"
          value={statusCounts.accepted}
          color="text-neutral-60"
          active={statusFilter === 'accepted'}
          onClick={() => setStatusFilter(statusFilter === 'accepted' ? 'all' : 'accepted')}
        />
        <StatCard
          icon={statusIcon.closed}
          label="Cerrados"
          value={statusCounts.closed}
          color="text-success"
          active={statusFilter === 'closed'}
          onClick={() => setStatusFilter(statusFilter === 'closed' ? 'all' : 'closed')}
        />
      </div>

      {/* Heat Map + Search Bar */}
      <div className="bg-card rounded-xl border border-boundary p-5 shadow-sm">
        <div className="flex items-start gap-8">
          {/* Heat Map - collapsible */}
          <div className="shrink-0">
            <Button
              onClick={() => setShowHeatMap(!showHeatMap)}
              className="flex items-center gap-2 text-sm font-bold text-neutral-90 dark:text-white mb-3 hover:text-primary transition-colors"
            >
              {showHeatMap ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Matriz de Calor
              {selectedCell && (
                <span className="text-xs font-medium text-primary ml-1">
                  (P{selectedCell.prob} · I{selectedCell.impact} ={' '}
                  {selectedCell.prob * selectedCell.impact})
                </span>
              )}
            </Button>

            {showHeatMap && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-neutral-50 -rotate-90 whitespace-nowrap mt-8">
                    Probabilidad
                  </span>
                  <div className="grid grid-cols-5 gap-1">
                    {[5, 4, 3, 2, 1].map((prob) => (
                      <div key={prob} className="contents">
                        <div className="flex items-center justify-center w-6 h-6 text-[10px] text-neutral-50">
                          {prob}
                        </div>
                        {[1, 2, 3, 4, 5].map((impact) => (
                          <Button
                            key={`${prob}-${impact}`}
                            onClick={() =>
                              setSelectedCell(
                                selectedCell?.prob === prob && selectedCell?.impact === impact
                                  ? null
                                  : { prob, impact },
                              )
                            }
                            className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${getCellColor(prob, impact)} ${
                              selectedCell?.prob === prob && selectedCell?.impact === impact
                                ? 'ring-2 ring-primary'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-xs font-bold text-neutral-90 dark:text-white">
                                {prob * impact}
                              </span>
                              {getCellRisks(prob, impact).length > 0 && (
                                <span className="text-[9px] text-muted">
                                  {getCellRisks(prob, impact).length}
                                </span>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    ))}
                    <div className="w-6" />
                    {[1, 2, 3, 4, 5].map((impact) => (
                      <div
                        key={impact}
                        className="flex items-center justify-center w-6 h-6 text-[10px] text-neutral-50"
                      >
                        {impact}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-neutral-50 mt-0.5">Impacto</span>
                </div>
                {selectedCell && (
                  <Button
                    onClick={() => setSelectedCell(null)}
                    className="text-xs text-danger hover:text-danger-dark transition-colors self-start mt-1"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Search + Filters */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
                />
                <input
                  type="text"
                  placeholder="Buscar riesgos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                  showFilters || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-neutral-30 dark:border-neutral-60 text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70'
                }`}
              >
                <Filter size={16} />
                Filtros
                {(statusFilter !== 'all' || categoryFilter !== 'all') && (
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
                      { value: 'mitigated', label: 'Mitigado' },
                      { value: 'accepted', label: 'Aceptado' },
                      { value: 'closed', label: 'Cerrado' },
                    ]}
                    className="min-w-[120px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-60">Categoría</label>
                  <Select
                    value={categoryFilter}
                    onChange={(v) => setCategoryFilter(v)}
                    options={[
                      { value: 'all', label: 'Todas' },
                      { value: 'technical', label: 'Técnico' },
                      { value: 'security', label: 'Seguridad' },
                      { value: 'operational', label: 'Operacional' },
                      { value: 'regulatory', label: 'Regulatorio' },
                      { value: 'financial', label: 'Financiero' },
                    ]}
                    className="min-w-[120px]"
                  />
                </div>
                {(statusFilter !== 'all' || categoryFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setStatusFilter('all')
                      setCategoryFilter('all')
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
        </div>
      </div>

      {/* Table */}
      <SortableTable
        columns={columns}
        data={filteredRisks}
        onRowClick={(risk) => navigate(`${risk.id}`)}
        emptyMessage="No se encontraron riesgos"
      />
    </div>
  )
}
