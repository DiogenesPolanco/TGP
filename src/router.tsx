import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
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
import { MobileDashboardPage } from '@/features/mobile/dashboard/MobileDashboardPage'
import ReportsPage from '@/features/reports/pages/ReportsPage'

export const router = createBrowserRouter([
  {
    path: '/public/:hash',
    element: <PublicDashboardPage />,
  },
  {
    path: '/public/performance/:hash',
    element: <PublicPerformancePage />,
  },
  {
    path: '/public/member/:hash',
    element: <PublicMemberPage />,
  },
  {
    path: '/public/members/:hash',
    element: <PublicMembersOverviewPage />,
  },
  {
    path: '/public/recruitment/:hash',
    element: <PublicRecruitmentPage />,
  },
  {
    path: '/public/daily/:hash',
    element: <PublicDailyPage />,
  },
  {
    path: '/public/plan/:hash',
    element: <PublicPlanPage />,
  },
  {
    path: '/public/timeline/:hash',
    element: <PublicTimelinePage />,
  },
  {
    path: '/public/predictability/:hash',
    element: <PublicPredictabilityPage />,
  },
  {
    path: '/public/vulnerabilities/:hash',
    element: <PublicVulnerabilitiesPage />,
  },
  {
    path: '/public/incidents/:hash',
    element: <PublicIncidentsPage />,
  },
  {
    path: '/public/risks/:hash',
    element: <PublicRisksPage />,
  },
  {
    path: '/public/audit/:hash',
    element: <PublicAuditPage />,
  },
  {
    path: '/public/objectives/:hash',
    element: <PublicObjectivesPage />,
  },
  {
    path: '/public/obsolescence/:hash',
    element: <PublicObsolescenceMapPage />,
  },
  {
    path: '/public/dependencies/:hash',
    element: <PublicDependencyMapPage />,
  },
  {
    path: '/public/equipment/:hash',
    element: <PublicEquipmentPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/mobile/dashboard',
    element: <MobileDashboardPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: 'dashboard', lazy: () => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })) },
      { path: 'ai/setup', lazy: () => import('@/features/ai/pages/AiSetupPage').then((m) => ({ Component: m.AiSetupPage })) },
      { path: 'ai/settings', lazy: () => import('@/features/ai/pages/AiSettingsPage').then((m) => ({ Component: m.AiSettingsPage })) },
      { path: 'calendar', lazy: () => import('@/features/calendar/CalendarPage').then((m) => ({ Component: m.CalendarPage })) },
      { path: 'compare', lazy: () => import('@/features/comparison/ComparePage').then((m) => ({ Component: m.ComparePage })) },
      { path: 'dependencies', lazy: () => import('@/features/dependencies/DependencyMapPage').then((m) => ({ Component: m.DependencyMapPage })) },
      { path: 'predictions', lazy: () => import('@/features/predictions/PredictionsPage').then((m) => ({ Component: m.PredictionsPage })) },
      { path: 'reports', element: <ReportsPage /> },

      // Catálogo
      { path: 'catalog/applications', lazy: () => import('@/features/catalog/pages/ApplicationsPage').then((m) => ({ Component: m.ApplicationsPage })) },
      { path: 'catalog/applications/new', lazy: () => import('@/features/catalog/pages/ApplicationFormPage').then((m) => ({ Component: m.ApplicationFormPage })) },
      { path: 'catalog/applications/:id/edit', lazy: () => import('@/features/catalog/pages/ApplicationFormPage').then((m) => ({ Component: m.ApplicationFormPage })) },
      { path: 'catalog/applications/:appId/databases/new', lazy: () => import('@/features/catalog/pages/DatabaseFormPage').then((m) => ({ Component: m.DatabaseFormPage })) },
      { path: 'catalog/applications/:appId/databases/:id/edit', lazy: () => import('@/features/catalog/pages/DatabaseFormPage').then((m) => ({ Component: m.DatabaseFormPage })) },
      { path: 'catalog/applications/:id', lazy: () => import('@/features/catalog/pages/ApplicationDetailPage').then((m) => ({ Component: m.ApplicationDetailPage })) },
      { path: 'catalog/microservices', lazy: () => import('@/features/catalog/pages/MicroservicesPage').then((m) => ({ Component: m.MicroservicesPage })) },
      { path: 'catalog/microservices/new', lazy: () => import('@/features/catalog/pages/MicroserviceDetailPage').then((m) => ({ Component: m.MicroserviceDetailPage })) },
      { path: 'catalog/microservices/:id', lazy: () => import('@/features/catalog/pages/MicroserviceDetailPage').then((m) => ({ Component: m.MicroserviceDetailPage })) },

      { path: 'catalog/obsolescence', lazy: () => import('@/features/obsolescence/pages/ObsolescencePage').then((m) => ({ Component: m.ObsolescencePage })) },
      { path: 'catalog/obsolescence/map', lazy: () => import('@/features/obsolescence/pages/ObsolescenceMapPage').then((m) => ({ Component: m.ObsolescenceMapPage })) },
      { path: 'catalog/obsolescence/new', lazy: () => import('@/features/obsolescence/pages/TechnologyFormPage').then((m) => ({ Component: m.TechnologyFormPage })) },
      { path: 'catalog/obsolescence/:id/edit', lazy: () => import('@/features/obsolescence/pages/TechnologyFormPage').then((m) => ({ Component: m.TechnologyFormPage })) },
      { path: 'catalog/obsolescence/:id', lazy: () => import('@/features/obsolescence/pages/TechnologyDetailPage').then((m) => ({ Component: m.TechnologyDetailPage })) },

      { path: 'catalog/deliverables', lazy: () => import('@/features/delivery/pages/DeliverablesPage').then((m) => ({ Component: m.DeliverablesPage })) },
      { path: 'catalog/deliverables/:id', lazy: () => import('@/features/delivery/pages/DeliverableDetailPage').then((m) => ({ Component: m.DeliverableDetailPage })) },

      // Seguridad
      { path: 'security/vulnerabilities', lazy: () => import('@/features/security/pages/VulnerabilitiesPage').then((m) => ({ Component: m.VulnerabilitiesPage })) },
      { path: 'security/vulnerabilities/new', lazy: () => import('@/features/security/pages/VulnerabilityFormPage').then((m) => ({ Component: m.VulnerabilityFormPage })) },
      { path: 'security/vulnerabilities/:id/edit', lazy: () => import('@/features/security/pages/VulnerabilityFormPage').then((m) => ({ Component: m.VulnerabilityFormPage })) },
      { path: 'security/vulnerabilities/:id', lazy: () => import('@/features/security/pages/VulnerabilityDetailPage').then((m) => ({ Component: m.VulnerabilityDetailPage })) },

      { path: 'security/incidents', lazy: () => import('@/features/security/pages/IncidentsPage').then((m) => ({ Component: m.IncidentsPage })) },
      { path: 'security/incidents/new', lazy: () => import('@/features/security/pages/IncidentFormPage').then((m) => ({ Component: m.IncidentFormPage })) },
      { path: 'security/incidents/:id/edit', lazy: () => import('@/features/security/pages/IncidentFormPage').then((m) => ({ Component: m.IncidentFormPage })) },
      { path: 'security/incidents/:id', lazy: () => import('@/features/security/pages/IncidentDetailPage').then((m) => ({ Component: m.IncidentDetailPage })) },

      // Gobierno
      { path: 'governance/risks', lazy: () => import('@/features/governance/pages/RisksPage').then((m) => ({ Component: m.RisksPage })) },
      { path: 'governance/risks/new', lazy: () => import('@/features/governance/pages/RiskFormPage').then((m) => ({ Component: m.RiskFormPage })) },
      { path: 'governance/risks/:id/edit', lazy: () => import('@/features/governance/pages/RiskFormPage').then((m) => ({ Component: m.RiskFormPage })) },
      { path: 'governance/risks/:id', lazy: () => import('@/features/governance/pages/RiskDetailPage').then((m) => ({ Component: m.RiskDetailPage })) },

      { path: 'governance/audit', lazy: () => import('@/features/governance/pages/AuditPage').then((m) => ({ Component: m.AuditPage })) },
      { path: 'governance/audit/new', lazy: () => import('@/features/governance/pages/AuditFormPage').then((m) => ({ Component: m.AuditFormPage })) },
      { path: 'governance/audit/:id/edit', lazy: () => import('@/features/governance/pages/AuditFormPage').then((m) => ({ Component: m.AuditFormPage })) },
      { path: 'governance/audit/:id', lazy: () => import('@/features/governance/pages/AuditDetailPage').then((m) => ({ Component: m.AuditDetailPage })) },

      // Equipos
      { path: 'teams', lazy: () => import('@/features/teams/pages/TeamsPage').then((m) => ({ Component: m.TeamsPage })) },
      { path: 'teams/new', lazy: () => import('@/features/teams/pages/TeamFormPage').then((m) => ({ Component: m.TeamFormPage })) },
      { path: 'teams/:id/edit', lazy: () => import('@/features/teams/pages/TeamFormPage').then((m) => ({ Component: m.TeamFormPage })) },
      { path: 'teams/:id', lazy: () => import('@/features/teams/pages/TeamDetailPage').then((m) => ({ Component: m.TeamDetailPage })) },
      { path: 'teams/members', lazy: () => import('@/features/teams/pages/MembersPage').then((m) => ({ Component: m.MembersPage })) },
      { path: 'teams/recruitment', lazy: () => import('@/features/recruitment/pages/RecruitmentPage').then((m) => ({ Component: m.RecruitmentPage })) },
      { path: 'teams/recruitment/new', lazy: () => import('@/features/recruitment/pages/CandidateFormPage').then((m) => ({ Component: m.CandidateFormPage })) },
      { path: 'teams/recruitment/:id/edit', lazy: () => import('@/features/recruitment/pages/CandidateFormPage').then((m) => ({ Component: m.CandidateFormPage })) },
      { path: 'teams/recruitment/:id', lazy: () => import('@/features/recruitment/pages/CandidateDetailPage').then((m) => ({ Component: m.CandidateDetailPage })) },
      { path: 'teams/:id/performance', lazy: () => import('@/features/performance/pages/PerformancePage').then((m) => ({ Component: m.PerformancePage })) },
      { path: 'teams/:id/performance/:memberId', lazy: () => import('@/features/performance/pages/MemberPerformancePage').then((m) => ({ Component: m.MemberPerformancePage })) },

      // Equipamiento
      { path: 'equipment', lazy: () => import('@/features/equipment/pages/EquipmentListPage').then((m) => ({ Component: m.EquipmentListPage })) },
      { path: 'equipment/new', lazy: () => import('@/features/equipment/pages/EquipmentFormPage').then((m) => ({ Component: m.EquipmentFormPage })) },
      { path: 'equipment/:id/edit', lazy: () => import('@/features/equipment/pages/EquipmentFormPage').then((m) => ({ Component: m.EquipmentFormPage })) },
      { path: 'equipment/:id/tickets/new', lazy: () => import('@/features/equipment/pages/EquipmentTicketFormPage').then((m) => ({ Component: m.EquipmentTicketFormPage })) },
      { path: 'equipment/:id/tickets/:ticketId/edit', lazy: () => import('@/features/equipment/pages/EquipmentTicketFormPage').then((m) => ({ Component: m.EquipmentTicketFormPage })) },
      { path: 'equipment/:id', lazy: () => import('@/features/equipment/pages/EquipmentDetailPage').then((m) => ({ Component: m.EquipmentDetailPage })) },
      { path: 'equipment/reports', lazy: () => import('@/features/equipment/pages/EquipmentReportsPage').then((m) => ({ Component: m.EquipmentReportsPage })) },

      // Estrategia
      { path: 'strategy/objectives', lazy: () => import('@/features/strategy/pages/ObjectivesPage').then((m) => ({ Component: m.ObjectivesPage })) },
      { path: 'strategy/objectives/new', lazy: () => import('@/features/strategy/pages/ObjectiveFormPage').then((m) => ({ Component: m.ObjectiveFormPage })) },
      { path: 'strategy/objectives/:id/edit', lazy: () => import('@/features/strategy/pages/ObjectiveFormPage').then((m) => ({ Component: m.ObjectiveFormPage })) },
      { path: 'strategy/objectives/:id', lazy: () => import('@/features/strategy/pages/ObjectiveDetailPage').then((m) => ({ Component: m.ObjectiveDetailPage })) },

      // Administración
      { path: 'admin', lazy: () => import('@/features/admin/pages/AdminPage').then((m) => ({ Component: m.AdminPage })) },
      { path: 'admin/import', lazy: () => import('@/features/admin/pages/ImportPage').then((m) => ({ Component: m.ImportPage })) },
      { path: 'admin/business-units', lazy: () => import('@/features/admin/pages/BusinessUnitsPage').then((m) => ({ Component: m.BusinessUnitsPage })) },
      { path: 'admin/users', lazy: () => import('@/features/admin/pages/UsersPage').then((m) => ({ Component: m.UsersPage })) },
      { path: 'admin/users/new', lazy: () => import('@/features/admin/pages/UserFormPage').then((m) => ({ Component: m.UserFormPage })) },
      { path: 'admin/users/:id/edit', lazy: () => import('@/features/admin/pages/UserFormPage').then((m) => ({ Component: m.UserFormPage })) },

      // Ejecución
      { path: 'execution/daily', lazy: () => import('@/features/execution/pages/DailyPage').then((m) => ({ Component: m.DailyPage })) },
      { path: 'execution/timeline', lazy: () => import('@/features/execution/pages/ExecutiveTimelinePage').then((m) => ({ Component: m.ExecutiveTimelinePage })) },

      { path: 'execution/plans', lazy: () => import('@/features/execution/pages/PlansPage').then((m) => ({ Component: m.PlansPage })) },
      { path: 'execution/plans/new', lazy: () => import('@/features/execution/pages/PlanFormPage').then((m) => ({ Component: m.PlanFormPage })) },
      { path: 'execution/plans/:id/edit', lazy: () => import('@/features/execution/pages/PlanFormPage').then((m) => ({ Component: m.PlanFormPage })) },
      { path: 'execution/plans/:planId/activities/new', lazy: () => import('@/features/execution/pages/ActivityFormPage').then((m) => ({ Component: m.ActivityFormPage })) },
      { path: 'execution/plans/:planId/activities/:activityId/edit', lazy: () => import('@/features/execution/pages/ActivityFormPage').then((m) => ({ Component: m.ActivityFormPage })) },
      { path: 'execution/plans/:id', lazy: () => import('@/features/execution/pages/PlanDetailPage').then((m) => ({ Component: m.PlanDetailPage })) },

      { path: 'execution/commitments', lazy: () => import('@/features/execution/pages/CommitmentsPage').then((m) => ({ Component: m.CommitmentsPage })) },
      { path: 'execution/commitments/new', lazy: () => import('@/features/execution/pages/CommitmentFormPage').then((m) => ({ Component: m.CommitmentFormPage })) },
      { path: 'execution/commitments/:id/edit', lazy: () => import('@/features/execution/pages/CommitmentFormPage').then((m) => ({ Component: m.CommitmentFormPage })) },
      { path: 'execution/commitments/:id', lazy: () => import('@/features/execution/pages/CommitmentDetailPage').then((m) => ({ Component: m.CommitmentDetailPage })) },

      { path: 'execution/blockers', lazy: () => import('@/features/execution/pages/BlockersPage').then((m) => ({ Component: m.BlockersPage })) },
      { path: 'execution/blockers/new', lazy: () => import('@/features/execution/pages/BlockerFormPage').then((m) => ({ Component: m.BlockerFormPage })) },
      { path: 'execution/blockers/:id/edit', lazy: () => import('@/features/execution/pages/BlockerFormPage').then((m) => ({ Component: m.BlockerFormPage })) },

      { path: 'execution/tasks', lazy: () => import('@/features/execution/pages/TasksPage').then((m) => ({ Component: m.TasksPage })) },
      { path: 'execution/tasks/new', lazy: () => import('@/features/execution/pages/TaskFormPage').then((m) => ({ Component: m.TaskFormPage })) },
      { path: 'execution/tasks/:id/edit', lazy: () => import('@/features/execution/pages/TaskFormPage').then((m) => ({ Component: m.TaskFormPage })) },
      { path: 'execution/tasks/:id', lazy: () => import('@/features/execution/pages/TaskDetailPage').then((m) => ({ Component: m.TaskDetailPage })) },

      { path: 'execution/dependencies', lazy: () => import('@/features/execution/pages/DependenciesPage').then((m) => ({ Component: m.DependenciesPage })) },
      { path: 'execution/predictability', lazy: () => import('@/features/execution/pages/PredictabilityPage').then((m) => ({ Component: m.PredictabilityPage })) },
    ],
  },
])
