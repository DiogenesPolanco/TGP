import { useEffect } from 'react'
import { seedDemoData, seedComplianceFindings } from '@/services/demo/seedData'

export function useDemoData() {
  useEffect(() => {
    seedDemoData().catch(console.error)
    // Ensures compliance findings exist even for already-seeded users
    seedComplianceFindings().catch(console.error)
  }, [])
}
