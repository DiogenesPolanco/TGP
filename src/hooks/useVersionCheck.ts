import { useState, useEffect, useCallback } from 'react'

const VERSION_URL = '/version.json'
const CHECK_INTERVAL = 15 * 1000 // cada 15s para desarrollo (produccion: 5 min)

interface AppVersion {
  version: string
  build: string
  timestamp: string
}

let cachedVersion: AppVersion | null = null

async function fetchVersion(): Promise<AppVersion | null> {
  try {
    const r = await fetch(`${VERSION_URL}?_=${Date.now()}`)
    return r.ok ? r.json() : null
  } catch {
    return null
  }
}

export function useVersionCheck() {
  const [stale, setStale] = useState(false)
  const [currentBuild, setCurrentBuild] = useState<string | null>(null)

  const check = useCallback(async () => {
    const v = await fetchVersion()

    if (!cachedVersion) {
      if (!v) { console.warn('[VersionCheck] No se pudo obtener version.json'); return }
      cachedVersion = v
      setCurrentBuild(v.build)
      return
    }

    // Fallo después de tener un build → probable redeploy, forzar actualización
    if (!v) {
      console.warn('[VersionCheck] Error al obtener version.json — forzando actualización')
      setStale(true)
      return
    }

    if (cachedVersion.build !== v.build) {
      console.log('[VersionCheck] Nueva versión detectada:', v.build)
      setStale(true)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    // Expose manual check for testing
    ;(window as any).__checkVersion = check
    ;(window as any).__forceStale = () => setStale(true)
    return () => clearInterval(interval)
  }, [check])

  const reload = useCallback(() => {
    cachedVersion = null
    window.location.reload()
  }, [])

  return { stale, reload, currentBuild }
}
