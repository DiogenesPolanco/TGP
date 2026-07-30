import { Cloud, RefreshCw, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Props {
  sasUrl: string
  onSasUrlChange: (v: string) => void
  containerName: string
  onContainerNameChange: (v: string) => void
  showUrl: boolean
  onToggleShowUrl: () => void
  testing: boolean
  testResult: { success: boolean; message: string } | null
  configured: boolean
  onTest: () => void
  onSave: () => void
  onClear: () => void
}

export function AzureBackupConfigSection({
  sasUrl, onSasUrlChange, containerName, onContainerNameChange,
  showUrl, onToggleShowUrl, testing, testResult, configured,
  onTest, onSave, onClear,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-secondary">
        <Cloud size={16} />
        <span>Backup de Base de Datos</span>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-60 mb-1 block">SAS URL de la Cuenta</label>
        <div className="flex gap-2">
          <Input
            type={showUrl ? 'text' : 'password'}
            value={sasUrl}
            onChange={(e) => onSasUrlChange(e.target.value)}
            placeholder="https://tuaccount.blob.core.windows.net/?sv=2022-11-02&ss=b&srt=sco&sp=rwdl&se=..."
          />
          <Button variant="ghost" size="sm" onClick={onToggleShowUrl}>
            {showUrl ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-neutral-60 mb-1 block">Nombre del Contenedor</label>
        <Input
          type="text"
          value={containerName}
          onChange={(e) => onContainerNameChange(e.target.value)}
          placeholder="tgpdemo"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onTest} isLoading={testing} leftIcon={<RefreshCw size={14} />}>
          {testing ? 'Probando...' : 'Probar Conexión'}
        </Button>
        <Button variant="primary" onClick={onSave} className="bg-primary text-white hover:bg-primary/90">
          Guardar Configuración
        </Button>
        {configured && (
          <Button variant="danger" onClick={onClear} leftIcon={<Trash2 size={14} />}>
            Eliminar
          </Button>
        )}
      </div>

      {testResult && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-success/5 text-success' : 'bg-danger/5 text-danger'}`}>
          {testResult.success ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  )
}
