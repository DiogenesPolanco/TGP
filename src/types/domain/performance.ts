import type { MemberRole } from '@/constants/enums'

export interface MemberProfile {
  id: string
  teamId: string
  email: string
  phoneCell: string
  phoneHome: string
  address: string
  role: MemberRole
  skills: Skill[]
  technologies: string[]
  microservices: string[]
  avgStoryPoints: number
  vacationDaysPerYear: number
  vacationUsed: number
  createdAt: Date
  updatedAt: Date
}

export interface Skill {
  id: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  category: string
}

export interface SprintRecord {
  id: string
  memberId: string
  sprintName: string
  quarter: string
  year: number
  storyPointsCompleted: number
  storyPointsNotCompleted: number
  createdAt: Date
}

export interface OneOnOne {
  id: string
  memberId: string
  date: Date
  tipo: 'semanal' | 'quincenal' | 'mensual'
  feedbackDelLider: string
  feedbackDelMiembro: string
  estadoAnimo: number
  oportunidades: Oportunidad[]
  acciones: Accion[]
  compromisos: Compromiso[]
  createdAt: Date
  updatedAt: Date
}

export interface Oportunidad {
  id: string
  descripcion: string
  tipo: 'mejora' | 'crecimiento' | 'capacitacion' | 'ascenso' | 'mentoria'
  status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  createdAt: Date
}

export interface Accion {
  id: string
  descripcion: string
  asignadoA: string
  fechaLimite: Date | null
  completada: boolean
  completadaEn: Date | null
}

export interface Compromiso {
  id: string
  descripcion: string
  fechaCompromiso: Date
  cumplido: boolean
  cumplidoEn: Date | null
}

export interface Achievement {
  id: string
  memberId: string
  title: string
  description: string
  date: Date
  type: 'logro' | 'reconocimiento' | 'certificacion' | 'ascenso'
  linkedToPromotion: boolean
  createdAt: Date
}
