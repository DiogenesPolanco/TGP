import { useEffect } from 'react'
import { seedDemoData } from '@/services/demo/seedData'

export function useDemoData() {
  useEffect(() => {
    seedDemoData().catch(console.error)
  }, [])
}
