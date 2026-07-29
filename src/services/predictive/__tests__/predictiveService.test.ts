import { describe, it, expect } from 'vitest'

function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length
  if (n < 3) return { slope: 0, intercept: values[0] ?? 0, r2: 0 }

  const indices = Array.from({ length: n }, (_, i) => i)
  const sumX = indices.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = indices.reduce((s, i) => s + i * values[i], 0)
  const sumX2 = indices.reduce((s, i) => s + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const yMean = sumY / n
  const ssRes = values.reduce((s, y, i) => s + (y - (slope * i + intercept)) ** 2, 0)
  const ssTot = values.reduce((s, y) => s + (y - yMean) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, r2 }
}

describe('linearRegression', () => {
  it('returns zero slope for constant values', () => {
    const result = linearRegression([50, 50, 50, 50, 50])
    expect(result.slope).toBe(0)
    expect(result.r2).toBe(1)
  })

  it('detects upward trend', () => {
    const result = linearRegression([10, 20, 30, 40, 50])
    expect(result.slope).toBeGreaterThan(0)
    expect(result.r2).toBeGreaterThan(0.9)
  })

  it('detects downward trend', () => {
    const result = linearRegression([50, 40, 30, 20, 10])
    expect(result.slope).toBeLessThan(0)
    expect(result.r2).toBeGreaterThan(0.9)
  })

  it('handles fewer than 3 values', () => {
    const result = linearRegression([100])
    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(100)
  })

  it('handles empty array', () => {
    const result = linearRegression([])
    expect(result.slope).toBe(0)
    expect(result.intercept).toBe(0)
  })
})

function predictNext(
  values: number[],
  steps = 30,
): { prediction: number; confidence: 'high' | 'medium' | 'low' } {
  const { slope, intercept, r2 } = linearRegression(values)
  const nextIndex = values.length + steps - 1
  const prediction = Math.max(0, Math.min(100, slope * nextIndex + intercept))

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (values.length >= 10 && r2 > 0.7) confidence = 'high'
  else if (values.length >= 5 && r2 > 0.4) confidence = 'medium'

  return { prediction: Math.round(prediction * 10) / 10, confidence }
}

describe('predictNext', () => {
  it('predicts upward trend correctly', () => {
    const result = predictNext([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 5)
    expect(result.confidence).toBe('high')
    expect(result.prediction).toBeGreaterThanOrEqual(90)
  })

  it('clamps prediction between 0 and 100', () => {
    const result = predictNext([1, 2, 3, 4, 5], 1000)
    expect(result.prediction).toBeLessThanOrEqual(100)
    expect(result.prediction).toBeGreaterThanOrEqual(0)
  })

  it('returns low confidence with few values', () => {
    const result = predictNext([50, 55], 10)
    expect(result.confidence).toBe('low')
  })

  it('returns medium confidence with 5+ values', () => {
    const result = predictNext([10, 20, 30, 40, 50], 10)
    expect(result.confidence).toBe('medium')
  })
})
