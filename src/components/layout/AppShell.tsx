import { useEffect, useCallback, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { PageTransition } from './PageTransition'
import { NotificationToast } from './NotificationToast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAppStore } from '@/stores/appStore'
import { useDemoData } from '@/hooks/useDemoData'
import { useTheme } from '@/hooks/useTheme'
import { usePrivacyBlur } from '@/hooks/usePrivacyBlur'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { UpdateAvailable } from '@/components/error/UpdateAvailable'
import { OnboardingWizard, useFirstTimeuser, isOnboardingDone } from '@/features/onboarding/OnboardingWizard'
import { cn } from '@/lib/utils'
import { startAutomatedChecks } from '@/services/jobs/automatedChecksService'
import { AiChatPanel } from '@/features/ai/components/AiChatPanel'
import { useAiConfigStore } from '@/features/ai/store/aiConfigStore'
import { useUserStore } from '@/stores/userStore'
export function AppShell() {
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const isTabHidden = usePrivacyBlur()
  const { checking: checkingOnboarding, isFirstTime } = useFirstTimeuser()
  const [wizardDone, setWizardDone] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const showWizard = !checkingOnboarding && isFirstTime && !wizardDone
  useDemoData()
  useTheme()

  const currentUser = useUserStore((s) => s.currentUser)
  const getConfig = useAiConfigStore((s) => s.getConfig)
  const aiConfig = currentUser ? getConfig(currentUser.id) : null
  const aiConfigured = aiConfig?.enabled && (aiConfig.provider === 'ollama' || !!aiConfig?.apiKey)

  const onboardingComplete = isOnboardingDone() || wizardDone

  useEffect(() => {
    if (onboardingComplete) {
      startAutomatedChecks()
    }
  }, [onboardingComplete])

  // Alt+A shortcut to toggle AI chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setChatOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const appShortcuts = useCallback(() => ({
    b: () => toggleSidebar(),
    n: () => {
      const path = window.location.pathname
      if (path.startsWith('/catalog/applications')) navigate('/catalog/applications/new')
      else if (path.startsWith('/catalog/obsolescence')) navigate('/catalog/obsolescence/new')
      else if (path.startsWith('/security/vulnerabilities')) navigate('/security/vulnerabilities/new')
      else if (path.startsWith('/security/incidents')) navigate('/security/incidents/new')
      else if (path.startsWith('/governance/risks')) navigate('/governance/risks/new')
      else if (path.startsWith('/governance/audit')) navigate('/governance/audit/new')
      else if (path.startsWith('/teams')) navigate('/teams/new')
      else if (path.startsWith('/strategy/objectives')) navigate('/strategy/objectives/new')
      else if (path.startsWith('/execution/plans')) navigate('/execution/plans/new')
      else if (path.startsWith('/execution/commitments')) navigate('/execution/commitments/new')
    },
  }), [navigate, toggleSidebar])

  useGlobalShortcuts(appShortcuts())

  const { stale, reload } = useVersionCheck()
  if (stale) return <UpdateAvailable onReload={reload} />

  return (
    <div className={cn('flex h-screen bg-canvas', isTabHidden && 'blur-xl transition-all duration-300')}>
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-16'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto p-4">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <footer className="shrink-0 border-t border-boundary px-6 py-2 flex items-center justify-between text-[11px] text-neutral-40">
          <span>TGP — Technology Governance Platform</span>
          <button
            onClick={() => navigate('/terms')}
            className="hover:text-primary transition-colors underline underline-offset-2"
          >
            Términos y condiciones
          </button>
        </footer>
      </div>

      {/* AI Copilot — toggle button */}
      {aiConfigured && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-neutral-90 border border-neutral-70 shadow-lg hover:shadow-xl hover:border-neutral-60 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          title="Abrir Copilot TGP (Alt+A)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-30">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </button>
      )}

      {aiConfigured && chatOpen && aiConfig && (
        <AiChatPanel config={aiConfig} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      )}

      <NotificationToast />
      <ConfirmDialog />
      {showWizard && <OnboardingWizard onClose={() => setWizardDone(true)} />}
    </div>
  )
}
