import { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Loader,
  AlertTriangle,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  parseExcel,
  importRows,
  getImportableEntities,
  ImportFileError,
} from '@/services/import/importService'
import type { ParsedRow, ImportResult } from '@/services/import/importService'
import { useAppStore } from '@/stores/appStore'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addNotification } = useAppStore()
  const [selectedType, setSelectedType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const entityTypes = getImportableEntities()
  const selectedConfig = entityTypes.find((e) => e.id === selectedType)

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setFile(null)
    setParsedRows(null)
    setResult(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.size > MAX_FILE_SIZE) {
      addNotification({
        type: 'error',
        message: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setFile(f)
    setParsedRows(null)
    setResult(null)
  }

  const handlePreview = async () => {
    if (!file || !selectedType) return

    try {
      const buffer = await file.arrayBuffer()
      const rows = parseExcel(buffer, selectedType)
      setParsedRows(rows)

      if (rows.length === 0) {
        addNotification({ type: 'warning', message: 'El archivo no contiene datos válidos' })
      }
    } catch (err) {
      if (err instanceof ImportFileError) {
        addNotification({ type: 'error', message: err.message })
      } else {
        addNotification({
          type: 'error',
          message: 'Error al leer el archivo. Verifica que sea un Excel válido.',
        })
      }
    }
  }

  const handleImport = async () => {
    if (!parsedRows || !selectedType) return

    setImporting(true)
    setResult(null)

    try {
      const res = await importRows(selectedType, parsedRows)
      setResult(res)
      if (res.errorRows === 0) {
        addNotification({
          type: 'success',
          message: `${res.successRows} registros importados correctamente`,
        })
      } else {
        addNotification({
          type: 'warning',
          message: `${res.successRows} importados, ${res.errorRows} con errores`,
        })
      }
    } catch (err) {
      const msg =
        err instanceof ImportFileError
          ? err.message
          : 'Error de importación. Revisa los datos e intenta de nuevo.'
      addNotification({ type: 'error', message: msg })
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedRows(null)
    setResult(null)
    setSelectedType('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validRows = parsedRows?.filter((r) => r.errors.length === 0) ?? []
  const errorRows = parsedRows?.filter((r) => r.errors.length > 0) ?? []
  const previewRows = parsedRows?.slice(0, 10) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-90 dark:text-white">Importar Datos</h2>
          <p className="text-sm text-muted mt-1">
            Sube un archivo Excel (.xlsx) para importar datos masivamente
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
        <div className="space-y-5">
          {/* Entity type selector */}
          <div>
            <Select
              label="Tipo de datos a importar"
              value={selectedType}
              onChange={(v) => handleTypeChange(v)}
              options={[
                { value: '', label: 'Seleccionar...' },
                ...entityTypes.map((et) => ({ value: et.id, label: et.label })),
              ]}
              className="max-w-md"
            />
          </div>

          {/* File upload */}
          {selectedType && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Archivo Excel</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block text-sm text-neutral-60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                />
                {file && (
                  <span className="text-sm text-neutral-60 flex items-center gap-1">
                    <FileSpreadsheet size={16} />
                    {file.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Column reference */}
          {selectedConfig && (
            <details className="text-sm">
              <summary className="cursor-pointer text-primary hover:text-primary-dark font-medium">
                Ver columnas esperadas
              </summary>
              <div className="mt-2 p-3 bg-neutral-10 dark:bg-neutral-70 rounded-lg">
                <p className="text-xs text-neutral-60 mb-2">
                  El Excel debe tener estos encabezados (orden flexible):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedConfig.columns.map((col) => (
                    <div key={col.key} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-neutral-90 dark:text-white">
                        {col.label}
                      </span>
                      {col.required && <span className="text-danger">*</span>}
                      {col.type === 'number' && <span className="text-info">(num)</span>}
                      {col.type === 'date' && <span className="text-warning">(fecha)</span>}
                      {col.type === 'enum' && (
                        <span className="text-neutral-50">({col.enumValues?.join('/')})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}

          {/* Action buttons */}
          {file && !parsedRows && (
            <Button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              <Upload size={16} />
              Previsualizar datos
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      {parsedRows && (
        <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-neutral-90 dark:text-white">
                Vista Previa
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {parsedRows.length} filas
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                {validRows.length} válidas
              </span>
              {errorRows.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                  {errorRows.length} con errores
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-90 dark:text-white border border-neutral-30 dark:border-neutral-60 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                <Trash2 size={14} />
                Limpiar
              </button>
              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Upload size={14} />
                  Nueva importación
                </button>
              )}
            </div>
          </div>

          {/* Error rows summary */}
          {errorRows.length > 0 && (
            <div className="mb-4 p-3 bg-danger/5 border border-danger/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-danger" />
                <span className="text-xs font-semibold text-danger">Errores de validación</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {errorRows.map((row) => (
                  <p key={row.index} className="text-xs text-danger">
                    Fila {row.index}: {row.errors.join('; ')}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Table preview */}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto border border-boundary rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-10 dark:bg-neutral-70 border-b border-boundary">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-60">#</th>
                    {selectedConfig?.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-left text-xs font-semibold text-neutral-60"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-20 dark:divide-neutral-70">
                  {previewRows.map((row) => (
                    <tr key={row.index} className={row.errors.length > 0 ? 'bg-danger/5' : ''}>
                      <td className="px-3 py-2 text-xs text-neutral-50">{row.index}</td>
                      {selectedConfig?.columns.map((col) => {
                        const val = row.data[col.label]
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2 text-xs text-secondary max-w-[200px] truncate"
                          >
                            {col.type === 'date' && val ? (
                              <span className="text-neutral-50">{String(val)}</span>
                            ) : (
                              String(val ?? '')
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 10 && (
                <p className="px-3 py-2 text-xs text-neutral-50 border-t border-boundary">
                  Mostrando 10 de {parsedRows.length} filas
                </p>
              )}
            </div>
          )}

          {/* Import button */}
          {!result && validRows.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {importing ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                {importing ? 'Importando...' : `Importar ${validRows.length} registros`}
              </Button>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="mt-4 p-4 rounded-lg border border-neutral-30 dark:border-neutral-60 text-sm">
              <div className="flex items-center gap-3 mb-3">
                {result.errorRows === 0 ? (
                  <CheckCircle size={24} className="text-success" />
                ) : (
                  <AlertTriangle size={24} className="text-warning" />
                )}
                <div>
                  <p className="font-medium text-neutral-90 dark:text-white">
                    Importación completada
                  </p>
                  <p className="text-xs text-neutral-60">
                    {result.successRows} registros importados
                    {result.errorRows > 0 ? `, ${result.errorRows} con errores` : ''}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-1 text-xs text-danger hover:text-danger-dark mb-2"
                  >
                    {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Ver detalles de errores
                  </button>
                  {showDetails && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-xs text-danger">
                          Fila {e.row}: {e.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Template download */}
      {selectedConfig && (
        <div className="bg-card rounded-xl border border-boundary p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-90 dark:text-white mb-2">
            ¿No tienes un archivo?
          </h3>
          <p className="text-sm text-muted mb-3">
            Puedes descargar una plantilla con las columnas necesarias para cada tipo de dato.
          </p>
          <div className="flex flex-wrap gap-2">
            {entityTypes.map((et) => (
              <button
                type="button"
                key={et.id}
                onClick={() => downloadTemplate(et.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-90 dark:text-white border border-neutral-30 dark:border-neutral-60 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
              >
                <Download size={14} />
                {et.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Template download ─── */

function downloadTemplate(entityType: string) {
  import('@/services/import/importService').then(({ getImportConfig }) => {
    const config = getImportConfig(entityType)
    if (!config) return

    import('xlsx-js-style').then((XLSX) => {
      const headerRow = config.columns.map((c) => c.label)
      const exampleRow = config.columns.map((c) => {
        if (c.required) {
          if (c.type === 'number') return '1'
          if (c.type === 'date') return '2026-01-01'
          if (c.enumValues) return c.enumValues[0]
          return 'Ejemplo'
        }
        return ''
      })

      const ws = XLSX.utils.aoa_to_sheet([headerRow, exampleRow])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')
      XLSX.writeFile(wb, `plantilla-${entityType}.xlsx`)
    })
  })
}
