import { useEffect, useState } from 'react'
import { getDashboardMetrics, type DashboardMetrics } from '../services/finOpsService'

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function useFinOpsMetrics(initialPeriod?: string) {
  const [period, setPeriod] = useState(initialPeriod ?? currentPeriod())
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getDashboardMetrics(period)
      .then((m) => {
        if (!cancelled) setMetrics(m)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar métricas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  return { period, setPeriod, metrics, loading, error }
}
