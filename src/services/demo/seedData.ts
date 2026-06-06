import { db } from '@/services/db/database'
import type {
  Tenant,
  BusinessUnit,
  Application,
  ApplicationDependency,
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
  AppDatabase,
  User,
  Plan,
  Activity,
  Task,
  Commitment,
  Blocker,
  MemberProfile,
  SprintRecord,
  OneOnOne,
  Achievement,
  TeamSprint,
} from '@/types/domain'

// Bump version to force re-seed when seed data changes
const SEEDED_FLAG = 'tgp-seeded-v2'
let seedingInProgress = false

export async function seedDemoData(force = false) {
  // Only seed once in the lifetime of the app (unless forced)
  if (!force && localStorage.getItem(SEEDED_FLAG)) return
  // Guard against React StrictMode double-invocation
  if (seedingInProgress) return
  seedingInProgress = true

  // Check if data already exists (e.g. imported data on first visit)
  if (!force) {
    const counts = await Promise.all(db.tables.map((t) => t.count()))
    if (counts.some((c) => c > 0)) {
      localStorage.setItem(SEEDED_FLAG, 'true')
      seedingInProgress = false
      return
    }
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

  // ── Application Dependencies (coherent graph) ──
  // Core Banking depends on others
  // Payments depends on Core Banking
  // Portal depends on Core Banking and Payments
  // Analytics consumes Data Lake
  // Reporting depends on Data Lake
  // Legacy CRM and Intranet are isolated (no deps)
  const appDeps: ApplicationDependency[] = [
    { id: 'dep-1', applicationId: 'app-4', dependsOnAppId: 'app-1', dependencyType: 'hard', criticality: 'critical', description: 'Payments ejecuta transacciones sobre cuentas del Core Banking', createdAt: days(365) },
    { id: 'dep-2', applicationId: 'app-2', dependsOnAppId: 'app-1', dependencyType: 'soft', criticality: 'high', description: 'Portal consulta saldos y datos del cliente desde Core Banking', createdAt: days(365) },
    { id: 'dep-3', applicationId: 'app-2', dependsOnAppId: 'app-4', dependencyType: 'data', criticality: 'high', description: 'Portal muestra historial de pagos desde Payments', createdAt: days(300) },
    { id: 'dep-4', applicationId: 'app-6', dependsOnAppId: 'app-9', dependencyType: 'data', criticality: 'medium', description: 'Analytics consume datasets procesados del Data Lake', createdAt: days(180) },
    { id: 'dep-5', applicationId: 'app-7', dependsOnAppId: 'app-9', dependencyType: 'data', criticality: 'low', description: 'Reporting genera reportes sobre datos del Data Lake', createdAt: days(200) },
    { id: 'dep-6', applicationId: 'app-3', dependsOnAppId: 'app-2', dependencyType: 'network', criticality: 'high', description: 'App Móvil consume APIs del Portal Clientes', createdAt: days(180) },
    { id: 'dep-7', applicationId: 'app-9', dependsOnAppId: 'app-6', dependencyType: 'data', criticality: 'medium', description: 'Data Lake recibe streams de datos desde Analytics', createdAt: days(150) },
    { id: 'dep-8', applicationId: 'app-1', dependsOnAppId: 'app-9', dependencyType: 'data', criticality: 'medium', description: 'Core Banking consume reportes del Data Lake', createdAt: days(120) },
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

  // ── Databases ──
  const databases: AppDatabase[] = [
    // Core Banking (app-1) databases
    { id: 'db-1', applicationId: 'app-1', name: 'corebanking-db', description: 'Base de datos principal del core bancario', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'prod', technologies: ['tech-4'], microserviceIds: ['ms-1', 'ms-2'], host: 'pg.corebanking.internal', port: 5432, isManaged: false, createdAt: days(365), updatedAt: days(1) },
    { id: 'db-2', applicationId: 'app-1', name: 'corebanking-cache', description: 'Caché distribuida para sesiones y rate-limiting', engine: 'Redis', version: '7', dbType: 'cache', environment: 'prod', technologies: ['tech-6'], microserviceIds: ['ms-1', 'ms-2', 'ms-3'], host: 'redis.corebanking.internal', port: 6379, isManaged: true, createdAt: days(365), updatedAt: days(1) },
    { id: 'db-3', applicationId: 'app-1', name: 'corebanking-legacy-db', description: 'Base de datos legacy del core bancario (migración en curso)', engine: 'SQL Server', version: '2019', dbType: 'relational', environment: 'prod', technologies: ['tech-5'], microserviceIds: ['ms-2'], host: 'sql.corebanking.internal', port: 1433, isManaged: false, createdAt: days(730), updatedAt: days(30) },
    // Portal Clientes (app-2) databases
    { id: 'db-4', applicationId: 'app-2', name: 'portal-db', description: 'Base de datos del portal de clientes', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'prod', technologies: ['tech-4'], microserviceIds: ['ms-4', 'ms-5'], host: 'pg.portal.internal', port: 5432, isManaged: true, createdAt: days(365), updatedAt: days(5) },
    { id: 'db-5', applicationId: 'app-2', name: 'portal-cache', description: 'Caché de sesiones del portal', engine: 'Redis', version: '7', dbType: 'cache', environment: 'prod', technologies: ['tech-6'], microserviceIds: ['ms-4'], host: 'redis.portal.internal', port: 6379, isManaged: true, createdAt: days(365), updatedAt: days(5) },
    // Payments (app-4) databases
    { id: 'db-6', applicationId: 'app-4', name: 'payments-db', description: 'Base de datos transaccional de pagos', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'prod', technologies: ['tech-4'], microserviceIds: ['ms-6'], host: 'pg.payments.internal', port: 5432, isManaged: false, createdAt: days(365), updatedAt: days(1) },
    { id: 'db-7', applicationId: 'app-4', name: 'fraud-cache', description: 'Caché en memoria para detección de fraudes en tiempo real', engine: 'Redis', version: '7', dbType: 'cache', environment: 'prod', technologies: ['tech-6'], microserviceIds: ['ms-7'], host: 'redis.fraud.internal', port: 6379, isManaged: true, createdAt: days(365), updatedAt: days(1) },
    // Legacy (app-5) databases
    { id: 'db-8', applicationId: 'app-5', name: 'legacy-crm-db', description: 'Base de datos del CRM legacy', engine: 'SQL Server', version: '2019', dbType: 'relational', environment: 'prod', technologies: ['tech-5'], microserviceIds: [], host: 'sql.legacy.internal', port: 1433, isManaged: false, createdAt: days(1095), updatedAt: days(60) },
    // Intranet (app-8) databases
    { id: 'db-9', applicationId: 'app-8', name: 'intranet-db', description: 'Base de datos de la intranet corporativa', engine: 'MySQL', version: '5.7', dbType: 'relational', environment: 'prod', technologies: ['tech-12'], microserviceIds: [], host: 'mysql.intranet.internal', port: 3306, isManaged: false, createdAt: days(730), updatedAt: days(90) },
    // Analytics (app-6) database
    { id: 'db-10', applicationId: 'app-6', name: 'analytics-warehouse', description: 'Data warehouse de analytics', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'prod', technologies: ['tech-4'], microserviceIds: [], host: 'pg.analytics.internal', port: 5432, isManaged: true, createdAt: days(180), updatedAt: days(5) },
    // Data Lake (app-9) databases
    { id: 'db-11', applicationId: 'app-9', name: 'datalake-metastore', description: 'Metastore del data lake', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'staging', technologies: ['tech-4'], microserviceIds: ['ms-8'], host: 'pg.datalake.internal', port: 5432, isManaged: true, createdAt: days(180), updatedAt: days(5) },
    // QA/DEV environment databases
    { id: 'db-12', applicationId: 'app-1', name: 'corebanking-db-dev', description: 'Entorno de desarrollo del core bancario', engine: 'PostgreSQL', version: '16', dbType: 'relational', environment: 'dev', technologies: ['tech-4'], microserviceIds: ['ms-1', 'ms-2'], host: 'pg-dev.corebanking.internal', port: 5432, isManaged: false, createdAt: days(180), updatedAt: days(5) },
  ]

  // ── Vulnerabilities spread across time windows ──
  // --- NEGATIVE indicators (open, critical/high) ---
  // 2d ago — critical, open (shows in 7d, 30d, 90d, ytd)
  const vuln_7d: Vulnerability = { id: 'vuln-1', applicationId: 'app-1', externalId: 'CVE-2024-001', title: 'SQL Injection en módulo de autenticación', description: 'Vulnerabilidad de inyección SQL', cvssScore: 9.8, severity: 'critical', source: 'fluid_attacks', status: 'open', slaDeadline: days(-5), detectedAt: days(2), fixedAt: null, metadata: {}, createdAt: days(2), updatedAt: days(2) }
  // 5d ago — high, open
  const vuln_7d_b: Vulnerability = { id: 'vuln-5', applicationId: 'app-3', externalId: 'CVE-2024-005', title: 'Exposición de datos sensibles', description: 'Información sensible expuesta en logs', cvssScore: 7.0, severity: 'high', source: 'sonarqube', status: 'open', slaDeadline: days(-25), detectedAt: days(5), fixedAt: null, metadata: {}, createdAt: days(5), updatedAt: days(5) }
  // 3d ago — medium, in_progress
  const vuln_7d_c: Vulnerability = { id: 'vuln-9', applicationId: 'app-6', externalId: 'CVE-2024-009', title: 'Script injection en dashboard', description: 'Posible inyección de scripts en dashboard de analytics', cvssScore: 5.5, severity: 'medium', source: 'sonarqube', status: 'in_progress', slaDeadline: days(-80), detectedAt: days(3), fixedAt: null, metadata: {}, createdAt: days(3), updatedAt: days(3) }
  // ~20d ago — high, in_progress (shows in 30d, 90d, ytd — NOT in 7d)
  const vuln_30d: Vulnerability = { id: 'vuln-2', applicationId: 'app-2', externalId: 'CVE-2024-002', title: 'XSS en formulario de búsqueda', description: 'Cross-site scripting', cvssScore: 7.5, severity: 'high', source: 'sonarqube', status: 'in_progress', slaDeadline: days(-20), detectedAt: days(20), fixedAt: null, metadata: {}, createdAt: days(20), updatedAt: days(20) }
  // ~60d ago — high, open (shows in 90d, ytd — NOT in 7d or 30d)
  const vuln_90d: Vulnerability = { id: 'vuln-3', applicationId: 'app-1', externalId: 'CVE-2024-003', title: 'Desbordamiento de buffer', description: 'Buffer overflow en servicio de pagos', cvssScore: 8.1, severity: 'high', source: 'fluid_attacks', status: 'open', slaDeadline: days(-15), detectedAt: days(60), fixedAt: null, metadata: {}, createdAt: days(60), updatedAt: days(60) }
  // ~180d ago — medium, accepted (shows in ytd only)
  const vuln_ytd: Vulnerability = { id: 'vuln-4', applicationId: 'app-5', externalId: 'CVE-2024-004', title: 'Autenticación débil', description: 'Mecanismo de autenticación vulnerable', cvssScore: 6.5, severity: 'medium', source: 'manual', status: 'accepted', slaDeadline: days(-60), detectedAt: days(180), fixedAt: null, metadata: {}, createdAt: days(180), updatedAt: days(180) }
  // --- POSITIVE indicators (fixed/resolved) ---
  // ~15d ago — critical, fixed (shows improvement in 30d, 90d)
  const vuln_fixed_30d: Vulnerability = { id: 'vuln-6', applicationId: 'app-4', externalId: 'CVE-2024-006', title: 'Race condition en procesador de pagos', description: 'Condición de carrera en sistema de pagos batch', cvssScore: 8.5, severity: 'high', source: 'fluid_attacks', status: 'fixed', slaDeadline: days(-10), detectedAt: days(45), fixedAt: days(15), metadata: {}, createdAt: days(45), updatedAt: days(15) }
  // ~45d ago — critical, fixed
  const vuln_fixed_90d: Vulnerability = { id: 'vuln-7', applicationId: 'app-1', externalId: 'CVE-2024-007', title: 'Deserialización insegura', description: 'Vulnerabilidad de deserialización en API REST', cvssScore: 9.0, severity: 'critical', source: 'fluid_attacks', status: 'fixed', slaDeadline: days(-35), detectedAt: days(90), fixedAt: days(45), metadata: {}, createdAt: days(90), updatedAt: days(45) }
  // ~120d ago — high, fixed
  const vuln_fixed_ytd: Vulnerability = { id: 'vuln-8', applicationId: 'app-2', externalId: 'CVE-2024-008', title: 'IDOR en perfiles de usuario', description: 'Acceso no autorizado a perfiles de otros usuarios', cvssScore: 7.2, severity: 'high', source: 'sonarqube', status: 'fixed', slaDeadline: days(-110), detectedAt: days(150), fixedAt: days(120), metadata: {}, createdAt: days(150), updatedAt: days(120) }

  const vulnerabilities = [vuln_7d, vuln_7d_b, vuln_7d_c, vuln_30d, vuln_90d, vuln_ytd, vuln_fixed_30d, vuln_fixed_90d, vuln_fixed_ytd]

  // ── Incidents spread across time ──
  const daysAgo = (n: number, offsetMs = 0) => new Date(now - n * 24 * 60 * 60 * 1000 + offsetMs)
  // --- NEGATIVE: still open ---
  const inc_open: Incident = { id: 'inc-3', applicationId: 'app-3', externalId: 'INC-003', title: 'Error 500 en carrito de compras', description: 'Error intermitente en endpoint de carrito', severity: 'high', status: 'in_progress', detectedAt: daysAgo(2), respondedAt: daysAgo(2, 10 * 60 * 1000), resolvedAt: null, downtimeMinutes: 45, rca: null, metadata: {}, createdAt: daysAgo(2), updatedAt: daysAgo(2) }
  const inc_detected: Incident = { id: 'inc-4', applicationId: 'app-1', externalId: 'INC-004', title: 'Intento de acceso no autorizado', description: 'Múltiples intentos fallidos de autenticación desde IP externa', severity: 'critical', status: 'detected', detectedAt: daysAgo(0, -2 * 60 * 60 * 1000), respondedAt: null, resolvedAt: null, downtimeMinutes: 0, rca: null, metadata: {}, createdAt: daysAgo(0, -2 * 60 * 60 * 1000), updatedAt: daysAgo(0, -2 * 60 * 60 * 1000) }
  // --- POSITIVE: resolved (show improvement) ---
  // 3d ago — resolved (shows in 7d, 30d, 90d, ytd)
  const inc_7d: Incident = { id: 'inc-2', applicationId: 'app-2', externalId: 'INC-002', title: 'Lentitud en portal', description: 'El portal presenta lentitud', severity: 'medium', status: 'resolved', detectedAt: daysAgo(3), respondedAt: daysAgo(3, 30 * 60 * 1000), resolvedAt: daysAgo(3, 3 * 60 * 60 * 1000), downtimeMinutes: 0, rca: 'Alto tráfico durante campaña', metadata: {}, createdAt: daysAgo(3), updatedAt: daysAgo(3) }
  // ~25d ago — resolved (shows in 30d, 90d, ytd — NOT in 7d)
  const inc_30d: Incident = { id: 'inc-1', applicationId: 'app-1', externalId: 'INC-001', title: 'Caída del servicio de pagos', description: 'El servicio de pagos no responde', severity: 'critical', status: 'resolved', detectedAt: daysAgo(25), respondedAt: daysAgo(25, 15 * 60 * 1000), resolvedAt: daysAgo(25, 2 * 60 * 60 * 1000), downtimeMinutes: 120, rca: 'Problema de conexión a base de datos', metadata: {}, createdAt: daysAgo(25), updatedAt: daysAgo(25) }
  // ~75d ago — resolved (shows in 90d, ytd only)
  const inc_90d: Incident = { id: 'inc-5', applicationId: 'app-9', externalId: 'INC-005', title: 'Caída del Data Lake', description: 'Data Lake no disponible por fallo de nodo Kafka', severity: 'high', status: 'resolved', detectedAt: daysAgo(75), respondedAt: daysAgo(75, 20 * 60 * 1000), resolvedAt: daysAgo(75, 6 * 60 * 60 * 1000), downtimeMinutes: 360, rca: 'Fallo de hardware en nodo de streaming', metadata: {}, createdAt: daysAgo(75), updatedAt: daysAgo(75) }
  // ~200d ago — resolved (shows in ytd only)
  const inc_ytd: Incident = { id: 'inc-6', applicationId: 'app-5', externalId: 'INC-006', title: 'Fallo en CRM Legacy', description: 'Caída del servidor SQL Server 2019', severity: 'medium', status: 'resolved', detectedAt: daysAgo(200), respondedAt: daysAgo(200, 45 * 60 * 1000), resolvedAt: daysAgo(200, 4 * 60 * 60 * 1000), downtimeMinutes: 240, rca: 'Falta de mantenimiento en base de datos legacy', metadata: {}, createdAt: daysAgo(200), updatedAt: daysAgo(200) }

  const incidents = [inc_open, inc_detected, inc_7d, inc_30d, inc_90d, inc_ytd]

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
    { id: 'team-1', businessUnitId: 'bu-digital', name: 'Platform Team', sourceSystem: 'jira', externalId: 'TEAM-1', members: [
      { id: 'tm-1', userPrincipal: 'user-1', displayName: 'Juan Pérez', role: 'tech_lead', allocationPct: 100, status: 'activo' },
      { id: 'tm-3', userPrincipal: 'user-3', displayName: 'Carlos López', role: 'senior_developer', allocationPct: 100, status: 'activo' },
      { id: 'tm-4', userPrincipal: 'user-4', displayName: 'Ana Martínez', role: 'developer', allocationPct: 100, status: 'activo' },
      { id: 'tm-5', userPrincipal: 'user-5', displayName: 'Pedro Sánchez', role: 'intern', allocationPct: 100, status: 'activo' },
    ], currentMetrics: { velocity: 45, leadTimeHours: 12, cycleTimeHours: 8, throughput: 12, deploymentFrequency: 2, changeFailureRate: 3, mttrHours: 0.5, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
    { id: 'team-2', businessUnitId: 'bu-core', name: 'Core Squad', sourceSystem: 'azure_devops', externalId: 'TEAM-2', members: [
      { id: 'tm-2', userPrincipal: 'user-2', displayName: 'María García', role: 'senior_developer', allocationPct: 100, status: 'activo' },
      { id: 'tm-6', userPrincipal: 'user-6', displayName: 'Laura Rodríguez', role: 'tech_lead', allocationPct: 100, status: 'activo' },
      { id: 'tm-7', userPrincipal: 'user-7', displayName: 'Diego Fernández', role: 'developer', allocationPct: 100, status: 'vacaciones' },
      { id: 'tm-8', userPrincipal: 'user-8', displayName: 'Sofía Torres', role: 'intern', allocationPct: 100, status: 'activo' },
    ], currentMetrics: { velocity: 38, leadTimeHours: 24, cycleTimeHours: 16, throughput: 10, deploymentFrequency: 1, changeFailureRate: 8, mttrHours: 2, measuredAt: new Date() }, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
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

  // ── Health Index history: 12 entries across ~360d showing trend ──
  // Starts low (55) 360d ago, fluctuates, ends at 78
  // Pattern: volatile first half, improving second half (security fixes + migrations)
  const thiEntries: { daysAgo: number; scores: [number, number, number, number, number, number, number] }[] = [
    { daysAgo: 360, scores: [45, 55, 35, 80, 40, 50, 60] },  // Crítico: baseline bajo, muchas vulns
    { daysAgo: 300, scores: [50, 58, 38, 82, 42, 52, 62] },  // Mejora leve
    { daysAgo: 240, scores: [55, 60, 42, 85, 40, 55, 65] },  // Estable
    { daysAgo: 180, scores: [48, 62, 40, 83, 38, 48, 68] },  // Caída por incidentes security
    { daysAgo: 120, scores: [60, 65, 48, 86, 45, 58, 70] },  // Recuperación parcial
    { daysAgo: 90, scores: [58, 68, 50, 88, 48, 60, 72] },   // 
    { daysAgo: 60, scores: [65, 72, 55, 90, 50, 62, 75] },   // Sube por fixes de vulns
    { daysAgo: 45, scores: [70, 75, 58, 92, 52, 65, 78] },   // 
    { daysAgo: 30, scores: [68, 78, 60, 93, 55, 68, 80] },   // Ligera caída delivery
    { daysAgo: 20, scores: [72, 80, 62, 94, 58, 70, 82] },   // 
    { daysAgo: 10, scores: [74, 80, 65, 95, 58, 72, 83] },   // Security mejora
    { daysAgo: 2, scores: [75, 80, 68, 95, 60, 74, 85] },    // Hoy: 78 overall
  ]

  const healthHistory: HealthIndex[] = thiEntries.map((e, i) => {
    const [delivery, quality, security, availability, obsolescence, risk, compliance] = e.scores
    const overall = Math.round(
      (delivery * 20 + quality * 15 + security * 20 + availability * 15 + obsolescence * 10 + risk * 10 + compliance * 10) / 100
    )
    const trend: 'stable' | 'improving' | 'declining' =
      i > 0 && overall > thiEntries[i - 1].scores.reduce((a, b) => a + b, 0) / 7 ? 'improving'
        : i > 0 && overall < thiEntries[i - 1].scores.reduce((a, b) => a + b, 0) / 7 ? 'declining'
          : 'stable'

    return {
      id: `hi-${i + 1}`,
      businessUnitId: 'all',
      tenantId: 'tenant-1',
      deliveryScore: delivery,
      qualityScore: quality,
      securityScore: security,
      availabilityScore: availability,
      obsolescenceScore: obsolescence,
      riskScore: risk,
      complianceScore: compliance,
      overallScore: overall,
      weights: { delivery: 20, quality: 15, security: 20, availability: 15, obsolescence: 10, risk: 10, compliance: 10 },
      calculatedAt: days(e.daysAgo),
      trend,
    } satisfies HealthIndex
  })

  const users: User[] = [
    { id: 'user-1', email: 'admin@tgp.demo', displayName: 'Admin', role: 'admin', businessUnitIds: ['bu-digital', 'bu-core', 'bu-legacy'], isActive: true, createdAt: new Date() },
  ]

  await db.tenants.add(tenant)
  await db.businessUnits.bulkAdd(businessUnits)
  await db.technologies.bulkAdd(technologies)
  await db.applications.bulkAdd(applications)
  await db.applicationDependencies.bulkAdd(appDeps)
  await db.vulnerabilities.bulkAdd(vulnerabilities)
  await db.incidents.bulkAdd(incidents)
  await db.risks.bulkAdd(risks)
  await db.auditFindings.bulkAdd(auditFindings)
  await db.teams.bulkAdd(teams)
  await db.objectives.bulkAdd(objectives)
  await db.deliverables.bulkAdd(deliverables)
  await db.microservices.bulkAdd(microservices)
  await db.appDatabases.bulkAdd(databases)
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

  // ── Performance module seed data ──
  const ds2 = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    d.setHours(12, 0, 0, 0)
    return d
  }

  const memberProfiles: MemberProfile[] = [
    { id: 'tm-1', teamId: 'team-1', email: 'juan.perez@tgp.demo', phoneCell: '+56911111111', phoneHome: '+56911111112', address: 'Santiago, Chile', role: 'tech_lead', skills: [{ id: 'sk-1', name: 'Arquitectura', level: 'expert', category: 'Arquitectura' }, { id: 'sk-2', name: 'Node.js', level: 'advanced', category: 'Backend' }, { id: 'sk-3', name: 'React', level: 'advanced', category: 'Frontend' }], technologies: ['tech-2', 'tech-4', 'tech-6', 'tech-7'], microservices: ['ms-1', 'ms-2', 'ms-6'], avgStoryPoints: 41, vacationDaysPerYear: 14, vacationUsed: 5, createdAt: ds2(-180), updatedAt: ds2(-1) },
    { id: 'tm-3', teamId: 'team-1', email: 'carlos.lopez@tgp.demo', phoneCell: '+56911111113', phoneHome: '', address: 'Santiago, Chile', role: 'senior_developer', skills: [{ id: 'sk-4', name: '.NET', level: 'expert', category: 'Backend' }, { id: 'sk-5', name: 'PostgreSQL', level: 'advanced', category: 'Base de Datos' }, { id: 'sk-6', name: 'Docker', level: 'intermediate', category: 'DevOps' }], technologies: ['tech-1', 'tech-4', 'tech-5'], microservices: ['ms-2'], avgStoryPoints: 31, vacationDaysPerYear: 14, vacationUsed: 3, createdAt: ds2(-180), updatedAt: ds2(-1) },
    { id: 'tm-4', teamId: 'team-1', email: 'ana.martinez@tgp.demo', phoneCell: '+56911111114', phoneHome: '', address: 'Santiago, Chile', role: 'developer', skills: [{ id: 'sk-7', name: 'Angular', level: 'intermediate', category: 'Frontend' }, { id: 'sk-8', name: 'TypeScript', level: 'intermediate', category: 'Frontend' }, { id: 'sk-9', name: 'Python', level: 'beginner', category: 'Backend' }], technologies: ['tech-3', 'tech-7', 'tech-13'], microservices: ['ms-4', 'ms-5'], avgStoryPoints: 21, vacationDaysPerYear: 14, vacationUsed: 7, createdAt: ds2(-120), updatedAt: ds2(-1) },
    { id: 'tm-5', teamId: 'team-1', email: 'pedro.sanchez@tgp.demo', phoneCell: '+56911111115', phoneHome: '', address: 'Santiago, Chile', role: 'intern', skills: [{ id: 'sk-10', name: 'JavaScript', level: 'beginner', category: 'Frontend' }, { id: 'sk-11', name: 'SQL', level: 'beginner', category: 'Base de Datos' }], technologies: ['tech-7', 'tech-13'], microservices: [], avgStoryPoints: 11, vacationDaysPerYear: 14, vacationUsed: 2, createdAt: ds2(-60), updatedAt: ds2(-1) },
    { id: 'tm-2', teamId: 'team-2', email: 'maria.garcia@tgp.demo', phoneCell: '+56922222221', phoneHome: '', address: 'Valparaíso, Chile', role: 'senior_developer', skills: [{ id: 'sk-12', name: 'Java', level: 'expert', category: 'Backend' }, { id: 'sk-13', name: 'Spring Boot', level: 'advanced', category: 'Backend' }, { id: 'sk-14', name: 'PostgreSQL', level: 'advanced', category: 'Base de Datos' }], technologies: ['tech-2', 'tech-4', 'tech-6'], microservices: ['ms-1', 'ms-6'], avgStoryPoints: 34, vacationDaysPerYear: 14, vacationUsed: 4, createdAt: ds2(-180), updatedAt: ds2(-1) },
    { id: 'tm-6', teamId: 'team-2', email: 'laura.rodriguez@tgp.demo', phoneCell: '+56922222222', phoneHome: '+56922222223', address: 'Viña del Mar, Chile', role: 'tech_lead', skills: [{ id: 'sk-15', name: 'Arquitectura', level: 'expert', category: 'Arquitectura' }, { id: 'sk-16', name: 'Python', level: 'advanced', category: 'Backend' }, { id: 'sk-17', name: 'Kubernetes', level: 'advanced', category: 'DevOps' }, { id: 'sk-18', name: 'Redis', level: 'intermediate', category: 'Cache' }], technologies: ['tech-8', 'tech-14', 'tech-15', 'tech-16', 'tech-6'], microservices: ['ms-7', 'ms-8', 'ms-9'], avgStoryPoints: 41, vacationDaysPerYear: 14, vacationUsed: 2, createdAt: ds2(-180), updatedAt: ds2(-1) },
    { id: 'tm-7', teamId: 'team-2', email: 'diego.fernandez@tgp.demo', phoneCell: '+56922222224', phoneHome: '', address: 'Valparaíso, Chile', role: 'developer', skills: [{ id: 'sk-19', name: 'Java', level: 'intermediate', category: 'Backend' }, { id: 'sk-20', name: 'React', level: 'intermediate', category: 'Frontend' }], technologies: ['tech-2', 'tech-13'], microservices: ['ms-6'], avgStoryPoints: 14, vacationDaysPerYear: 14, vacationUsed: 10, createdAt: ds2(-90), updatedAt: ds2(-1) },
    { id: 'tm-8', teamId: 'team-2', email: 'sofia.torres@tgp.demo', phoneCell: '+56922222225', phoneHome: '', address: 'Valparaíso, Chile', role: 'intern', skills: [{ id: 'sk-21', name: 'JavaScript', level: 'beginner', category: 'Frontend' }, { id: 'sk-22', name: 'HTML/CSS', level: 'beginner', category: 'Frontend' }], technologies: ['tech-13'], microservices: [], avgStoryPoints: 7, vacationDaysPerYear: 14, vacationUsed: 0, createdAt: ds2(-45), updatedAt: ds2(-1) },
  ]

  // ── Generate sprint records for 12 sprints per team ──
  // Q1: Sprint 1-6 (Team-1) / Sprint A-F (Team-2)
  // Q2: Sprint 7-12 (Team-1) / Sprint G-L (Team-2)
  // Each sprint ~15 days, end-to-end covering ~180 days
  const sprintsPerTeam = 12
  const sprintSpanDays = 15

  const team1Names = Array.from({ length: sprintsPerTeam }, (_, i) => `Sprint ${i + 1}`)
  const team2Names = Array.from({ length: sprintsPerTeam }, (_, i) => `Sprint ${String.fromCharCode(65 + i)}`)

  const getQuarter = (idx: number) => (idx < 6 ? 'Q1' : 'Q2')
  const getDate = (idx: number, end: boolean) =>
    ds2(-180 + idx * sprintSpanDays + (end ? sprintSpanDays - 1 : 0))

  // Per-sprint [completedSP, notCompletedSP] patterns per member
  // Team-1 (Platform Team): Juan(tm-1) + Carlos(tm-3) from sprint 1
  //   Ana(tm-4) + Pedro(tm-5) from sprint 3
  // Sprint 3 (index 2): all 4 members have [20,5] → teamTotal = 4×(20+5) = 100
  const t1Juan: Array<[number, number]> = [
    [40,5],[45,3],[20,5],[42,4],[41,5],[44,3],
    [39,6],[43,4],[40,5],[42,3],[45,4],[41,5],
  ]
  const t1Carlos: Array<[number, number]> = [
    [30,8],[35,5],[20,5],[32,6],[31,7],[33,5],
    [29,9],[34,6],[30,8],[32,5],[35,6],[31,7],
  ]
  const t1Ana: Array<[number, number] | null> = [
    null,null,[20,5],[22,12],[19,14],[21,11],
    [18,16],[23,10],[20,13],[22,11],[25,10],[20,12],
  ]
  const t1Pedro: Array<[number, number] | null> = [
    null,null,[20,5],[12,18],[8,22],[11,19],
    [9,21],[13,17],[10,20],[12,18],[15,16],[11,19],
  ]

  // Team-2 (Core Squad): Maria(tm-2) + Laura(tm-6) from sprint A
  //   Diego(tm-7) + Sofia(tm-8) from sprint G (idx 6)
  const t2Maria: Array<[number, number]> = [
    [35,5],[32,8],[38,4],[30,6],[36,5],[33,7],
    [31,6],[34,4],[37,5],[32,6],[35,4],[30,7],
  ]
  const t2Laura: Array<[number, number]> = [
    [42,3],[38,5],[45,2],[40,4],[43,3],[41,4],
    [44,3],[39,5],[42,3],[40,4],[43,2],[41,3],
  ]
  const t2Diego: Array<[number, number] | null> = [
    null,null,null,null,null,null,
    [15,10],[12,8],[14,9],[13,10],[16,7],[12,11],
  ]
  const t2Sofia: Array<[number, number] | null> = [
    null,null,null,null,null,null,
    [8,25],[5,20],[10,22],[7,23],[9,21],[6,24],
  ]

  let srId = 0
  const nextSrId = () => `sr-${++srId}`

  const sprintRecords: SprintRecord[] = []

  for (let i = 0; i < sprintsPerTeam; i++) {
    const t1Name = team1Names[i]
    const t2Name = team2Names[i]
    const quarter = getQuarter(i)
    const date = getDate(i, true)

    const pushSr = (memberId: string, name: string, pair: [number, number] | null) => {
      if (!pair) return
      sprintRecords.push({
        id: nextSrId(), memberId, sprintName: name,
        quarter, year: 2026,
        storyPointsCompleted: pair[0],
        storyPointsNotCompleted: pair[1],
        createdAt: date,
      })
    }

    pushSr('tm-1', t1Name, t1Juan[i])
    pushSr('tm-3', t1Name, t1Carlos[i])
    pushSr('tm-4', t1Name, t1Ana[i])
    pushSr('tm-5', t1Name, t1Pedro[i])

    pushSr('tm-2', t2Name, t2Maria[i])
    pushSr('tm-6', t2Name, t2Laura[i])
    pushSr('tm-7', t2Name, t2Diego[i])
    pushSr('tm-8', t2Name, t2Sofia[i])
  }

  const oneOnOnes: OneOnOne[] = [
    // Juan Pérez — 3 reuniones, ánimo alto
    { id: 'oo-1', memberId: 'tm-1', date: ds2(-45), tipo: 'semanal', feedbackDelLider: 'Excelente desempeño en la migración, liderazgo técnico destacado.', feedbackDelMiembro: 'Me gustaría tener más tiempo para investigar nuevas tecnologías.', estadoAnimo: 5, oportunidades: [{ id: 'op-1', descripcion: 'Liderar taller de arquitectura', tipo: 'crecimiento', status: 'completada', createdAt: ds2(-45) }], acciones: [{ id: 'ac-1', descripcion: 'Asignar tiempo de investigación', asignadoA: 'Juan Pérez', fechaLimite: ds2(-15), completada: true, completadaEn: ds2(-20) }], compromisos: [{ id: 'co-1', descripcion: 'Preparar presentación de arquitectura', fechaCompromiso: ds2(-30), cumplido: true, cumplidoEn: ds2(-31) }], createdAt: ds2(-45), updatedAt: ds2(-45) },
    { id: 'oo-2', memberId: 'tm-1', date: ds2(-20), tipo: 'quincenal', feedbackDelLider: 'Buena gestión del equipo, sigue así.', feedbackDelMiembro: 'El equipo está motivado con el proyecto.', estadoAnimo: 4, oportunidades: [{ id: 'op-2', descripcion: 'Certificación AWS Solutions Architect', tipo: 'capacitacion', status: 'en_progreso', createdAt: ds2(-20) }], acciones: [], compromisos: [], createdAt: ds2(-20), updatedAt: ds2(-20) },
    { id: 'oo-3', memberId: 'tm-1', date: ds2(-5), tipo: 'semanal', feedbackDelLider: 'Sprint exitoso, métricas muy buenas.', feedbackDelMiembro: 'Todo bien, equipo rindiendo bien.', estadoAnimo: 5, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-5), updatedAt: ds2(-5) },
    // Carlos López — 2 reuniones
    { id: 'oo-4', memberId: 'tm-3', date: ds2(-30), tipo: 'quincenal', feedbackDelLider: 'Buen trabajo en la migración de bases de datos.', feedbackDelMiembro: 'Me gustaría aprender más sobre Kubernetes.', estadoAnimo: 4, oportunidades: [{ id: 'op-3', descripcion: 'Curso de Kubernetes', tipo: 'capacitacion', status: 'pendiente', createdAt: ds2(-30) }], acciones: [{ id: 'ac-2', descripcion: 'Inscribir a Carlos en curso K8s', asignadoA: 'Juan Pérez', fechaLimite: ds2(-10), completada: false, completadaEn: null }], compromisos: [], createdAt: ds2(-30), updatedAt: ds2(-30) },
    { id: 'oo-5', memberId: 'tm-3', date: ds2(-7), tipo: 'semanal', feedbackDelLider: 'Sigue mejorando, consistente.', feedbackDelMiembro: 'El equipo de core necesita más apoyo.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-7), updatedAt: ds2(-7) },
    // Ana Martínez — 2 reuniones
    { id: 'oo-6', memberId: 'tm-4', date: ds2(-25), tipo: 'quincenal', feedbackDelLider: 'Cumpliendo objetivos, pero mejorar estimaciones.', feedbackDelMiembro: 'Me siento un poco sobrecargada de trabajo.', estadoAnimo: 3, oportunidades: [{ id: 'op-4', descripcion: 'Mejora en estimación ágil', tipo: 'mejora', status: 'en_progreso', createdAt: ds2(-25) }], acciones: [{ id: 'ac-3', descripcion: 'Revisar carga de trabajo semanal', asignadoA: 'Juan Pérez', fechaLimite: ds2(-10), completada: true, completadaEn: ds2(-12) }], compromisos: [], createdAt: ds2(-25), updatedAt: ds2(-25) },
    { id: 'oo-7', memberId: 'tm-4', date: ds2(-3), tipo: 'semanal', feedbackDelLider: 'Mejorando, sigue practicando.', feedbackDelMiembro: 'Necesito ayuda con Angular.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-3), updatedAt: ds2(-3) },
    // Pedro Sánchez — 3 reuniones, ánimo bajo
    { id: 'oo-8', memberId: 'tm-5', date: ds2(-35), tipo: 'semanal', feedbackDelLider: 'Está aprendiendo, tiene potencial.', feedbackDelMiembro: 'Me cuesta seguir el ritmo del equipo.', estadoAnimo: 2, oportunidades: [{ id: 'op-5', descripcion: 'Mentoría con senior', tipo: 'mentoria', status: 'en_progreso', createdAt: ds2(-35) }], acciones: [{ id: 'ac-4', descripcion: 'Asignar mentor', asignadoA: 'Juan Pérez', fechaLimite: ds2(-28), completada: true, completadaEn: ds2(-28) }], compromisos: [], createdAt: ds2(-35), updatedAt: ds2(-35) },
    { id: 'oo-9', memberId: 'tm-5', date: ds2(-14), tipo: 'semanal', feedbackDelLider: 'Progreso lento pero constante.', feedbackDelMiembro: 'La mentoría está ayudando.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-14), updatedAt: ds2(-14) },
    { id: 'oo-10', memberId: 'tm-5', date: ds2(-2), tipo: 'semanal', feedbackDelLider: 'Mejorando en JavaScript.', feedbackDelMiembro: 'Quiero aprender React.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-2), updatedAt: ds2(-2) },
    // María García — 2 reuniones
    { id: 'oo-11', memberId: 'tm-2', date: ds2(-20), tipo: 'quincenal', feedbackDelLider: 'Sólido desempeño, referente técnico.', feedbackDelMiembro: 'Equipo motivado, buen ambiente.', estadoAnimo: 4, oportunidades: [{ id: 'op-6', descripcion: 'Ascenso a tech lead', tipo: 'ascenso', status: 'pendiente', createdAt: ds2(-20) }], acciones: [], compromisos: [], createdAt: ds2(-20), updatedAt: ds2(-20) },
    { id: 'oo-12', memberId: 'tm-2', date: ds2(-4), tipo: 'semanal', feedbackDelLider: 'Sprint excelente, cero deuda técnica.', feedbackDelMiembro: 'Todo bien, sin novedades.', estadoAnimo: 4, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-4), updatedAt: ds2(-4) },
    // Laura Rodríguez — 3 reuniones, ánimo alto
    { id: 'oo-13', memberId: 'tm-6', date: ds2(-40), tipo: 'semanal', feedbackDelLider: 'Liderazgo excepcional en el equipo core.', feedbackDelMiembro: 'El equipo está alineado con los objetivos.', estadoAnimo: 5, oportunidades: [{ id: 'op-7', descripcion: 'Programa de liderazgo técnico', tipo: 'crecimiento', status: 'completada', createdAt: ds2(-40) }], acciones: [], compromisos: [], createdAt: ds2(-40), updatedAt: ds2(-40) },
    { id: 'oo-14', memberId: 'tm-6', date: ds2(-15), tipo: 'quincenal', feedbackDelLider: 'Métricas mejorando continuamente.', feedbackDelMiembro: 'Todo fluye bien, equipo comprometido.', estadoAnimo: 4, oportunidades: [{ id: 'op-8', descripcion: 'Certificación Google Cloud', tipo: 'capacitacion', status: 'en_progreso', createdAt: ds2(-15) }], acciones: [], compromisos: [], createdAt: ds2(-15), updatedAt: ds2(-15) },
    { id: 'oo-15', memberId: 'tm-6', date: ds2(-2), tipo: 'semanal', feedbackDelLider: 'Sprint récord, 45 SP completados.', feedbackDelMiembro: 'Excelente dinámica de equipo.', estadoAnimo: 5, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-2), updatedAt: ds2(-2) },
    // Diego Fernández — 1 reunión
    { id: 'oo-16', memberId: 'tm-7', date: ds2(-10), tipo: 'quincenal', feedbackDelLider: 'Rendimiento aceptable, pero puede mejorar.', feedbackDelMiembro: 'Estoy de vacaciones la próxima semana.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-10), updatedAt: ds2(-10) },
    // Sofía Torres — 2 reuniones, ánimo bajo
    { id: 'oo-17', memberId: 'tm-8', date: ds2(-20), tipo: 'semanal', feedbackDelLider: 'Necesita mejorar velocidad, pero buena actitud.', feedbackDelMiembro: 'Me cuesta entender las historias de usuario.', estadoAnimo: 2, oportunidades: [{ id: 'op-9', descripcion: 'Curso de metodologías ágiles', tipo: 'capacitacion', status: 'en_progreso', createdAt: ds2(-20) }], acciones: [{ id: 'ac-5', descripcion: 'Asignar pairing con senior', asignadoA: 'Laura Rodríguez', fechaLimite: ds2(-10), completada: true, completadaEn: ds2(-12) }], compromisos: [], createdAt: ds2(-20), updatedAt: ds2(-20) },
    { id: 'oo-18', memberId: 'tm-8', date: ds2(-3), tipo: 'semanal', feedbackDelLider: 'Mejorando con el pairing, sigue así.', feedbackDelMiembro: 'El pairing me está ayudando mucho.', estadoAnimo: 3, oportunidades: [], acciones: [], compromisos: [], createdAt: ds2(-3), updatedAt: ds2(-3) },
  ]

  const achievements: Achievement[] = [
    // Juan Pérez
    { id: 'ach-1', memberId: 'tm-1', title: 'Migración Core Exitosa', description: 'Lideró la migración del core bancario a .NET 8 sin downtime.', date: ds2(-15), type: 'logro', linkedToPromotion: false, createdAt: ds2(-15) },
    { id: 'ach-2', memberId: 'tm-1', title: 'Certificación AWS Solutions Architect', description: 'Obtuvo la certificación AWS Solutions Architect Associate.', date: ds2(-30), type: 'certificacion', linkedToPromotion: false, createdAt: ds2(-30) },
    { id: 'ach-3', memberId: 'tm-1', title: 'Reconocimiento al Liderazgo', description: 'Reconocido por su liderazgo técnico en el Q1 2026.', date: ds2(-60), type: 'reconocimiento', linkedToPromotion: false, createdAt: ds2(-60) },
    { id: 'ach-4', memberId: 'tm-1', title: 'Ascenso a Tech Lead', description: 'Ascendido a Tech Lead del Platform Team.', date: ds2(-180), type: 'ascenso', linkedToPromotion: true, createdAt: ds2(-180) },
    // Carlos López
    { id: 'ach-5', memberId: 'tm-3', title: 'Optimización de Consultas SQL', description: 'Redujo el tiempo de respuesta de consultas críticas en un 60%.', date: ds2(-25), type: 'logro', linkedToPromotion: false, createdAt: ds2(-25) },
    { id: 'ach-6', memberId: 'tm-3', title: 'Mentor del Mes', description: 'Reconocido como mentor del mes por apoyar a junior.', date: ds2(-50), type: 'reconocimiento', linkedToPromotion: false, createdAt: ds2(-50) },
    // Ana Martínez
    { id: 'ach-7', memberId: 'tm-4', title: 'Rediseño Portal Clientes', description: 'Lideró el rediseño del portal mejorando UX y performance.', date: ds2(-20), type: 'logro', linkedToPromotion: false, createdAt: ds2(-20) },
    // Pedro Sánchez
    { id: 'ach-8', memberId: 'tm-5', title: 'Curso JavaScript Avanzado', description: 'Completó el curso de JavaScript avanzado con distinción.', date: ds2(-35), type: 'certificacion', linkedToPromotion: false, createdAt: ds2(-35) },
    // María García
    { id: 'ach-9', memberId: 'tm-2', title: 'Cero Bugs en Sprint', description: 'Entregó su sprint completo sin bugs reportados.', date: ds2(-10), type: 'logro', linkedToPromotion: false, createdAt: ds2(-10) },
    { id: 'ach-10', memberId: 'tm-2', title: 'Ascenso a Senior Developer', description: 'Ascendida a Senior Developer por desempeño consistente.', date: ds2(-180), type: 'ascenso', linkedToPromotion: true, createdAt: ds2(-180) },
    // Laura Rodríguez
    { id: 'ach-11', memberId: 'tm-6', title: 'Mejora en Deploy Frequency', description: 'Aumentó la frecuencia de deploy del equipo a 3 por semana.', date: ds2(-20), type: 'logro', linkedToPromotion: false, createdAt: ds2(-20) },
    { id: 'ach-12', memberId: 'tm-6', title: 'Certificación Google Cloud', description: 'Obtuvo la certificación Professional Cloud Architect.', date: ds2(-10), type: 'certificacion', linkedToPromotion: false, createdAt: ds2(-10) },
    { id: 'ach-13', memberId: 'tm-6', title: 'Premio a la Innovación', description: 'Reconocida por implementar arquitectura de eventos.', date: ds2(-45), type: 'reconocimiento', linkedToPromotion: false, createdAt: ds2(-45) },
    // Diego Fernández
    { id: 'ach-14', memberId: 'tm-7', title: 'Mención por Colaboración', description: 'Destacado por su colaboración en el equipo core.', date: ds2(-30), type: 'reconocimiento', linkedToPromotion: false, createdAt: ds2(-30) },
  ]

  await db.memberProfiles.bulkAdd(memberProfiles)
  await db.sprintRecords.bulkAdd(sprintRecords)
  await db.oneOnOnes.bulkAdd(oneOnOnes)
  await db.achievements.bulkAdd(achievements)

  // ── Build TeamSprint entries aggregated from SprintRecords ──
  let tsId = 0
  const nextTsId = () => `ts-${++tsId}`

  const teamSprints: TeamSprint[] = []

  for (let i = 0; i < sprintsPerTeam; i++) {
    const t1Name = team1Names[i]
    const t2Name = team2Names[i]
    const quarter = getQuarter(i)
    const start = getDate(i, false)
    const end = getDate(i, true)

    // Aggregate Team-1 member contributions
    const t1Cmb = [t1Juan[i], t1Carlos[i], t1Ana[i], t1Pedro[i]]
      .filter((p): p is [number, number] => p !== null)
    const t1Done = t1Cmb.reduce((s, p) => s + p[0], 0)
    const t1NotDone = t1Cmb.reduce((s, p) => s + p[1], 0)
    const t1Planned = t1Done + t1NotDone + Math.round((t1Done + t1NotDone) * 0.08)

    teamSprints.push({
      id: nextTsId(), teamId: 'team-1', sprintName: t1Name,
      quarter, year: 2026,
      startDate: start, endDate: end,
      plannedSP: t1Planned,
      completedSP: t1Done,
      notCompletedSP: t1NotDone,
      createdAt: start, updatedAt: end,
    })

    // Aggregate Team-2 member contributions
    const t2Cmb = [t2Maria[i], t2Laura[i], t2Diego[i], t2Sofia[i]]
      .filter((p): p is [number, number] => p !== null)
    const t2Done = t2Cmb.reduce((s, p) => s + p[0], 0)
    const t2NotDone = t2Cmb.reduce((s, p) => s + p[1], 0)

    // Sprints A,B,G,H match perfectly; C,D,E,F,I,J,K,L have deviations
    const isMismatch = (i >= 2 && i <= 5) || (i >= 8)
    const t2AdjPlanned = isMismatch
      ? t2Done + t2NotDone + Math.round((t2Done + t2NotDone) * 0.12)
      : t2Done + t2NotDone + Math.round((t2Done + t2NotDone) * 0.08)
    const t2AdjDone = isMismatch
      ? Math.round(t2Done * 0.75)
      : t2Done
    const t2AdjNotDone = isMismatch
      ? t2AdjPlanned - t2AdjDone
      : t2NotDone

    teamSprints.push({
      id: nextTsId(), teamId: 'team-2', sprintName: t2Name,
      quarter, year: 2026,
      startDate: start, endDate: end,
      plannedSP: t2AdjPlanned,
      completedSP: t2AdjDone,
      notCompletedSP: t2AdjNotDone,
      createdAt: start, updatedAt: end,
    })
  }

  await db.teamSprints.bulkAdd(teamSprints)

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
