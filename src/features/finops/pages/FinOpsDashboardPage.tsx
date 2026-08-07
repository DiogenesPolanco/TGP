import { Link } from 'react-router'
import { useFinOpsMetrics } from '../hooks/useFinOpsMetrics'
import { FinOpsKPICards } from '../components/FinOpsKPICards'
import { FinOpsCharts } from '../components/FinOpsCharts'
import { PeriodSelector } from '../components/PeriodSelector'

const fmt = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function FinOpsDashboardPage() {
  const { period, setPeriod, metrics, loading, error } = useFinOpsMetrics()

  if (error) {
    return <div className="p-6 text-danger">Error: {error}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">FinOps</h1>
          <p className="text-sm text-neutral-500">Costo por aplicación</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      {loading || !metrics ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : (
        <>
          <FinOpsKPICards metrics={metrics} />
          <FinOpsCharts metrics={metrics} />
          <section className="rounded-lg border border-boundary bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Apps por costo</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="py-1">Aplicación</th>
                  <th className="py-1 text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topApps.map((app) => (
                  <tr key={app.applicationId} className="border-t border-boundary">
                    <td className="py-2">
                      <Link to={`/finops/apps/${app.applicationId}`} className="hover:underline">
                        {app.name}
                      </Link>
                    </td>
                    <td className="py-2 text-right">{fmt(app.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
