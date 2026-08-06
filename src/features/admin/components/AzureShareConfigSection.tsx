import { Share2, CheckCircle2, XCircle, Info, RefreshCw, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Props {
  useSameForSharing: boolean
  backupConfigured: boolean
  effectiveConfigured: boolean
  shareSasUrl: string
  onShareSasUrlChange: (v: string) => void
  shareContainerName: string
  onShareContainerNameChange: (v: string) => void
  showShareUrl: boolean
  onToggleShowShareUrl: () => void
  testingShare: boolean
  shareTestResult: { success: boolean; message: string } | null
  shareContainerConfigured: string
  backupContainerName: string
  onToggleUseSame: (same: boolean) => void
  onTest: () => void
  onSave: () => void
  onClear: () => void
}

export function AzureShareConfigSection({
  useSameForSharing,
  backupConfigured,
  effectiveConfigured,
  shareSasUrl,
  onShareSasUrlChange,
  shareContainerName,
  onShareContainerNameChange,
  showShareUrl,
  onToggleShowShareUrl,
  testingShare,
  shareTestResult,
  shareContainerConfigured,
  backupContainerName,
  onToggleUseSame,
  onTest,
  onSave,
  onClear,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary">
          <Share2 size={16} className="text-secondary" />
          <span>Compartir Enlaces Públicos</span>
        </div>
        {effectiveConfigured && (
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
          onChange={(e) => onToggleUseSame(e.target.checked)}
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
              Configura un contenedor separado para compartir enlaces públicos. Usa permisos mínimos
              (
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
                onChange={(e) => onShareSasUrlChange(e.target.value)}
                placeholder="https://tuaccount.blob.core.windows.net/?sv=2022-11-02&ss=b&srt=sco&sp=rc&se=..."
              />
              <Button variant="ghost" size="sm" onClick={onToggleShowShareUrl}>
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
              onChange={(e) => onShareContainerNameChange(e.target.value)}
              placeholder="tgp-shares"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={onTest}
              isLoading={testingShare}
              leftIcon={<RefreshCw size={14} />}
            >
              {testingShare ? 'Probando...' : 'Probar Conexión'}
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Guardar Configuración
            </Button>
            <Button variant="danger" onClick={onClear} leftIcon={<Trash2 size={14} />}>
              Usar Backup
            </Button>
          </div>

          {shareTestResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg text-sm ${shareTestResult.success ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'}`}
            >
              {shareTestResult.success ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{shareTestResult.message}</span>
            </div>
          )}

          {shareContainerConfigured && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-info/5 text-info text-xs">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                Compartiendo en <strong>{shareContainerConfigured}</strong>. Los datos se cifran
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
            Los enlaces públicos se almacenan en <strong>{backupContainerName}</strong> (mismo
            contenedor que backup). Siempre se cifran (AES-GCM 256) antes de subir. Los archivos
            expirados se limpian automáticamente.
          </span>
        </div>
      )}

      {!effectiveConfigured && (
        <p className="text-sm text-warning flex items-center gap-2">
          <Info size={14} />
          Sin Azure configurado, los enlaces compartidos solo funcionarán desde este navegador.
        </p>
      )}
    </div>
  )
}
