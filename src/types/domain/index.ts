import type { Criticality, ArchitectureType, ApplicationStatus, TechCategory, SupportStatus, DependencyType, Severity, VulnSource, VulnStatus, IncidentStatus, RiskCategory, RiskStatus, AuditCategory, AuditStatus, PlanStatus, SourceSystem, ObjectiveType, ObjectiveStatus, KrStatus, TrendDirection, DeliverableStatus, UserRole, TaskStatus, CommitmentStatus, BlockerSeverity, BlockerStatus, DependencyRelation, ProjectStatus, ProjectHealth } from '@/constants/enums'

export type {
  Criticality,
  ArchitectureType,
  ApplicationStatus,
  TechCategory,
  SupportStatus,
  DependencyType,
  Severity,
  VulnSource,
  VulnStatus,
  IncidentStatus,
  RiskCategory,
  RiskStatus,
  AuditCategory,
  AuditStatus,
  PlanStatus,
  SourceSystem,
  ObjectiveType,
  ObjectiveStatus,
  KrStatus,
  TrendDirection,
  DeliverableStatus,
  UserRole,
}

export interface Tenant {
  id: string
  name: string
  slug: string
  settings: TenantSettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TenantSettings {
  defaultWeights: HealthWeights
  slas: VulnerabilitySLAConfig
  branding: BrandingConfig
}

export interface HealthWeights {
  delivery: number
  quality: number
  security: number
  availability: number
  obsolescence: number
  risk: number
  compliance: number
}

export interface VulnerabilitySLAConfig {
  critical: number
  high: number
  medium: number
  low: number
}

export interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

export interface BusinessUnit {
  id: string
  tenantId: string
  name: string
  createdAt: Date
}

export interface Application {
  id: string
  businessUnitId: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  criticality: Criticality
  architecture: ArchitectureType
  status: ApplicationStatus
  supportEndDate: Date | null
  technologies: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Technology {
  id: string
  name: string
  version: string
  category: TechCategory
  vendor: string
  eolDate: Date | null
  supportStatus: SupportStatus
  cveList: string[]
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface ApplicationDependency {
  id: string
  applicationId: string
  dependsOnAppId: string
  dependencyType: DependencyType
  criticality: Criticality
  description: string
  createdAt: Date
}

export interface Vulnerability {
  id: string
  applicationId: string | null
  externalId: string
  title: string
  description: string
  cvssScore: number
  severity: Severity
  source: VulnSource
  status: VulnStatus
  slaDeadline: Date
  detectedAt: Date
  fixedAt: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Incident {
  id: string
  applicationId: string | null
  externalId: string
  title: string
  description: string
  severity: Severity
  status: IncidentStatus
  detectedAt: Date
  respondedAt: Date | null
  resolvedAt: Date | null
  downtimeMinutes: number | null
  rca: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Risk {
  id: string
  applicationId: string | null
  businessUnitId: string
  title: string
  description: string
  category: RiskCategory
  probability: number
  impact: number
  riskScore: number
  mitigationPlan: string | null
  status: RiskStatus
  targetDate: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface AuditFinding {
  id: string
  applicationId: string | null
  auditReference: string
  title: string
  description: string
  severity: Severity
  category: AuditCategory
  status: AuditStatus
  dueDate: Date
  evidence: EvidenceAttachment[]
  actionPlan: ActionPlan | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface EvidenceAttachment {
  id: string
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedAt: Date
}

export interface ActionPlan {
  id: string
  findingId: string
  description: string
  ownerId: string
  status: PlanStatus
  dueDate: Date
  createdAt: Date
  items: ActionItem[]
}

export interface ActionItem {
  id: string
  actionPlanId: string
  description: string
  isCompleted: boolean
  completedAt: Date | null
  completedBy: string | null
}

export interface Team {
  id: string
  businessUnitId: string
  name: string
  sourceSystem: SourceSystem
  externalId: string
  members: TeamMember[]
  currentMetrics: TeamMetrics | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  userPrincipal: string
  displayName: string
  role: string
  allocationPct: number
  isActive: boolean
}

export interface TeamMetrics {
  velocity: number
  leadTimeHours: number
  cycleTimeHours: number
  throughput: number
  deploymentFrequency: number
  changeFailureRate: number
  mttrHours: number
  measuredAt: Date
}

export interface Objective {
  id: string
  teamId: string | null
  businessUnitId: string | null
  title: string
  description: string
  type: ObjectiveType
  periodStart: Date
  periodEnd: Date
  progress: number
  status: ObjectiveStatus
  keyResults: KeyResult[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface KeyResult {
  id: string
  title: string
  measure: string
  baseline: number
  target: number
  current: number
  status: KrStatus
}

export interface HealthIndex {
  id: string
  businessUnitId: string
  tenantId: string
  deliveryScore: number
  qualityScore: number
  securityScore: number
  availabilityScore: number
  obsolescenceScore: number
  riskScore: number
  complianceScore: number
  overallScore: number
  weights: HealthWeights
  calculatedAt: Date
  trend: TrendDirection
}

export interface Microservice {
  id: string
  applicationId: string
  name: string
  description: string
  technologies: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Deliverable {
  id: string
  applicationId: string | null
  title: string
  description: string
  dueDate: Date | null
  status: DeliverableStatus
  objectiveId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  businessUnitIds: string[]
  isActive: boolean
  createdAt: Date
}

/* ─── Ejecución ─── */

export interface Plan {
  id: string
  title: string
  description: string
  teamId: string | null
  businessUnitId: string | null
  objectiveId: string | null
  status: ProjectStatus
  health: ProjectHealth
  startDate: Date
  endDate: Date
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  planId: string
  parentActivityId: string | null
  title: string
  description: string
  assigneeId: string | null
  teamId: string | null
  applicationId: string | null
  priority: Criticality
  status: DeliverableStatus
  estimatedHours: number | null
  actualHours: number | null
  plannedPoints: number | null
  completedPoints: number | null
  startDate: Date | null
  dueDate: Date | null
  completedAt: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  activityId: string | null
  planId: string | null
  title: string
  description: string
  assigneeId: string | null
  status: TaskStatus
  priority: Criticality
  estimatedHours: number | null
  dueDate: Date | null
  completedAt: Date | null
  dependsOn: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Commitment {
  id: string
  title: string
  description: string
  ownerId: string
  accountableId: string
  teamId: string | null
  applicationId: string | null
  objectiveId: string | null
  deliverableId: string | null
  status: CommitmentStatus
  commitmentDate: Date
  fulfilledAt: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Dependency {
  id: string
  sourceType: 'task' | 'activity' | 'plan' | 'commitment'
  sourceId: string
  targetType: 'task' | 'activity' | 'plan' | 'commitment' | 'deliverable'
  targetId: string
  relationType: DependencyRelation
  description: string
  status: 'active' | 'resolved' | 'at_risk'
  expectedResolutionDate: Date | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Blocker {
  id: string
  sourceType: 'task' | 'activity' | 'plan' | 'commitment'
  sourceId: string
  title: string
  description: string
  severity: BlockerSeverity
  status: BlockerStatus
  raisedById: string
  assigneeId: string | null
  escalatedAt: Date | null
  resolvedAt: Date | null
  resolutionNotes: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
