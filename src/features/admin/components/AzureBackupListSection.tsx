import { Download, Upload, RefreshCw, Loader2, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BackupInfo {
  configured: boolean
  lastBackup?: Date
}

interface BackupBlob {
  name: string
  size: number
  lastModified: Date
}

interface Props {
  info: BackupInfo
  backups: BackupBlob[]
  loadingBackups: boolean
  uploading: boolean
  restoring: string | null
  onUpload: () => void
  onRefresh: () => void
  onRestore: (blobName: string) => void
}

export function AzureBackupListSection({
  info, backups, loadingBackups, uploading, restoring,
  onUpload, onRefresh, onRestore,
}: Props) {
  if (!info.configured) return null

  return (
    <>
      <div className="border-t border-boundary" />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary">
            <Download size={16} />
            <span>Backups</span>
          </div>
          {info.lastBackup && (
            <span className="text-xs text-neutral-50">
              Último: {new Date(info.lastBackup).toLocaleString('es-ES')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onUpload} isLoading={!!uploading} leftIcon={<Upload size={14} />}
            className="bg-primary text-white hover:bg-primary/90">
            {uploading ? 'Subiendo...' : 'Subir Backup Ahora'}
          </Button>
          <Button variant="secondary" onClick={onRefresh} isLoading={loadingBackups} leftIcon={<RefreshCw size={14} />}>
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
                    onClick={() => onRestore(b.name)}
                    disabled={restoring === b.name}
                    className="mt-2 flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                  >
                    {restoring === b.name ? <Loader2 size={10} className="animate-spin" /> : <ExternalLink size={10} />}
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
    </>
  )
}


