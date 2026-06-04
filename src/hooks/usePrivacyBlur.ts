import { useEffect, useState, useCallback } from 'react'

export function usePrivacyBlur() {
  const [isHidden, setIsHidden] = useState(false)

  const handleVisibility = useCallback(() => {
    setIsHidden(document.visibilityState === 'hidden')
  }, [])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [handleVisibility])

  return isHidden
}
