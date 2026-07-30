import Dexie, { type Table } from 'dexie'
import type {
  Tenant,
  BusinessUnit,
  Application,
  Technology,
  ApplicationDependency,
  Vulnerability,
  Incident,
  Risk,
  AuditFinding,
  Team,
  Objective,
  HealthIndex,
  Deliverable,
  Microservice,
  AppDatabase,
  User,
  Plan,
  Activity,
  Task,
  Commitment,
  Dependency,
  Blocker,
  MemberProfile,
  SprintRecord,
  OneOnOne,
  Achievement,
  VacationRecord,
  TeamSprint,
  Candidate,
  CandidateTechnology,
  CandidateEvaluation,
  VulnerabilityMicroservice,
  IncidentMicroservice,
  AuditFindingMicroservice,
  RiskMicroservice,
  AppDatabaseMicroservice,
  EquipmentItem,
  EquipmentAssignmentLog,
  EquipmentTicket,
} from '@/types/domain'
import type { AiConversation, AiChatMessage } from '@/features/ai/types'
import type { SystemConfig, CatalogEntry, ContentBlock, Skill } from '@/types/system'

export class TGPDatabase extends Dexie {
  tenants!: Table<Tenant, string>
  businessUnits!: Table<BusinessUnit, string>
  applications!: Table<Application, string>
  technologies!: Table<Technology, string>
  applicationDependencies!: Table<ApplicationDependency, string>
  vulnerabilities!: Table<Vulnerability, string>
  incidents!: Table<Incident, string>
  risks!: Table<Risk, string>
  auditFindings!: Table<AuditFinding, string>
  teams!: Table<Team, string>
  objectives!: Table<Objective, string>
  healthIndexHistory!: Table<HealthIndex, string>
  deliverables!: Table<Deliverable, string>
  microservices!: Table<Microservice, string>
  appDatabases!: Table<AppDatabase, string>
  users!: Table<User, string>

  // Ejecución
  plans!: Table<Plan, string>
  activities!: Table<Activity, string>
  tasks!: Table<Task, string>
  commitments!: Table<Commitment, string>
  dependencies!: Table<Dependency, string>
  blockers!: Table<Blocker, string>

  // Rendimiento
  memberProfiles!: Table<MemberProfile, string>
  sprintRecords!: Table<SprintRecord, string>
  oneOnOnes!: Table<OneOnOne, string>
  achievements!: Table<Achievement, string>
  vacationRecords!: Table<VacationRecord, string>
  teamSprints!: Table<TeamSprint, string>

  // Reclutamiento
  candidates!: Table<Candidate, string>
  candidateTechnologies!: Table<CandidateTechnology, string>
  candidateEvaluations!: Table<CandidateEvaluation, string>

  // Equipamiento
  equipment!: Table<EquipmentItem, string>
  equipmentAssignments!: Table<EquipmentAssignmentLog, string>
  equipmentTickets!: Table<EquipmentTicket, string>

  // Junction M:N microservicios
  vulnerabilityMicroservices!: Table<VulnerabilityMicroservice, string>
  incidentMicroservices!: Table<IncidentMicroservice, string>
  auditFindingMicroservices!: Table<AuditFindingMicroservice, string>
  riskMicroservices!: Table<RiskMicroservice, string>
  appDatabaseMicroservices!: Table<AppDatabaseMicroservice, string>

  // AI Chat
  aiConversations!: Table<AiConversation, string>
  aiMessages!: Table<AiChatMessage, string>

  // Sistema — config dinámica (v23)
  systemConfig!: Table<SystemConfig, string>
  catalogs!: Table<CatalogEntry, string>
  contentBlocks!: Table<ContentBlock, string>
  skills!: Table<Skill, string>

