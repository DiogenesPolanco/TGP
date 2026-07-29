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

type FetchResult = AppVersion | 'network-error' | 'http-error'

async function fetchVersion(): Promise<FetchResult> {
  try {
    const r = await fetch(`${VERSION_URL}?_=${Date.now()}`)
    if (r.ok) return r.json()
    return 'http-error'
  } catch {
    return 'network-error'
  }
}

function getBuildOverride(): FetchResult | null {
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
  localStorage.setItem(
    TEST_BUILD_KEY,
    JSON.stringify({
      version: '0.0.0',
      build,
      timestamp: new Date().toISOString(),
    }),
  )
  console.log(
    `[VersionCheck] Build de prueba "${build}" guardado — llamá __checkVersion() para probar`,
  )
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
    const result = getBuildOverride() ?? (await fetchVersion())

    // Successful fetch
    if (result && typeof result === 'object' && 'build' in result) {
      localStorage.removeItem(FAILURES_KEY)
      if (!cachedVersion) {
        cachedVersion = result
        setCurrentBuild(result.build)
        return
      }
      if (cachedVersion.build !== result.build) {
        console.log('[VersionCheck] Nueva versión detectada:', result.build)
        markStale()
      }
      return
    }

    // Network error (offline) — don't show stale, just wait silently
    if (result === 'network-error') {
      if (!navigator.onLine) return // offline, keep waiting
      // Online but fetch failed — could be transient
      return
    }

    // HTTP error (404/500) — server likely changed
    const failures = parseInt(localStorage.getItem(FAILURES_KEY) ?? '0', 10) + 1
    localStorage.setItem(FAILURES_KEY, String(failures))
    const buildStr = cachedVersion ? formatVersion(cachedVersion) : 'ninguna (primera carga)'
    console.warn(
      `[VersionCheck] Error HTTP ${failures}/${MAX_CONSECUTIVE_FAILURES} — versión actual: ${buildStr}`,
    )

    if (cachedVersion && failures >= MAX_CONSECUTIVE_FAILURES) {
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
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.unregister()
    window.location.reload()
  }, [])

  return { stale, reload, currentBuild }
}
