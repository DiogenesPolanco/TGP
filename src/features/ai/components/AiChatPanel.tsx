import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Settings, CornerDownLeft, Sparkles, Clipboard, Check, Plus, MessageSquare, Trash2, ChevronDown, User } from 'lucide-react'
import type { AiProviderConfig, AiChatMessage, AiConversation } from '../types'
import { useAiChat } from '../hooks/useAiChat'

// ─── Copy hook ────────────────────────────────────────────────────

function useCopy(delay = 1800) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const copy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedId(null), delay)
  }, [delay])
  return { copiedId, copy }
}

// ─── Keyframes ────────────────────────────────────────────────────

const KF = `
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes loadPulse { 0%,100% { opacity: .25; transform: scale(1); } 50% { opacity: .75; transform: scale(1.15); } }
`

// ─── Render markdown → HTML ───────────────────────────────────────

function renderMd(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks first (preserve inner content)
  const withCode = escaped.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const langAttr = lang ? ` data-lang="${lang}"` : ''
      return `<div class="relative group/code my-3 first:mt-0 last:mb-0">
        <div class="flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-neutral-85 dark:bg-neutral-20 border-b border-neutral-70 dark:border-neutral-30">
          <span class="text-[10px] font-mono text-neutral-40 dark:text-neutral-50 uppercase tracking-wide">${lang || 'code'}</span>
          <button onclick="(function(b){navigator.clipboard.writeText(b.dataset.code);b.innerHTML='<span style=font-size:10px>✓</span>';setTimeout(()=>b.innerHTML='<span style=font-size:10px>⎘</span>',1500)})(this)"
            data-code="${code.replace(/"/g, '&quot;')}"
            class="text-[10px] font-mono text-neutral-40 dark:text-neutral-50 hover:text-white dark:hover:text-neutral-90 transition-colors"
          ><span style="font-size:10px">⎘</span></button>
        </div>
        <pre class="bg-neutral-85 dark:bg-neutral-20 text-neutral-20 dark:text-neutral-85 rounded-b-lg p-3 text-[12px] leading-relaxed overflow-x-auto font-mono"${langAttr}><code>${code}</code></pre>
      </div>`
    }
  )

  return withCode
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-default">$1</strong>',
    )
    .replace(/\*(.+?)\*/g, '<em class="text-secondary">$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="bg-subtle px-1.5 py-0.5 rounded text-[11px] font-mono text-default">$1</code>',
    )
    .replace(
      /^- (.+)$/gm,
      '<span class="block ml-4 text-sm leading-relaxed text-secondary">• $1</span>',
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<span class="block ml-4 text-sm leading-relaxed text-secondary">$1. $2</span>',
    )
    .replace(/^---$/gm, '<hr class="my-2 border-boundary" />')
    .replace(/\n\n/g, '</p><p class="text-sm leading-relaxed text-secondary">')
    .replace(/\n/g, '<br />')
}

// ─── Provider label ───────────────────────────────────────────────

function providerLabel(config: AiProviderConfig): string {
  switch (config.provider) {
    case 'ollama': return 'Ollama'
    case 'groq': return 'Groq'
    case 'anthropic': return 'Claude'
    case 'openai': return 'OpenAI'
  }
}

// ─── Quick suggestions ────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Panorama general', cmd: 'Dashboard ejecutivo con los indicadores principales' },
  { label: 'Vulnerabilidades críticas', cmd: 'Vulnerabilidades críticas abiertas' },
  { label: 'OKRs en riesgo', cmd: 'Objetivos en riesgo o atrasados' },
  { label: 'Tecnologías por vencer', cmd: 'Tecnologías con soporte vencido o por vencer' },
  { label: 'Bloqueos activos', cmd: 'Bloqueos activos en la plataforma' },
]

// ─── Sub-components ───────────────────────────────────────────────

