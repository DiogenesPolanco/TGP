import { describe, it, expect } from 'vitest'
import {
  DEFAULT_HEALTH_WEIGHTS,
  DEFAULT_SLA_CONFIG,
  THI_RANGES,
  DORA_BENCHMARKS,
  RISK_THRESHOLDS,
  APP_NAME,
  APP_VERSION,
} from '../config'

describe('DEFAULT_HEALTH_WEIGHTS', () => {
  it('sums to 100', () => {
    const sum = Object.values(DEFAULT_HEALTH_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBe(100)
  })

  it('has all required dimensions', () => {
    expect(DEFAULT_HEALTH_WEIGHTS.delivery).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.quality).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.security).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.availability).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.obsolescence).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.risk).toBeDefined()
    expect(DEFAULT_HEALTH_WEIGHTS.compliance).toBeDefined()
  })
})

describe('DEFAULT_SLA_CONFIG', () => {
  it('has SLA for all severity levels', () => {
    expect(DEFAULT_SLA_CONFIG.critical).toBe(7)
    expect(DEFAULT_SLA_CONFIG.high).toBe(30)
    expect(DEFAULT_SLA_CONFIG.medium).toBe(90)
    expect(DEFAULT_SLA_CONFIG.low).toBe(180)
  })

  it('has increasing SLA days by severity', () => {
    expect(DEFAULT_SLA_CONFIG.critical).toBeLessThan(DEFAULT_SLA_CONFIG.high)
    expect(DEFAULT_SLA_CONFIG.high).toBeLessThan(DEFAULT_SLA_CONFIG.medium)
    expect(DEFAULT_SLA_CONFIG.medium).toBeLessThan(DEFAULT_SLA_CONFIG.low)
  })
})

describe('THI_RANGES', () => {
  it('has all THI ranges', () => {
    expect(THI_RANGES.excellent).toBeDefined()
    expect(THI_RANGES.healthy).toBeDefined()
    expect(THI_RANGES.regular).toBeDefined()
    expect(THI_RANGES.atRisk).toBeDefined()
    expect(THI_RANGES.critical).toBeDefined()
  })

  it('has non-overlapping ranges', () => {
    expect(THI_RANGES.excellent.min).toBe(90)
    expect(THI_RANGES.healthy.min).toBe(70)
    expect(THI_RANGES.healthy.max).toBe(89)
    expect(THI_RANGES.regular.min).toBe(50)
    expect(THI_RANGES.regular.max).toBe(69)
    expect(THI_RANGES.atRisk.min).toBe(30)
    expect(THI_RANGES.atRisk.max).toBe(49)
    expect(THI_RANGES.critical.min).toBe(0)
    expect(THI_RANGES.critical.max).toBe(29)
  })

  it('has Spanish labels', () => {
    expect(THI_RANGES.excellent.label).toBe('Excelente')
    expect(THI_RANGES.healthy.label).toBe('Saludable')
    expect(THI_RANGES.regular.label).toBe('Regular')
    expect(THI_RANGES.atRisk.label).toBe('En Riesgo')
    expect(THI_RANGES.critical.label).toBe('Crítico')
  })
})

describe('DORA_BENCHMARKS', () => {
  it('has all DORA levels', () => {
    expect(DORA_BENCHMARKS.elite).toBeDefined()
    expect(DORA_BENCHMARKS.high).toBeDefined()
    expect(DORA_BENCHMARKS.medium).toBeDefined()
    expect(DORA_BENCHMARKS.low).toBeDefined()
  })

  it('elite has strict thresholds', () => {
    expect(DORA_BENCHMARKS.elite.deploymentFrequency.min).toBe(1)
    expect(DORA_BENCHMARKS.elite.leadTimeHours.max).toBe(1)
    expect(DORA_BENCHMARKS.elite.changeFailureRate.max).toBe(5)
    expect(DORA_BENCHMARKS.elite.mttrHours.max).toBe(1)
  })
})

describe('RISK_THRESHOLDS', () => {
  it('has all risk levels', () => {
    expect(RISK_THRESHOLDS.critical).toBeDefined()
    expect(RISK_THRESHOLDS.high).toBeDefined()
    expect(RISK_THRESHOLDS.medium).toBeDefined()
    expect(RISK_THRESHOLDS.low).toBeDefined()
    expect(RISK_THRESHOLDS.veryLow).toBeDefined()
  })

  it('has non-overlapping ranges', () => {
    expect(RISK_THRESHOLDS.critical.min).toBe(20)
    expect(RISK_THRESHOLDS.critical.max).toBe(25)
    expect(RISK_THRESHOLDS.high.min).toBe(15)
    expect(RISK_THRESHOLDS.high.max).toBe(19)
    expect(RISK_THRESHOLDS.medium.min).toBe(10)
    expect(RISK_THRESHOLDS.medium.max).toBe(14)
    expect(RISK_THRESHOLDS.low.min).toBe(5)
    expect(RISK_THRESHOLDS.low.max).toBe(9)
    expect(RISK_THRESHOLDS.veryLow.min).toBe(1)
    expect(RISK_THRESHOLDS.veryLow.max).toBe(4)
  })
})

describe('APP constants', () => {
  it('has correct app name', () => {
    expect(APP_NAME).toBe('TGP')
  })

  it('has version format', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
