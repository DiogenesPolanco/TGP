import type { AiProviderConfig, AiConversation } from '../types'

// ─── Keyframes ────────────────────────────────────────────────────

export const KF = `
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes loadPulse { 0%,100% { opacity: .25; transform: scale(1); } 50% { opacity: .75; transform: scale(1.15); } }
`

// ─── Provider label ───────────────────────────────────────────────

export function providerLabel(config: AiProviderConfig): string {
  switch (config.provider) {
    case 'ollama':
      return 'Ollama'
    case 'groq':
      return 'Groq'
    case 'anthropic':
      return 'Claude'
    case 'openai':
      return 'OpenAI'
  }
}

// ─── Quick suggestions ────────────────────────────────────────────

export const SUGGESTIONS = [
  { label: 'Panorama general', cmd: 'Dashboard ejecutivo con los indicadores principales' },
  { label: 'Vulnerabilidades críticas', cmd: 'Vulnerabilidades críticas abiertas' },
  { label: 'OKRs en riesgo', cmd: 'Objetivos en riesgo o atrasados' },
  { label: 'Tecnologías por vencer', cmd: 'Tecnologías con soporte vencido o por vencer' },
  { label: 'Bloqueos activos', cmd: 'Bloqueos activos en la plataforma' },
]

// ─── Time helpers ─────────────────────────────────────────────────

export function msgTime(date: Date): string {
  const d = new Date(date)
  const now = new Date()
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return time
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `ayer, ${time}`
  const dateStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  return `${dateStr}, ${time}`
}

export function formatRelativeTime(date: Date): string {
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

// ─── Conversation helpers ─────────────────────────────────────────

export function convTitle(conv: AiConversation, reverseIdx: number): string {
  const t = conv.title
  if (t && t !== 'Nueva conversación') return t
  const count = conv.messageCount ?? 0
  if (count > 0) return `Conversación #${reverseIdx}`
  const d = conv.updatedAt ? new Date(conv.updatedAt) : null
  if (d)
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  return 'Conversación'
}

export function convSubtitle(conv: AiConversation): string {
  const t = conv.title
  const count = conv.messageCount ?? 0
  const time = formatRelativeTime(conv.updatedAt)
  if (!t || t === 'Nueva conversación') {
    if (count > 0) return `${count} mensajes · ${time}`
    return `Sin mensajes · ${time}`
  }
  return time
}

// ─── Types ────────────────────────────────────────────────────────

export interface AiChatPanelProps {
  config: AiProviderConfig
  onClose?: () => void
  isOpen: boolean
}
