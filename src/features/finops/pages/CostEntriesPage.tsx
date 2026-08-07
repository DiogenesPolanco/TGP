import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { getCostEntries, deleteCostEntry } from '../services/finOpsService'
import { useCatalogMap } from '@/hooks/useCatalog'
import { useConfirm } from '@/hooks/useConfirm'
import { CostCategoryBadge } from '../components/CostCategoryBadge'
import { AllocationModal } from '../components/AllocationModal'
import { ImportCsvModal } from '../components/ImportCsvModal'
import { Button } from '@/components/ui/Button'
import type { CostEntry } from '@/types/domain'

export function CostEntriesPage() {
  const [entries, setEntries] = useState<CostEntry[]>([])
  const [period, setPeriod] = useState('')
  const [showAllocation, setShowAllocation] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { confirm } = useConfirm()
  const categoryMap = useCatalogMap('cost_category')
  const apps = useLiveQuery(() => db.applications.toArray()) ?? []
  const appName = new Map(apps.map((a) => [a.id, a.name]))

  const load = () => getCostEntries(period ? { period } : {}).then(setEntries)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const handleDelete = async (e: CostEntry) => {
    const app = appName.get(e.applicationId) ?? e.applicationId
    if (
      !(await confirm(
        `¿Eliminar la partida de ${fmt(e.amount, e.currency)} de "${app}" (${e.period})?`,
      ))
    )
      return
    await deleteCostEntry(e.id)
    load()
  }

  const fmt = (n: number, currency: string) =>
    n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partidas de costo</h1>
          <p className="text-sm text-neutral-500">Registro manual, distribución e importación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            Importar CSV
          </Button>
          <Button variant="secondary" onClick={() => setShowAllocation(true)}>
            Distribuir total
          </Button>
          <Link to="/finops/entries/new">
            <Button>Nueva partida</Button>
          </Link>
        </div>
      </header>

      <input
        type="month"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="rounded-md border border-boundary bg-background px-3 py-1.5 text-sm"
        aria-label="Filtrar por periodo"
      />

      <div className="rounded-lg border border-boundary bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
            <tr>
              <th className="px-4 py-2">Periodo</th>
              <th className="px-4 py-2">Aplicación</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2">Fuente</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  Sin partidas
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-boundary">
                <td className="px-4 py-2">{e.period}</td>
                <td className="px-4 py-2">{appName.get(e.applicationId) ?? e.applicationId}</td>
                <td className="px-4 py-2">
                  <CostCategoryBadge
                    categoryId={e.categoryId}
                    label={categoryMap[e.categoryId] ?? e.categoryId}
                  />
                </td>
                <td className="px-4 py-2 text-right">{fmt(e.amount, e.currency)}</td>
                <td className="px-4 py-2 capitalize">{e.source}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link to={`/finops/entries/${e.id}/edit`}>Editar</Link>
                  <button className="text-danger" onClick={() => handleDelete(e)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAllocation && <AllocationModal onClose={() => setShowAllocation(false)} onDone={load} />}
      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} onDone={load} />}
    </div>
  )
}
