import { useState, useEffect, useCallback } from 'react'

const VERSION_URL = '/version.json'
const CHECK_INTERVAL = 5 * 60 * 1000 // cada 5 minutos

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
    if (!v) return

    if (!cachedVersion) {
      cachedVersion = v
      setCurrentBuild(v.build)
      return
    }

    if (cachedVersion.build !== v.build) {
      setStale(true)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [check])

  const reload = useCallback(() => {
    cachedVersion = null
    window.location.reload()
  }, [])

  return { stale, reload, currentBuild }
}
