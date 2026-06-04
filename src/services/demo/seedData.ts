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
  Plan,
  Activity,
  Task,
  Commitment,
  Blocker,
} from '@/types/domain'

const SEEDED_FLAG = 'tgp-seeded'
let seedingInProgress = false

export async function seedDemoData() {
  // Only seed once in the lifetime of the app
  if (localStorage.getItem(SEEDED_FLAG)) return
  // Guard against React StrictMode double-invocation
  if (seedingInProgress) return
  seedingInProgress = true

  // Check if data already exists (e.g. imported data on first visit)
  const counts = await Promise.all(db.tables.map((t) => t.count()))
  if (counts.some((c) => c > 0)) {
    localStorage.setItem(SEEDED_FLAG, 'true')
    seedingInProgress = false
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
    { id: 'bu-digital', tenantId: 'tenant-1', name: 'Digital', status: 'active', createdAt: new Date() },
    { id: 'bu-core', tenantId: 'tenant-1', name: 'Core', status: 'active', createdAt: new Date() },
    { id: 'bu-legacy', tenantId: 'tenant-1', name: 'Legacy', status: 'active', createdAt: new Date() },
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
  const inc_detected: Incident = { id: 'inc-4', applicationId: 'app-1', externalId: 'INC-004', title: 'Intento de acceso no autorizado', description: 'Múltiples intentos fallidos de autenticación desde IP externa', severity: 'critical', status: 'detected', detectedAt: daysAgo(0, -2 * 60 * 60 * 1000), respondedAt: null, resolvedAt: null, downtimeMinutes: 0, rca: null, metadata: {}, createdAt: daysAgo(0, -2 * 60 * 60 * 1000), updatedAt: daysAgo(0, -2 * 60 * 60 * 1000) }

  const incidents = [inc_7d, inc_30d, inc_open, inc_detected]

  // ── Risks spread across time ──
  // Open within 7d
  const risk_7d: Risk = { id: 'risk-1', applicationId: 'app-1', businessUnitId: 'bu-core', title: 'Dependencia de tecnología EOL', description: 'SQL Server 2019 approaching EOL', category: 'technical', probability: 4, impact: 4, riskScore: 16, mitigationPlan: 'Migrar a PostgreSQL 16', status: 'open', targetDate: new Date('2025-06-30'), metadata: {}, createdAt: days(4), updatedAt: days(4) }
  // ~40d ago (shows in 90d, ytd only)
  const risk_90d: Risk = { id: 'risk-2', applicationId: 'app-5', businessUnitId: 'bu-legacy', title: 'Sistema legacy sin soporte', description: 'CRM antiguo sin soporte del vendor', category: 'technical', probability: 5, impact: 3, riskScore: 15, mitigationPlan: 'Reemplazar con nuevo CRM', status: 'open', targetDate: new Date('2025-03-31'), metadata: {}, createdAt: days(40), updatedAt: days(40) }
  // ~200d ago (only ytd)
  const risk_ytd: Risk = { id: 'risk-3', applicationId: null, businessUnitId: 'bu-digital', title: 'Fuga de talento técnico', description: 'Rotación alta en equipo de desarrollo', category: 'operational', probability: 3, impact: 4, riskScore: 12, mitigationPlan: 'Plan de retención', status: 'mitigated', targetDate: null, metadata: {}, createdAt: days(200), updatedAt: days(200) }

  const risks = [risk_7d, risk_90d, risk_ytd]

  // ── Audit findings spread across time ──
  // Closed on time (counts toward compliance: ✓)
  const find_closed_1: AuditFinding = {
    id: 'find-1', applicationId: 'app-1', auditReference: 'AUD-2024-001',
    title: 'Controles de acceso insuficientes', description: 'Falta de RBAC granular en módulo de pagos. Corregido con políticas IAM.',
    severity: 'high', category: 'security', status: 'closed',
    dueDate: new Date('2026-08-15'), evidence: [], actionPlan: null,
    metadata: {}, createdAt: days(90), updatedAt: days(10),
  }
  const find_closed_2: AuditFinding = {
    id: 'find-3', applicationId: 'app-4', auditReference: 'AUD-2024-003',
    title: 'Cifrado de datos en tránsito', description: 'ISO 27001: A.10.1.1 — Implementar TLS 1.3 en todos los endpoints.',
    severity: 'high', category: 'compliance', status: 'resolved',
    dueDate: new Date('2026-07-31'), evidence: [], actionPlan: null,
    metadata: {}, createdAt: days(60), updatedAt: days(5),
  }
  const find_closed_3: AuditFinding = {
    id: 'find-4', applicationId: 'app-2', auditReference: 'AUD-2024-004',
    title: 'Política de backups', description: 'Verificar y documentar política de backups según compliance interno.',
    severity: 'medium', category: 'compliance', status: 'closed',
    dueDate: new Date('2026-06-30'), evidence: [], actionPlan: null,
    metadata: {}, createdAt: days(45), updatedAt: days(15),
  }
  // Open — still within due date (does NOT count toward compliance: ✗)
  const find_open: AuditFinding = {
    id: 'find-5', applicationId: 'app-3', auditReference: 'AUD-2024-005',
    title: 'Auditoría de accesos privilegiados', description: 'Revisión de accesos administrativos según SOX.',
    severity: 'medium', category: 'access_control', status: 'open',
    dueDate: new Date('2026-09-30'), evidence: [], actionPlan: null,
    metadata: {}, createdAt: days(20), updatedAt: days(20),
  }
  // Overdue (does NOT count toward compliance: ✗)
  const find_overdue: AuditFinding = {
    id: 'find-2', applicationId: 'app-5', auditReference: 'AUD-2024-002',
    title: 'Documentación de continuidad', description: 'Actualizar plan de continuidad del negocio según BCP.',
    severity: 'medium', category: 'business_continuity', status: 'overdue',
    dueDate: new Date('2026-01-15'), evidence: [], actionPlan: null,
    metadata: {}, createdAt: days(120), updatedAt: days(30),
  }

  const auditFindings = [find_closed_1, find_overdue, find_closed_2, find_closed_3, find_open]

  const teams: Team[] = [
    { id: 'team-1', businessUnitId: 'bu-digital', name: 'Platform Team', sourceSystem: 'jira', externalId: 'TEAM-1', members: [{ id: 'tm-1', userPrincipal: 'user-1', displayName: 'Juan Pérez', role: 'tech_lead', allocationPct: 100, isActive: true }], currentMetrics: { velocity: 45, leadTimeHours: 12, cycleTimeHours: 8, throughput: 12, deploymentFrequency: 2, changeFailureRate: 3, mttrHours: 0.5, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'team-2', businessUnitId: 'bu-core', name: 'Core Squad', sourceSystem: 'azure_devops', externalId: 'TEAM-2', members: [{ id: 'tm-2', userPrincipal: 'user-2', displayName: 'María García', role: 'senior_developer', allocationPct: 100, isActive: true }], currentMetrics: { velocity: 38, leadTimeHours: 24, cycleTimeHours: 16, throughput: 10, deploymentFrequency: 1, changeFailureRate: 8, mttrHours: 2, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
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

  // ── Execution seed data ──
  const ds = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    d.setHours(12, 0, 0, 0)
    return d
  }

  const plans: Plan[] = [
    { id: 'plan-1', title: 'Q2 2026 — Modernizacion Core', description: 'Actualizacion de frameworks y migracion de BD del core bancario', teamId: 'team-1', businessUnitId: 'bu-core', objectiveId: 'obj-1', status: 'in_progress', health: 'yellow', startDate: ds(-45), endDate: ds(45), metadata: {}, createdAt: ds(-45), updatedAt: ds(-1) },
    { id: 'plan-2', title: 'Q2 2026 — Seguridad', description: 'Correccion de vulnerabilidades y hardening de aplicaciones', teamId: 'team-2', businessUnitId: 'bu-digital', objectiveId: 'obj-1', status: 'in_progress', health: 'green', startDate: ds(-30), endDate: ds(60), metadata: {}, createdAt: ds(-30), updatedAt: ds(-1) },
    { id: 'plan-3', title: 'Migracion CRM — Planificacion', description: 'Plan de reemplazo del CRM legacy', teamId: 'team-2', businessUnitId: 'bu-legacy', objectiveId: null, status: 'planned', health: 'green', startDate: ds(15), endDate: ds(75), metadata: {}, createdAt: ds(-10), updatedAt: ds(-10) },
  ]

  const plan1Activities: Activity[] = [
    { id: 'act-1', planId: 'plan-1', parentActivityId: null, title: 'Migrar Core Banking a .NET 8', description: 'Actualizar el framework del core bancario', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'critical', status: 'in_progress', estimatedHours: 80, actualHours: 45, plannedPoints: 21, completedPoints: null, startDate: ds(-40), dueDate: ds(20), completedAt: null, metadata: {}, createdAt: ds(-40), updatedAt: ds(-1) },
    { id: 'act-2', planId: 'plan-1', parentActivityId: 'act-1', title: 'Actualizar dependencias NuGet', description: 'Actualizar paquetes a versiones compatibles con .NET 8', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'high', status: 'completed', estimatedHours: 16, actualHours: 14, plannedPoints: 5, completedPoints: 5, startDate: ds(-40), dueDate: ds(-15), completedAt: ds(-16), metadata: {}, createdAt: ds(-40), updatedAt: ds(-16) },
    { id: 'act-3', planId: 'plan-1', parentActivityId: 'act-1', title: 'Migrar controladores MVC', description: 'Migrar todos los controladores a la nueva version', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'high', status: 'in_progress', estimatedHours: 32, actualHours: 20, plannedPoints: 8, completedPoints: null, startDate: ds(-30), dueDate: ds(10), completedAt: null, metadata: {}, createdAt: ds(-30), updatedAt: ds(-1) },
    { id: 'act-4', planId: 'plan-1', parentActivityId: null, title: 'Actualizar PostgreSQL 16', description: 'Migracion de base de datos', assigneeId: 'user-2', teamId: 'team-1', applicationId: 'app-1', priority: 'medium', status: 'in_progress', estimatedHours: 40, actualHours: 25, plannedPoints: 13, completedPoints: null, startDate: ds(-35), dueDate: ds(5), completedAt: null, metadata: {}, createdAt: ds(-35), updatedAt: ds(-1) },
    { id: 'act-5', planId: 'plan-1', parentActivityId: null, title: 'Implementar OAuth2 en Portal', description: 'Migrar autenticacion a OAuth2 con Keycloak', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-2', priority: 'high', status: 'pending', estimatedHours: 24, actualHours: null, plannedPoints: 8, completedPoints: null, startDate: ds(1), dueDate: ds(0), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
  ]

  const plan2Activities: Activity[] = [
    { id: 'act-6', planId: 'plan-2', parentActivityId: null, title: 'Auditoria de vulnerabilidades', description: 'Escaneo completo de vulnerabilidades en todas las apps', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-2', priority: 'critical', status: 'completed', estimatedHours: 16, actualHours: 18, plannedPoints: 13, completedPoints: 13, startDate: ds(-20), dueDate: ds(-5), completedAt: ds(-6), metadata: {}, createdAt: ds(-20), updatedAt: ds(-6) },
    { id: 'act-7', planId: 'plan-2', parentActivityId: null, title: 'Corregir XSS en formularios de busqueda', description: 'Sanitizar inputs en el portal clientes', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-2', priority: 'high', status: 'in_progress', estimatedHours: 12, actualHours: 6, plannedPoints: 5, completedPoints: null, startDate: ds(-14), dueDate: ds(0), completedAt: null, metadata: {}, createdAt: ds(-14), updatedAt: ds(-1) },
    { id: 'act-8', planId: 'plan-2', parentActivityId: null, title: 'Implementar CSP headers', description: 'Agregar Content Security Policy headers', assigneeId: null, teamId: 'team-2', applicationId: 'app-2', priority: 'medium', status: 'pending', estimatedHours: 8, actualHours: null, plannedPoints: 3, completedPoints: null, startDate: ds(2), dueDate: ds(10), completedAt: null, metadata: {}, createdAt: ds(-7), updatedAt: ds(-1) },
  ]

  const allActivities = [...plan1Activities, ...plan2Activities]

  const tasks: Task[] = [
    { id: 'task-1', activityId: 'act-1', planId: 'plan-1', title: 'Evaluar cambios de version', description: '', assigneeId: 'user-1', status: 'done', priority: 'medium', estimatedHours: 4, dueDate: ds(-38), completedAt: ds(-39), dependsOn: [], metadata: {}, createdAt: ds(-40), updatedAt: ds(-39) },
    { id: 'task-2', activityId: 'act-1', planId: 'plan-1', title: 'Actualizar Dockerfile a .NET 8 SDK', description: '', assigneeId: 'user-1', status: 'done', priority: 'high', estimatedHours: 2, dueDate: ds(-35), completedAt: ds(-36), dependsOn: [], metadata: {}, createdAt: ds(-40), updatedAt: ds(-36) },
    { id: 'task-3', activityId: 'act-1', planId: 'plan-1', title: 'Verificar compatibilidad de paquetes', description: '', assigneeId: 'user-1', status: 'in_progress', priority: 'high', estimatedHours: 8, dueDate: ds(-1), completedAt: null, dependsOn: [], metadata: {}, createdAt: ds(-30), updatedAt: ds(-2) },
    { id: 'task-4', activityId: 'act-4', planId: 'plan-1', title: 'Hacer dump de BD actual', description: '', assigneeId: 'user-2', status: 'done', priority: 'critical', estimatedHours: 2, dueDate: ds(-30), completedAt: ds(-31), dependsOn: [], metadata: {}, createdAt: ds(-35), updatedAt: ds(-31) },
    { id: 'task-5', activityId: 'act-4', planId: 'plan-1', title: 'Ejecutar pg_upgrade', description: '', assigneeId: 'user-2', status: 'todo', priority: 'critical', estimatedHours: 4, dueDate: ds(2), completedAt: null, dependsOn: [], metadata: {}, createdAt: ds(-10), updatedAt: ds(-2) },
    { id: 'task-6', activityId: 'act-7', planId: 'plan-2', title: 'Identificar endpoints vulnerables', description: '', assigneeId: 'user-2', status: 'done', priority: 'high', estimatedHours: 3, dueDate: ds(-10), completedAt: ds(-11), dependsOn: [], metadata: {}, createdAt: ds(-14), updatedAt: ds(-11) },
    { id: 'task-7', activityId: 'act-7', planId: 'plan-2', title: 'Implementar sanitizacion en backend', description: '', assigneeId: 'user-2', status: 'in_progress', priority: 'high', estimatedHours: 6, dueDate: ds(0), completedAt: null, dependsOn: [], metadata: {}, createdAt: ds(-10), updatedAt: ds(-2) },
    { id: 'task-8', activityId: 'act-7', planId: 'plan-2', title: 'Agregar tests de seguridad', description: '', assigneeId: 'user-2', status: 'todo', priority: 'medium', estimatedHours: 4, dueDate: ds(2), completedAt: null, dependsOn: [], metadata: {}, createdAt: ds(-7), updatedAt: ds(-2) },
  ]

  const commitments: Commitment[] = [
    { id: 'comm-1', title: 'Entregar plan de migracion CRM', description: 'Documento con estrategia y cronograma', ownerId: 'user-4', accountableId: 'user-1', teamId: 'team-2', applicationId: 'app-5', objectiveId: null, deliverableId: 'del-6', status: 'active', commitmentDate: ds(3), fulfilledAt: null, metadata: {}, createdAt: ds(-20), updatedAt: ds(-5) },
    { id: 'comm-2', title: 'Corregir vulnerabilidades criticas', description: 'Todas las vulnerabilidades P1 deben estar corregidas', ownerId: 'user-1', accountableId: 'user-2', teamId: 'team-1', applicationId: 'app-1', objectiveId: 'obj-1', deliverableId: null, status: 'at_risk', commitmentDate: ds(-2), fulfilledAt: null, metadata: {}, createdAt: ds(-30), updatedAt: ds(-3) },
    { id: 'comm-3', title: 'Certificacion SSL renovada', description: 'Renovar certificados SSL del portal', ownerId: 'user-2', accountableId: 'user-1', teamId: 'team-2', applicationId: 'app-2', objectiveId: null, deliverableId: 'del-2', status: 'breached', commitmentDate: ds(-10), fulfilledAt: null, metadata: {}, createdAt: ds(-60), updatedAt: ds(-11) },
  ]

  const blockers: Blocker[] = [
    { id: 'blk-1', sourceType: 'activity', sourceId: 'act-5', title: 'Certificado SSL vencido', description: 'El certificado SSL del portal de clientes vencio y debe ser renovado antes de implementar OAuth2', severity: 'high', status: 'open', raisedById: 'user-1', assigneeId: 'user-2', escalatedAt: null, resolvedAt: null, resolutionNotes: null, metadata: {}, createdAt: ds(-5), updatedAt: ds(-2) },
    { id: 'blk-2', sourceType: 'activity', sourceId: 'act-4', title: 'Dependencia externa proveedor SMS', description: 'El proveedor de SMS no ha entregado las credenciales para el entorno de staging', severity: 'medium', status: 'open', raisedById: 'user-2', assigneeId: 'user-1', escalatedAt: null, resolvedAt: null, resolutionNotes: null, metadata: {}, createdAt: ds(-3), updatedAt: ds(-1) },
  ]

  await db.plans.bulkAdd(plans)
  await db.activities.bulkAdd(allActivities)
  await db.tasks.bulkAdd(tasks)
  await db.commitments.bulkAdd(commitments)
  await db.blockers.bulkAdd(blockers)

  localStorage.setItem(SEEDED_FLAG, 'true')
  seedingInProgress = false
}

/**
 * Ensure compliance audit findings exist, even for already-seeded users.
 * Runs on every app load — only inserts/updates what's missing.
 */
export async function seedComplianceFindings() {
  const now = Date.now()
  const days = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000)

  const upserts: AuditFinding[] = [
    {
      id: 'find-1', applicationId: 'app-1', auditReference: 'AUD-2024-001',
      title: 'Controles de acceso insuficientes', description: 'Falta de RBAC granular en módulo de pagos. Corregido con políticas IAM.',
      severity: 'high', category: 'security', status: 'closed',
      dueDate: new Date('2026-08-15'), evidence: [], actionPlan: null,
      metadata: {}, createdAt: days(90), updatedAt: days(10),
    },
    {
      id: 'find-2', applicationId: 'app-5', auditReference: 'AUD-2024-002',
      title: 'Documentación de continuidad', description: 'Actualizar plan de continuidad del negocio según BCP.',
      severity: 'medium', category: 'business_continuity', status: 'overdue',
      dueDate: new Date('2026-01-15'), evidence: [], actionPlan: null,
      metadata: {}, createdAt: days(120), updatedAt: days(30),
    },
    {
      id: 'find-3', applicationId: 'app-4', auditReference: 'AUD-2024-003',
      title: 'Cifrado de datos en tránsito', description: 'ISO 27001: A.10.1.1 — Implementar TLS 1.3 en todos los endpoints.',
      severity: 'high', category: 'compliance', status: 'resolved',
      dueDate: new Date('2026-07-31'), evidence: [], actionPlan: null,
      metadata: {}, createdAt: days(60), updatedAt: days(5),
    },
    {
      id: 'find-4', applicationId: 'app-2', auditReference: 'AUD-2024-004',
      title: 'Política de backups', description: 'Verificar y documentar política de backups según compliance interno.',
      severity: 'medium', category: 'compliance', status: 'closed',
      dueDate: new Date('2026-06-30'), evidence: [], actionPlan: null,
      metadata: {}, createdAt: days(45), updatedAt: days(15),
    },
    {
      id: 'find-5', applicationId: 'app-3', auditReference: 'AUD-2024-005',
      title: 'Auditoría de accesos privilegiados', description: 'Revisión de accesos administrativos según SOX.',
      severity: 'medium', category: 'access_control', status: 'open',
      dueDate: new Date('2026-09-30'), evidence: [], actionPlan: null,
      metadata: {}, createdAt: days(20), updatedAt: days(20),
    },
  ]

  await db.auditFindings.bulkPut(upserts)
}
