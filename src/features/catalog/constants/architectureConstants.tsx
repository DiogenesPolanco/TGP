import { Server, Layers, Box, Cpu, Database, Globe, Wrench, Wifi } from 'lucide-react'
import type { SupportStatus } from '@/constants/enums'
import type { DependencyType } from '@/constants/enums'

export const criticalityLabel: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const appStatusLabel: Record<string, string> = {
  active: 'Activa',
  deprecated: 'Deprecada',
  retired: 'Retirada',
  planned: 'Planificada',
}

export const statusColors: Record<SupportStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  extended: 'bg-warning/10 text-warning border-warning/30',
  eol: 'bg-danger/10 text-danger border-danger/30',
  unknown: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
}

export const categoryIcons: Record<string, React.ReactNode> = {
  language: <Wrench size={14} />,
  framework: <Layers size={14} />,
  database: <Database size={14} />,
  runtime: <Cpu size={14} />,
  cloud: <Globe size={14} />,
  tool: <Wrench size={14} />,
  library: <Box size={14} />,
  'message-broker': <Wifi size={14} />,
  'web-server': <Server size={14} />,
}

export const dependencyTypes: { value: DependencyType; label: string }[] = [
  { value: 'api', label: 'API' },
  { value: 'database', label: 'Base de Datos' },
  { value: 'library', label: 'Librería' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'message', label: 'Mensajería' },
  { value: 'external', label: 'Sistema Externo' },
]
