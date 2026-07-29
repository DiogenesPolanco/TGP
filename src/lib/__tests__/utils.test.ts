import { describe, it, expect } from 'vitest'
import { cn, parseLocalDate } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('deduplicates tailwind classes', () => {
    const result = cn('px-4 py-2', 'px-6')
    expect(result).toContain('px-6')
    expect(result).toContain('py-2')
    expect(result).not.toContain('px-4')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active', false && 'inactive')
    expect(result).toContain('base')
    expect(result).toContain('active')
    expect(result).not.toContain('inactive')
  })

  it('handles empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })
})

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const date = parseLocalDate('2024-06-15')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(5) // June is month 5 (0-indexed)
    expect(date.getDate()).toBe(15)
  })

  it('parses first day of year', () => {
    const date = parseLocalDate('2025-01-01')
    expect(date.getFullYear()).toBe(2025)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })

  it('parses last day of year', () => {
    const date = parseLocalDate('2024-12-31')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(11)
    expect(date.getDate()).toBe(31)
  })

  it('creates date at local midnight', () => {
    const date = parseLocalDate('2024-03-15')
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
    expect(date.getSeconds()).toBe(0)
  })

  it('handles single digit month and day', () => {
    const date = parseLocalDate('2024-01-05')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(5)
  })
})
