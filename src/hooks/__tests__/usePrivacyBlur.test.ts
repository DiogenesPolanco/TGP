import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePrivacyBlur } from '../usePrivacyBlur'

describe('usePrivacyBlur', () => {
  it('initializes with isHidden false', () => {
    const { result } = renderHook(() => usePrivacyBlur())
    expect(result.current).toBe(false)
  })

  it('registers visibilitychange listener', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    renderHook(() => usePrivacyBlur())

    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    addEventListenerSpy.mockRestore()
  })

  it('cleans up listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => usePrivacyBlur())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('updates isHidden when visibility changes to hidden', () => {
    const { result } = renderHook(() => usePrivacyBlur())

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(true)
  })

  it('updates isHidden when visibility changes back to visible', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
    const { result } = renderHook(() => usePrivacyBlur())

    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(false)
  })
})
