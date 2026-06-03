import { db } from '@/services/db/database'
import type {
  Tenant,
  BusinessUnit,
  Application,
  Technology,
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
} from '@/types/domain'

const SEEDED_FLAG = 'tgp-seeded'

export async function seedDemoData() {
  // Only seed once in the lifetime of the app
  if (localStorage.getItem(SEEDED_FLAG)) return

  // Check if data already exists (e.g. imported data on first visit)
  const counts = await Promise.all(db.tables.map((t) => t.count()))
  if (counts.some((c) => c > 0)) {
    localStorage.setItem(SEEDED_FLAG, 'true')
    return
  }

  // Clear all existing data first so re-seeding always works
  await Promise.all(db.tables.map((t) => t.clear()))

  const now = Date.now()
  const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000)

  const tenant: Tenant = {
    id: 'tenant-1',
    name: 'TGP Demo Corp',
    slug: 'tgp-demo',
    settings: {
      defaultWeights: {
        delivery: 20,
        quality: 15,
        security: 20,
        availability: 15,
        obsolescence: 10,
        risk: 10,
        compliance: 10,
      },
      slas: {
        critical: 7,
        high: 30,
        medium: 90,
        low: 180,
      },
      branding: {
        primaryColor: '#0052CC',
        secondaryColor: '#0747A6',
        logoUrl: null,
      },
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const businessUnits: BusinessUnit[] = [
    { id: 'bu-digital', tenantId: 'tenant-1', name: 'Digital', createdAt: new Date() },
    { id: 'bu-core', tenantId: 'tenant-1', name: 'Core', createdAt: new Date() },
    { id: 'bu-legacy', tenantId: 'tenant-1', name: 'Legacy', createdAt: new Date() },
  ]

  const technologies: Technology[] = [
    { id: 'tech-1', name: '.NET', version: '8.0', category: 'framework', vendor: 'Microsoft', eolDate: new Date('2027-11-14'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-2', name: 'Java', version: '17', category: 'language', vendor: 'Oracle', eolDate: new Date('2029-09-30'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-3', name: 'Angular', version: '17', category: 'framework', vendor: 'Google', eolDate: new Date('2025-05-15'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-4', name: 'PostgreSQL', version: '16', category: 'database', vendor: 'PostgreSQL', eolDate: new Date('2028-11-09'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-5', name: 'SQL Server', version: '2019', category: 'database', vendor: 'Microsoft', eolDate: new Date('2025-01-08'), supportStatus: 'extended', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-6', name: 'Redis', version: '7', category: 'cache', vendor: 'Redis', eolDate: null, supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-7', name: 'Node.js', version: '20', category: 'runtime', vendor: 'OpenJS', eolDate: new Date('2026-04-30'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-8', name: 'Python', version: '3.12', category: 'language', vendor: 'Python', eolDate: new Date('2028-10-31'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-9', name: 'Angular', version: '15', category: 'framework', vendor: 'Google', eolDate: new Date('2024-05-15'), supportStatus: 'eol', cveList: ['CVE-2024-1234'], metadata: {}, createdAt: new Date() },
    { id: 'tech-10', name: 'Java', version: '11', category: 'language', vendor: 'Oracle', eolDate: new Date('2023-09-30'), supportStatus: 'eol', cveList: ['CVE-2024-20932', 'CVE-2024-20952'], metadata: {}, createdAt: new Date() },
    { id: 'tech-11', name: 'Windows Server', version: '2016', category: 'os', vendor: 'Microsoft', eolDate: new Date('2027-01-12'), supportStatus: 'extended', cveList: ['CVE-2024-38077'], metadata: {}, createdAt: new Date() },
    { id: 'tech-12', name: 'MySQL', version: '5.7', category: 'database', vendor: 'Oracle', eolDate: new Date('2023-10-21'), supportStatus: 'eol', cveList: ['CVE-2024-20994', 'CVE-2024-21007'], metadata: {}, createdAt: new Date() },
    { id: 'tech-13', name: 'React', version: '18', category: 'library', vendor: 'Meta', eolDate: null, supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-14', name: 'Docker', version: '24', category: 'runtime', vendor: 'Docker Inc.', eolDate: null, supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-15', name: 'Kubernetes', version: '1.28', category: 'runtime', vendor: 'CNCF', eolDate: new Date('2025-10-28'), supportStatus: 'extended', cveList: ['CVE-2024-10220'], metadata: {}, createdAt: new Date() },
    { id: 'tech-16', name: 'Nginx', version: '1.24', category: 'web_server', vendor: 'F5', eolDate: new Date('2026-04-01'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-17', name: 'RabbitMQ', version: '3.12', category: 'message_broker', vendor: 'VMware', eolDate: new Date('2025-12-31'), supportStatus: 'active', cveList: [], metadata: {}, createdAt: new Date() },
    { id: 'tech-18', name: 'Ubuntu', version: '20.04', category: 'os', vendor: 'Canonical', eolDate: new Date('2025-04-02'), supportStatus: 'extended', cveList: ['CVE-2024-6387'], metadata: {}, createdAt: new Date() },
  ]

  const applications: Application[] = [
    { id: 'app-1', businessUnitId: 'bu-core', name: 'Core Banking', description: 'Sistema core bancario', ownerId: 'user-1', ownerName: 'Juan Pérez', criticality: 'critical', architecture: 'microservices', status: 'active', supportEndDate: new Date('2027-06-30'), technologies: ['tech-1', 'tech-4', 'tech-6'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-2', businessUnitId: 'bu-digital', name: 'Portal Clientes', description: 'Portal web para clientes', ownerId: 'user-2', ownerName: 'María García', criticality: 'high', architecture: 'microservices', status: 'active', supportEndDate: null, technologies: ['tech-3', 'tech-7', 'tech-6'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-3', businessUnitId: 'bu-digital', name: 'App Móvil', description: 'Aplicación móvil', ownerId: 'user-3', ownerName: 'Carlos López', criticality: 'high', architecture: 'microservices', status: 'active', supportEndDate: null, technologies: ['tech-7', 'tech-6'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-4', businessUnitId: 'bu-core', name: 'Payments', description: 'Sistema de pagos', ownerId: 'user-1', ownerName: 'Juan Pérez', criticality: 'critical', architecture: 'event_driven', status: 'active', supportEndDate: null, technologies: ['tech-2', 'tech-4', 'tech-6'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-5', businessUnitId: 'bu-legacy', name: 'Sistema Legacy CRM', description: 'CRM antiguo', ownerId: 'user-4', ownerName: 'Ana Martínez', criticality: 'medium', architecture: 'monolith', status: 'deprecated', supportEndDate: new Date('2024-12-31'), technologies: ['tech-10', 'tech-5'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-6', businessUnitId: 'bu-digital', name: 'Analytics', description: 'Plataforma de analytics', ownerId: 'user-5', ownerName: 'Pedro Sánchez', criticality: 'medium', architecture: 'microservices', status: 'active', supportEndDate: null, technologies: ['tech-8', 'tech-4', 'tech-6'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-7', businessUnitId: 'bu-core', name: 'Reporting', description: 'Sistema de reportes', ownerId: 'user-2', ownerName: 'María García', criticality: 'low', architecture: 'soa', status: 'active', supportEndDate: null, technologies: ['tech-1', 'tech-5'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-8', businessUnitId: 'bu-legacy', name: 'Intranet', description: 'Portal interno', ownerId: 'user-4', ownerName: 'Ana Martínez', criticality: 'low', architecture: 'monolith', status: 'active', supportEndDate: null, technologies: ['tech-9', 'tech-5'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-9', businessUnitId: 'bu-core', name: 'Data Lake', description: 'Plataforma de datos centralizada', ownerId: 'user-5', ownerName: 'Pedro Sánchez', criticality: 'high', architecture: 'microservices', status: 'active', supportEndDate: null, technologies: ['tech-14', 'tech-15', 'tech-16', 'tech-17'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'app-10', businessUnitId: 'bu-legacy', name: 'Legacy ERP', description: 'ERP antiguo sobre MySQL', ownerId: 'user-4', ownerName: 'Ana Martínez', criticality: 'critical', architecture: 'monolith', status: 'deprecated', supportEndDate: new Date('2024-06-30'), technologies: ['tech-12', 'tech-11', 'tech-18'], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  ]

  const microservices: Microservice[] = [
    // Core Banking (app-1) microservices
    { id: 'ms-1', applicationId: 'app-1', name: 'auth-service', description: 'Autenticación y autorización', technologies: ['tech-2', 'tech-4'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'ms-2', applicationId: 'app-1', name: 'account-service', description: 'Gestión de cuentas bancarias', technologies: ['tech-1', 'tech-5', 'tech-6'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'ms-3', applicationId: 'app-1', name: 'notification-service', description: 'Notificaciones push y email', technologies: ['tech-7', 'tech-17'], createdAt: new Date(), updatedAt: new Date() },
    // Portal Clientes (app-2) microservices
    { id: 'ms-4', applicationId: 'app-2', name: 'api-gateway', description: 'API gateway del portal', technologies: ['tech-7', 'tech-16'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'ms-5', applicationId: 'app-2', name: 'user-profile-service', description: 'Gestión de perfiles de usuario', technologies: ['tech-8', 'tech-4'], createdAt: new Date(), updatedAt: new Date() },
    // Payments (app-4) microservices
    { id: 'ms-6', applicationId: 'app-4', name: 'payment-processor', description: 'Procesador de pagos transaccional', technologies: ['tech-2', 'tech-4', 'tech-17'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'ms-7', applicationId: 'app-4', name: 'fraud-detection', description: 'Detección de fraudes en tiempo real', technologies: ['tech-8', 'tech-6'], createdAt: new Date(), updatedAt: new Date() },
    // Data Lake (app-9) microservices
    { id: 'ms-8', applicationId: 'app-9', name: 'data-ingestion', description: 'Ingesta de datos batch y streaming', technologies: ['tech-8', 'tech-17', 'tech-18'], createdAt: new Date(), updatedAt: new Date() },
    { id: 'ms-9', applicationId: 'app-9', name: 'etl-orchestrator', description: 'Orquestación de pipelines ETL', technologies: ['tech-8', 'tech-18'], createdAt: new Date(), updatedAt: new Date() },
  ]

  // ── Vulnerabilities spread across time windows ──
  // 7d ago (shows in 7d, 30d, 90d, ytd)
  const vuln_7d: Vulnerability = { id: 'vuln-1', applicationId: 'app-1', externalId: 'CVE-2024-001', title: 'SQL Injection en módulo de autenticación', description: 'Vulnerabilidad de inyección SQL', cvssScore: 9.8, severity: 'critical', source: 'fluid_attacks', status: 'open', slaDeadline: days(-5), detectedAt: days(2), fixedAt: null, metadata: {}, createdAt: days(2), updatedAt: days(2) }
  // 7d ago, high
  const vuln_7d_b: Vulnerability = { id: 'vuln-5', applicationId: 'app-3', externalId: 'CVE-2024-005', title: 'Exposición de datos sensibles', description: 'Información sensible expuesta en logs', cvssScore: 7.0, severity: 'high', source: 'sonarqube', status: 'open', slaDeadline: days(-25), detectedAt: days(5), fixedAt: null, metadata: {}, createdAt: days(5), updatedAt: days(5) }
  // ~20d ago (shows in 30d, 90d, ytd — NOT in 7d)
  const vuln_30d: Vulnerability = { id: 'vuln-2', applicationId: 'app-2', externalId: 'CVE-2024-002', title: 'XSS en formulario de búsqueda', description: 'Cross-site scripting', cvssScore: 7.5, severity: 'high', source: 'sonarqube', status: 'in_progress', slaDeadline: days(-20), detectedAt: days(20), fixedAt: null, metadata: {}, createdAt: days(20), updatedAt: days(20) }
  // ~60d ago (shows in 90d, ytd — NOT in 7d or 30d)
  const vuln_90d: Vulnerability = { id: 'vuln-3', applicationId: 'app-1', externalId: 'CVE-2024-003', title: 'Desbordamiento de buffer', description: 'Buffer overflow en servicio de pagos', cvssScore: 8.1, severity: 'high', source: 'fluid_attacks', status: 'open', slaDeadline: days(-15), detectedAt: days(60), fixedAt: null, metadata: {}, createdAt: days(60), updatedAt: days(60) }
  // ~180d ago (shows in ytd only)
  const vuln_ytd: Vulnerability = { id: 'vuln-4', applicationId: 'app-5', externalId: 'CVE-2024-004', title: 'Autenticación débil', description: 'Mecanismo de autenticación vulnerable', cvssScore: 6.5, severity: 'medium', source: 'manual', status: 'accepted', slaDeadline: days(-60), detectedAt: days(180), fixedAt: null, metadata: {}, createdAt: days(180), updatedAt: days(180) }

  const vulnerabilities = [vuln_7d, vuln_7d_b, vuln_30d, vuln_90d, vuln_ytd]

  // ── Incidents spread across time ──
  const daysAgo = (n: number, offsetMs = 0) => new Date(now - n * 24 * 60 * 60 * 1000 + offsetMs)
  const inc_7d: Incident = { id: 'inc-2', applicationId: 'app-2', externalId: 'INC-002', title: 'Lentitud en portal', description: 'El portal presenta lentitud', severity: 'medium', status: 'resolved', detectedAt: daysAgo(3), respondedAt: daysAgo(3, 30 * 60 * 1000), resolvedAt: daysAgo(3, 3 * 60 * 60 * 1000), downtimeMinutes: 0, rca: 'Alto tráfico durante campaña', metadata: {}, createdAt: daysAgo(3), updatedAt: daysAgo(3) }
  const inc_30d: Incident = { id: 'inc-1', applicationId: 'app-1', externalId: 'INC-001', title: 'Caída del servicio de pagos', description: 'El servicio de pagos no responde', severity: 'critical', status: 'resolved', detectedAt: daysAgo(25), respondedAt: daysAgo(25, 15 * 60 * 1000), resolvedAt: daysAgo(25, 2 * 60 * 60 * 1000), downtimeMinutes: 120, rca: 'Problema de conexión a base de datos', metadata: {}, createdAt: daysAgo(25), updatedAt: daysAgo(25) }
  // Open incident (to show in counters) — 3d ago
  const inc_open: Incident = { id: 'inc-3', applicationId: 'app-3', externalId: 'INC-003', title: 'Error 500 en carrito de compras', description: 'Error intermitente en endpoint de carrito', severity: 'high', status: 'in_progress', detectedAt: daysAgo(2), respondedAt: daysAgo(2, 10 * 60 * 1000), resolvedAt: null, downtimeMinutes: 45, rca: null, metadata: {}, createdAt: daysAgo(2), updatedAt: daysAgo(2) }

  const incidents = [inc_7d, inc_30d, inc_open]

  // ── Risks spread across time ──
  // Open within 7d
  const risk_7d: Risk = { id: 'risk-1', applicationId: 'app-1', businessUnitId: 'bu-core', title: 'Dependencia de tecnología EOL', description: 'SQL Server 2019 approaching EOL', category: 'technical', probability: 4, impact: 4, riskScore: 16, mitigationPlan: 'Migrar a PostgreSQL 16', status: 'open', targetDate: new Date('2025-06-30'), metadata: {}, createdAt: days(4), updatedAt: days(4) }
  // ~40d ago (shows in 90d, ytd only)
  const risk_90d: Risk = { id: 'risk-2', applicationId: 'app-5', businessUnitId: 'bu-legacy', title: 'Sistema legacy sin soporte', description: 'CRM antiguo sin soporte del vendor', category: 'technical', probability: 5, impact: 3, riskScore: 15, mitigationPlan: 'Reemplazar con nuevo CRM', status: 'open', targetDate: new Date('2025-03-31'), metadata: {}, createdAt: days(40), updatedAt: days(40) }
  // ~200d ago (only ytd)
  const risk_ytd: Risk = { id: 'risk-3', applicationId: null, businessUnitId: 'bu-digital', title: 'Fuga de talento técnico', description: 'Rotación alta en equipo de desarrollo', category: 'operational', probability: 3, impact: 4, riskScore: 12, mitigationPlan: 'Plan de retención', status: 'mitigated', targetDate: null, metadata: {}, createdAt: days(200), updatedAt: days(200) }

  const risks = [risk_7d, risk_90d, risk_ytd]

  // ── Audit findings spread across time ──
  // Within 7d
  const find_7d: AuditFinding = { id: 'find-1', applicationId: 'app-1', auditReference: 'AUD-2024-001', title: 'Controles de acceso insuficientes', description: 'Falta de RBAC granular', severity: 'high', category: 'security', status: 'open', dueDate: new Date('2025-02-28'), evidence: [], actionPlan: null, metadata: {}, createdAt: days(3), updatedAt: days(3) }
  // ~50d ago (shows in 90d, ytd — NOT in 7d or 30d)
  const find_90d: AuditFinding = { id: 'find-2', applicationId: 'app-5', auditReference: 'AUD-2024-002', title: 'Documentación obsoleta', description: 'La documentación no refleja el estado actual', severity: 'medium', category: 'compliance', status: 'overdue', dueDate: new Date('2024-11-30'), evidence: [], actionPlan: null, metadata: {}, createdAt: days(50), updatedAt: days(50) }

  const auditFindings = [find_7d, find_90d]

  const teams: Team[] = [
    { id: 'team-1', businessUnitId: 'bu-digital', name: 'Platform Team', sourceSystem: 'jira', externalId: 'TEAM-1', members: [{ id: 'tm-1', userPrincipal: 'user-1', displayName: 'Juan Pérez', role: 'Tech Lead', allocationPct: 100, isActive: true }], currentMetrics: { velocity: 45, leadTimeHours: 12, cycleTimeHours: 8, throughput: 12, deploymentFrequency: 2, changeFailureRate: 3, mttrHours: 0.5, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'team-2', businessUnitId: 'bu-core', name: 'Core Squad', sourceSystem: 'azure_devops', externalId: 'TEAM-2', members: [{ id: 'tm-2', userPrincipal: 'user-2', displayName: 'María García', role: 'Senior Dev', allocationPct: 100, isActive: true }], currentMetrics: { velocity: 38, leadTimeHours: 24, cycleTimeHours: 16, throughput: 10, deploymentFrequency: 1, changeFailureRate: 8, mttrHours: 2, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  ]

  const objectives: Objective[] = [
    { id: 'obj-1', teamId: 'team-1', businessUnitId: 'bu-digital', title: 'Mejorar tiempo de entrega', description: 'Reducir lead time a menos de 24h', type: 'okr', periodStart: new Date('2024-01-01'), periodEnd: new Date('2024-03-31'), progress: 65, status: 'on_track', keyResults: [{ id: 'kr-1', title: 'Reducir lead time a < 24h', measure: 'hours', baseline: 48, target: 24, current: 30, status: 'on_track' }], metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  ]

  const deliverables: Deliverable[] = [
    { id: 'del-1', applicationId: 'app-1', title: 'Migración a .NET 8', description: 'Actualizar framework del core bancario', dueDate: new Date('2026-08-30'), status: 'in_progress', objectiveId: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-2', applicationId: 'app-1', title: 'Implementar autenticación 2FA', description: 'Añadir segundo factor de autenticación', dueDate: new Date('2026-07-15'), status: 'in_progress', objectiveId: 'obj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-3', applicationId: 'app-2', title: 'Rediseño del portal', description: 'Nuevo diseño UX del portal clientes', dueDate: new Date('2026-09-01'), status: 'pending', objectiveId: 'obj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-4', applicationId: 'app-3', title: 'App Móvil versión 2.0', description: 'Nueva versión con soporte offline', dueDate: new Date('2026-12-31'), status: 'pending', objectiveId: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-5', applicationId: 'app-4', title: 'Integración con nuevo proveedor', description: 'Conectar con gateway de pagos alternativo', dueDate: new Date('2026-06-30'), status: 'completed', objectiveId: null, createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-6', applicationId: 'app-5', title: 'Plan de migración CRM', description: 'Documentar estrategia de reemplazo del CRM legacy', dueDate: new Date('2026-05-15'), status: 'completed', objectiveId: 'obj-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'del-7', applicationId: null, title: 'Actualización política de seguridad', description: 'Revisar y actualizar políticas de seguridad TI', dueDate: new Date('2026-10-01'), status: 'pending', objectiveId: null, createdAt: new Date(), updatedAt: new Date() },
  ]

  const healthHistory: HealthIndex[] = [
    { id: 'hi-1', businessUnitId: 'all', tenantId: 'tenant-1', deliveryScore: 75, qualityScore: 80, securityScore: 70, availabilityScore: 95, obsolescenceScore: 60, riskScore: 75, complianceScore: 85, overallScore: 78, weights: { delivery: 20, quality: 15, security: 20, availability: 15, obsolescence: 10, risk: 10, compliance: 10 }, calculatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), trend: 'stable' },
    { id: 'hi-2', businessUnitId: 'all', tenantId: 'tenant-1', deliveryScore: 78, qualityScore: 82, securityScore: 72, availabilityScore: 96, obsolescenceScore: 62, riskScore: 76, complianceScore: 86, overallScore: 80, weights: { delivery: 20, quality: 15, security: 20, availability: 15, obsolescence: 10, risk: 10, compliance: 10 }, calculatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), trend: 'improving' },
  ]

  const users: User[] = [
    { id: 'user-1', email: 'admin@tgp.demo', displayName: 'Admin', role: 'admin', businessUnitIds: ['bu-digital', 'bu-core', 'bu-legacy'], isActive: true, createdAt: new Date() },
  ]

  await db.tenants.add(tenant)
  await db.businessUnits.bulkAdd(businessUnits)
  await db.technologies.bulkAdd(technologies)
  await db.applications.bulkAdd(applications)
  await db.vulnerabilities.bulkAdd(vulnerabilities)
  await db.incidents.bulkAdd(incidents)
  await db.risks.bulkAdd(risks)
  await db.auditFindings.bulkAdd(auditFindings)
  await db.teams.bulkAdd(teams)
  await db.objectives.bulkAdd(objectives)
  await db.deliverables.bulkAdd(deliverables)
  await db.microservices.bulkAdd(microservices)
  await db.healthIndexHistory.bulkAdd(healthHistory)
  await db.users.bulkAdd(users)

  // Mark as seeded so it never runs again
  localStorage.setItem(SEEDED_FLAG, 'true')
}