function msgTime(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return time
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `ayer, ${time}`
  const dateStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${dateStr}, ${time}`
}

function MessageBanner({ msg, index }: { msg: AiChatMessage; index: number }) {
  const isUser = msg.role === 'user'
  const isTool = msg.role === 'tool'
  const ts = msgTime(msg.timestamp)

  if (isTool) {
    return (
      <div
        className="flex items-center gap-2 py-1 px-1"
        style={{ animation: `msgIn 300ms cubic-bezier(0.16,1,0.3,1) ${index * 20}ms both` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-40 dark:bg-neutral-50 shrink-0" />
        <span className="text-[10px] text-muted font-mono italic tracking-wide">
          {msg.toolName ?? 'tool'} · {msg.content.slice(0, 60).replace(/\n/g, ' ')}
          {msg.content.length > 60 ? '…' : ''}
        </span>
        <span className="text-[9px] text-muted/40 font-mono ml-auto">{ts}</span>
      </div>
    )
  }

  return (
    <div
      className="group"
      style={{ animation: `msgIn 350ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both` }}
    >
      {isUser ? (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-neutral-10 dark:bg-neutral-75 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center shrink-0 mt-0.5">
            <User size={13} className="text-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm leading-relaxed text-default font-medium">
              {msg.content}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted/50 font-mono">{ts}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-neutral-10 dark:bg-neutral-75 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M12 3v18" /><path d="M3 12h18" /><path d="M5 7l14 10" /><path d="M5 17l14-10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative pl-4">
              <div className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-neutral-20 dark:bg-neutral-70 rounded-full" />
              <div
                className="text-sm leading-relaxed text-secondary [&_strong]:text-default [&_code]:text-default [&_hr]:border-boundary"
                dangerouslySetInnerHTML={{
                  __html: renderMd(msg.content),
                }}
              />
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.toolCalls.map((tc) => (
                    <span
                      key={tc.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-10 dark:bg-neutral-75 border border-boundary text-[10px] text-muted font-mono"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-40 dark:bg-neutral-50" />
                      <span>{tc.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 pl-4">
              <span className="text-[10px] text-muted/50 font-mono">{ts}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col min-h-full px-5 py-8 select-none">
      <div className="mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-primary/30 border border-primary/20 flex items-center justify-center mb-3">
          <Sparkles size={16} className="text-white" />
        </div>
        <h2 className="text-base font-semibold text-default tracking-tight mb-1">
          Hola, soy GobIA
        </h2>
        <p className="text-[13px] text-muted leading-relaxed max-w-md">
          Consultá la plataforma en lenguaje natural: aplicaciones, seguridad, equipos, estrategia y más.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
        <p className="text-[10px] font-medium text-muted uppercase tracking-widest mb-2.5">
          Probá preguntar
        </p>
        <div className="flex flex-col gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.cmd}
              onClick={() => onPick(s.cmd)}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] text-secondary hover:text-default bg-card/40 hover:bg-subtle border border-boundary/60 hover:border-boundary transition-all duration-150 active:scale-[0.98]"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted/50 text-center mt-6 pt-4 border-t border-boundary/50 font-mono">
        Escribí lo que necesites
      </p>
    </div>
  )
}

function LoadingDots() {
  return (
    <div className="flex items-start gap-3 px-4 py-2" style={{ animation: 'msgIn 300ms cubic-bezier(0.16,1,0.3,1) both' }}>
      <div className="w-7 h-7 rounded-full bg-neutral-10 dark:bg-neutral-75 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M12 3v18" /><path d="M3 12h18" /><path d="M5 7l14 10" /><path d="M5 17l14-10" />
        </svg>
      </div>
      <div className="flex items-center gap-2 py-1.5">
        <span className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '250ms' }} />
        <span className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]" style={{ animationDelay: '500ms' }} />
      </div>
    </div>
  )
}

// ─── Conversation list (dropdown panel) ───────────────────────────

function convTitle(conv: AiConversation, reverseIdx: number): string {
  const t = conv.title
  if (t && t !== 'Nueva conversación') return t
  const count = conv.messageCount ?? 0
  if (count > 0) return `Conversación #${reverseIdx}`
  const d = conv.updatedAt ? new Date(conv.updatedAt) : null
  if (d) return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return 'Conversación'
}

