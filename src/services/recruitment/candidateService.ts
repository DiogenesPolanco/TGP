import { db } from '@/services/db/database'
import type { Candidate, CandidateTechnology } from '@/types/domain'

function generateId(): string {
  return crypto.randomUUID()
}

function calculateScore(technologies: { points: number }[]): number {
  if (technologies.length === 0) return 0
  const total = technologies.reduce((sum, t) => sum + t.points, 0)
  return Math.round((total / (technologies.length * 100)) * 100)
}

export async function getCandidates(): Promise<Candidate[]> {
  return db.candidates.orderBy('createdAt').reverse().toArray()
}

export async function getCandidate(id: string): Promise<Candidate | undefined> {
  return db.candidates.get(id)
}

export async function getCandidateTechnologies(candidateId: string): Promise<CandidateTechnology[]> {
  return db.candidateTechnologies.where('candidateId').equals(candidateId).toArray()
}

export async function createCandidate(
  data: Omit<Candidate, 'id' | 'totalScore' | 'createdAt' | 'updatedAt'>,
  technologies: Omit<CandidateTechnology, 'id' | 'candidateId'>[],
): Promise<string> {
  const id = generateId()
  const now = new Date()
  const techs = technologies.map((t) => ({
    ...t,
    id: generateId(),
    candidateId: id,
  }))
  const totalScore = calculateScore(techs)

  await db.transaction('rw', db.candidates, db.candidateTechnologies, async () => {
    await db.candidates.add({ ...data, id, totalScore, createdAt: now, updatedAt: now })
    if (techs.length > 0) {
      await db.candidateTechnologies.bulkAdd(techs)
    }
  })

  return id
}

export async function updateCandidate(
  id: string,
  data: Partial<Omit<Candidate, 'id' | 'createdAt'>>,
  technologies?: Omit<CandidateTechnology, 'id' | 'candidateId'>[],
): Promise<void> {
  const now = new Date()

  await db.transaction('rw', db.candidates, db.candidateTechnologies, async () => {
    await db.candidates.update(id, { ...data, updatedAt: now })

    if (technologies !== undefined) {
      const techs = technologies.map((t) => ({
        ...t,
        id: generateId(),
        candidateId: id,
      }))
      await db.candidateTechnologies.where('candidateId').equals(id).delete()
      if (techs.length > 0) {
        await db.candidateTechnologies.bulkAdd(techs)
      }
      const totalScore = calculateScore(techs)
      await db.candidates.update(id, { totalScore, updatedAt: now })
    }
  })
}

export async function deleteCandidate(id: string): Promise<void> {
  await db.transaction('rw', db.candidates, db.candidateTechnologies, async () => {
    await db.candidateTechnologies.where('candidateId').equals(id).delete()
    await db.candidates.delete(id)
  })
}

export async function selectCandidate(id: string, teamId: string): Promise<void> {
  await db.candidates.update(id, { status: 'selected', teamId, updatedAt: new Date() })
}
