import { describe, it, expect } from 'vitest'
import { MEMBER_ROLE_LABELS, MEMBER_ROLES, MEMBER_STATUS_LABELS } from '../roleLabels'

describe('MEMBER_ROLE_LABELS', () => {
  it('has labels for all roles', () => {
    expect(MEMBER_ROLE_LABELS.developer).toBe('Desarrollador')
    expect(MEMBER_ROLE_LABELS.senior_developer).toBe('Desarrollador Senior')
    expect(MEMBER_ROLE_LABELS.tech_lead).toBe('Líder Técnico')
    expect(MEMBER_ROLE_LABELS.architect).toBe('Arquitecto')
    expect(MEMBER_ROLE_LABELS.qa).toBe('QA')
    expect(MEMBER_ROLE_LABELS.devops).toBe('DevOps')
    expect(MEMBER_ROLE_LABELS.product_owner).toBe('Product Owner')
    expect(MEMBER_ROLE_LABELS.scrum_master).toBe('Scrum Master')
    expect(MEMBER_ROLE_LABELS.ux_designer).toBe('UX Designer')
    expect(MEMBER_ROLE_LABELS.analyst).toBe('Analista')
    expect(MEMBER_ROLE_LABELS.manager).toBe('Gerente')
    expect(MEMBER_ROLE_LABELS.intern).toBe('Pasante')
    expect(MEMBER_ROLE_LABELS.other).toBe('Otro')
  })

  it('has 13 roles', () => {
    expect(Object.keys(MEMBER_ROLE_LABELS)).toHaveLength(13)
  })
})

describe('MEMBER_ROLES', () => {
  it('has all role keys', () => {
    expect(MEMBER_ROLES).toContain('developer')
    expect(MEMBER_ROLES).toContain('tech_lead')
    expect(MEMBER_ROLES).toContain('manager')
  })

  it('matches MEMBER_ROLE_LABELS keys', () => {
    expect(MEMBER_ROLES).toEqual(Object.keys(MEMBER_ROLE_LABELS))
  })
})

describe('MEMBER_STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    expect(MEMBER_STATUS_LABELS.activo).toBe('Activo')
    expect(MEMBER_STATUS_LABELS.incorporacion).toBe('Incorporación')
    expect(MEMBER_STATUS_LABELS.licencia).toBe('Licencia')
    expect(MEMBER_STATUS_LABELS.vacaciones).toBe('Vacaciones')
    expect(MEMBER_STATUS_LABELS.desvinculado).toBe('Desvinculado')
  })

  it('has 5 statuses', () => {
    expect(Object.keys(MEMBER_STATUS_LABELS)).toHaveLength(5)
  })
})
