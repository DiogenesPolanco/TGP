import { describe, it, expect } from 'vitest'
import { getGradientId } from '../gradients'

describe('getGradientId', () => {
  it('returns all gradient IDs with default prefix', () => {
    const result = getGradientId()
    expect(result).toEqual({
      primary: 'url(#chart-gradients-primary)',
      success: 'url(#chart-gradients-success)',
      warning: 'url(#chart-gradients-warning)',
      danger: 'url(#chart-gradients-danger)',
      info: 'url(#chart-gradients-info)',
      neutral: 'url(#chart-gradients-neutral)',
    })
  })

  it('returns gradient IDs with custom prefix', () => {
    const result = getGradientId('my-chart')
    expect(result.primary).toBe('url(#my-chart-primary)')
    expect(result.success).toBe('url(#my-chart-success)')
    expect(result.warning).toBe('url(#my-chart-warning)')
    expect(result.danger).toBe('url(#my-chart-danger)')
    expect(result.info).toBe('url(#my-chart-info)')
    expect(result.neutral).toBe('url(#my-chart-neutral)')
  })

  it('returns gradient IDs with empty prefix', () => {
    const result = getGradientId('')
    expect(result.primary).toBe('url(#-primary)')
    expect(result.success).toBe('url(#-success)')
  })

  it('returns gradient IDs with special characters', () => {
    const result = getGradientId('chart-1')
    expect(result.primary).toBe('url(#chart-1-primary)')
  })
})
