import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ShortcutMap {
  [key: string]: () => void
}

const ROUTE_SHORTCUTS: Record<string, string> = {
  '1': '/dashboard',
  '2': '/catalog/applications',
  '3': '/catalog/obsolescence',
  '4': '/security/vulnerabilities',
  '5': '/governance/risks',
  '6': '/teams',
  '7': '/strategy/objectives',
  '8': '/execution/daily',
  '9': '/admin',
}

export function useGlobalShortcuts(
  extraShortcuts: ShortcutMap = {},
  enabled = true
) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      const meta = e.metaKey || e.ctrlKey

      if (!meta) {
        if (e.key === 'Escape') {
          extraShortcuts['Escape']?.()
        }
        return
      }

      if (isInput) return

      e.preventDefault()

      const key = e.key.toLowerCase()

      if (key === 'b') {
        extraShortcuts['b']?.()
        return
      }

      if (key === 'n') {
        extraShortcuts['n']?.()
        return
      }

      if (key >= '1' && key <= '9') {
        const route = ROUTE_SHORTCUTS[key]
        if (route) navigate(route)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, extraShortcuts, enabled])
}
