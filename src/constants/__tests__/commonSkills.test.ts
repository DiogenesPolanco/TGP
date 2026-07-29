import { describe, it, expect } from 'vitest'
import { searchTechnologies, COMMON_SKILLS } from '../commonSkills'

describe('COMMON_SKILLS', () => {
  it('has skills in multiple categories', () => {
    const categories = new Set(COMMON_SKILLS.map((s) => s.category))
    expect(categories.size).toBeGreaterThan(3)
  })

  it('each skill has required fields', () => {
    COMMON_SKILLS.forEach((skill) => {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.category).toBeTruthy()
    })
  })

  it('has unique ids', () => {
    const ids = COMMON_SKILLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('searchTechnologies', () => {
  const catalog = [
    { id: 'tech-1', name: 'React', category: 'framework', vendor: 'Meta' },
    { id: 'tech-2', name: 'Vue.js', category: 'framework' },
    { id: 'tech-3', name: 'PostgreSQL', category: 'database' },
  ]

  it('returns empty for empty query', () => {
    expect(searchTechnologies('', catalog)).toEqual([])
    expect(searchTechnologies('   ', catalog)).toEqual([])
  })

  it('finds technologies by name', () => {
    const results = searchTechnologies('react', catalog)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.name === 'React')).toBe(true)
  })

  it('finds technologies by vendor', () => {
    const results = searchTechnologies('meta', catalog)
    expect(results.some((r) => r.name === 'React')).toBe(true)
  })

  it('finds common skills', () => {
    const results = searchTechnologies('scrum', [])
    expect(results.some((r) => r.name === 'Scrum' && r.isSkill)).toBe(true)
  })

  it('deduplicates skills already in catalog', () => {
    const catalogWithScrum = [{ id: 'custom-scrum', name: 'Scrum', category: 'methodology' }]
    const results = searchTechnologies('scrum', catalogWithScrum)
    const scrumResults = results.filter((r) => r.name === 'Scrum')
    expect(scrumResults).toHaveLength(1)
    expect(scrumResults[0].isSkill).toBe(false)
  })

  it('limits results to 20', () => {
    const results = searchTechnologies('a', catalog)
    expect(results.length).toBeLessThanOrEqual(20)
  })

  it('returns TechSearchResult format', () => {
    const results = searchTechnologies('react', catalog)
    expect(results[0]).toHaveProperty('id')
    expect(results[0]).toHaveProperty('name')
    expect(results[0]).toHaveProperty('category')
    expect(results[0]).toHaveProperty('isSkill')
  })
})
