import type { HealthWeights, VulnerabilitySLAConfig } from '@/types/domain'

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  delivery: 20,
  quality: 15,
  security: 20,
  availability: 15,
  obsolescence: 10,
  risk: 10,
  compliance: 10,
}

export const DEFAULT_SLA_CONFIG: VulnerabilitySLAConfig = {
  critical: 7,
  high: 30,
  medium: 90,
  low: 180,
}

export const THI_RANGES = {
  excellent: { min: 90, max: 100, label: 'Excelente', color: '#36B37E' },
  healthy: { min: 70, max: 89, label: 'Saludable', color: '#57D9A3' },
  regular: { min: 50, max: 69, label: 'Regular', color: '#FFAB00' },
  atRisk: { min: 30, max: 49, label: 'En Riesgo', color: '#FF8B00' },
  critical: { min: 0, max: 29, label: 'Crítico', color: '#FF5630' },
}

export const DORA_BENCHMARKS = {
  elite: {
    deploymentFrequency: { min: 1, unit: 'day' },
    leadTimeHours: { max: 1 },
    changeFailureRate: { max: 5 },
    mttrHours: { max: 1 },
  },
  high: {
    deploymentFrequency: { min: 1, max: 7, unit: 'week' },
    leadTimeHours: { max: 168 },
    changeFailureRate: { max: 10 },
    mttrHours: { max: 24 },
  },
  medium: {
    deploymentFrequency: { min: 1, max: 30, unit: 'month' },
    leadTimeHours: { max: 720 },
    changeFailureRate: { max: 15 },
    mttrHours: { max: 168 },
  },
  low: {
    deploymentFrequency: { max: 30, unit: 'month' },
    leadTimeHours: { min: 720 },
    changeFailureRate: { min: 15 },
    mttrHours: { min: 168 },
  },
}

export const RISK_THRESHOLDS = {
  critical: { min: 20, max: 25 },
  high: { min: 15, max: 19 },
  medium: { min: 10, max: 14 },
  low: { min: 5, max: 9 },
  veryLow: { min: 1, max: 4 },
}

export const APP_NAME = 'TGP'
export const APP_VERSION = '1.0.0'
