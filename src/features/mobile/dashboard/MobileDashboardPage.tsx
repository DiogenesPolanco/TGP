import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useTheme } from '@/hooks/useTheme'
import { decryptData, isEncryptedPayload } from '@/services/share/encryptionService'
import type { EncryptedPayload } from '@/services/share/encryptionService'
import {
  parseManifestFromHash,
  downloadSnapshotFromManifest,
  getCachedMobileSnapshot,
  setCachedMobileSnapshot,
  clearCachedMobileSnapshot,
} from '@/services/share/metricsSnapshotService'
import type { MobileSnapshot } from '@/services/share/metricsSnapshotService'
import { MobilePassphraseGate } from './MobilePassphraseGate'
import { MobileDashboardView } from './MobileDashboardView'

export function MobileDashboardPage() {
  const { theme, setTheme } = useAppStore()
  useTheme()
  const [phase, setPhase] = useState<'loading' | 'passphrase' | 'error' | 'dashboard'>('loading')
  const [data, setData] = useState<MobileSnapshot | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [passError, setPassError] = useState(false)
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(null)
  const [showCacheInfo, setShowCacheInfo] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setPhase('loading')
    const cached = getCachedMobileSnapshot()
    if (cached) {
      setData(cached)
      setPhase('dashboard')
    }
    const hashFragment = window.location.hash
    const manifest = hashFragment ? parseManifestFromHash(hashFragment) : null
    if (manifest) {
      try {
        const raw = await downloadSnapshotFromManifest(manifest)
        if (raw && isEncryptedPayload(raw)) {
          setEncryptedPayload(raw as EncryptedPayload)
          setPhase(cached ? 'dashboard' : 'passphrase')
          return
        }
      } catch {
        /* fall through */
      }
    }
    if (!cached) {
      setErrorMsg(
        manifest
          ? 'No se pudo descargar el snapshot desde Azure.'
          : 'Enlace inválido. Genera un nuevo enlace desde el escritorio (Administración → Command Center Móvil).',
      )
      setPhase('error')
    }
  }

  async function handleSubmitPassphrase() {
    if (!encryptedPayload || !passphrase || submitting) return
    setSubmitting(true)
    setPassError(false)
    try {
      const decrypted = await decryptData(encryptedPayload, passphrase)
      if (decrypted) {
        const snapshot = decrypted as MobileSnapshot
        setData(snapshot)
        setCachedMobileSnapshot(snapshot)
        setPhase('dashboard')
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        setPassError(true)
      }
    } catch {
      setPassError(true)
    } finally {
      setSubmitting(false)
    }
  }

  function handleRefresh() {
    clearCachedMobileSnapshot()
    setData(null)
    setPhase('loading')
    setEncryptedPayload(null)
    init()
  }

  function handleLock() {
    setPassphrase('')
    setPassError(false)
    setSubmitting(false)
    setPhase('passphrase')
  }

  if (phase === 'loading' && !data) {
    return (
      <div className="min-h-dvh bg-canvas text-default flex flex-col items-center justify-center gap-4 p-6 relative">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? (
            <Moon size={16} className="text-neutral-60" />
          ) : (
            <Sun size={16} className="text-neutral-40" />
          )}
        </button>
        <div className="w-9 h-9 border-2 border-neutral-30 dark:border-neutral-60 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted font-medium">Conectando con Azure...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="min-h-dvh bg-canvas text-default flex flex-col items-center justify-center gap-4 p-6 relative">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-85 flex items-center justify-center transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? (
            <Moon size={16} className="text-neutral-60" />
          ) : (
            <Sun size={16} className="text-neutral-40" />
          )}
        </button>
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-danger"
          >
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <p className="text-base font-semibold text-center">Sin conexión al Command Center</p>
        <p className="text-sm text-muted text-center max-w-xs">{errorMsg}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-6 py-3 bg-neutral-90 dark:bg-neutral-10 text-white dark:text-neutral-90 hover:bg-neutral-80 dark:hover:bg-neutral-20 rounded-xl text-sm font-semibold transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (phase === 'passphrase') {
    return (
      <MobilePassphraseGate
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        passphrase={passphrase}
        onPassphraseChange={(v) => {
          setPassphrase(v)
          setPassError(false)
        }}
        passError={passError}
        submitting={submitting}
        onSubmit={handleSubmitPassphrase}
      />
    )
  }

  if (!data) {
    return (
      <div className="min-h-dvh bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-30 dark:border-neutral-60 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <MobileDashboardView
      data={data}
      showCacheInfo={showCacheInfo}
      theme={theme}
      onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      onToggleCacheInfo={() => setShowCacheInfo(!showCacheInfo)}
      onRefresh={handleRefresh}
      onLock={handleLock}
    />
  )
}
