import { describe, it, expect } from 'vitest'
import { generateExecutiveNarrative } from '../narrativeGenerator'
import type { NarrativeInput } from '../narrativeGenerator'

function createTestInput(overrides: Partial<NarrativeInput> = {}): NarrativeInput {
  return {
    thi: {
      id: 'test',
      businessUnitId: 'test-bu',
      tenantId: 'default',
      overallScore: 75,
      deliveryScore: 80,
      qualityScore: 70,
      securityScore: 75,
      availabilityScore: 80,
      obsolescenceScore: 70,
      riskScore: 75,
      complianceScore: 75,
      weights: {
        delivery: 0.2,
        quality: 0.15,
        security: 0.2,
        availability: 0.15,
        obsolescence: 0.1,
        risk: 0.1,
        compliance: 0.1,
      },
      calculatedAt: new Date('2026-07-06'),
      trend: 'stable',
    },
    applications: [],
    vulnerabilities: [],
    incidents: [],
    risks: [],
    auditFindings: [],
    teams: [],
    technologies: [],
    businessUnits: [],
    blockers: [],
    commitments: [],
    periodStart: new Date(),
    ...overrides,
  }
}

describe('generateExecutiveNarrative', () => {
  it('generates basic narrative with no data', () => {
    const input = createTestInput({ thi: null })
    const result = generateExecutiveNarrative(input)
    expect(result.timestamp).toBeInstanceOf(Date)
    expect(typeof result.flashBriefing).toBe('string')
    expect(result.keyInsights).toBeDefined()
    expect(result.recommendations).toBeDefined()
  })

  it('includes THI score in briefing', () => {
    const result = generateExecutiveNarrative(createTestInput())
    expect(result.flashBriefing).toContain('THI 75')
    expect(result.flashBriefing).toContain('Saludable')
  })

  it('labels THI ranges correctly', () => {
    const excelente = generateExecutiveNarrative(
      createTestInput({
        thi: {
          ...createTestInput().thi!,
          overallScore: 95,
          deliveryScore: 90,
          qualityScore: 90,
          securityScore: 95,
          obsolescenceScore: 90,
          availabilityScore: 95,
          riskScore: 90,
          complianceScore: 95,
        },
      }),
    )
    expect(excelente.flashBriefing).toContain('Excelente')

    const regular = generateExecutiveNarrative(
      createTestInput({
        thi: { ...createTestInput().thi!, overallScore: 60, deliveryScore: 50, qualityScore: 50 },
      }),
    )
    expect(regular.flashBriefing).toContain('Regular')

    const enRiesgo = generateExecutiveNarrative(
      createTestInput({
        thi: { ...createTestInput().thi!, overallScore: 40, deliveryScore: 30, qualityScore: 30 },
      }),
    )
    expect(enRiesgo.flashBriefing).toContain('En Riesgo')

    const critico = generateExecutiveNarrative(
      createTestInput({
        thi: { ...createTestInput().thi!, overallScore: 20, deliveryScore: 10, qualityScore: 10 },
      }),
    )
    expect(critico.flashBriefing).toContain('Crítico')
  })

  it('flags missing default scores as weak dimensions', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        thi: { ...createTestInput().thi!, deliveryScore: 50, qualityScore: 60 },
      }),
    )
    expect(result.flashBriefing).toContain('dimensiones débiles')
    expect(result.flashBriefing).toContain('Delivery')
    expect(result.flashBriefing).toContain('Quality')
  })

  it('flags all score <70 as weak dimensions', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        thi: {
          ...createTestInput().thi!,
          deliveryScore: 60,
          qualityScore: 60,
          securityScore: 65,
          availabilityScore: 60,
          obsolescenceScore: 65,
          riskScore: 60,
          complianceScore: 65,
        },
      }),
    )
    expect(result.flashBriefing).toContain('dimensiones débiles')
  })

  it('flags critical vulnerabilities singular', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        vulnerabilities: [
          { id: 'v1', severity: 'critical', status: 'open', applicationId: 'app1' },
        ] as any,
      }),
    )
    const insight = result.keyInsights.find((i) => i.icon === 'critical')
    expect(insight).toBeDefined()
    expect(insight!.text).toContain('1 vulnerabilidad crítica')
  })

  it('flags critical vulnerabilities plural', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        vulnerabilities: [
          { id: 'v1', severity: 'critical', status: 'open', applicationId: 'app1' },
          { id: 'v2', severity: 'critical', status: 'open', applicationId: 'app1' },
        ] as any,
      }),
    )
    const criticalInsight = result.keyInsights.find((i) => i.icon === 'critical')
    expect(criticalInsight).toBeDefined()
    expect(criticalInsight?.text).toContain('2 vulnerabilidades críticas')
  })

  it('flags high vulnerabilities over threshold', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        vulnerabilities: Array.from({ length: 5 }, (_, i) => ({
          id: `v${i}`,
          severity: 'high',
          status: 'open',
          applicationId: 'app1',
        })) as any,
      }),
    )
    const warning = result.keyInsights.find((i) => i.icon === 'warning')
    expect(warning).toBeTruthy()
    expect(warning!.text).toContain('umbral')
  })

  it('includes positive insight when no critical or high vulns', () => {
    const result = generateExecutiveNarrative(
      createTestInput({ vulnerabilities: [], incidents: [] }),
    )
    const positive = result.keyInsights.filter((i) => i.icon === 'positive')
    expect(positive.length).toBeGreaterThan(0)
  })

  it('flags P1 incident singular', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        incidents: [
          { id: 'i1', severity: 'critical', status: 'detected', applicationId: 'app1' },
        ] as any,
      }),
    )
    const insight = result.keyInsights.find((i) => i.text.includes('incidente P1'))
    expect(insight).toBeDefined()
    expect(insight!.text).toContain('1 incidente P1')
  })

  it('flags P1 incidents plural', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        incidents: [
          { id: 'i1', severity: 'critical', status: 'detected', applicationId: 'app1' },
          { id: 'i2', severity: 'critical', status: 'detected', applicationId: 'app2' },
        ] as any,
      }),
    )
    const insight = result.keyInsights.find((i) => i.text.includes('incidentes P1'))
    expect(insight).toBeDefined()
    expect(insight!.text).toContain('2 incidentes P1')
  })

  it('flags open incidents without P1', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        incidents: [
          { id: 'i1', severity: 'low', status: 'detected', applicationId: 'app1' },
        ] as any,
      }),
    )
    const insight = result.keyInsights.find((i) => i.text.includes('incidentes abiertos'))
    expect(insight).toBeDefined()
  })

  it('positive insight when no incidents', () => {
    const result = generateExecutiveNarrative(createTestInput({ incidents: [] }))
    expect(result.keyInsights.some((i) => i.text.includes('Sin incidentes'))).toBe(true)
  })

  it('identifies EOL technologies', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        technologies: [{ id: 't1', name: 'Angular', version: '12', supportStatus: 'eol' }] as any,
        applications: [
          { id: 'app1', businessUnitId: 'bu1', technologies: ['t1'], criticality: 'critical' },
        ] as any,
      }),
    )
    const eolInsight = result.keyInsights.find((i) => i.text.includes('tecnologías EOL'))
    expect(eolInsight).toBeDefined()
    expect(eolInsight!.text).toContain('apps críticas afectadas')
  })

  it('handles EOL tech without critical apps', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        technologies: [{ id: 't1', name: 'Angular', version: '12', supportStatus: 'eol' }] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('ninguna app crítica'))).toBe(true)
  })

  it('adds recommendation for extended support technologies', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        technologies: [
          { id: 't1', name: 'Angular', version: '12', supportStatus: 'extended' },
        ] as any,
      }),
    )
    expect(result.recommendations.some((r) => r.includes('soporte extendido'))).toBe(true)
  })

  it('flags overdue audit findings singular', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        auditFindings: [{ id: 'f1', status: 'overdue' }] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('1 hallazgo'))).toBe(true)
  })

  it('flags overdue audit findings plural', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        auditFindings: [
          { id: 'f1', status: 'overdue' },
          { id: 'f2', status: 'overdue' },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('hallazgos'))).toBe(true)
  })

  it('flags critical risks singular', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        risks: [{ id: 'r1', status: 'open', riskScore: 20, applicationId: 'app1' }] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('1 riesgo crítico'))).toBe(true)
    expect(result.recommendations.some((r) => r.includes('plan de mitigación'))).toBe(true)
  })

  it('flags critical risks plural', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        risks: [
          { id: 'r1', status: 'open', riskScore: 20, applicationId: 'app1' },
          { id: 'r2', status: 'open', riskScore: 25, applicationId: 'app2' },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('riesgos críticos'))).toBe(true)
  })

  it('identifies elite DORA teams', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        teams: [
          { id: 't1', currentMetrics: { deploymentFrequency: 5, leadTimeHours: 0.5 } },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('Elite DORA'))).toBe(true)
  })

  it('identifies low DORA teams', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        teams: [
          { id: 't1', currentMetrics: { deploymentFrequency: 0.01, leadTimeHours: 1000 } },
        ] as any,
      }),
    )
    expect(result.recommendations.some((r) => r.includes('DORA Bajo'))).toBe(true)
  })

  it('skips team without metrics', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        teams: [{ id: 't1' }] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('Elite'))).toBe(false)
  })

  it('flags open blockers singular', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        blockers: [{ id: 'b1', status: 'open' }] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('1 bloqueo'))).toBe(true)
  })

  it('flags open blockers plural', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        blockers: [
          { id: 'b1', status: 'open' },
          { id: 'b2', status: 'escalated' },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('bloqueos'))).toBe(true)
  })

  it('flags overdue breached commitments', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        commitments: [
          {
            id: 'c1',
            status: 'breached',
            commitmentDate: new Date(Date.now() - 86400000).toISOString(),
          },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('compromiso'))).toBe(true)
    expect(result.recommendations.some((r) => r.includes('compromiso'))).toBe(true)
  })

  it('flags overdue active commitments past their date', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        commitments: [
          {
            id: 'c1',
            status: 'active',
            commitmentDate: new Date(Date.now() - 86400000).toISOString(),
          },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('compromiso'))).toBe(true)
  })

  it('does not flag future commitments', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        commitments: [
          {
            id: 'c1',
            status: 'active',
            commitmentDate: new Date(Date.now() + 86400000).toISOString(),
          },
        ] as any,
      }),
    )
    expect(result.keyInsights.some((i) => i.text.includes('compromiso'))).toBe(false)
  })

  it('includes coverage info in briefing', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        applications: [
          { id: 'app1', businessUnitId: 'bu1', technologies: [], criticality: 'low' },
        ] as any,
        teams: [{ id: 't1', name: 'Team A' }] as any,
        technologies: [{ id: 't1', name: 'React', supportStatus: 'active' }] as any,
      }),
    )
    expect(result.flashBriefing).toContain('Cobertura')
    expect(result.flashBriefing).toContain('aplicaciones')
    expect(result.flashBriefing).toContain('equipos')
    expect(result.flashBriefing).toContain('tecnologías')
  })

  it('generates BU highlights sorted by THI ascending', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        businessUnits: [
          { id: 'bu1', name: 'BU Good' },
          { id: 'bu2', name: 'BU Bad' },
        ] as any,
        applications: [
          { id: 'app1', businessUnitId: 'bu1', technologies: [], criticality: 'low' },
          { id: 'app2', businessUnitId: 'bu2', technologies: [], criticality: 'low' },
        ] as any,
        technologies: [{ id: 't1', name: 'Angular', supportStatus: 'eol' }] as any,
      }),
    )
    expect(result.buHighlights).toBeDefined()
    if (result.buHighlights.length >= 2) {
      expect(result.buHighlights[0].thi).toBeLessThanOrEqual(result.buHighlights[1].thi)
    }
  })

  it('skips BU with no apps in highlights', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        businessUnits: [{ id: 'bu1', name: 'Empty BU' }] as any,
      }),
    )
    expect(result.buHighlights).toHaveLength(0)
  })

  it('highlights BU with critical vulns and EOL apps', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        businessUnits: [{ id: 'bu1', name: 'BU At Risk' }] as any,
        applications: [
          { id: 'app1', businessUnitId: 'bu1', technologies: ['t1'], criticality: 'critical' },
        ] as any,
        vulnerabilities: [
          { id: 'v1', severity: 'critical', status: 'open', applicationId: 'app1' },
        ] as any,
        technologies: [{ id: 't1', name: 'Angular', supportStatus: 'eol' }] as any,
      }),
    )
    expect(result.buHighlights.length).toBeGreaterThan(0)
    expect(result.buHighlights[0].text).toContain('vulns críticas')
    expect(result.buHighlights[0].text).toContain('EOL')
  })

  it('has urgent items section when critical vulns present', () => {
    const result = generateExecutiveNarrative(
      createTestInput({
        vulnerabilities: [
          { id: 'v1', severity: 'critical', status: 'open', applicationId: 'app1' },
        ] as any,
        teams: [{ id: 't1', name: 'Team' }] as any,
      }),
    )
    expect(result.flashBriefing).toContain('Requiere atención')
  })
})
