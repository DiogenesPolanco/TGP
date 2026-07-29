import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

export function useTheme() {
  const { theme } = useAppStore()

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const stored = localStorage.getItem('tgp-app-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.state?.theme === 'dark') {
          window.document.documentElement.classList.add('dark')
        }
      } catch {
        /* empty */
      }
    }
  }, [])
}
