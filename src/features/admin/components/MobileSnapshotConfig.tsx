import { useState } from 'react'
import { Smartphone, Shield, KeyRound, Check, X, Copy, Scan } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import {
  getMobileSnapshotPassphrase,
  setMobileSnapshotPassphrase,
  hasMobileSnapshotPassphrase,
  computeMobileSnapshot,
  uploadMobileSnapshot,
  getStoredSnapshotInfo,
} from '@/services/share/metricsSnapshotService'

export function MobileSnapshotConfig() {
  const { addNotification } = useAppStore()
  const [passphrase, setPassphrase] = useState(getMobileSnapshotPassphrase())
  const [saved, setSaved] = useState(hasMobileSnapshotPassphrase())
  const [generating, setGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const storedInfo = getStoredSnapshotInfo()

  const handleSavePassphrase = () => {
    if (passphrase.length < 4) {
      addNotification({ type: 'error', message: 'La contraseña debe tener al menos 4 caracteres' })
      return
    }
    setMobileSnapshotPassphrase(passphrase)
    setSaved(true)
    addNotification({ type: 'success', message: 'Contraseña del Command Center guardada' })
  }

  const handleClearPassphrase = () => {
    setMobileSnapshotPassphrase('')
    setPassphrase('')
    setSaved(false)
    setShareUrl(null)
    addNotification({ type: 'info', message: 'Contraseña eliminada' })
  }

  const handleGenerateLink = async () => {
    if (!saved || !passphrase) {
      addNotification({ type: 'error', message: 'Guarda una contraseña primero' })
      return
    }
    setGenerating(true)
    try {
      const snapshot = await computeMobileSnapshot()
      const result = await uploadMobileSnapshot(snapshot, passphrase)
      if (result.success && result.url) {
        const fullUrl = `${window.location.origin}${result.url}`
        setShareUrl(fullUrl)
        addNotification({ type: 'success', message: 'Enlace del Command Center generado' })
      } else {
        addNotification({ type: 'error', message: result.error ?? 'Error al generar enlace' })
      }
    } catch (err) {
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error desconocido',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Smartphone size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-90 dark:text-white">
            Command Center Móvil
          </h3>
          <p className="text-xs text-neutral-50">Snapshot cifrado para dashboard móvil</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Passphrase */}
        <div>
          <label className="text-xs font-medium text-muted mb-1.5 flex items-center gap-1.5">
            <KeyRound size={12} />
            Contraseña de cifrado
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value)
                setSaved(false)
                setShareUrl(null)
              }}
              placeholder="Mínimo 4 caracteres"
              className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-neutral-30 dark:border-neutral-60 bg-transparent text-neutral-90 dark:text-white placeholder:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {saved && passphrase ? (
              <button
                onClick={handleClearPassphrase}
                className="px-3 py-2.5 text-xs font-medium text-danger hover:bg-danger/5 rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                onClick={handleSavePassphrase}
                disabled={passphrase.length < 4}
                className="px-4 py-2.5 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark disabled:opacity-40 transition-all shrink-0"
              >
                Guardar
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-50 mt-1.5">
            Esta contraseña cifra el snapshot antes de subirlo a Azure. Deberás ingresarla en el
            móvil para desbloquear el Command Center.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-xs">
            <Check size={14} className="text-success" />
            <span className="text-success font-medium">Cifrado configurado</span>
            <span className="text-neutral-50 mx-1">·</span>
            <Shield size={12} className="text-neutral-50" />
            <span className="text-neutral-50">AES-GCM 256</span>
          </div>
        )}

        {storedInfo && (
          <div className="text-xs text-neutral-50 bg-neutral-5 dark:bg-neutral-85 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
            <Check size={14} className="text-success" />
            <span>Último upload: {new Date(storedInfo.uploadedAt).toLocaleString('es-ES')}</span>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerateLink}
          disabled={!saved || generating}
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
              Generando...
            </>
          ) : (
            <>
              <Scan size={16} /> Generar enlace del Command Center
            </>
          )}
        </button>

        {/* Share URL result */}
        {shareUrl && (
          <div className="bg-neutral-90 dark:bg-neutral-85 rounded-xl border border-primary/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Enlace para el móvil
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-primary bg-primary/5 rounded-lg px-3 py-2.5 break-all select-all font-mono leading-relaxed">
                {shareUrl}
              </code>
              <button
                onClick={handleCopyUrl}
                className="p-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
              >
                <Copy size={16} />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-success animate-pulse">¡Copiado al portapapeles!</p>
            )}
            <div className="text-[11px] text-neutral-50 space-y-1">
              <p>Abre este enlace en el navegador de tu móvil.</p>
              <p className="flex items-center gap-1">
                <Shield size={11} />
                Los datos viajan cifrados de extremo a extremo. Solo quien tenga la contraseña puede
                verlos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
