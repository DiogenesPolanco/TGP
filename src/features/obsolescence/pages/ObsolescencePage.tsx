import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router'
import { db } from '@/services/db/database'
import { computeAppTechMap } from '@/utils/technologyUtils'
import { SortableTable } from '@/components/ui/SortableTable'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Upload, Network } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import type { SupportStatus, TechCategory } from '@/types/domain'
import { ObsolescenceStatsCards } from '../components/ObsolescenceStatsCards'
import { useObsColumns } from '../components/obsColumns'
import { categoryLabels } from '../utils/obsolescenceHelpers'

export function ObsolescencePage() {
  const navigate = useNavigate()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<TechCategory | 'all'>('all')

  const rawTechnologies = useLiveQuery(() => db.technologies.toArray())
  const technologies = useMemo(() => rawTechnologies ?? [], [rawTechnologies])
  const rawApplications = useLiveQuery(() => db.applications.toArray())
  const applications = useMemo(() => rawApplications ?? [], [rawApplications])
  const rawMicroservices = useLiveQuery(() => db.microservices.toArray())
  const microservices = useMemo(() => rawMicroservices ?? [], [rawMicroservices])

  const filteredTechs = useMemo(
    () =>
      technologies.filter((t) => {
        if (
          search &&
          !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.vendor.toLowerCase().includes(search.toLowerCase())
        )
          return false
        if (statusFilter !== 'all' && t.supportStatus !== statusFilter) return false
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
        return true
      }),
    [technologies, search, statusFilter, categoryFilter],
  )

  const appTechMap = useMemo(
    () => computeAppTechMap(applications, microservices),
    [applications, microservices],
  )

  const stats = useMemo(() => {
    const total = technologies.length
    const eol = technologies.filter((t) => t.supportStatus === 'eol').length
    const extended = technologies.filter((t) => t.supportStatus === 'extended').length
    const active = technologies.filter((t) => t.supportStatus === 'active').length
    const eolTechIds = new Set(
      technologies.filter((t) => t.supportStatus === 'eol').map((t) => t.id),
    )
    const criticalAppsWithEol = applications.filter((app) => {
      const allTechIds = appTechMap.get(app.id) ?? app.technologies
      return (
        allTechIds.some((tId) => eolTechIds.has(tId)) &&
        (app.criticality === 'critical' || app.criticality === 'high')
      )
    }).length
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    const nearEol = technologies.filter(
      (t) =>
        t.eolDate && new Date(t.eolDate) <= sixMonthsFromNow && new Date(t.eolDate) > new Date(),
    ).length
    return { total, eol, extended, active, criticalAppsWithEol, nearEol }
  }, [technologies, applications, appTechMap])

  const handleDelete = async (id: string) => {
    if (
      !(await confirm(
        '¿Eliminar esta tecnología? Se eliminará de todas las aplicaciones que la usen.',
      ))
    )
      return
    const affectedApps = applications.filter((app) => app.technologies.includes(id))
    for (const app of affectedApps) {
      await db.applications.update(app.id, {
        technologies: app.technologies.filter((tId) => tId !== id),
      })
    }
    await db.technologies.delete(id)
  }

  const categories = useMemo(
    () => Array.from(new Set(technologies.map((t) => t.category))) as TechCategory[],
    [technologies],
  )
  const categoryOptions = categories.map((cat) => ({
    value: cat,
    label: categoryLabels[cat] || cat,
  }))

  const columns = useObsColumns({
    technologies,
    applications,
    microservices,
    appTechMap,
    onNavigate: (path) => navigate(path),
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">Obsolescencia</h2>
          <p className="text-sm text-muted">Gestión del ciclo de vida de tecnologías</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/admin/import')} variant="secondary" size="sm">
            <Upload size={16} /> Importar
          </Button>
          <Button onClick={() => navigate('map')} variant="secondary" size="sm">
            <Network size={16} /> Mapa de Obsolescencias
          </Button>
          <Button
            onClick={() => navigate('new')}
            variant="primary"
            size="md"
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus size={18} /> Nueva Tecnología
          </Button>
        </div>
      </div>

      <ObsolescenceStatsCards
        stats={stats}
        onFilterStatus={(s) => setStatusFilter(s as SupportStatus | 'all')}
        onReset={() => {
          setStatusFilter('all')
          setSearch('')
        }}
      />

      <div className="bg-card rounded-2xl border border-boundary p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-50"
            />
            <Input
              type="text"
              placeholder="Buscar por nombre o vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-transparent"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as SupportStatus | 'all')}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activo' },
              { value: 'extended', label: 'Soporte Extendido' },
              { value: 'eol', label: 'EOL' },
              { value: 'unknown', label: 'Desconocido' },
            ]}
            className="min-w-[180px]"
          />
          <Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as TechCategory | 'all')}
            options={[{ value: 'all', label: 'Todas las categorías' }, ...categoryOptions]}
            className="min-w-[180px]"
          />
          {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              variant="ghost"
              size="sm"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filteredTechs}
        onRowClick={(tech) => navigate(`${tech.id}`)}
        pageSize={5}
        emptyMessage={
          technologies.length === 0
            ? 'No hay tecnologías registradas. Crea la primera.'
            : 'No se encontraron tecnologías con los filtros seleccionados.'
        }
      />
    </div>
  )
}