  constructor() {
    super('TGPDatabase')
    this.version(5).stores({
      tenants: 'id, name, slug',
      businessUnits: 'id, tenantId, name, status',
      applications: 'id, businessUnitId, name, criticality, status, ownerId',
      technologies: 'id, name, version, category, supportStatus',
      applicationDependencies: 'id, applicationId, dependsOnAppId',
      vulnerabilities: 'id, applicationId, severity, status, slaDeadline, detectedAt, title',
      incidents: 'id, applicationId, severity, status, detectedAt, title',
      risks: 'id, businessUnitId, applicationId, status, riskScore, title',
      auditFindings: 'id, applicationId, severity, status, dueDate, title',
      teams: 'id, businessUnitId, name',
      objectives: 'id, teamId, businessUnitId, status, periodStart',
      healthIndexHistory: 'id, businessUnitId, calculatedAt',
      deliverables: 'id, applicationId, status, dueDate',
      microservices: 'id, applicationId, name',
      users: 'id, email, role',
      plans: 'id, teamId, businessUnitId, objectiveId, status, startDate, endDate',
      activities:
        'id, planId, parentActivityId, assigneeId, teamId, applicationId, status, dueDate',
      tasks: 'id, activityId, planId, assigneeId, status, priority, dueDate',
      commitments:
        'id, ownerId, accountableId, teamId, applicationId, objectiveId, status, commitmentDate',
      dependencies: 'id, sourceType, sourceId, targetType, targetId, status',
      blockers: 'id, sourceType, sourceId, assigneeId, severity, status',
    })
    this.version(6).stores({
      memberProfiles: 'id, teamId',
      sprintRecords: 'id, memberId, year, quarter',
      oneOnOnes: 'id, memberId, date',
      achievements: 'id, memberId, type, date',
    })
    this.version(7).stores({
      vacationRecords: 'id, memberId, startDate',
    })
    this.version(8).stores({
      teamSprints: 'id, teamId, year, quarter',
    })
    this.version(9).stores({
      appDatabases: 'id, applicationId, dbType, engine, environment',
    })
    this.version(11).stores({
      candidates: 'id, name, position, status, teamId, interviewDate, createdAt',
      candidateTechnologies: 'id, candidateId, name, points',
    })
    this.version(12).stores({
      candidateEvaluations: 'id, candidateId, category',
    })
    this.version(13).stores({
      vulnerabilities:
        'id, applicationId, severity, status, slaDeadline, detectedAt, title, externalId',
    })
    this.version(14).stores({
      vulnerabilityMicroservices: 'id, vulnerabilityId, microserviceId',
      incidentMicroservices: 'id, incidentId, microserviceId',
      auditFindingMicroservices: 'id, auditFindingId, microserviceId',
      riskMicroservices: 'id, riskId, microserviceId',
    })
    this.version(15).stores({
      appDatabaseMicroservices: 'id, appDatabaseId, microserviceId',
    })
    this.version(16).stores({
      users: 'id, email, role, isActive',
    })
    this.version(17).stores({
      equipment: 'id, type, status, assignedTo, serialNumber',
      equipmentAssignments: 'id, equipmentId, assignedTo, assignedAt',
      equipmentTickets: 'id, equipmentId, requesterId, status, type',
    })
    this.version(18).stores({
      equipment: 'id, type, status, assignedTo, serialNumber, createdAt',
      equipmentAssignments: 'id, equipmentId, assignedTo, assignedAt',
      equipmentTickets: 'id, equipmentId, requesterId, status, type',
    })
    this.version(19).stores({
      equipment:
        'id, type, status, assignedTo, serialNumber, createdAt, costCenter, businessUnitId',
      equipmentAssignments: 'id, equipmentId, assignedTo, assignedAt',
      equipmentTickets: 'id, equipmentId, requesterId, status, type',
    })
    this.version(20).stores({
      equipment:
        'id, type, status, assignedTo, serialNumber, createdAt, costCenter, businessUnitId',
      equipmentAssignments: 'id, equipmentId, assignedTo, assignedAt',
      equipmentTickets: 'id, equipmentId, requesterId, status, type, assigneeId',
    })
    this.version(21).stores({
      memberProfiles: 'id, teamId, role',
    })
    this.version(22).stores({
      aiConversations: 'id, updatedAt',
      aiMessages: 'id, conversationId, timestamp',
    })
    this.version(23).stores({
      systemConfig: 'key',
      catalogs: 'id, [category+value], category, enabled',
      contentBlocks: 'key',
      skills: 'id, category, name',
    })
  }
}

export const db = new TGPDatabase()

// Data Layer Multi-Backend — misma importación, nuevo poder.
// Los consumidores existentes siguen usando `db` como siempre.
// Los nuevos pueden usar `dataLayer` que abstrae Dexie, PGlite, etc.
//
// Migración progresiva:
//   import { db, dataLayer } from '@/services/db/database'
//   // Antes: await db.applications.toArray()
//   // Ahora: await dataLayer.applications.getAll()
//   //         await dataLayer.applications.getById(id)
//   //         await dataLayer.applications.create(obj)
export { dataLayer } from '@/services/data-layer'
export type { BackendType, Repository, DatabaseBackend } from '@/services/data-layer'
