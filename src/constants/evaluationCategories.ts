import type { EvalCategory } from '@/types/domain'

export const EVALUATION_CATEGORIES: { key: EvalCategory; label: string }[] = [
  { key: 'technical_knowledge', label: 'Conocimiento Técnico' },
  { key: 'experience', label: 'Experiencia' },
  { key: 'communication', label: 'Comunicación' },
  { key: 'attitude', label: 'Actitud / Ajuste Cultural' },
  { key: 'problem_solving', label: 'Resolución de Problemas' },
  { key: 'teamwork', label: 'Trabajo en Equipo' },
  { key: 'leadership', label: 'Liderazgo' },
]
