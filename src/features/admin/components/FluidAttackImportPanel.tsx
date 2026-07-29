import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/Button'
import {
  parseFluidAttackCSV,
  matchLocations,
  importFluidAttackVulnerabilities,
  type FluidAttackRow,
  type FluidAttackImportResult,
} from '@/services/import/fluidAttackService'

type Phase = 'upload' | 'preview' | 'importing' | 'done'

export function FluidAttackImportPanel() {
  const { addNotification } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('upload')
  const [parsedRows, setParsedRows] = useState<FluidAttackRow[]>([])
  const [result, setResult] = useState<FluidAttackImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      addNotification({ type: 'error', message: 'Solo se permiten archivos .csv' })
      return
    }

    setIsProcessing(true)
    try {
      const content = await file.text()
      const rows = parseFluidAttackCSV(content)
      setParsedRows(rows)
      setPhase('preview')
    } catch (err) {
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error al leer el archivo',
      })
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return
    setPhase('importing')
    try {
      const matches = await matchLocations(parsedRows)
      const importResult = await importFluidAttackVulnerabilities(matches)
      setResult(importResult)
      setPhase('done')
      addNotification({
        type: 'success',
        message: `Importación completada: ${importResult.createdVulns} vulnerabilidades creadas/actualizadas`,
      })
    } catch (err) {
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error durante la importación',
      })
      setPhase('preview')
    }
  }

  const handleReset = () => {
    setParsedRows([])
    setResult(null)
    setPhase('upload')
  }

  return (
    <div className="bg-card rounded-2xl border border-boundary shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-danger/10 text-danger">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">
            FluidAttack — Importar Vulnerabilidades
          </h3>
          <p className="text-xs text-neutral-50 dark:text-neutral-40">
            Carga un CSV de FluidAttack para crear vulnerabilidades en las aplicaciones
            correspondientes
          </p>
        </div>
      </div>

      {phase === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={cn(
              'w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 transition-colors',
              'border-boundary',
              'hover:border-danger/40 dark:hover:border-danger/40',
              'cursor-pointer disabled:opacity-50',
            )}
          >
            {isProcessing ? (
              <>
                <div className="w-8 h-8 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-neutral-50">Leyendo archivo...</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-neutral-40" />
                <p className="text-sm font-medium text-muted">Seleccionar archivo CSV</p>
                <p className="text-xs text-neutral-50 dark:text-neutral-50">
                  Columnas esperadas: Location, Weakness, Vulnerability ID, Severity Level, etc.
                </p>
              </>
            )}
          </Button>
        </div>
      )}

      {phase === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{parsedRows.length} filas detectadas</p>
            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs border border-neutral-30 dark:border-neutral-60 rounded-lg text-muted hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                className="px-3 py-1.5 text-xs bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors flex items-center gap-1.5"
              >
                <ArrowRight size={14} />
                Importar
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-boundary rounded-xl">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-neutral-10 dark:bg-neutral-85">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted">#</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted">Location</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted">Weakness</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted">Vuln ID</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted">Severidad</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 50).map((row) => (
                  <tr
                    key={row.rowIndex}
                    className="border-t border-neutral-10 dark:border-neutral-85 hover:bg-neutral-5 dark:hover:bg-neutral-85/50"
                  >
                    <td className="px-3 py-1.5 text-neutral-50">{row.rowIndex}</td>
                    <td className="px-3 py-1.5 font-mono text-neutral-80 dark:text-neutral-30">
                      {row.location || '—'}
                    </td>
                    <td className="px-3 py-1.5 text-neutral-80 dark:text-neutral-30 max-w-xs truncate">
                      {row.raw['weakness'] || '—'}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-neutral-60">
                      {row.raw['vulnerability_id'] || '—'}
                    </td>
                    <td className="px-3 py-1.5">
                      <SeverityBadge
                        value={row.raw['severity_level'] || row.raw['severity'] || ''}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusBadge value={row.raw['status'] || ''} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRows.length > 50 && (
              <p className="text-xs text-center text-neutral-50 py-2 border-t border-neutral-10 dark:border-neutral-85">
                ...y {parsedRows.length - 50} filas más
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'importing' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-2 border-danger border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-50">
            Matcheando locations con microservicios y creando vulnerabilidades...
          </p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              icon={<FileText size={16} />}
              label="Total filas"
              value={result.totalRows}
              color="neutral"
            />
            <StatBox
              icon={<CheckCircle size={16} />}
              label="Con match"
              value={result.matchedRows}
              color="success"
            />
            <StatBox
              icon={<XCircle size={16} />}
              label="Sin match"
              value={result.unmatchedRows}
              color={result.unmatchedRows > 0 ? 'danger' : 'neutral'}
            />
            <StatBox
              icon={<ShieldAlert size={16} />}
              label="Vulnerabilidades"
              value={result.createdVulns}
              color="danger"
            />
          </div>

          {result.unmatchedRows > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-2 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-warning" />
                Filas sin match ({result.unmatchedRows})
              </p>
              <div className="max-h-40 overflow-y-auto border border-boundary rounded-xl">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-neutral-10 dark:bg-neutral-85">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted">#</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted">Location</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted">Vuln ID</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted">Weakness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches
                      .filter((m) => !m.applicationId)
                      .map((m) => (
                        <tr
                          key={m.row.rowIndex}
                          className="border-t border-neutral-10 dark:border-neutral-85"
                        >
                          <td className="px-3 py-1.5 text-neutral-50">{m.row.rowIndex}</td>
                          <td className="px-3 py-1.5 font-mono text-neutral-80 dark:text-neutral-30">
                            {m.row.location || '—'}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-neutral-60">
                            {m.row.raw['vulnerability_id'] || '—'}
                          </td>
                          <td className="px-3 py-1.5 text-neutral-80 dark:text-neutral-30 truncate max-w-xs">
                            {m.row.raw['weakness'] || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-danger mb-1">
                {result.errors.length} error(es) durante la importación
              </p>
              <ul className="text-xs text-danger/80 space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    Fila {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleReset}
              className="px-4 py-2 text-xs bg-neutral-10 dark:bg-neutral-85 text-secondary rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70 transition-colors"
            >
              Importar otro archivo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SeverityBadge({ value }: { value: string }) {
  const v = value.trim().toLowerCase()
  const colorMap: Record<string, string> = {
    critical: 'bg-danger/10 text-danger border-danger/20',
    high: 'bg-warning/10 text-warning border-warning/20',
    medium: 'bg-info/10 text-info border-info/20',
    low: 'bg-success/10 text-success border-success/20',
    info: 'bg-neutral-10 text-neutral-50 border-neutral-20 dark:bg-neutral-85 dark:text-neutral-40 dark:border-neutral-70',
  }
  return (
    <span
      className={cn(
        'inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border',
        colorMap[v] ??
          'bg-neutral-10 text-neutral-50 border-neutral-20 dark:bg-neutral-85 dark:text-neutral-40 dark:border-neutral-70',
      )}
    >
      {value || '—'}
    </span>
  )
}

function StatusBadge({ value }: { value: string }) {
  const v = value.trim().toLowerCase()
  const colorMap: Record<string, string> = {
    open: 'bg-danger/10 text-danger border-danger/20',
    'in progress': 'bg-info/10 text-info border-info/20',
    mitigate: 'bg-warning/10 text-warning border-warning/20',
    'accept risk': 'bg-neutral-10 text-neutral-60 border-neutral-30',
    fixed: 'bg-success/10 text-success border-success/20',
  }
  return (
    <span
      className={cn(
        'inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border',
        colorMap[v] ??
          'bg-neutral-10 text-neutral-50 border-neutral-20 dark:bg-neutral-85 dark:text-neutral-40 dark:border-neutral-70',
      )}
    >
      {value || '—'}
    </span>
  )
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
    neutral: 'text-muted',
  }
  return (
    <div className="bg-neutral-5 dark:bg-neutral-85 rounded-xl border border-neutral-10 dark:border-neutral-75 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={colorMap[color] ?? colorMap.neutral}>{icon}</span>
        <span className="text-[11px] text-neutral-50 dark:text-neutral-40">{label}</span>
      </div>
      <p className={cn('text-lg font-bold tabular-nums', colorMap[color] ?? colorMap.neutral)}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}
