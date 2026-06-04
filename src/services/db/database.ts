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
  User,
  Plan,
  Activity,
  Task,
  Commitment,
  Dependency,
  Blocker,
} from '@/types/domain'

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
  users!: Table<User, string>

  // Ejecución
  plans!: Table<Plan, string>
  activities!: Table<Activity, string>
  tasks!: Table<Task, string>
  commitments!: Table<Commitment, string>
  dependencies!: Table<Dependency, string>
  blockers!: Table<Blocker, string>

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
      activities: 'id, planId, parentActivityId, assigneeId, teamId, applicationId, status, dueDate',
      tasks: 'id, activityId, planId, assigneeId, status, priority, dueDate',
      commitments: 'id, ownerId, accountableId, teamId, applicationId, objectiveId, status, commitmentDate',
      dependencies: 'id, sourceType, sourceId, targetType, targetId, status',
      blockers: 'id, sourceType, sourceId, assigneeId, severity, status',
    })
  }
}

export const db = new TGPDatabase()
