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
import {
  getShareAzureConfig,
  saveShareAzureConfig,
  clearShareAzureConfig,
  getShareAzureInfo,
  listShareContainerBlobs,
} from '@/services/share/azureShareService'
import {
  Cloud,
  Share2,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Upload,
  Download,
  ExternalLink,
  Info,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function AzureCloudConfig() {
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

  const savedShareConfig = getShareAzureConfig()
  const initialShareInfo = getShareAzureInfo()
  const backupConfigured = info.configured
  // Default: use same config unless a dedicated share config already exists
  const [useSameForSharing, setUseSameForSharing] = useState(!savedShareConfig)
  const [shareSasUrl, setShareSasUrl] = useState(savedShareConfig?.sasUrl ?? '')
  const [shareContainerName, setShareContainerName] = useState(
    savedShareConfig?.containerName ?? '',
  )
  const [showShareUrl, setShowShareUrl] = useState(false)
  const [testingShare, setTestingShare] = useState(false)
  const [shareTestResult, setShareTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [shareInfo, setShareInfo] = useState(initialShareInfo)

  const refreshInfo = useCallback(() => {
    setInfo(getAzureBackupInfo())
    setShareInfo(getShareAzureInfo())
  }, [])

  const loadBackupList = useCallback(async () => {
    setLoadingBackups(true)
    try {
      setBackups(await listAzureBackups())
    } catch {
      setBackups([])
    } finally {
      setLoadingBackups(false)
    }
  }, [])

  useEffect(() => {
    if (initialInfo.configured) {
      startTransition(() => {
        loadBackupList()
      })
    }
  }, [initialInfo.configured, loadBackupList])

  const handleTestBackup = async () => {
    if (!sasUrl.trim()) {
      setTestResult({ success: false, message: 'Ingresa una SAS URL primero' })
      return
    }
    setTesting(true)
    setTestResult(null)
    setTestResult(await testAzureConnection())
    setTesting(false)
  }

  const handleSaveBackup = () => {
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

  const handleClearBackup = () => {
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
      addNotification({ type: 'success', message: `Backup subido: ${blobName} (${sizeKB} KB)` })
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
    if (
      !(await confirm(
        `¿Restaurar datos desde "${blobName}"? Esto sobrescribirá TODOS los datos actuales en el navegador.`,
      ))
    )
      return
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

  const handleTestShare = async () => {
    const url = useSameForSharing ? sasUrl.trim() : shareSasUrl.trim()
    if (!url) {
      setShareTestResult({ success: false, message: 'No hay SAS URL configurada' })
      return
    }
    setTestingShare(true)
    setShareTestResult(null)
    try {
      const blobs = await listShareContainerBlobs()
      setShareTestResult({
        success: true,
        message: `Conexión exitosa: ${blobs.length} archivos en el contenedor`,
      })
    } catch (err) {
      setShareTestResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : 'desconocido'}`,
      })
    }
    setTestingShare(false)
  }

  const handleSaveShare = () => {
    if (useSameForSharing) {
      clearShareAzureConfig()
    } else {
      if (!shareSasUrl.trim()) {
        addNotification({ type: 'error', message: 'La SAS URL de compartir no puede estar vacía' })
        return
      }
      if (!shareContainerName.trim()) {
        addNotification({
          type: 'error',
          message: 'El nombre del contenedor de compartir no puede estar vacío',
        })
        return
      }
      saveShareAzureConfig({ sasUrl: shareSasUrl.trim(), containerName: shareContainerName.trim() })
    }
    refreshInfo()
    addNotification({
      type: 'success',
      message: useSameForSharing
        ? 'Compartir usará la misma configuración de Azure'
        : 'Configuración de compartir guardada',
    })
  }

  const handleClearShare = () => {
    clearShareAzureConfig()
    setShareSasUrl('')
    setShareContainerName('')
    setShareTestResult(null)
    setUseSameForSharing(true)
    refreshInfo()
    addNotification({
      type: 'info',
      message: 'Configuración de compartir dedicada eliminada. Usará la de backup.',
    })
  }

  const handleToggleUseSame = (same: boolean) => {
    setUseSameForSharing(same)
    if (same) {
      clearShareAzureConfig()
      refreshInfo()
      addNotification({
        type: 'info',
        message: 'Compartir usará la misma configuración de Azure que Backup',
      })
    } else {
      if (!savedShareConfig && backupConfigured) {
        setShareSasUrl(sasUrl)
        setShareContainerName(containerName)
      }
    }
  }

  const effectiveShareConfigured = useSameForSharing ? backupConfigured : shareInfo.configured

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">
            Azure Blob Storage
          </h3>
        </div>
        {info.configured && (
          <Badge color="success">
            <CheckCircle2 size={12} className="mr-1" />
            Configurado
          </Badge>
        )}
      </div>

      {!info.configured && (
        <p className="text-sm text-muted">
          Configura una SAS URL de Azure Blob Storage para mantener copias de seguridad automáticas
          en la nube y compartir enlaces públicos con cifrado. Puedes generar una SAS URL desde
          Azure Portal: Storage Account → Contenedor → Shared access signature.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary">
          <Cloud size={16} />
          <span>Backup de Base de Datos</span>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            SAS URL de la Cuenta
          </label>
          <div className="flex gap-2">
            <Input
              type={showUrl ? 'text' : 'password'}
              value={sasUrl}
              onChange={(e) => setSasUrl(e.target.value)}
              placeholder="https://tuaccount.blob.core.windows.net/?sv=2022-11-02&ss=b&srt=sco&sp=rwdl&se=..."
            />
            <Button variant="ghost" size="sm" onClick={() => setShowUrl(!showUrl)}>
              {showUrl ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-60 mb-1 block">
            Nombre del Contenedor
          </label>
          <Input
            type="text"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            placeholder="tgpdemo"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleTestBackup}
            isLoading={testing}
            leftIcon={<RefreshCw size={14} />}
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveBackup}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Guardar Configuración
          </Button>
          {info.configured && (
            <Button variant="danger" onClick={handleClearBackup} leftIcon={<Trash2 size={14} />}>
              Eliminar
            </Button>
          )}
        </div>

        {testResult && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              testResult.success ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <XCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      <div className="border-t border-boundary" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Share2 size={16} className="text-secondary" />
            <span>Compartir Enlaces Públicos</span>
          </div>
          {effectiveShareConfigured && (
            <Badge color="success">
              <CheckCircle2 size={12} className="mr-1" />
              {useSameForSharing ? 'Usa Backup' : 'Configurado'}
            </Badge>
          )}
        </div>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={useSameForSharing}
            onChange={(e) => handleToggleUseSame(e.target.checked)}
            className="mt-0.5 rounded border-neutral-30 dark:border-neutral-60 text-secondary focus:ring-secondary/20"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-neutral-80 dark:text-neutral-20 group-hover:text-neutral-90 dark:group-hover:text-white transition-colors">
              Usar la misma configuración de Azure
            </span>
            <p className="text-xs text-neutral-50 mt-0.5">
              Los enlaces compartidos se almacenarán en el mismo contenedor de backup. Recomendado
              para simplicidad.
            </p>
          </div>
        </label>

        {!useSameForSharing && (
          <Card padding={false} className="p-4 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 text-info text-xs">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                Configura un contenedor separado para compartir enlaces públicos. Usa permisos
                mínimos (
                <code className="px-1 py-0.5 rounded bg-neutral-20 dark:bg-neutral-70 text-[10px]">
                  rc
                </code>
                ) en la SAS URL.
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">
                SAS URL (solo lectura + creación)
              </label>
              <div className="flex gap-2">
                <Input
                  type={showShareUrl ? 'text' : 'password'}
                  value={shareSasUrl}
                  onChange={(e) => setShareSasUrl(e.target.value)}
                  placeholder="https://tuaccount.blob.core.windows.net/?sv=2022-11-02&ss=b&srt=sco&sp=rc&se=..."
                />
                <Button variant="ghost" size="sm" onClick={() => setShowShareUrl(!showShareUrl)}>
                  {showShareUrl ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-60 mb-1 block">
                Nombre del Contenedor
              </label>
              <Input
                type="text"
                value={shareContainerName}
                onChange={(e) => setShareContainerName(e.target.value)}
                placeholder="tgp-shares"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleTestShare}
                isLoading={testingShare}
                leftIcon={<RefreshCw size={14} />}
              >
                {testingShare ? 'Probando...' : 'Probar Conexión'}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveShare}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Guardar Configuración
              </Button>
              <Button variant="danger" onClick={handleClearShare} leftIcon={<Trash2 size={14} />}>
                Usar Backup
              </Button>
            </div>

            {shareTestResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  shareTestResult.success ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'
                }`}
              >
                {shareTestResult.success ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <span>{shareTestResult.message}</span>
              </div>
            )}

            {shareInfo.configured && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 text-info text-xs">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  Compartiendo en <strong>{shareInfo.containerName}</strong>. Los datos se cifran
                  (AES-GCM 256) antes de subir. Archivos expirados se limpian automáticamente.
                </span>
              </div>
            )}
          </Card>
        )}

        {useSameForSharing && backupConfigured && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 text-info text-xs">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Los enlaces públicos se almacenan en <strong>{containerName}</strong> (mismo
              contenedor que backup). Siempre se cifran (AES-GCM 256) antes de subir. Los archivos
              expirados se limpian automáticamente.
            </span>
          </div>
        )}

        {!effectiveShareConfigured && (
          <p className="text-sm text-warning flex items-center gap-2">
            <Info size={14} />
            Sin Azure configurado, los enlaces compartidos solo funcionarán desde este navegador.
          </p>
        )}
      </div>

      {info.configured && <div className="border-t border-boundary" />}

      {info.configured && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary">
              <Download size={16} />
              <span>Backups</span>
            </div>
            <span className="text-xs text-neutral-50">
              {info.lastBackup && `Último: ${new Date(info.lastBackup).toLocaleString('es-ES')}`}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={handleUpload}
              isLoading={uploading}
              leftIcon={<Upload size={14} />}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {uploading ? 'Subiendo...' : 'Subir Backup Ahora'}
            </Button>
            <Button
              variant="secondary"
              onClick={loadBackupList}
              isLoading={loadingBackups}
              leftIcon={<RefreshCw size={14} />}
            >
              {loadingBackups ? 'Cargando...' : 'Listar Backups'}
            </Button>
          </div>

          {loadingBackups && (
            <div className="flex items-center gap-2 text-sm text-neutral-50 py-3">
              <Loader2 size={14} className="animate-spin" />
              Cargando lista de backups...
            </div>
          )}

          {backups.length > 0 && (
            <div>
              <p className="text-xs font-medium text-neutral-60 mb-3">
                {backups.length} backups disponibles:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {backups.map((b) => (
                  <Card padding={false} key={b.name} className="flex flex-col p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-90 dark:text-white truncate leading-tight mb-1">
                        {b.name.replace('tgp-backup-', '').replace('.json', '')}
                      </p>
                      <p className="text-[10px] text-neutral-50">
                        {b.size > 1024 ? `${(b.size / 1024).toFixed(1)} KB` : `${b.size} B`}
                        {' · '}
                        {new Date(b.lastModified).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRestore(b.name)}
                      disabled={restoring === b.name}
                      className="mt-2 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                    >
                      {restoring === b.name ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <ExternalLink size={10} />
                      )}
                      {restoring === b.name ? 'Restaurando...' : 'Restaurar'}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loadingBackups && backups.length === 0 && (
            <p className="text-sm text-neutral-50 py-2">
              No se encontraron backups en Azure. Sube el primero con el botón "Subir Backup Ahora".
            </p>
          )}
        </div>
      )}
    </div>
  )
}
