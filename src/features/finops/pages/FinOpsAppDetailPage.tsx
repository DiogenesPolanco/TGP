import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { rollupAppCosts, getCostEntries } from '../services/finOpsService'
import { useCatalogMap } from '@/hooks/useCatalog'
import { CostCategoryBadge } from '../components/CostCategoryBadge'
import type { CostEntry } from '@/types/domain'

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function FinOpsAppDetailPage() {
  const { id } = useParams<{ id: string }>()
  const appId = id ?? ''
  const [byPeriod, setByPeriod] = useState<Record<string, number>>({})
  const [entries, setEntries] = useState<CostEntry[]>([])
  const categoryMap = useCatalogMap('cost_category')
  const app = useLiveQuery(() => (appId ? db.applications.get(appId) : undefined), [appId])

  useEffect(() => {
    if (!appId) return
    rollupAppCosts(appId).then(setByPeriod)
    getCostEntries({ applicationId: appId }).then(setEntries)
  }, [appId])

  const total = Object.values(byPeriod).reduce((s, v) => s + v, 0)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{app?.name ?? appId}</h1>
      <p className="text-sm text-neutral-500">Costo total: {fmt(total)}</p>
      <section className="rounded-lg border border-boundary bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Por mes</h2>
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(byPeriod)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([p, v]) => (
                <tr key={p} className="border-t border-boundary">
                  <td className="py-1">{p}</td>
                  <td className="py-1 text-right">{fmt(v)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
      <section className="rounded-lg border border-boundary bg-card p-4">
        <h2 className="text-sm font-medium mb-3">Partidas</h2>
        {entries.map((e) => (
          <div key={e.id} className="flex justify-between border-t border-boundary py-2 text-sm">
            <div className="flex items-center gap-2">
              <CostCategoryBadge
                categoryId={e.categoryId}
                label={categoryMap[e.categoryId] ?? e.categoryId}
              />
              <span>{e.period}</span>
              {e.microserviceId && <span className="text-neutral-500">· microservicio</span>}
            </div>
            <span>{fmt(e.amount)}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
