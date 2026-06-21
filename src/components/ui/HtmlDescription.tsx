interface HtmlDescriptionProps {
  html: string | null | undefined
  /** Número de líneas visibles antes del truncamiento (default: 1) */
  lines?: number
  className?: string
  /** Render completo sin truncar (para detalle) */
  full?: boolean
}

/**
 * Renderiza contenido HTML con truncamiento via CSS line-clamp.
 * Seguro porque el HTML proviene del editor TipTap (no de inputs de usuario libre).
 *
 * NOTA: Usamos inline style para line-clamp porque Tailwind JIT no genera
 * clases dinámicas como `line-clamp-${lines}`.
 */
export function HtmlDescription({ html, lines = 1, className = '', full = false }: HtmlDescriptionProps) {
  if (!html) return null
  const trimmed = html.trim()
  if (!trimmed) return null

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none text-neutral-70 dark:text-neutral-40 ${className}`}
      style={full ? undefined : {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: trimmed }}
    />
  )
}
