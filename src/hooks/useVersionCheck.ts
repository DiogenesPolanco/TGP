import { useState, useEffect, useCallback } from 'react'

const VERSION_URL = '/version.json'
const CHECK_INTERVAL = 15 * 1000 // cada 15s para desarrollo (produccion: 5 min)
const MAX_CONSECUTIVE_FAILURES = 3

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

function formatVersion(v: AppVersion) {
  return `${v.version} (build ${v.build}, ${v.timestamp})`
}

export function useVersionCheck() {
  const [stale, setStale] = useState(false)
  const [currentBuild, setCurrentBuild] = useState<string | null>(null)

  const check = useCallback(async () => {
    const v = await fetchVersion()

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

  const reload = useCallback(() => {
    cachedVersion = null
    window.location.reload()
  }, [])

  return { stale, reload, currentBuild }
}
