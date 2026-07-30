import { useState, useEffect } from 'react'
import { getConfig, getConfigOrDefault } from '@/services/system/systemConfigService'

export function useSystemConfig<T = unknown>(key: string): T | null {
  const [value, setValue] = useState<T | null>(null)
  useEffect(() => {
    getConfig<T>(key).then(setValue)
  }, [key])
  return value
}

export function useSystemConfigOrDefault<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    getConfigOrDefault<T>(key, defaultValue).then(setValue)
  }, [key, defaultValue])
  return value
}
