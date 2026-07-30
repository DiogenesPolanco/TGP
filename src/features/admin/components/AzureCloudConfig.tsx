import { useCallback, useEffect, useState, startTransition } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useConfirm } from '@/hooks/useConfirm'
import {
  getAzureConfig, saveAzureConfig, clearAzureConfig,
  getAzureBackupInfo, testAzureConnection, uploadBackupToAzure,
  listAzureBackups, restoreFromAzure,
} from '@/services/backup/azureBackupService'
import type { BackupBlobInfo } from '@/services/backup/azureBackupService'
import {
  getShareAzureConfig, saveShareAzureConfig, clearShareAzureConfig,
  getShareAzureInfo, listShareContainerBlobs,
} from '@/services/share/azureShareService'
import { Cloud, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { AzureBackupConfigSection } from './AzureBackupConfigSection'
import { AzureShareConfigSection } from './AzureShareConfigSection'
import { AzureBackupListSection } from './AzureBackupListSection'

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
  const [useSameForSharing, setUseSameForSharing] = useState(!savedShareConfig)
  const [shareSasUrl, setShareSasUrl] = useState(savedShareConfig?.sasUrl ?? '')
  const [shareContainerName, setShareContainerName] = useState(savedShareConfig?.containerName ?? '')
  const [showShareUrl, setShowShareUrl] = useState(false)
  const [testingShare, setTestingShare] = useState(false)
  const [shareTestResult, setShareTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [shareInfo, setShareInfo] = useState(initialShareInfo)

  const refreshInfo = useCallback(() => { setInfo(getAzureBackupInfo()); setShareInfo(getShareAzureInfo()) }, [])

  const loadBackupList = useCallback(async () => {
    setLoadingBackups(true)
    try { setBackups(await listAzureBackups()) }
    catch { setBackups([]) }
    finally { setLoadingBackups(false) }
  }, [])

  useEffect(() => { if (initialInfo.configured) startTransition(() => loadBackupList()) }, [initialInfo.configured, loadBackupList])

  const handleTestBackup = async () => {
    if (!sasUrl.trim()) { setTestResult({ success: false, message: 'Ingresa una SAS URL primero' }); return }
    setTesting(true); setTestResult(null)
    setTestResult(await testAzureConnection())
    setTesting(false)
  }

  const handleSaveBackup = () => {
    if (!sasUrl.trim()) { addNotification({ type: 'error', message: 'La SAS URL no puede estar vacía' }); return }
    if (!containerName.trim()) { addNotification({ type: 'error', message: 'El nombre del contenedor no puede estar vacío' }); return }
    saveAzureConfig({ sasUrl: sasUrl.trim(), containerName: containerName.trim() })
    refreshInfo()
    addNotification({ type: 'success', message: 'Configuración de Azure guardada' })
  }

  const handleClearBackup = () => {
    clearAzureConfig(); setSasUrl(''); setContainerName(''); setTestResult(null); setBackups([])
    refreshInfo()
    addNotification({ type: 'info', message: 'Configuración de Azure eliminada' })
  }

  const handleUpload = async () => {
    setUploading(true)
    try {
      const { blobName, sizeBytes } = await uploadBackupToAzure()
      refreshInfo()
      addNotification({ type: 'success', message: `Backup subido: ${blobName} (${Math.round(sizeBytes / 1024)} KB)` })
      loadBackupList()
    } catch (err) {
      addNotification({ type: 'error', message: `Error al subir backup: ${err instanceof Error ? err.message : 'desconocido'}` })
    } finally { setUploading(false) }
  }

  const handleRestore = async (blobName: string) => {
    if (!await confirm(`¿Restaurar datos desde "${blobName}"? Esto sobrescribirá TODOS los datos actuales en el navegador.`)) return
    setRestoring(blobName)
    try {
      const result = await restoreFromAzure(blobName)
      addNotification({
        type: result.success ? 'success' : 'warning',
        message: result.success
          ? `Restauración completada: ${result.totalRecords} registros en ${result.tablesRestored.length} tablas`
          : `Restauración con errores: ${result.errors.length} errores`,
      })
    } catch (err) {
      addNotification({ type: 'error', message: `Error al restaurar: ${err instanceof Error ? err.message : 'desconocido'}` })
    } finally { setRestoring(null) }
  }

  const handleTestShare = async () => {
    if (!(useSameForSharing ? sasUrl.trim() : shareSasUrl.trim())) {
      setShareTestResult({ success: false, message: 'No hay SAS URL configurada' }); return
    }
    setTestingShare(true); setShareTestResult(null)
    try {
      const blobs = await listShareContainerBlobs()
      setShareTestResult({ success: true, message: `Conexión exitosa: ${blobs.length} archivos en el contenedor` })
    } catch (err) {
      setShareTestResult({ success: false, message: `Error: ${err instanceof Error ? err.message : 'desconocido'}` })
    }
    setTestingShare(false)
  }

  const handleSaveShare = () => {
    if (useSameForSharing) { clearShareAzureConfig() }
    else {
      if (!shareSasUrl.trim()) { addNotification({ type: 'error', message: 'La SAS URL de compartir no puede estar vacía' }); return }
      if (!shareContainerName.trim()) { addNotification({ type: 'error', message: 'El nombre del contenedor de compartir no puede estar vacío' }); return }
      saveShareAzureConfig({ sasUrl: shareSasUrl.trim(), containerName: shareContainerName.trim() })
    }
    refreshInfo()
    addNotification({ type: 'success', message: useSameForSharing ? 'Compartir usará la misma configuración de Azure' : 'Configuración de compartir guardada' })
  }

  const handleClearShare = () => {
    clearShareAzureConfig(); setShareSasUrl(''); setShareContainerName(''); setShareTestResult(null)
    setUseSameForSharing(true)
    refreshInfo()
    addNotification({ type: 'info', message: 'Configuración de compartir dedicada eliminada. Usará la de backup.' })
  }

  const handleToggleUseSame = (same: boolean) => {
    setUseSameForSharing(same)
    if (same) { clearShareAzureConfig(); refreshInfo(); addNotification({ type: 'info', message: 'Compartir usará la misma configuración de Azure que Backup' }) }
    else if (!savedShareConfig && info.configured) { setShareSasUrl(sasUrl); setShareContainerName(containerName) }
  }

  const effectiveShareConfigured = useSameForSharing ? info.configured : shareInfo.configured

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-neutral-90 dark:text-white">Azure Blob Storage</h3>
        </div>
        {info.configured && <Badge color="success"><CheckCircle2 size={12} className="mr-1" /> Configurado</Badge>}
      </div>

      {!info.configured && (
        <p className="text-sm text-muted">
          Configura una SAS URL de Azure Blob Storage para mantener copias de seguridad automáticas
          en la nube y compartir enlaces públicos con cifrado. Puedes generar una SAS URL desde
          Azure Portal: Storage Account → Contenedor → Shared access signature.
        </p>
      )}

      <AzureBackupConfigSection
        sasUrl={sasUrl} onSasUrlChange={setSasUrl}
        containerName={containerName} onContainerNameChange={setContainerName}
        showUrl={showUrl} onToggleShowUrl={() => setShowUrl(!showUrl)}
        testing={testing} testResult={testResult} configured={info.configured}
        onTest={handleTestBackup} onSave={handleSaveBackup} onClear={handleClearBackup}
      />

      <div className="border-t border-boundary" />

      <AzureShareConfigSection
        useSameForSharing={useSameForSharing} backupConfigured={info.configured}
        effectiveConfigured={effectiveShareConfigured}
        shareSasUrl={shareSasUrl} onShareSasUrlChange={setShareSasUrl}
        shareContainerName={shareContainerName} onShareContainerNameChange={setShareContainerName}
        showShareUrl={showShareUrl} onToggleShowShareUrl={() => setShowShareUrl(!showShareUrl)}
        testingShare={testingShare} shareTestResult={shareTestResult}
        shareContainerConfigured={shareInfo.configured ? shareInfo.containerName : ''}
        backupContainerName={containerName}
        onToggleUseSame={handleToggleUseSame}
        onTest={handleTestShare} onSave={handleSaveShare} onClear={handleClearShare}
      />

      <AzureBackupListSection
        info={info} backups={backups} loadingBackups={loadingBackups}
        uploading={uploading} restoring={restoring}
        onUpload={handleUpload} onRefresh={loadBackupList} onRestore={handleRestore}
      />
    </div>
  )
}
