import type { MemberRole } from './enums'

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  developer: 'Developer',
  senior_developer: 'Senior Developer',
  tech_lead: 'Tech Lead',
  architect: 'Arquitecto',
  qa: 'QA',
  devops: 'DevOps',
  product_owner: 'Product Owner',
  scrum_master: 'Scrum Master',
  ux_designer: 'UX Designer',
  analyst: 'Analista',
  manager: 'Manager',
  intern: 'Intern',
  other: 'Otro',
}

export const MEMBER_ROLES = Object.keys(MEMBER_ROLE_LABELS) as MemberRole[]
