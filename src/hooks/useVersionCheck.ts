import { useState, useEffect, useCallback } from 'react'

const VERSION_URL = '/version.json'
const CHECK_INTERVAL = 15 * 1000
const MAX_CONSECUTIVE_FAILURES = 3
const TEST_BUILD_KEY = 'tgp-test-build'
const STALE_KEY = 'tgp-stale'
const FAILURES_KEY = 'tgp-failures'

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
;(window as any).__setTestBuild = setTestBuild

export function useVersionCheck() {
  const [stale, setStale] = useState(() => localStorage.getItem(STALE_KEY) === 'true')
  const [currentBuild, setCurrentBuild] = useState<string | null>(null)

  const markStale = useCallback(() => {
    localStorage.setItem(STALE_KEY, 'true')
    setStale(true)
  }, [])

  const check = useCallback(async () => {
    const v = getBuildOverride() ?? await fetchVersion()

    if (v) {
      localStorage.removeItem(FAILURES_KEY)
      if (!cachedVersion) {
        cachedVersion = v
        setCurrentBuild(v.build)
        return
      }
      if (cachedVersion.build !== v.build) {
        console.log('[VersionCheck] Nueva versión detectada:', v.build)
        markStale()
      }
      return
    }

    const failures = (parseInt(localStorage.getItem(FAILURES_KEY) ?? '0', 10)) + 1
    localStorage.setItem(FAILURES_KEY, String(failures))
    const buildStr = cachedVersion ? formatVersion(cachedVersion) : 'ninguna (primera carga)'
    console.warn(`[VersionCheck] Intento ${failures}/${MAX_CONSECUTIVE_FAILURES} — versión actual: ${buildStr}`)

    if (cachedVersion || failures >= MAX_CONSECUTIVE_FAILURES) {
      markStale()
    }
  }, [markStale])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    ;(window as any).__checkVersion = check
    ;(window as any).__forceStale = markStale
    return () => clearInterval(interval)
  }, [check, markStale])

  const reload = useCallback(async () => {
    cachedVersion = null
    localStorage.removeItem(STALE_KEY)
    localStorage.removeItem(FAILURES_KEY)
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
