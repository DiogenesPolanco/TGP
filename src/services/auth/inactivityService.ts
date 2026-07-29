const DEFAULT_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
const WARNING_DURATION_MS = 60 * 1000

type InactivityHandler = (phase: 'warning' | 'expired') => void

let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let warningTimer: ReturnType<typeof setInterval> | null = null
let remainingRef = WARNING_DURATION_MS
let handler: InactivityHandler | null = null
let started = false
let currentTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS

const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

function clear() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
  if (warningTimer) {
    clearInterval(warningTimer)
    warningTimer = null
  }
}

function onUserActivity() {
  const h = handler
  if (!started || !h) return
  // If we were in warning phase and user is active, dismiss the warning
  if (warningTimer) {
    clear()
    h('warning')
  }
  resetMainTimer()
}

function resetMainTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    const h = handler
    if (!h) return
    remainingRef = WARNING_DURATION_MS
    h('warning')
    warningTimer = setInterval(() => {
      remainingRef -= 1000
      if (remainingRef <= 0) {
        clear()
        h('expired')
      }
    }, 1000)
  }, currentTimeoutMs)
}

export function startInactivityWatch(h: InactivityHandler, timeoutMs?: number) {
  if (started) return
  currentTimeoutMs = timeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS
  handler = h
  started = true
  for (const ev of EVENTS) {
    window.addEventListener(ev, onUserActivity, { passive: true })
  }
  resetMainTimer()
}

export function stopInactivityWatch() {
  started = false
  handler = null
  clear()
  for (const ev of EVENTS) {
    window.removeEventListener(ev, onUserActivity)
  }
}

export function getWarningRemainingMs(): number {
  return Math.max(0, remainingRef)
}

export function dismissInactivityWarning() {
  clear()
  resetMainTimer()
}

export { WARNING_DURATION_MS }
