import { db } from '@/services/db/database'
import type { Candidate, CandidateTechnology, CandidateEvaluation, TeamMember } from '@/types/domain'
import type { MemberProfile, Achievement, Skill } from '@/types/domain/performance'
import type { MemberRole } from '@/constants/enums'

function generateId(): string {
  return crypto.randomUUID()
}

function calculateTechScore(technologies: { points: number }[]): number {
  if (technologies.length === 0) return 0
  const total = technologies.reduce((sum, t) => sum + t.points, 0)
  return Math.round((total / (technologies.length * 100)) * 100)
}

function calculateEvalScore(evaluations: { points: number }[]): number {
  if (evaluations.length === 0) return 0
  const total = evaluations.reduce((sum, e) => sum + e.points, 0)
  return Math.round((total / (evaluations.length * 100)) * 100)
}

function calculateTotalScore(techScore: number, evalScore: number): number {
  return Math.round(techScore * 0.5 + evalScore * 0.5)
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

export async function getCandidateEvaluations(candidateId: string): Promise<CandidateEvaluation[]> {
  return db.candidateEvaluations.where('candidateId').equals(candidateId).toArray()
}

export async function createCandidate(
  data: Omit<Candidate, 'id' | 'totalScore' | 'createdAt' | 'updatedAt'>,
  technologies: Omit<CandidateTechnology, 'id' | 'candidateId'>[],
  evaluations: Omit<CandidateEvaluation, 'id' | 'candidateId'>[],
): Promise<string> {
  const id = generateId()
  const now = new Date()
  const techs = technologies.map((t) => ({ ...t, id: generateId(), candidateId: id }))
  const evals = evaluations.map((e) => ({ ...e, id: generateId(), candidateId: id }))
  const techScore = calculateTechScore(techs)
  const evalScore = calculateEvalScore(evals)
  const totalScore = calculateTotalScore(techScore, evalScore)

  await db.transaction('rw', db.candidates, db.candidateTechnologies, db.candidateEvaluations, async () => {
    await db.candidates.add({ ...data, id, totalScore, createdAt: now, updatedAt: now })
    if (techs.length > 0) await db.candidateTechnologies.bulkAdd(techs)
    if (evals.length > 0) await db.candidateEvaluations.bulkAdd(evals)
  })

  return id
}

export async function updateCandidate(
  id: string,
  data: Partial<Omit<Candidate, 'id' | 'createdAt'>>,
  technologies?: Omit<CandidateTechnology, 'id' | 'candidateId'>[],
  evaluations?: Omit<CandidateEvaluation, 'id' | 'candidateId'>[],
): Promise<void> {
  const now = new Date()

  await db.transaction('rw', db.candidates, db.candidateTechnologies, db.candidateEvaluations, async () => {
    await db.candidates.update(id, { ...data, updatedAt: now })

    let techScore = 0
    let evalScore = 0

    if (technologies !== undefined) {
      const techs = technologies.map((t) => ({ ...t, id: generateId(), candidateId: id }))
      await db.candidateTechnologies.where('candidateId').equals(id).delete()
      if (techs.length > 0) await db.candidateTechnologies.bulkAdd(techs)
      techScore = calculateTechScore(techs)
    } else {
      const existing = await db.candidateTechnologies.where('candidateId').equals(id).toArray()
      techScore = calculateTechScore(existing)
    }

    if (evaluations !== undefined) {
      const evals = evaluations.map((e) => ({ ...e, id: generateId(), candidateId: id }))
      await db.candidateEvaluations.where('candidateId').equals(id).delete()
      if (evals.length > 0) await db.candidateEvaluations.bulkAdd(evals)
      evalScore = calculateEvalScore(evals)
    } else {
      const existing = await db.candidateEvaluations.where('candidateId').equals(id).toArray()
      evalScore = calculateEvalScore(existing)
    }

    const totalScore = calculateTotalScore(techScore, evalScore)
    await db.candidates.update(id, { totalScore, updatedAt: now })
  })
}

export async function deleteCandidate(id: string): Promise<void> {
  await db.transaction('rw', db.candidates, db.candidateTechnologies, db.candidateEvaluations, async () => {
    await db.candidateTechnologies.where('candidateId').equals(id).delete()
    await db.candidateEvaluations.where('candidateId').equals(id).delete()
    await db.candidates.delete(id)
  })
}

export async function selectCandidate(id: string, teamId: string): Promise<void> {
  const candidate = await db.candidates.get(id)
  if (!candidate) return

  await db.transaction('rw', [db.candidates, db.teams, db.memberProfiles, db.achievements, db.candidateTechnologies] as const, async () => {
    await db.candidates.update(id, { status: 'selected', teamId, updatedAt: new Date() })

    const team = await db.teams.get(teamId)
    if (team) {
      const member: TeamMember = {
        id: `member-${candidate.id}`,
        userPrincipal: candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@tgp.demo`,
        displayName: candidate.name,
        role: candidate.position as MemberRole,
        allocationPct: 100,
        status: 'incorporacion',
      }
      await db.teams.update(teamId, { members: [...team.members, member], updatedAt: new Date() })
    }

    // Create member profile with candidate data
    const techs = await db.candidateTechnologies.where('candidateId').equals(id).toArray()
    const skills: Skill[] = techs.map((t) => ({
      id: crypto.randomUUID(),
      name: t.name,
      level: 'intermediate' as const,
      category: 'Tecnología',
    }))

    const profile: MemberProfile = {
      id: `member-${candidate.id}`,
      teamId,
      email: candidate.email || '',
      phoneCell: candidate.phone || '',
      phoneHome: '',
      address: '',
      role: candidate.position as MemberRole,
      skills,
      technologies: techs.map((t) => t.name),
      microservices: [],
      avgStoryPoints: 0,
      vacationDaysPerYear: 14,
      vacationUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.memberProfiles.add(profile)

    // Add achievement with interview comments
    const achievement: Achievement = {
      id: crypto.randomUUID(),
      memberId: `member-${candidate.id}`,
      title: 'Ser parte del equipo',
      description: candidate.comments
        ? candidate.comments.replace(/<[^>]*>/g, '').slice(0, 500)
        : 'Nuevo integrante del equipo',
      date: new Date(),
      type: 'logro',
      linkedToPromotion: false,
      createdAt: new Date(),
    }
    await db.achievements.add(achievement)
  })
}
