import { useCallback, useEffect, useState, startTransition } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import {
  getAzureConfig,
  saveAzureConfig,
  clearAzureConfig,
  getAzureBackupInfo,
  testAzureConnection,
  uploadBackupToAzure,
  listAzureBackups,
  restoreFromAzure,
} from '@/services/backup/azureBackupService'
import type { BackupBlobInfo } from '@/services/backup/azureBackupService'
import { Cloud, Upload, Download, CheckCircle2, XCircle, Loader2, Trash2, RefreshCw, ExternalLink } from 'lucide-react'

export function AzureBackupConfig() {
  const { addNotification } = useAppStore()
  const { confirm } = useConfirm()

  const savedConfig = getAzureConfig()
  const initialInfo = getAzureBackupInfo()

  const [sasUrl, setSasUrl] = useState(savedConfig?.sasUrl ?? '')
  const [containerName, setContainerName] = useState(savedConfig?.containerName ?? '')
  const [showUrl, setShowUrl] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [backups, setBackups] = useState<BackupBlobInfo[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [info, setInfo] = useState(initialInfo)

  const refreshInfo = useCallback(() => {
    setInfo(getAzureBackupInfo())
  }, [])

  const loadBackupList = useCallback(async () => {
    setLoadingBackups(true)
    try {
      const list = await listAzureBackups()
      
      setBackups(list)
    } catch {
      setBackups([])
    } finally {
      setLoadingBackups(false)
    }
  }, [])

  useEffect(() => {
    if (initialInfo.configured) {
      startTransition(() => { loadBackupList() })
    }
  }, [initialInfo.configured, loadBackupList])

  const handleTest = async () => {
    if (!sasUrl.trim()) {
      setTestResult({ success: false, message: 'Ingresa una SAS URL primero' })
      return
    }
    setTesting(true)
    setTestResult(null)
    const result = await testAzureConnection()
    setTestResult(result)
    setTesting(false)
  }

  const handleSave = () => {
    if (!sasUrl.trim()) {
      addNotification({ type: 'error', message: 'La SAS URL no puede estar vacía' })
      return
    }
    if (!containerName.trim()) {
      addNotification({ type: 'error', message: 'El nombre del contenedor no puede estar vacío' })
      return
    }
    saveAzureConfig({ sasUrl: sasUrl.trim(), containerName: containerName.trim() })
    refreshInfo()
    addNotification({ type: 'success', message: 'Configuración de Azure guardada' })
  }

  const handleClear = () => {
    clearAzureConfig()
    setSasUrl('')
    setContainerName('')
    setTestResult(null)
    setBackups([])
    refreshInfo()
    addNotification({ type: 'info', message: 'Configuración de Azure eliminada' })
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const { blobName, sizeBytes } = await uploadBackupToAzure()
      refreshInfo()
      const sizeKB = Math.round(sizeBytes / 1024)
      addNotification({
        type: 'success',
        message: `Backup subido: ${blobName} (${sizeKB} KB)`,
      })
      loadBackupList()
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Error al subir backup: ${err instanceof Error ? err.message : 'desconocido'}`,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRestore = async (blobName: string) => {
    if (!await confirm(`¿Restaurar datos desde "${blobName}"? Esto sobrescribirá TODOS los datos actuales en el navegador.`)) {
      return
    }
    setRestoring(blobName)
    try {
      const result = await restoreFromAzure(blobName)
      if (result.success) {
        addNotification({
          type: 'success',
          message: `Restauración completada: ${result.totalRecords} registros en ${result.tablesRestored.length} tablas`,
        })
      } else {
        addNotification({
          type: 'warning',
          message: `Restauración con errores: ${result.errors.length} errores`,
        })
      }
    } catch (err) {
      addNotification({
        type: 'error',
        message: `Error al restaurar: ${err instanceof Error ? err.message : 'desconocido'}`,
      })
    } finally {
      setRestoring(null)
    }
  }

  const inputClass = 'w-full rounded-lg border border-neutral-30 dark:border-neutral-60 bg-white dark:bg-neutral-80 px-3 py-2 text-sm text-neutral-90 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary'
  const btnClass = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const cardClass = 'p-4 bg-neutral-10 dark:bg-neutral-70 rounded-lg border border-neutral-20 dark:border-neutral-60'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Backup en la Nube</h3>
        </div>
        {info.configured && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <CheckCircle2 size={12} />
            Configurado
          </span>
        )}
      </div>

      {!info.configured && (
        <p className="text-sm text-neutral-60 dark:text-neutral-40">
          Configura una SAS URL de Azure Blob Storage para mantener copias de seguridad automáticas en la nube.
          Puedes generar una SAS URL desde Azure Portal: Storage Account → Contenedor → Shared access signature.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            SAS URL de la Cuenta
          </label>
          <div className="flex gap-2">
            <input
              type={showUrl ? 'text' : 'password'}
              value={sasUrl}
              onChange={(e) => setSasUrl(e.target.value)}
              placeholder="https://tuaccount.blob.core.windows.net/?sv=2022-11-02&ss=b&srt=sco&sp=rwdl&se=..."
              className={inputClass}
            />
            <button
              onClick={() => setShowUrl(!showUrl)}
              className="px-3 py-2 border border-neutral-30 dark:border-neutral-60 rounded-lg text-xs text-neutral-50 hover:text-neutral-90 dark:hover:text-white transition-colors"
              title={showUrl ? 'Ocultar' : 'Mostrar'}
            >
              {showUrl ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            Nombre del Contenedor
          </label>
          <input
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder="tgpdemo"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleTest} disabled={testing} className={`${btnClass} border border-neutral-30 dark:border-neutral-60 text-neutral-70 dark:text-neutral-30 hover:bg-neutral-20 dark:hover:bg-neutral-60`}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>
          <button onClick={handleSave} className={`${btnClass} bg-primary text-white hover:bg-primary-dark`}>
            Guardar Configuración
          </button>
          {info.configured && (
            <button onClick={handleClear} className={`${btnClass} border border-danger/30 text-danger hover:bg-danger/5`}>
              <Trash2 size={14} />
              Eliminar Configuración
            </button>
          )}
        </div>

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            testResult.success
              ? 'bg-success/5 text-success'
              : 'bg-danger/5 text-danger'
          }`}>
            {testResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {info.configured && (
        <>
          <div className="flex items-center gap-3">
            {info.lastBackup && (
              <span className="text-xs text-neutral-50">
                Último backup: {new Date(info.lastBackup).toLocaleString('es-ES')}
                {info.lastBackupName && ` (${info.lastBackupName})`}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleUpload} disabled={uploading} className={`${btnClass} bg-primary text-white hover:bg-primary-dark disabled:opacity-50`}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Subiendo...' : 'Subir Backup Ahora'}
            </button>
            <button onClick={loadBackupList} disabled={loadingBackups} className={`${btnClass} border border-neutral-30 dark:border-neutral-60 text-neutral-70 dark:text-neutral-30 hover:bg-neutral-20 dark:hover:bg-neutral-60`}>
              {loadingBackups ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loadingBackups ? 'Cargando...' : 'Listar Backups'}
            </button>
          </div>

          {loadingBackups && (
            <div className="flex items-center gap-2 text-sm text-neutral-50 py-4">
              <Loader2 size={14} className="animate-spin" />
              Cargando lista de backups...
            </div>
          )}

          {backups.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-60 mb-3">{backups.length} backups disponibles:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {backups.map((b) => (
                  <div key={b.name} className={`${cardClass} flex flex-col p-3`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-90 dark:text-white truncate leading-tight mb-1">{b.name.replace('tgp-backup-', '').replace('.json', '')}</p>
                      <p className="text-[10px] text-neutral-50">
                        {b.size > 1024 ? `${(b.size / 1024).toFixed(1)} KB` : `${b.size} B`}
                        {' · '}
                        {new Date(b.lastModified).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <button onClick={() => handleRestore(b.name)} disabled={restoring === b.name}
                      className="mt-2 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50">
                      {restoring === b.name ? <Loader2 size={10} className="animate-spin" /> : <ExternalLink size={10} />}
                      {restoring === b.name ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingBackups && backups.length === 0 && info.configured && (
            <p className="text-sm text-neutral-50 py-2">
              No se encontraron backups en Azure. Sube el primero con el botón "Subir Backup Ahora".
            </p>
          )}
        </>
      )}
    </div>
  )
}
