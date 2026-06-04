import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, Search, Filter, Upload, X, Pencil, Trash2 } from 'lucide-react'

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

  const { page, setPage, totalPages, paginatedItems: paginatedRisks } = usePagination(filteredRisks, 5)

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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todos</option>
                <option value="open">Abierto</option>
                <option value="mitigated">Mitigado</option>
                <option value="accepted">Aceptado</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Categoría</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todas</option>
                <option value="technical">Técnico</option>
                <option value="security">Seguridad</option>
                <option value="operational">Operacional</option>
                <option value="regulatory">Regulatorio</option>
                <option value="financial">Financiero</option>
              </select>
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

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-20 dark:border-neutral-70 bg-neutral-10 dark:bg-neutral-80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Título</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">App</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Prob</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Impacto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Score</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-60 dark:text-neutral-40 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
            {paginatedRisks.map((risk) => {
              const app = applications.find((a) => a.id === risk.applicationId)
              return (
                <tr key={risk.id}
                  onClick={() => navigate(`${risk.id}/edit`)}
                  className="hover:bg-neutral-10 dark:hover:bg-neutral-70/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-neutral-90 dark:text-white">{risk.title}</p>
                    <p className="text-xs text-neutral-50 dark:text-neutral-50">{risk.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{app?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{risk.category}</td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{risk.probability}</td>
                  <td className="px-6 py-4 text-sm text-neutral-70 dark:text-neutral-30">{risk.impact}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      risk.riskScore >= 20 ? 'bg-danger/10 text-danger' :
                      risk.riskScore >= 15 ? 'bg-warning/10 text-warning' :
                      risk.riskScore >= 10 ? 'bg-orange-100 text-orange-700' :
                      'bg-success/10 text-success'
                    }`}>
                      {risk.riskScore}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      risk.status === 'open' ? 'bg-danger/10 text-danger' :
                      risk.status === 'mitigated' ? 'bg-info/10 text-info' :
                      risk.status === 'accepted' ? 'bg-neutral-10 text-neutral-60' :
                      'bg-success/10 text-success'
                    }`}>
                      {risk.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredRisks.length}
          pageSize={5}
          onPageChange={setPage}
        />
        {filteredRisks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-50 dark:text-neutral-50">No se encontraron riesgos</p>
          </div>
        )}
      </div>

    </div>
  )
}
