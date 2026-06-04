import { useEffect } from 'react'
import { seedDemoData, seedComplianceFindings } from '@/services/demo/seedData'

export function useDemoData() {
  useEffect(() => {
    seedDemoData().then(() => {
      // Ensures compliance findings exist even for already-seeded users
      seedComplianceFindings().catch(console.error)
    }).catch(console.error)
  }, [])
}
