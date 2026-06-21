import { useEffect, useState } from 'react'
import { db } from '@/services/db/database'
import { TechSearch } from '@/components/ui/TechSearch'

interface Props {
  memberId: string
}

export function TechStackSection({ memberId }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    db.memberProfiles.get(memberId).then((profile) => {
      setSelectedIds(profile?.technologies ?? [])
    })
  }, [memberId])

  const handleChange = async (ids: string[]) => {
    setSelectedIds(ids)
    const profile = await db.memberProfiles.get(memberId)
    const base = profile ?? {
      id: memberId, teamId: '', email: '', phoneCell: '', phoneHome: '',
      address: '', role: 'developer' as const, skills: [], microservices: [],
      avgStoryPoints: 0, vacationDaysPerYear: 14, vacationUsed: 0,
      createdAt: new Date(),
    }
    await db.memberProfiles.put({ ...base, technologies: ids, updatedAt: new Date() })
  }

  return (
    <div className="bg-card rounded-2xl border border-boundary p-4">
      <h2 className="text-lg font-semibold text-neutral-90 dark:text-white mb-4">Tecnologías</h2>
      <TechSearch
        selectedIds={selectedIds}
        onChange={handleChange}
        enableDepsSearch={true}
      />
    </div>
  )
}
