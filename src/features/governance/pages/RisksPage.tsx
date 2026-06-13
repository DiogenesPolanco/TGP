import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { SortableTable, type Column } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Plus, Search, Filter, Upload, X, Eye, Pencil, Trash2 } from 'lucide-react'

import type { Risk } from '@/types/domain'

const statusLabel: Record<string, string> = {
  open: 'Abierto',
  mitigated: 'Mitigado',
  accepted: 'Aceptado',
  closed: 'Cerrado',
}

export function RisksPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ prob: number; impact: number } | null>(null)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const risks = useLiveQuery(() => db.risks.toArray()) ?? []
  const applications = useLiveQuery(() => db.applications.toArray()) ?? []

  const filteredRisks = risks.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === 'all' || r.status === statusFilter) &&
    (categoryFilter === 'all' || r.category === categoryFilter) &&
    (!selectedCell || (r.probability === selectedCell.prob && r.impact === selectedCell.impact))
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
      render: (risk) => (
        <>
          <p className="text-sm font-medium text-neutral-90 dark:text-white">{risk.title}</p>
          <p className="text-xs text-neutral-50 dark:text-neutral-50">{risk.description}</p>
        </>
      ),
    },
    {
      key: 'applicationId',
      label: 'App',
      render: (risk) => {
        const app = applications.find((a) => a.id === risk.applicationId)
        return <span className="text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</span>
      },
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      render: (risk) => <span className="text-sm text-neutral-70 dark:text-neutral-30">{risk.category}</span>,
    },
    {
      key: 'probability',
      label: 'Prob',
      sortable: true,
      render: (risk) => <span className="text-sm text-neutral-70 dark:text-neutral-30">{risk.probability}</span>,
    },
    {
      key: 'impact',
      label: 'Impacto',
      sortable: true,
      render: (risk) => <span className="text-sm text-neutral-70 dark:text-neutral-30">{risk.impact}</span>,
    },
    {
      key: 'riskScore',
      label: 'Score',
      sortable: true,
      render: (risk) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          risk.riskScore >= 20 ? 'bg-danger/10 text-danger' :
          risk.riskScore >= 15 ? 'bg-warning/10 text-warning' :
          risk.riskScore >= 10 ? 'bg-orange-100 text-orange-700' :
          'bg-success/10 text-success'
        }`}>
          {risk.riskScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (risk) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          risk.status === 'open' ? 'bg-danger/10 text-danger' :
          risk.status === 'mitigated' ? 'bg-info/10 text-info' :
          risk.status === 'accepted' ? 'bg-neutral-10 text-neutral-60' :
          'bg-success/10 text-success'
        }`}>
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
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${risk.id}`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`${risk.id}/edit`) }}
            className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(risk.id) }}
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
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Riesgos</h2>
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
            Nuevo Riesgo
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Matriz de Calor</h3>
        <div className="flex items-start gap-8">
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-neutral-60 dark:text-neutral-40 mb-2 -rotate-90 whitespace-nowrap">Probabilidad</span>
            <div className="grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map((prob) => (
                <div key={prob} className="contents">
                  <div className="flex items-center justify-center w-8 h-8 text-xs text-neutral-60 dark:text-neutral-40">{prob}</div>
                  {[1, 2, 3, 4, 5].map((impact) => (
                    <button
                      key={`${prob}-${impact}`}
                      onClick={() => setSelectedCell(selectedCell?.prob === prob && selectedCell?.impact === impact ? null : { prob, impact })}
                      className={`w-16 h-16 rounded-lg border-2 transition-all hover:scale-105 ${getCellColor(prob, impact)} ${
                        selectedCell?.prob === prob && selectedCell?.impact === impact ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-xs font-bold text-neutral-90 dark:text-white">{prob * impact}</span>
                        {getCellRisks(prob, impact).length > 0 && (
                          <span className="text-[10px] text-neutral-60 dark:text-neutral-40">{getCellRisks(prob, impact).length}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              <div className="w-8" />
              {[1, 2, 3, 4, 5].map((impact) => (
                <div key={impact} className="flex items-center justify-center w-16 h-8 text-xs text-neutral-60 dark:text-neutral-40">{impact}</div>
              ))}
            </div>
            <span className="text-sm font-medium text-neutral-60 dark:text-neutral-40 mt-2">Impacto</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar riesgos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="px-3 py-2 text-sm text-primary hover:underline"
            >
              Limpiar calor
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Estado</label>
              <Select value={statusFilter} onChange={(v) => setStatusFilter(v)} options={[
                { value: 'all', label: 'Todos' },
                { value: 'open', label: 'Abierto' },
                { value: 'mitigated', label: 'Mitigado' },
                { value: 'accepted', label: 'Aceptado' },
                { value: 'closed', label: 'Cerrado' },
              ]} className="min-w-[120px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Categoría</label>
              <Select value={categoryFilter} onChange={(v) => setCategoryFilter(v)} options={[
                { value: 'all', label: 'Todas' },
                { value: 'technical', label: 'Técnico' },
                { value: 'security', label: 'Seguridad' },
                { value: 'operational', label: 'Operacional' },
                { value: 'regulatory', label: 'Regulatorio' },
                { value: 'financial', label: 'Financiero' },
              ]} className="min-w-[120px]" />
            </div>
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setCategoryFilter('all') }}
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
        data={filteredRisks}
        onRowClick={(risk) => navigate(`${risk.id}`)}
        emptyMessage="No se encontraron riesgos"
      />
    </div>
  )
}
