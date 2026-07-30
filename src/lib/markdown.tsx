import { useState, useRef, useCallback, type ReactNode } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Public API ───────────────────────────────────────────────────

/**
 * Renderiza markdown como ReactNodes (seguro, sin dangerouslySetInnerHTML).
 *
 * Soporta:
 *   - Código bloque ```lang\n...\n```
 *   - **bold** y *italic* inline
 *   - `código inline`
 *   - Listas sin orden (- item)
 *   - Listas ordenadas (1. item)
 *   - Línea entera en **bold** como título
 *   - Separador ---
 *   - Párrafos (doble salto de línea)
 */
export function Markdown({ text, className }: { text: string; className?: string }) {
  if (!text) return null
  return <div className={cn('space-y-1', className)}>{renderBlocks(text)}</div>
}

// ─── Code Block Component ─────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1500)
  }, [code])

  return (
    <div className="relative group/code my-3 first:mt-0 last:mb-0">
      <div className="flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-neutral-85 dark:bg-neutral-20 border-b border-neutral-70 dark:border-neutral-30">
        <span className="text-[10px] font-mono text-neutral-40 dark:text-neutral-50 uppercase tracking-wide">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-neutral-40 dark:text-neutral-50 hover:text-white dark:hover:text-neutral-90 transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre
        className="bg-neutral-85 dark:bg-neutral-20 text-neutral-20 dark:text-neutral-85 rounded-b-lg p-3 text-[12px] leading-relaxed overflow-x-auto font-mono"
        data-lang={lang || undefined}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Block-level parser ───────────────────────────────────────────

type Block =
  | { type: 'code'; lang: string; code: string }
  | { type: 'text'; content: string }

/** Divide el texto en bloques de código y texto, preservando los code fences. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const regex = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index)
      if (before.trim()) blocks.push({ type: 'text', content: before })
    }
    blocks.push({ type: 'code', lang: match[1], code: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex)
    if (rest.trim()) blocks.push({ type: 'text', content: rest })
  }

  return blocks
}

/** Renderiza los bloques a ReactNodes. */
function renderBlocks(text: string): ReactNode[] {
  const blocks = parseBlocks(text)
  const elements: ReactNode[] = []
  let key = 0

  for (const block of blocks) {
    if (block.type === 'code') {
      elements.push(<CodeBlock key={key++} code={block.code} lang={block.lang} />)
    } else {
      elements.push(...renderTextLines(block.content, key))
      key += 1000 // evitar colisiones de key
    }
  }

  return elements
}

// ─── Line-level parser ────────────────────────────────────────────

type LineType = 'heading' | 'ulist' | 'olist' | 'hr' | 'paragraph' | 'empty'

function classifyLine(line: string): LineType {
  const t = line.trim()
  if (!t) return 'empty'
  if (/^---+\s*$/.test(t)) return 'hr'
  if (/^\*\*.+\*\*$/.test(t)) return 'heading'
  if (t.startsWith('- ')) return 'ulist'
  if (/^\d+\.\s/.test(t)) return 'olist'
  return 'paragraph'
}

/** Renderiza líneas de texto, agrupando párrafos separados por líneas en blanco. */
function renderTextLines(text: string, baseKey: number): ReactNode[] {
  const lines = text.split('\n')
  const elements: ReactNode[] = []
  let i = 0
  let key = baseKey

  while (i < lines.length) {
    const type = classifyLine(lines[i])

    if (type === 'empty') {
      elements.push(<div key={key++} className="h-1.5" />)
      i++
      continue
    }

    if (type === 'hr') {
      elements.push(
        <div key={key++} className="my-2 border-t border-boundary" />,
      )
      i++
      continue
    }

    if (type === 'heading') {
      const title = lines[i].trim().replace(/\*\*(.+)\*\*/g, '$1')
      elements.push(
        <p
          key={key++}
          className="text-sm font-semibold text-default mt-2 first:mt-0 leading-relaxed"
        >
          {title}
        </p>,
      )
      i++
      continue
    }

    if (type === 'ulist') {
      const item = lines[i].trim().slice(2)
      elements.push(
        <div
          key={key++}
          className="flex items-start gap-2 text-sm leading-relaxed text-secondary ml-1"
        >
          <span className="w-1 h-1 rounded-full bg-neutral-40 dark:bg-neutral-50 mt-2 shrink-0" />
          <span className="flex-1">{renderInline(item)}</span>
        </div>,
      )
      i++
      continue
    }

    if (type === 'olist') {
      const match = lines[i].trim().match(/^(\d+)\.\s(.+)$/)
      if (match) {
        elements.push(
          <div
            key={key++}
            className="flex items-start gap-2 text-sm leading-relaxed text-secondary ml-1"
          >
            <span className="text-xs text-muted font-mono mt-0.5 shrink-0 w-4 text-right tabular-nums">
              {match[1]}.
            </span>
            <span className="flex-1">{renderInline(match[2])}</span>
          </div>,
        )
      }
      i++
      continue
    }

    // paragraph — agrupar líneas consecutivas hasta otra línea en blanco
    const paraLines: string[] = []
    while (i < lines.length && classifyLine(lines[i]) === 'paragraph') {
      paraLines.push(lines[i].trim())
      i++
    }
    elements.push(
      <p key={key++} className="text-sm leading-relaxed text-secondary">
        {renderInline(paraLines.join('\n'))}
      </p>,
    )
  }

  return elements
}

// ─── Inline parser ────────────────────────────────────────────────

/** Renderiza inline: **bold**, *italic*, `code`. */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let key = 0
  // Matches **bold**, *italic*, or `inline code`
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|`(.+?)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={key++} className="font-semibold text-default">
          {match[2]}
        </strong>,
      )
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={key++} className="text-secondary">
          {match[4]}
        </em>,
      )
    } else if (match[5]) {
      // `inline code`
      parts.push(
        <code
          key={key++}
          className="bg-subtle px-1.5 py-0.5 rounded text-[11px] font-mono text-default"
        >
          {match[5]}
        </code>,
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : [<span key={key}>{text}</span>]
}
