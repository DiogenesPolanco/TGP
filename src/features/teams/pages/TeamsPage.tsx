import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/services/db/database'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import { createShareLink, getPublicPerformanceData } from '@/services/share/publicShareService'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Upload, X, Users, TrendingUp, Award, Pencil, Trash2, Share2, Check, Copy } from 'lucide-react'

export function TeamsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [buFilter, setBuFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const teams = useLiveQuery(() => db.teams.toArray()) ?? []
  const businessUnits = useLiveQuery(() => db.businessUnits.toArray()) ?? []

  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (buFilter === 'all' || t.businessUnitId === buFilter)
  )

  const { page, setPage, totalPages, paginatedItems: paginatedTeams } = usePagination(filteredTeams, 5)

  const handleDelete = async (id: string) => {
    if (await confirm('¿Eliminar equipo?')) {
      await db.teams.delete(id)
      addNotification({ type: 'success', message: 'Equipo eliminado' })
    }
  }

  const getDoraLevel = (metrics: { deploymentFrequency: number; leadTimeHours: number; changeFailureRate: number; mttrHours: number } | null) => {
    if (!metrics) return { label: 'N/A', color: 'bg-neutral-10 text-neutral-60' }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 1 && metrics.changeFailureRate <= 5 && metrics.mttrHours <= 1) {
      return { label: 'Elite', color: 'bg-success/10 text-success' }
    }
    if (metrics.deploymentFrequency >= 1 && metrics.leadTimeHours <= 168 && metrics.changeFailureRate <= 10 && metrics.mttrHours <= 24) {
      return { label: 'Alto', color: 'bg-info/10 text-info' }
    }
    if (metrics.deploymentFrequency >= 0.25 && metrics.leadTimeHours <= 720 && metrics.changeFailureRate <= 15 && metrics.mttrHours <= 168) {
      return { label: 'Medio', color: 'bg-warning/10 text-warning' }
    }
    return { label: 'Bajo', color: 'bg-danger/10 text-danger' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Equipos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={async () => {
              const data = await getPublicPerformanceData()
              const { url } = await createShareLink(48, 'performance', undefined, data)
              setShareUrl(url)
            }}
            className="flex items-center gap-2 px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-sm text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <Share2 size={16} />
            Compartir
          </button>
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nuevo Equipo
          </button>
        </div>
      </div>

      {shareUrl && (() => { const cleanUrl = shareUrl.split('#')[0]; return (
        <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 flex items-center gap-3 max-w-full overflow-hidden">
          <span className="text-sm text-neutral-50 shrink-0">Enlace público:</span>
          <code className="flex-1 text-xs bg-neutral-5 dark:bg-neutral-85 px-3 py-1.5 rounded-lg text-neutral-70 dark:text-neutral-30 truncate font-mono min-w-0">{cleanUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )})()}

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users size={20} />} label="Total Equipos" value={teams.length} color="text-primary" onClick={() => setSearchTerm('')} />
        <StatCard icon={<Award size={20} />} label="Equipos Elite" value={teams.filter((t) => getDoraLevel(t.currentMetrics).label === 'Elite').length} color="text-success" />
        <StatCard icon={<TrendingUp size={20} />} label="Velocidad Promedio" value={teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + (t.currentMetrics?.velocity ?? 0), 0) / teams.length) : 0} color="text-info" />
      </div>

      <div className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50" />
            <input
              type="text"
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              showFilters || buFilter !== 'all'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-neutral-30 dark:border-neutral-60 text-neutral-60 dark:text-neutral-40 hover:bg-neutral-10 dark:hover:bg-neutral-70'
            }`}
          >
            <Filter size={16} />
            Filtros
            {buFilter !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-60">Unidad de Negocio</label>
              <select
                value={buFilter}
                onChange={(e) => setBuFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Todas</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
            {buFilter !== 'all' && (
              <button
                onClick={() => setBuFilter('all')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-danger hover:text-danger-dark transition-colors"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedTeams.map((team) => {
          const bu = businessUnits.find((b) => b.id === team.businessUnitId)
          const dora = getDoraLevel(team.currentMetrics)
          return (
            <div key={team.id}
              onClick={() => navigate(`/teams/${team.id}`)}
              className="bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link to={`/teams/${team.id}`} className="text-lg font-semibold text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    {team.name}
                  </Link>
                  <p className="text-sm text-neutral-60 dark:text-neutral-40">{bu?.name} • {team.members.length} miembros</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${dora.color}`}>
                  {dora.label}
                </span>
              </div>

              {team.currentMetrics && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <MetricItem label="Velocidad" value={team.currentMetrics.velocity} />
                  <MetricItem label="Tiempo de Entrega" value={`${team.currentMetrics.leadTimeHours}h`} />
                  <MetricItem label="Tasa de Fallos" value={`${team.currentMetrics.changeFailureRate}%`} />
                  <MetricItem label="MTTR" value={`${team.currentMetrics.mttrHours}h`} />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-20 dark:border-neutral-70">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`${team.id}/edit`) }}
                  className="p-1.5 rounded text-neutral-50 hover:text-primary transition-colors"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(team.id) }}
                  className="p-1.5 rounded text-neutral-50 hover:text-danger transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredTeams.length}
        pageSize={5}
        onPageChange={setPage}
      />

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-neutral-80 rounded-xl border border-neutral-20 dark:border-neutral-70">
          <p className="text-neutral-50 dark:text-neutral-50">No se encontraron equipos</p>
        </div>
      )}

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

function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-10 dark:bg-neutral-70 rounded-lg p-2">
      <p className="text-xs text-neutral-60 dark:text-neutral-40">{label}</p>
      <p className="text-sm font-semibold text-neutral-90 dark:text-white">{value}</p>
    </div>
  )
}
