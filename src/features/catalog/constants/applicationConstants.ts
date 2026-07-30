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

export const criticalityColor: Record<string, string> = {
  critical: 'bg-danger/10 text-danger border-danger/30',
  high: 'bg-warning/10 text-warning border-warning/30',
  medium: 'bg-info/10 text-info border-info/30',
  low: 'bg-success/10 text-success border-success/30',
}

export const statusColor: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  deprecated: 'bg-warning/10 text-warning border-warning/30',
  retired: 'bg-neutral-10 dark:bg-neutral-70 text-muted border-neutral-30 dark:border-neutral-60',
  planned: 'bg-info/10 text-info border-info/30',
}
