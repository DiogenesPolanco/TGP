import type { Criticality, TaskStatus } from './enums'

export const criticalityOptions: { value: Criticality; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
]

export const taskStatusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'Por Hacer' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'review', label: 'En Revisión' },
  { value: 'done', label: 'Completada' },
]
