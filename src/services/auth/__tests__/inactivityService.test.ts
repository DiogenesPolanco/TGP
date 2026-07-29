import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  startInactivityWatch,
  stopInactivityWatch,
  getWarningRemainingMs,
  dismissInactivityWarning,
  WARNING_DURATION_MS,
} from '../inactivityService'

type InactivityHandler = (phase: 'warning' | 'expired') => void

describe('inactivityService', () => {
  let handler: InactivityHandler

  beforeEach(() => {
    vi.useFakeTimers()
    handler = vi.fn() as unknown as InactivityHandler
  })

  afterEach(() => {
    stopInactivityWatch()
    vi.useRealTimers()
  })

  it('starts watch and calls handler after timeout', () => {
    startInactivityWatch(handler, 5000)
    expect(handler).not.toHaveBeenCalled()

    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('warning')
  })

  it('calls expired after warning duration elapses', () => {
    startInactivityWatch(handler, 5000)
    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledWith('warning')

    vi.advanceTimersByTime(WARNING_DURATION_MS + 100)
    expect(handler).toHaveBeenCalledWith('expired')
  })

  it('ignores duplicate start calls', () => {
    startInactivityWatch(handler, 5000)
    startInactivityWatch(handler, 5000)
    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('stopInactivityWatch clears timers and events', () => {
    startInactivityWatch(handler, 5000)
    stopInactivityWatch()
    vi.advanceTimersByTime(5001)
    expect(handler).not.toHaveBeenCalled()
  })

  it('dismissInactivityWarning resets the main timer', () => {
    startInactivityWatch(handler, 5000)
    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledWith('warning')
    ;(handler as unknown as { mockClear: () => void }).mockClear()

    dismissInactivityWarning()
    // Main timer resets — warning fires again after another 5s
    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledWith('warning')
  })

  it('getWarningRemainingMs returns remaining time', () => {
    startInactivityWatch(handler, 5000)
    vi.advanceTimersByTime(5001) // enters warning
    expect(getWarningRemainingMs()).toBe(WARNING_DURATION_MS)

    vi.advanceTimersByTime(1000)
    expect(getWarningRemainingMs()).toBe(WARNING_DURATION_MS - 1000)
  })

  it('activity during warning dismisses it', () => {
    startInactivityWatch(handler, 5000)
    vi.advanceTimersByTime(5001)
    expect(handler).toHaveBeenCalledWith('warning')
    ;(handler as unknown as { mockClear: () => void }).mockClear()

    window.dispatchEvent(new MouseEvent('mousemove'))
    expect(handler).toHaveBeenCalledWith('warning')
  })

  it('uses default timeout when not provided', () => {
    startInactivityWatch(handler) // no timeoutMs
    vi.advanceTimersByTime(15 * 60 * 1000 + 1)
    expect(handler).toHaveBeenCalled()
  })
})
