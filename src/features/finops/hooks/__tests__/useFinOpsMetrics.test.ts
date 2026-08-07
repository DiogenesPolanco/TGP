import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFinOpsMetrics } from '../useFinOpsMetrics'

describe('useFinOpsMetrics', () => {
  it('expone el periodo actual y permite cambiarlo', () => {
    const { result } = renderHook(() => useFinOpsMetrics())
    expect(result.current.period).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
    act(() => result.current.setPeriod('2026-06'))
    expect(result.current.period).toBe('2026-06')
  })
})
