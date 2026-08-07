import { useState } from 'react'
import { X } from 'lucide-react'
import { parseCostCsv, importCostEntries } from '../services/finOpsService'
import { Button } from '@/components/ui/Button'

interface ImportCsvModalProps {
  onClose: () => void
  onDone: () => void
}

export function ImportCsvModal({ onClose, onDone }: ImportCsvModalProps) {
  const [csv, setCsv] = useState('')
  const [errors, setErrors] = useState<{ row: number; column: string; message: string }[]>([])
  const [done, setDone] = useState(false)

  const handleImport = async () => {
    const result = await parseCostCsv(csv)
    setErrors(result.errors)
    if (result.errors.length > 0) return
    await importCostEntries(result.entries)
    setDone(true)
    onDone()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg bg-card rounded-2xl border border-boundary shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-boundary">
            <h2 className="text-lg font-bold text-neutral-90 dark:text-white">Importar CSV</h2>
            <Button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
            >
              <X size={20} className="text-neutral-50" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-xs text-muted">
              Columnas: aplicacion, categoria, mes, monto, moneda (opcional), microservicio
              (opcional), notas (opcional)
            </p>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-neutral-30 dark:border-neutral-60 bg-transparent text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={'aplicacion,categoria,mes,monto\nApp Uno,cloud,2026-07,1000'}
            />
            {errors.length > 0 && (
              <div className="text-xs text-danger space-y-1">
                {errors.map((er, i) => (
                  <p key={i}>
                    Fila {er.row} ({er.column}): {er.message}
                  </p>
                ))}
              </div>
            )}
            {done && <p className="text-sm text-emerald-600">Importación completada</p>}
          </div>

          <div className="flex justify-end gap-2 p-5 border-t border-boundary">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={handleImport}>Importar</Button>
          </div>
        </div>
      </div>
    </>
  )
}
