import { memo, useRef, useEffect } from 'react'
import { Plus, MessageSquare, Trash2, User, Sparkles } from 'lucide-react'
import type { AiChatMessage, AiConversation } from '../types'
import { Markdown } from '@/lib/markdown'
import { msgTime, SUGGESTIONS, convTitle, convSubtitle } from './aiChatHelpers'

// ─── MessageBanner ────────────────────────────────────────────────

export const MessageBanner = memo(function MessageBanner({
  msg,
  index,
}: {
  msg: AiChatMessage
  index: number
}) {
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
            <div className="text-sm leading-relaxed text-default font-medium">{msg.content}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted/50 font-mono">{ts}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-neutral-10 dark:bg-neutral-75 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted"
            >
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <path d="M5 7l14 10" />
              <path d="M5 17l14-10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative pl-4">
              <div className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-neutral-20 dark:bg-neutral-70 rounded-full" />
              <Markdown text={msg.content} />
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
})

// ─── EmptyState ───────────────────────────────────────────────────

export const EmptyState = memo(function EmptyState({ onPick }: { onPick: (text: string) => void }) {
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
          Consultá la plataforma en lenguaje natural: aplicaciones, seguridad, equipos, estrategia y
          más.
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

      <p className="text-[10px] text-muted/50 text-center mt-6 pt-4 border-t border-boundary/50 font-mono">
        Escribí lo que necesites
      </p>
    </div>
  )
})

// ─── LoadingDots ──────────────────────────────────────────────────

export const LoadingDots = memo(function LoadingDots() {
  return (
    <div
      className="flex items-start gap-3 px-4 py-2"
      style={{ animation: 'msgIn 300ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="w-7 h-7 rounded-full bg-neutral-10 dark:bg-neutral-75 border border-neutral-20 dark:border-neutral-70 flex items-center justify-center shrink-0">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
        >
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <path d="M5 7l14 10" />
          <path d="M5 17l14-10" />
        </svg>
      </div>
      <div className="flex items-center gap-2 py-1.5">
        <span
          className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '250ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-neutral-40 dark:bg-neutral-50 animate-[loadPulse_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: '500ms' }}
        />
      </div>
    </div>
  )
})

// ─── ConversationList ─────────────────────────────────────────────

export const ConversationList = memo(function ConversationList({
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
                onClick={() => {
                  onSelect(conv.id)
                  onClose()
                }}
              >
                <MessageSquare size={13} className="shrink-0 text-muted" />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-default text-[13px] truncate"
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    {convTitle(conv, reverseIdx)}
                  </p>
                  <p className="text-[10px] text-muted font-mono">{convSubtitle(conv)}</p>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conv.id)
                    }}
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
})
