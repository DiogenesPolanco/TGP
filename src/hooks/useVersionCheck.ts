import { useState, useEffect, useCallback } from 'react'

const VERSION_URL = '/version.json'
const CHECK_INTERVAL = 15 * 1000 // cada 15s para desarrollo (produccion: 5 min)
const MAX_CONSECUTIVE_FAILURES = 3
const TEST_BUILD_KEY = 'tgp-test-build' // localStorage override para pruebas

interface AppVersion {
  version: string
  build: string
  timestamp: string
}

let cachedVersion: AppVersion | null = null
let consecutiveFailures = 0

async function fetchVersion(): Promise<AppVersion | null> {
  try {
    const r = await fetch(`${VERSION_URL}?_=${Date.now()}`)
    return r.ok ? r.json() : null
  } catch {
    return null
  }
}

function getBuildOverride(): AppVersion | null {
  const raw = localStorage.getItem(TEST_BUILD_KEY)
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as AppVersion
    console.log('[VersionCheck] Usando override de localStorage:', v.build)
    return v
  } catch {
    console.warn('[VersionCheck] tgp-test-build inválido, ignorando')
    localStorage.removeItem(TEST_BUILD_KEY)
    return null
  }
}

function formatVersion(v: AppVersion) {
  return `${v.version} (build ${v.build}, ${v.timestamp})`
}

function setTestBuild(build: string) {
  localStorage.setItem(TEST_BUILD_KEY, JSON.stringify({
    version: '0.0.0',
    build,
    timestamp: new Date().toISOString()
  }))
  console.log(`[VersionCheck] Build de prueba "${build}" guardado — llamá __checkVersion() para probar`)
}

// Globales inmediatas (no dependen de React)
;(window as any).__setTestBuild = setTestBuild

export function useVersionCheck() {
  const [stale, setStale] = useState(false)
  const [currentBuild, setCurrentBuild] = useState<string | null>(null)

  const check = useCallback(async () => {
    const v = getBuildOverride() ?? await fetchVersion()

    if (v) {
      consecutiveFailures = 0
      if (!cachedVersion) {
        cachedVersion = v
        setCurrentBuild(v.build)
        return
      }
      if (cachedVersion.build !== v.build) {
        console.log('[VersionCheck] Nueva versión detectada:', v.build)
        setStale(true)
      }
      return
    }

    consecutiveFailures++
    const buildStr = cachedVersion ? formatVersion(cachedVersion) : 'ninguna (primera carga)'
    console.warn(`[VersionCheck] Intento ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} — versión actual: ${buildStr}`)

    if (cachedVersion) {
      setStale(true)
    } else if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      setStale(true)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    ;(window as any).__checkVersion = check
    ;(window as any).__forceStale = () => setStale(true)
    return () => clearInterval(interval)
  }, [check])

  const reload = useCallback(async () => {
    cachedVersion = null
    // Forzar carga fresca: borrar caches del SW + desregistrar antes de recargar
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.unregister()
    window.location.reload()
  }, [])

  return { stale, reload, currentBuild }
}
