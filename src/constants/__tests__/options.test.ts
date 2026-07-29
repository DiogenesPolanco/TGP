import { describe, it, expect } from 'vitest'
import { criticalityOptions, taskStatusOptions } from '../options'

describe('criticalityOptions', () => {
  it('has 4 options', () => {
    expect(criticalityOptions).toHaveLength(4)
  })

  it('includes all criticality values', () => {
    const values = criticalityOptions.map((o) => o.value)
    expect(values).toContain('low')
    expect(values).toContain('medium')
    expect(values).toContain('high')
    expect(values).toContain('critical')
  })

  it('has Spanish labels', () => {
    expect(criticalityOptions.find((o) => o.value === 'low')?.label).toBe('Baja')
    expect(criticalityOptions.find((o) => o.value === 'critical')?.label).toBe('Crítica')
  })
})

describe('taskStatusOptions', () => {
  it('has 4 options', () => {
    expect(taskStatusOptions).toHaveLength(4)
  })

  it('includes all task statuses', () => {
    const values = taskStatusOptions.map((o) => o.value)
    expect(values).toContain('todo')
    expect(values).toContain('in_progress')
    expect(values).toContain('review')
    expect(values).toContain('done')
  })

  it('has Spanish labels', () => {
    expect(taskStatusOptions.find((o) => o.value === 'todo')?.label).toBe('Por Hacer')
    expect(taskStatusOptions.find((o) => o.value === 'done')?.label).toBe('Completada')
  })
})
