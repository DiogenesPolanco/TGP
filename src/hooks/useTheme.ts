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
}
