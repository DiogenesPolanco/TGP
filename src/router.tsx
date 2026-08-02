import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import LandingPage from '@/features/landing/LandingPage'
import { isTermsAccepted } from '@/features/auth/pages/TermsPage'
import { isConfigured, getSession } from '@/services/auth/authService'
import NotFoundPage from '@/features/landing/NotFoundPage'
import { RouteErrorPage } from '@/components/error/RouteErrorPage'
import { PublicDashboardPage } from '@/features/share/PublicDashboardPage'
import { PublicPerformancePage } from '@/features/share/PublicPerformancePage'
import { PublicMemberPage } from '@/features/share/PublicMemberPage'
import { PublicMembersOverviewPage } from '@/features/share/PublicMembersOverviewPage'
import { PublicRecruitmentPage } from '@/features/share/PublicRecruitmentPage'
import { PublicDailyPage } from '@/features/share/PublicDailyPage'
import { PublicPlanPage } from '@/features/share/PublicPlanPage'
import { PublicTimelinePage } from '@/features/share/PublicTimelinePage'
import { PublicPredictabilityPage } from '@/features/share/PublicPredictabilityPage'
import { PublicVulnerabilitiesPage } from '@/features/share/PublicVulnerabilitiesPage'
import { PublicIncidentsPage } from '@/features/share/PublicIncidentsPage'
import { PublicRisksPage } from '@/features/share/PublicRisksPage'
import { PublicAuditPage } from '@/features/share/PublicAuditPage'
import { PublicObjectivesPage } from '@/features/share/PublicObjectivesPage'
import { PublicObsolescenceMapPage } from '@/features/share/PublicObsolescenceMapPage'
import { PublicDependencyMapPage } from '@/features/share/PublicDependencyMapPage'
import { PublicEquipmentPage } from '@/features/equipment/pages/PublicEquipmentPage'
import { TermsPage } from '@/features/share/TermsPage'
import { appShellRoutes } from './router/appShellRoutes'

function RootRoute() {
  // Redirect straight into the app when the OTP is configured OR an active
  // session exists (user already accepted terms to get a session). Sessions
  // survive browser restarts; getSession() also clears expired ones.
  const ready = (isTermsAccepted() && isConfigured()) || getSession() !== null
  return ready ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export const router = createBrowserRouter([
  { path: '/public/:hash', element: <PublicDashboardPage /> },
  { path: '/public/performance/:hash', element: <PublicPerformancePage /> },
  { path: '/public/member/:hash', element: <PublicMemberPage /> },
  { path: '/public/members/:hash', element: <PublicMembersOverviewPage /> },
  { path: '/public/recruitment/:hash', element: <PublicRecruitmentPage /> },
  { path: '/public/daily/:hash', element: <PublicDailyPage /> },
  { path: '/public/plan/:hash', element: <PublicPlanPage /> },
  { path: '/public/timeline/:hash', element: <PublicTimelinePage /> },
  { path: '/public/predictability/:hash', element: <PublicPredictabilityPage /> },
  { path: '/public/vulnerabilities/:hash', element: <PublicVulnerabilitiesPage /> },
  { path: '/public/incidents/:hash', element: <PublicIncidentsPage /> },
  { path: '/public/risks/:hash', element: <PublicRisksPage /> },
  { path: '/public/audit/:hash', element: <PublicAuditPage /> },
  { path: '/public/objectives/:hash', element: <PublicObjectivesPage /> },
  { path: '/public/obsolescence/:hash', element: <PublicObsolescenceMapPage /> },
  { path: '/public/dependencies/:hash', element: <PublicDependencyMapPage /> },
  { path: '/public/equipment/:hash', element: <PublicEquipmentPage /> },
  { path: '/terms', element: <TermsPage /> },
  {
    path: '/mobile/dashboard',
    lazy: () =>
      import('@/features/mobile/dashboard/MobileDashboardPage').then((m) => ({
        Component: m.MobileDashboardPage,
      })),
  },
  { index: true, element: <RootRoute /> },
  {
    path: '/docs',
    lazy: () => import('@/features/docs/pages/DocsPage').then((m) => ({ Component: m.default })),
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: appShellRoutes,
  },
  { path: '*', element: <NotFoundPage /> },
])
