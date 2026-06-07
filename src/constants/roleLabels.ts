import type { MemberRole, MemberStatus } from './enums'

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  developer: 'Desarrollador',
  senior_developer: 'Desarrollador Senior',
  tech_lead: 'Líder Técnico',
  architect: 'Arquitecto',
  qa: 'QA',
  devops: 'DevOps',
  product_owner: 'Product Owner',
  scrum_master: 'Scrum Master',
  ux_designer: 'UX Designer',
  analyst: 'Analista',
  manager: 'Gerente',
  intern: 'Pasante',
  other: 'Otro',
}

export const MEMBER_ROLES = Object.keys(MEMBER_ROLE_LABELS) as MemberRole[]

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  activo: 'Activo',
  incorporacion: 'Incorporación',
  licencia: 'Licencia',
  vacaciones: 'Vacaciones',
  desvinculado: 'Desvinculado',
}