function convSubtitle(conv: AiConversation): string {
  const t = conv.title
  const count = conv.messageCount ?? 0
  const time = formatRelativeTime(conv.updatedAt)
  if (!t || t === 'Nueva conversación') {
    if (count > 0) return `${count} mensajes · ${time}`
    return `Sin mensajes · ${time}`
  }
  return time
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: AiConversation[]
  activeId: string | undefined
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={listRef}
      className="absolute top-full left-3 right-3 z-50 mt-1 rounded-xl border border-boundary shadow-2xl overflow-hidden"
      style={{
        background: 'var(--color-card)',
        animation: 'slideDown 150ms ease-out both',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-boundary">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-widest">
          Conversaciones
        </span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-secondary hover:text-default bg-card hover:bg-subtle border border-boundary transition-all"
        >
          <Plus size={12} />
          Nueva
        </button>
      </div>
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <p className="text-[12px] text-muted text-center py-6 font-mono">
            Sin conversaciones anteriores
          </p>
        ) : (
          conversations.map((conv, i) => {
            const isActive = conv.id === activeId
            const reverseIdx = conversations.length - i
            return (
              <div
                key={conv.id}
                className={`group/item flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b border-boundary/50 last:border-b-0 ${
                  isActive ? 'bg-subtle/60' : 'hover:bg-card/80'
                }`}
                onClick={() => { onSelect(conv.id); onClose() }}
              >
                <MessageSquare size={13} className="shrink-0 text-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-default text-[13px] truncate" style={{ fontWeight: isActive ? 600 : 400 }}>
                    {convTitle(conv, reverseIdx)}
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    {convSubtitle(conv)}
                  </p>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                    className="p-1 rounded-md text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover/item:opacity-100 transition-all"
                    title="Eliminar conversación"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Main component ───────────────────────────────────────────────

interface AiChatPanelProps {
  config: AiProviderConfig
  onClose?: () => void
  isOpen: boolean
}

export function AiChatPanel({ config, onClose, isOpen }: AiChatPanelProps) {
  const navigate = useNavigate()
  const {
    messages, sendMessage, isLoading, error,
    conversations, activeConversation,
    switchConversation, newConversation, deleteConv,
  } = useAiChat({ config })
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [animClass, setAnimClass] = useState('')
  const [showConvList, setShowConvList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { copiedId, copy } = useCopy()

  // Mount / unmount animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => setAnimClass('slide-in'))
    } else if (mounted) {
      setAnimClass('slide-out')
      const timer = setTimeout(() => { setMounted(false); setAnimClass(''); setShowConvList(false) }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mounted])

  // Auto-focus
  useEffect(() => {
    if (animClass === 'slide-in') inputRef.current?.focus()
  }, [animClass])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    setShowConvList(false)
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewConversation = async () => {
    setShowConvList(false)
    await newConversation()
  }

  const handleSwitchConversation = async (id: string) => {
    await switchConversation(id)
  }

  const handleDeleteConversation = async (id: string) => {
    await deleteConv(id)
  }

  if (!mounted) return null

  const panelAnim = animClass === 'slide-in'
    ? 'animate-[slideInRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
    : animClass === 'slide-out'
    ? 'animate-[slideOutRight_250ms_cubic-bezier(0.16,1,0.3,1)_both]'
    : ''

  return (
    <>
      <style>{KF}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-canvas/40"
        style={{ animation: `fadeIn 200ms ease-out both` }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[90vw] sm:w-1/2 max-w-[800px] z-50 flex flex-col border-l border-boundary ${panelAnim}`}
        style={{
          background: 'var(--color-card)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          boxShadow: '-8px 0 40px -12px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center gap-2 px-4 py-3 border-b border-boundary shrink-0">
          <div className="w-7 h-7 rounded-lg bg-subtle border border-boundary flex items-center justify-center shrink-0">
            <Sparkles size={13} className="text-secondary" />
          </div>

          {/* Conversation title + switcher */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setShowConvList((v) => !v)}
              className="flex items-center gap-1.5 w-full hover:bg-subtle rounded-lg px-1.5 py-1 -ml-1.5 transition-colors"
            >
              <span className="text-sm font-semibold text-default tracking-tight truncate">
                {activeConversation?.title ?? 'Copilot TGP'}
              </span>
              <ChevronDown size={12} className="text-muted shrink-0 mt-px" />
            </button>
            <span className="text-[10px] text-muted font-mono block px-1.5">
              {providerLabel(config)} · {config.model}
              {activeConversation && messages.length > 0 && (
                <> · {messages.filter(m => m.role !== 'system').length} mensajes</>
              )}
            </span>
          </div>

          {/* Conversation list dropdown */}
          {showConvList && (
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?.id}
              onSelect={handleSwitchConversation}
              onNew={handleNewConversation}
              onDelete={handleDeleteConversation}
              onClose={() => setShowConvList(false)}
            />
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              title="Nueva conversación"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => navigate('/ai/settings')}
              className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              title="Configuración"
            >
              <Settings size={14} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-default hover:bg-subtle transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-neutral-80 scrollbar-track-transparent">
          {messages.length === 0 && !isLoading ? (
            <EmptyState onPick={(text) => { setInput(text); inputRef.current?.focus() }} />
          ) : (
            <div className="px-4 space-y-3">
              {messages
                .filter((m) => m.role !== 'system')
                .map((msg, i) => (
                  <div key={msg.id} className="relative group/message">
                    <MessageBanner msg={msg} index={i} />
                    {/* Copy button */}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => copy(msg.content, msg.id)}
                        className="absolute -right-1 -top-1 p-1.5 rounded-lg text-muted hover:text-default bg-card/80 hover:bg-subtle opacity-0 group-hover/message:opacity-100 transition-all duration-150"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? <Check size={14} /> : <Clipboard size={14} />}
                      </button>
                    )}
                  </div>
                ))}
              {isLoading && <LoadingDots />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div className="px-3 py-3 border-t border-boundary shrink-0">
          {error && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-danger/10 text-[11px] text-danger leading-relaxed border border-danger/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-canvas rounded-xl border border-boundary has-[:focus]:border-primary has-[:focus]:ring-1 has-[:focus]:ring-primary/30 transition-all duration-200 px-3 py-2">
            <span className="text-muted font-mono text-sm select-none shrink-0">
              ❯
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá algo a la plataforma..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm font-mono text-default placeholder-muted focus:outline-none disabled:opacity-40 py-0.5"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-1 rounded-lg text-muted hover:text-default hover:bg-subtle transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              title="Enviar (Enter)"
            >
              {isLoading ? (
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <CornerDownLeft size={15} />
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[9px] text-muted mt-1.5 text-center font-mono">
            Enter para enviar · Alt+A para abrir/cerrar
          </p>
        </div>
      </div>
    </>
  )
}
