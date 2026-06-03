import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ApplicationsPage } from '@/features/catalog/pages/ApplicationsPage'
import { ApplicationDetailPage } from '@/features/catalog/pages/ApplicationDetailPage'
import { VulnerabilitiesPage } from '@/features/security/pages/VulnerabilitiesPage'
import { IncidentsPage } from '@/features/security/pages/IncidentsPage'
import { RisksPage } from '@/features/governance/pages/RisksPage'
import { AuditPage } from '@/features/governance/pages/AuditPage'
import { TeamsPage } from '@/features/teams/pages/TeamsPage'
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage'
import { ObjectivesPage } from '@/features/strategy/pages/ObjectivesPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { ImportPage } from '@/features/admin/pages/ImportPage'
import { ObsolescencePage } from '@/features/obsolescence/pages/ObsolescencePage'
import { DeliverablesPage } from '@/features/delivery/pages/DeliverablesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'catalog/applications', element: <ApplicationsPage /> },
      { path: 'catalog/applications/:id', element: <ApplicationDetailPage /> },
      { path: 'catalog/obsolescence', element: <ObsolescencePage /> },
      { path: 'catalog/deliverables', element: <DeliverablesPage /> },
      { path: 'security/vulnerabilities', element: <VulnerabilitiesPage /> },
      { path: 'security/incidents', element: <IncidentsPage /> },
      { path: 'governance/risks', element: <RisksPage /> },
      { path: 'governance/audit', element: <AuditPage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'teams/:id', element: <TeamDetailPage /> },
      { path: 'strategy/objectives', element: <ObjectivesPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'admin/import', element: <ImportPage /> },
    ],
  },
])
