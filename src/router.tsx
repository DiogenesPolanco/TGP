import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ApplicationsPage } from '@/features/catalog/pages/ApplicationsPage'
import { ApplicationDetailPage } from '@/features/catalog/pages/ApplicationDetailPage'
import { ApplicationFormPage } from '@/features/catalog/pages/ApplicationFormPage'
import { VulnerabilitiesPage } from '@/features/security/pages/VulnerabilitiesPage'
import { VulnerabilityFormPage } from '@/features/security/pages/VulnerabilityFormPage'
import { IncidentsPage } from '@/features/security/pages/IncidentsPage'
import { IncidentFormPage } from '@/features/security/pages/IncidentFormPage'
import { RisksPage } from '@/features/governance/pages/RisksPage'
import { RiskFormPage } from '@/features/governance/pages/RiskFormPage'
import { AuditPage } from '@/features/governance/pages/AuditPage'
import { AuditFormPage } from '@/features/governance/pages/AuditFormPage'
import { TeamsPage } from '@/features/teams/pages/TeamsPage'
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage'
import { TeamFormPage } from '@/features/teams/pages/TeamFormPage'
import { MembersPage } from '@/features/teams/pages/MembersPage'
import { ObjectivesPage } from '@/features/strategy/pages/ObjectivesPage'
import { ObjectiveFormPage } from '@/features/strategy/pages/ObjectiveFormPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { ImportPage } from '@/features/admin/pages/ImportPage'
import { BusinessUnitsPage } from '@/features/admin/pages/BusinessUnitsPage'
import { ObsolescencePage } from '@/features/obsolescence/pages/ObsolescencePage'
import { TechnologyFormPage } from '@/features/obsolescence/pages/TechnologyFormPage'
import { DeliverablesPage } from '@/features/delivery/pages/DeliverablesPage'
import { DailyPage } from '@/features/execution/pages/DailyPage'
import { PlansPage } from '@/features/execution/pages/PlansPage'
import { PlanFormPage } from '@/features/execution/pages/PlanFormPage'
import { PlanDetailPage } from '@/features/execution/pages/PlanDetailPage'
import { CommitmentsPage } from '@/features/execution/pages/CommitmentsPage'
import { CommitmentFormPage } from '@/features/execution/pages/CommitmentFormPage'
import { PredictabilityPage } from '@/features/execution/pages/PredictabilityPage'
import { PerformancePage } from '@/features/performance/pages/PerformancePage'
import { MemberPerformancePage } from '@/features/performance/pages/MemberPerformancePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'catalog/applications', element: <ApplicationsPage /> },
      { path: 'catalog/applications/new', element: <ApplicationFormPage /> },
      { path: 'catalog/applications/:id/edit', element: <ApplicationFormPage /> },
      { path: 'catalog/applications/:id', element: <ApplicationDetailPage /> },
      { path: 'catalog/obsolescence', element: <ObsolescencePage /> },
      { path: 'catalog/obsolescence/new', element: <TechnologyFormPage /> },
      { path: 'catalog/obsolescence/:id/edit', element: <TechnologyFormPage /> },
      { path: 'catalog/deliverables', element: <DeliverablesPage /> },
      { path: 'security/vulnerabilities', element: <VulnerabilitiesPage /> },
      { path: 'security/vulnerabilities/new', element: <VulnerabilityFormPage /> },
      { path: 'security/vulnerabilities/:id/edit', element: <VulnerabilityFormPage /> },
      { path: 'security/incidents', element: <IncidentsPage /> },
      { path: 'security/incidents/new', element: <IncidentFormPage /> },
      { path: 'security/incidents/:id/edit', element: <IncidentFormPage /> },
      { path: 'governance/risks', element: <RisksPage /> },
      { path: 'governance/risks/new', element: <RiskFormPage /> },
      { path: 'governance/risks/:id/edit', element: <RiskFormPage /> },
      { path: 'governance/audit', element: <AuditPage /> },
      { path: 'governance/audit/new', element: <AuditFormPage /> },
      { path: 'governance/audit/:id/edit', element: <AuditFormPage /> },
      { path: 'teams/members', element: <MembersPage /> },
      { path: 'teams/new', element: <TeamFormPage /> },
      { path: 'teams/:id/edit', element: <TeamFormPage /> },
      { path: 'teams/:id/performance', element: <PerformancePage /> },
      { path: 'teams/:id/performance/:memberId', element: <MemberPerformancePage /> },
      { path: 'teams/:id', element: <TeamDetailPage /> },
      { path: 'teams', element: <TeamsPage /> },
      { path: 'strategy/objectives', element: <ObjectivesPage /> },
      { path: 'strategy/objectives/new', element: <ObjectiveFormPage /> },
      { path: 'strategy/objectives/:id/edit', element: <ObjectiveFormPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'admin/import', element: <ImportPage /> },
      { path: 'admin/business-units', element: <BusinessUnitsPage /> },
      { path: 'execution/daily', element: <DailyPage /> },
      { path: 'execution/plans', element: <PlansPage /> },
      { path: 'execution/plans/new', element: <PlanFormPage /> },
      { path: 'execution/plans/:id/edit', element: <PlanFormPage /> },
      { path: 'execution/plans/:id', element: <PlanDetailPage /> },
      { path: 'execution/commitments', element: <CommitmentsPage /> },
      { path: 'execution/commitments/new', element: <CommitmentFormPage /> },
      { path: 'execution/commitments/:id/edit', element: <CommitmentFormPage /> },
      { path: 'execution/predictability', element: <PredictabilityPage /> },
    ],
  },
])
