import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X } from 'lucide-react'
import { distributeCost } from '../services/finOpsService'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

interface AllocationModalProps {
  onClose: () => void
  onDone: () => void
}

const METHOD_LABELS: Record<string, string> = {
  equal: 'Igual entre apps',
  weighted: 'Por pesos',
  byMicroserviceCount: 'Proporcional a microservicios',
}

export function AllocationModal({ onClose, onDone }: AllocationModalProps) {
  const [period, setPeriod] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [method, setMethod] = useState<'equal' | 'weighted' | 'byMicroserviceCount'>('equal')
  const [appIds, setAppIds] = useState<string[]>([])
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const apps = useLiveQuery(() => db.applications.toArray()) ?? []

  const toggleApp = (id: string) => {
    setAppIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    try {
      await distributeCost({ period, totalAmount, method, appIds, weights })
      onDone()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al distribuir')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-card rounded-2xl border border-boundary shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-boundary">
            <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Distribuir total</h2>
            <Button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              <X size={20} className="text-neutral-50" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Periodo *</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Monto total *</label>
              <input
                type="number"
                min={0}
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Método *</label>
              <Select
                value={method}
                onChange={(v) => setMethod(v as typeof method)}
                options={Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Aplicaciones *
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {apps.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-75 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={appIds.includes(a.id)}
                      onChange={() => toggleApp(a.id)}
                      className="rounded border-neutral-30 dark:border-neutral-60"
                    />
                    <span className="text-sm">{a.name}</span>
                  </label>
                ))}
                {apps.length === 0 && (
                  <p className="text-sm text-neutral-500">Sin aplicaciones registradas</p>
                )}
              </div>
            </div>
            {method === 'weighted' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary mb-1">
                  Pesos (suman 100)
                </label>
                {apps
                  .filter((a) => appIds.includes(a.id))
                  .map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{a.name}</span>
                      <input
                        type="number"
                        min={0}
                        value={weights[a.id] ?? ''}
                        onChange={(e) =>
                          setWeights((prev) => ({ ...prev, [a.id]: Number(e.target.value) }))
                        }
                        className="w-24 px-3 py-1.5 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  ))}
              </div>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 p-5 border-t border-boundary">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Distribuir</Button>
          </div>
        </div>
      </div>
    </>
  )
}
