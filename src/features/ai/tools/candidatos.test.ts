import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/services/db/database'
import { consultarCandidatoTool } from './candidatos'

describe('consultarCandidatoTool', () => {
  beforeEach(async () => {
    await Promise.all([
      db.candidates.clear(),
      db.candidateTechnologies.clear(),
      db.candidateEvaluations.clear(),
    ])
  })

  it('exige id o q', async () => {
    const out = await consultarCandidatoTool.execute({})
    expect(out).toBe('Error: proporcioná un `id` (UUID) o un `q` (nombre/email) para buscar.')
  })

  it('no encuentra por id', async () => {
    const out = await consultarCandidatoTool.execute({ id: 'zzz' })
    expect(out).toContain('No se encontró un candidato con ID "zzz".')
  })

  it('no encuentra por q', async () => {
    const out = await consultarCandidatoTool.execute({ q: 'nadie' })
    expect(out).toContain('No se encontró un candidato con "nadie".')
  })

  it('muestra perfil completo por id', async () => {
    await db.candidates.add({
      id: 'c1',
      name: 'María Pérez',
      email: 'maria@corp.com',
      position: 'Frontend Dev',
      status: 'interviewed',
      totalScore: 82,
      phone: '809-555-0100',
      interviewDate: new Date(2026, 6, 10, 12, 0, 0),
      comments: 'Muy buena entrevista',
    } as never)
    await db.candidateTechnologies.bulkAdd([
      { id: 'ct1', candidateId: 'c1', name: 'React', points: 90 },
      { id: 'ct2', candidateId: 'c1', name: 'TypeScript', points: 70 },
    ] as never)
    await db.candidateEvaluations.bulkAdd([
      { id: 'e1', candidateId: 'c1', category: 'technical_knowledge', points: 85 },
      { id: 'e2', candidateId: 'c1', category: 'technical_knowledge', points: 95 },
      { id: 'e3', candidateId: 'c1', category: 'communication', points: 60 },
    ] as never)
    const out = await consultarCandidatoTool.execute({ id: 'c1' })
    expect(out).toContain('📋 **María Pérez**')
    expect(out).toContain('**Posición:** Frontend Dev')
    expect(out).toContain('**Estado:** Entrevistado · Puntaje total: 82')
    expect(out).toContain('**Email:** maria@corp.com')
    expect(out).toContain('**Teléfono:** 809-555-0100')
    expect(out).toContain('**Entrevista:** 10 de julio de 2026')
    expect(out).toContain('**Comentarios:** Muy buena entrevista')
    expect(out).toContain('**Tecnologías** (2):')
    expect(out.indexOf('React: 90/100')).toBeLessThan(out.indexOf('TypeScript: 70/100'))
    expect(out).toContain('**Evaluaciones** (2 categorías):')
    expect(out).toContain('Conocimiento técnico: 90/100')
    expect(out).toContain('Comunicación: 60/100')
    expect(out).toContain('buscar_candidato')
  })

  it('busca por q parcial sin acentos y sin datos opcionales', async () => {
    await db.candidates.add({
      id: 'c2',
      name: 'José García',
      email: 'jose@corp.com',
      position: 'Backend Dev',
      status: 'pending',
    } as never)
    const out = await consultarCandidatoTool.execute({ q: 'garcia' })
    expect(out).toContain('📋 **José García**')
    expect(out).toContain('**Estado:** Pendiente')
    expect(out).toContain('**Email:** jose@corp.com')
    expect(out).toContain('**Teléfono:** —')
    expect(out).toContain('**Entrevista:** Pendiente')
    expect(out).not.toContain('**Comentarios:**')
  })

  it('busca por email', async () => {
    await db.candidates.add({
      id: 'c3',
      name: 'Ana López',
      email: 'ana@corp.com',
      position: 'QA',
    } as never)
    const out = await consultarCandidatoTool.execute({ q: 'ANA@CORP' })
    expect(out).toContain('📋 **Ana López**')
  })

  it('muestra estados sin label', async () => {
    await db.candidates.add({
      id: 'c4',
      name: 'Luis',
      email: 'luis@corp.com',
      position: 'DevOps',
      status: 'custom_status',
      totalScore: 0,
    } as never)
    const out = await consultarCandidatoTool.execute({ id: 'c4' })
    expect(out).toContain('**Estado:** custom_status · Puntaje total: 0')
  })
})
