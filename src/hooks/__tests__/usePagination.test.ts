import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`)

  it('initializes with page 1 and default pageSize', () => {
    const { result } = renderHook(() => usePagination(items))

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(5)
    expect(result.current.totalPages).toBe(5)
  })

  it('initializes with custom pageSize', () => {
    const { result } = renderHook(() => usePagination(items, 10))

    expect(result.current.pageSize).toBe(10)
    expect(result.current.totalPages).toBe(3)
  })

  it('returns correct paginatedItems for first page', () => {
    const { result } = renderHook(() => usePagination(items))

    expect(result.current.paginatedItems).toEqual([
      'Item 1',
      'Item 2',
      'Item 3',
      'Item 4',
      'Item 5',
    ])
  })

  it('navigates to next page', () => {
    const { result } = renderHook(() => usePagination(items))

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.page).toBe(2)
    expect(result.current.paginatedItems).toEqual([
      'Item 6',
      'Item 7',
      'Item 8',
      'Item 9',
      'Item 10',
    ])
  })

  it('navigates to last page with fewer items', () => {
    const { result } = renderHook(() => usePagination(items))

    act(() => {
      result.current.setPage(5)
    })

    expect(result.current.paginatedItems).toEqual([
      'Item 21',
      'Item 22',
      'Item 23',
      'Item 24',
      'Item 25',
    ])
  })

  it('changes pageSize and resets to page 1', () => {
    const { result } = renderHook(() => usePagination(items))

    act(() => {
      result.current.setPage(3)
    })

    act(() => {
      result.current.setPageSize(10)
    })

    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(10)
    expect(result.current.totalPages).toBe(3)
  })

  it('handles empty array', () => {
    const { result } = renderHook(() => usePagination([]))

    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginatedItems).toEqual([])
  })

  it('handles single item', () => {
    const { result } = renderHook(() => usePagination(['Only']))

    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginatedItems).toEqual(['Only'])
  })

  it('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination(items, 3))

    expect(result.current.totalPages).toBe(9)
  })
})
