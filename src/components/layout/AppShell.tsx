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

export function AppShell() {
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar } = useAppStore()
  const isTabHidden = usePrivacyBlur()
  const { checking: checkingOnboarding, isFirstTime } = useFirstTimeuser()
  const [wizardDone, setWizardDone] = useState(false)
  const showWizard = !checkingOnboarding && isFirstTime && !wizardDone
  useDemoData()
  useTheme()

  const onboardingComplete = isOnboardingDone() || wizardDone

  useEffect(() => {
    if (onboardingComplete) {
      startAutomatedChecks()
    }
  }, [onboardingComplete])

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
      <NotificationToast />
      <ConfirmDialog />
      {showWizard && <OnboardingWizard onClose={() => setWizardDone(true)} />}
    </div>
  )
}
