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
  User,
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
  users!: Table<User, string>

  constructor() {
    super('TGPDatabase')
    this.version(1).stores({
      tenants: 'id, name, slug',
      businessUnits: 'id, tenantId, name',
      applications: 'id, businessUnitId, name, criticality, status, ownerId',
      technologies: 'id, name, version, category, supportStatus',
      applicationDependencies: 'id, applicationId, dependsOnAppId',
      vulnerabilities: 'id, applicationId, severity, status, slaDeadline, detectedAt',
      incidents: 'id, applicationId, severity, status, detectedAt',
      risks: 'id, businessUnitId, applicationId, status, riskScore',
      auditFindings: 'id, applicationId, severity, status, dueDate',
      teams: 'id, businessUnitId, name',
      objectives: 'id, teamId, businessUnitId, status, periodStart',
      healthIndexHistory: 'id, businessUnitId, calculatedAt',
      deliverables: 'id, applicationId, status, dueDate',
      users: 'id, email, role',
    })
  }
}

export const db = new TGPDatabase()
