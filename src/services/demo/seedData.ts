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
  Candidate,
  CandidateTechnology,
  CandidateEvaluation,
  Dependency,
} from '@/types/domain'

// Bump version to force re-seed when seed data changes
const SEEDED_FLAG = 'tgp-seeded-v4'
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
    { id: 'dep-1', applicationId: 'app-4', dependsOnAppId: 'app-1', dependencyType: 'api', criticality: 'critical', description: 'Payments ejecuta transacciones sobre cuentas del Core Banking', createdAt: days(365) },
    { id: 'dep-2', applicationId: 'app-2', dependsOnAppId: 'app-1', dependencyType: 'api', criticality: 'high', description: 'Portal consulta saldos y datos del cliente desde Core Banking', createdAt: days(365) },
    { id: 'dep-3', applicationId: 'app-2', dependsOnAppId: 'app-4', dependencyType: 'database', criticality: 'high', description: 'Portal muestra historial de pagos desde Payments', createdAt: days(300) },
    { id: 'dep-4', applicationId: 'app-6', dependsOnAppId: 'app-9', dependencyType: 'database', criticality: 'medium', description: 'Analytics consume datasets procesados del Data Lake', createdAt: days(180) },
    { id: 'dep-5', applicationId: 'app-7', dependsOnAppId: 'app-9', dependencyType: 'database', criticality: 'low', description: 'Reporting genera reportes sobre datos del Data Lake', createdAt: days(200) },
    { id: 'dep-6', applicationId: 'app-3', dependsOnAppId: 'app-2', dependencyType: 'api', criticality: 'high', description: 'App Móvil consume APIs del Portal Clientes', createdAt: days(180) },
    { id: 'dep-7', applicationId: 'app-9', dependsOnAppId: 'app-6', dependencyType: 'database', criticality: 'medium', description: 'Data Lake recibe streams de datos desde Analytics', createdAt: days(150) },
    { id: 'dep-8', applicationId: 'app-1', dependsOnAppId: 'app-9', dependencyType: 'database', criticality: 'medium', description: 'Core Banking consume reportes del Data Lake', createdAt: days(120) },
  ]

  const microservices: Microservice[] = [
    // Core Banking (app-1) microservices
    {
      id: 'ms-1', applicationId: 'app-1', name: 'auth-service',
      description: 'Autenticación y autorización centralizada con OAuth2 y JWT. Gestiona identidades, sesiones y control de acceso basado en roles (RBAC).',
      technologies: ['tech-2', 'tech-4'],
      lifecycleStatus: 'evolving', serviceLevel: 'critical', technicalLead: 'Juan Pérez',
      repository: 'https://github.com/tgp/auth-service',
      documentation: '<h2>Arquitectura</h2><p>API REST con Spring Boot 3 + PostgreSQL 16. Implementa OAuth2 con Keycloak como IdP externo.</p><h2>API</h2><ul><li><code>POST /auth/login</code> — Autenticación usuario/contraseña</li><li><code>POST /auth/refresh</code> — Refresco de token JWT</li><li><code>POST /auth/validate</code> — Validación de token</li></ul><h2>Integraciones</h2><p>Keycloak (IdP), Redis (sesiones), alertas vía RabbitMQ.</p>',
      features: [
        { id: 'mf-1', name: 'Login con MFA', description: 'Autenticación multifactor vía TOTP', status: 'active', category: 'security' },
        { id: 'mf-2', name: 'SSO Corporativo', description: 'Single Sign-On con SAML', status: 'active', category: 'integration' },
        { id: 'mf-3', name: 'Rate Limiting', description: 'Limitación de intentos por IP', status: 'in_progress', category: 'performance' },
        { id: 'mf-4', name: 'WebAuthn', description: 'Soporte para passkeys y biometría', status: 'planned', category: 'security' },
      ],
      roadmap: [
        { id: 'mr-1', title: 'Migrar a Spring Boot 3.4', description: 'Actualizar framework a última versión LTS', type: 'upgrade', targetDate: '2026-09-30', status: 'in_progress', priority: 'high' },
        { id: 'mr-2', title: 'Implementar WebAuthn', description: 'Soporte de passkeys FIDO2 para autenticación sin contraseña', type: 'feature', targetDate: '2026-12-15', status: 'planned', priority: 'medium' },
        { id: 'mr-3', title: 'Deprecar JWT legacy', description: 'Migrar tokens JWT legacy a nuevo formato con claims estándar', type: 'migration', targetDate: '2026-08-01', status: 'planned', priority: 'high' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'ms-2', applicationId: 'app-1', name: 'account-service',
      description: 'Gestión de cuentas bancarias, saldos y transacciones. Core del negocio bancario.',
      technologies: ['tech-1', 'tech-5', 'tech-6'],
      lifecycleStatus: 'active', serviceLevel: 'critical', technicalLead: 'Carlos López',
      repository: 'https://github.com/tgp/account-service',
      features: [
        { id: 'mf-5', name: 'Consulta de saldos', description: 'Saldo disponible y contable en tiempo real', status: 'active', category: 'api' },
        { id: 'mf-6', name: 'Transferencias internas', description: 'Transferencias entre cuentas del mismo banco', status: 'active', category: 'business' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    { id: 'ms-3', applicationId: 'app-1', name: 'notification-service', description: 'Notificaciones push y email para eventos del sistema', technologies: ['tech-7', 'tech-17'], lifecycleStatus: 'active', serviceLevel: 'low', createdAt: new Date(), updatedAt: new Date() },
    // Portal Clientes (app-2) microservices
    {
      id: 'ms-4', applicationId: 'app-2', name: 'api-gateway',
      description: 'API Gateway del portal de clientes. Enrutamiento, rate limiting y transformación de protocolos.',
      technologies: ['tech-7', 'tech-16'],
      lifecycleStatus: 'active', serviceLevel: 'high', technicalLead: 'María García',
      repository: 'https://github.com/tgp/api-gateway',
      documentation: '<h2>Rutas expuestas</h2><ul><li><code>/api/v1/users/*</code> → user-profile-service</li><li><code>/api/v1/products/*</code> → product-service</li><li><code>/api/v1/orders/*</code> → order-service</li></ul>',
      features: [
        { id: 'mf-7', name: 'Rate Limiting', description: 'Límite de 1000 req/min por cliente', status: 'active', category: 'performance' },
        { id: 'mf-8', name: 'Circuit Breaker', description: 'Aislamiento de fallos en servicios aguas abajo', status: 'active', category: 'observability' },
      ],
      roadmap: [
        { id: 'mr-4', title: 'Migrar a Kong 3.x', description: 'Actualizar API Gateway de Kong 2.x a 3.x', type: 'upgrade', targetDate: '2026-07-30', status: 'planned', priority: 'high' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    { id: 'ms-5', applicationId: 'app-2', name: 'user-profile-service', description: 'Gestión de perfiles de usuario y preferencias', technologies: ['tech-8', 'tech-4'], lifecycleStatus: 'active', serviceLevel: 'medium', createdAt: new Date(), updatedAt: new Date() },
    // Payments (app-4) microservices
    {
      id: 'ms-6', applicationId: 'app-4', name: 'payment-processor',
      description: 'Procesador de pagos transaccional. Maneja autorizaciones, capturas, reembolsos y conciliación.',
      technologies: ['tech-2', 'tech-4', 'tech-17'],
      lifecycleStatus: 'evolving', serviceLevel: 'critical', technicalLead: 'Laura Rodríguez',
      repository: 'https://github.com/tgp/payment-processor',
      documentation: '<h2>Flujo de pago</h2><p>Autorización → Captura → Conciliación → Liquidación</p><h2>Integraciones</h2><p>Adquirente externo vía ISO 8583, Webhook de notificaciones, Kafka para eventos</p>',
      features: [
        { id: 'mf-9', name: 'Pago con tarjeta', description: 'Autorización y captura de tarjetas crédito/débito', status: 'active', category: 'business' },
        { id: 'mf-10', name: 'Reembolso automático', description: 'Reembolso total/parcial sin intervención manual', status: 'active', category: 'business' },
        { id: 'mf-11', name: 'Pagos programados', description: 'Suscripciones y pagos recurrentes', status: 'in_progress', category: 'business' },
        { id: 'mf-12', name: 'Detección de anomalías', description: 'ML-based anomaly detection en patrones de pago', status: 'planned', category: 'security' },
      ],
      roadmap: [
        { id: 'mr-5', title: 'Migrar a ISO 8583:2024', description: 'Actualizar protocolo de comunicación con adquirente', type: 'migration', targetDate: '2026-10-01', status: 'planned', priority: 'critical' },
        { id: 'mr-6', title: 'Soporte Pix / SPEI', description: 'Integrar pagos instantáneos Latinoamérica', type: 'feature', targetDate: '2026-12-01', status: 'planned', priority: 'high' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'ms-7', applicationId: 'app-4', name: 'fraud-detection',
      description: 'Detección de fraudes en tiempo real usando machine learning. Analiza patrones de transacciones y genera alertas.',
      technologies: ['tech-8', 'tech-6'],
      lifecycleStatus: 'evolving', serviceLevel: 'high', technicalLead: 'Laura Rodríguez',
      repository: 'https://github.com/tgp/fraud-detection',
      features: [
        { id: 'mf-13', name: 'Score de fraude', description: 'Modelo ML asigna score 0-100 a cada transacción', status: 'active', category: 'security' },
        { id: 'mf-14', name: 'Reglas configurables', description: 'Reglas de negocio para umbrales por tipo de operación', status: 'active', category: 'business' },
        { id: 'mf-15', name: 'Dashboard de alertas', description: 'Panel en tiempo real con alertas de fraude', status: 'in_progress', category: 'observability' },
      ],
      roadmap: [
        { id: 'mr-7', title: 'Nuevo modelo ML v3', description: 'Implementar Random Forest para reducir falsos positivos', type: 'upgrade', targetDate: '2026-09-01', status: 'in_progress', priority: 'high' },
        { id: 'mr-8', title: 'Integrar red neuronal', description: 'Deep learning para detección de fraudes complejos', type: 'feature', targetDate: '2027-01-15', status: 'planned', priority: 'medium' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    // Data Lake (app-9) microservices
    {
      id: 'ms-8', applicationId: 'app-9', name: 'data-ingestion',
      description: 'Ingesta de datos batch y streaming desde fuentes internas y externas. Kafka como backbone de eventos.',
      technologies: ['tech-8', 'tech-17', 'tech-18'],
      lifecycleStatus: 'active', serviceLevel: 'high', technicalLead: 'Pedro Sánchez',
      repository: 'https://github.com/tgp/data-ingestion',
      features: [
        { id: 'mf-16', name: 'Streaming Kafka', description: 'Ingesta en tiempo real vía Kafka topics', status: 'active', category: 'performance' },
        { id: 'mf-17', name: 'Carga batch', description: 'Carga programada de archivos CSV/Parquet', status: 'active', category: 'integration' },
      ],
      roadmap: [
        { id: 'mr-9', title: 'Actualizar Kafka 3.9', description: 'Upgrade de Kafka 3.5 a 3.9 para mejor rendimiento', type: 'upgrade', targetDate: '2026-08-15', status: 'planned', priority: 'high' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'ms-9', applicationId: 'app-9', name: 'etl-orchestrator',
      description: 'Orquestación de pipelines ETL con Apache Airflow. Programación, monitoreo y alertas de procesos de transformación.',
      technologies: ['tech-8', 'tech-18'],
      lifecycleStatus: 'deprecated', serviceLevel: 'medium', technicalLead: 'Pedro Sánchez',
      repository: 'https://github.com/tgp/etl-orchestrator',
      decommissionPlan: '<p>Este microservicio será reemplazado por <strong>data-ingestion</strong> (ms-8) que integrará las capacidades ETL en su nueva versión.</p><ul><li><strong>Fase 1</strong> (Q3 2026): Migrar pipelines batch críticos a data-ingestion</li><li><strong>Fase 2</strong> (Q4 2026): Migrar pipelines secundarios y desactivar Airflow</li><li><strong>Fase 3</strong> (Q1 2027): Retirar infraestructura y eliminar código</li></ul><p><strong>Responsable:</strong> Pedro Sánchez</p>',
      roadmap: [
        { id: 'mr-10', title: 'Migrar pipelines críticos', description: 'Mover pipelines batch a data-ingestion (ms-8)', type: 'migration', targetDate: '2026-09-30', status: 'planned', priority: 'critical' },
        { id: 'mr-11', title: 'Retirar Airflow', description: 'Desactivar servidores Airflow tras migración completa', type: 'decommission', targetDate: '2027-01-15', status: 'planned', priority: 'high' },
      ],
      createdAt: new Date(), updatedAt: new Date(),
    },
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
    // ── TÉCNICOS: Mejora de procesos de ingeniería ──
    {
      id: 'obj-1', teamId: 'team-1', businessUnitId: 'bu-digital',
      title: 'Mejorar eficiencia de entrega',
      description: 'Reducir lead time, aumentar frecuencia de deploy y disminuir tasa de fallo en cambios',
      type: 'okr', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-06-30'),
      progress: 58, status: 'on_track',
      keyResults: [
        { id: 'kr-1', title: 'Reducir lead time a < 24h', measure: 'hours', baseline: 48, target: 24, current: 30, status: 'on_track' },
        { id: 'kr-2', title: 'Aumentar deploys semanales a 5', measure: 'deploys/sem', baseline: 1, target: 5, current: 3, status: 'at_risk' },
        { id: 'kr-3', title: 'Reducir tasa de fallo a < 5%', measure: '% fallo', baseline: 15, target: 5, current: 8, status: 'behind' },
      ],
      metadata: {}, createdAt: new Date('2025-12-15'), updatedAt: new Date(),
    },
    {
      id: 'obj-tech-2', teamId: 'team-1', businessUnitId: 'bu-digital',
      title: 'Cero vulnerabilidades críticas en producción',
      description: 'Eliminar vulnerabilidades P1, automatizar escaneo de seguridad y alcanzar cobertura de SAST en CI/CD',
      type: 'okr', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-09-30'),
      progress: 45, status: 'at_risk',
      keyResults: [
        { id: 'kr-tech-2a', title: 'Corregir todas las vulnerabilidades P1 abiertas', measure: 'vulns', baseline: 12, target: 0, current: 3, status: 'on_track' },
        { id: 'kr-tech-2b', title: 'Automatizar escaneo SAST en pipelines CI/CD', measure: '% repos', baseline: 30, target: 100, current: 60, status: 'on_track' },
        { id: 'kr-tech-2c', title: 'Reducir ventana de exposición de vulns críticas', measure: 'hours', baseline: 72, target: 24, current: 48, status: 'behind' },
      ],
      metadata: {}, createdAt: new Date('2026-03-20'), updatedAt: new Date(),
    },
    {
      id: 'obj-tech-3', teamId: 'team-2', businessUnitId: 'bu-core',
      title: 'Modernización del stack tecnológico',
      description: 'Migrar aplicaciones legacy, actualizar sistemas operativos y estandarizar bases de datos',
      type: 'okr', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'),
      progress: 30, status: 'at_risk',
      keyResults: [
        { id: 'kr-tech-3a', title: 'Migrar aplicaciones core a .NET 8', measure: 'apps', baseline: 0, target: 5, current: 2, status: 'at_risk' },
        { id: 'kr-tech-3b', title: 'Actualizar servidores a Ubuntu 24.04 LTS', measure: '% servidores', baseline: 20, target: 100, current: 40, status: 'behind' },
        { id: 'kr-tech-3c', title: 'Estandarizar PostgreSQL 16 en todos los entornos', measure: '% entornos', baseline: 10, target: 100, current: 30, status: 'on_track' },
      ],
      metadata: {}, createdAt: new Date('2025-12-01'), updatedAt: new Date(),
    },

    // ── NEGOCIO: Experiencia de cliente y procesos ──
    {
      id: 'obj-biz-1', teamId: null, businessUnitId: 'bu-legacy',
      title: 'Mejorar experiencia digital del cliente',
      description: 'Aumentar adopción de canales digitales, reducir tiempos de respuesta y mejorar NPS',
      type: 'okr', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-09-30'),
      progress: 35, status: 'at_risk',
      keyResults: [
        { id: 'kr-biz-1a', title: 'Aumentar adopción de app móvil en clientes activos', measure: '% adopción', baseline: 15, target: 40, current: 22, status: 'at_risk' },
        { id: 'kr-biz-1b', title: 'Reducir tiempo de carga del portal a < 2s', measure: 'seconds', baseline: 4.5, target: 2, current: 3.2, status: 'on_track' },
        { id: 'kr-biz-1c', title: 'Aumentar NPS digital de 65 a 80', measure: 'puntos NPS', baseline: 65, target: 80, current: 70, status: 'on_track' },
      ],
      metadata: {}, createdAt: new Date('2026-03-15'), updatedAt: new Date(),
    },
    {
      id: 'obj-biz-2', teamId: 'team-2', businessUnitId: 'bu-core',
      title: 'Optimizar procesos operativos del core bancario',
      description: 'KPIs de eficiencia operativa: resolución de tickets, cumplimiento SLA y autoservicio',
      type: 'kpi', periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'),
      progress: 72, status: 'on_track',
      keyResults: [
        { id: 'kr-biz-2a', title: 'Reducir tiempo promedio de resolución de tickets', measure: 'hours', baseline: 48, target: 24, current: 36, status: 'at_risk' },
        { id: 'kr-biz-2b', title: 'Alcanzar 99% de cumplimiento SLA', measure: '% SLA', baseline: 85, target: 99, current: 92, status: 'on_track' },
        { id: 'kr-biz-2c', title: 'Aumentar tasa de autoservicio en mesa de ayuda', measure: '% autoservicio', baseline: 20, target: 50, current: 30, status: 'on_track' },
      ],
      metadata: {}, createdAt: new Date('2025-12-20'), updatedAt: new Date(),
    },

    // ── PLATAFORMA: Disponibilidad, confiabilidad y SRE ──
    {
      id: 'obj-plat-1', teamId: 'team-2', businessUnitId: 'bu-core',
      title: 'Garantizar disponibilidad y confiabilidad de la plataforma',
      description: 'Alcanzar cuatro nueves de uptime, reducir MTTR e implementar DR multi-región',
      type: 'okr', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-12-31'),
      progress: 40, status: 'on_track',
      keyResults: [
        { id: 'kr-plat-1a', title: 'Alcanzar 99.99% de uptime en servicios críticos', measure: '% uptime', baseline: 99.95, target: 99.99, current: 99.97, status: 'on_track' },
        { id: 'kr-plat-1b', title: 'Reducir MTTR a menos de 1 hora', measure: 'hours', baseline: 2.5, target: 1, current: 1.5, status: 'on_track' },
        { id: 'kr-plat-1c', title: 'Implementar disaster recovery multi-región', measure: '% cobertura', baseline: 20, target: 100, current: 45, status: 'behind' },
      ],
      metadata: {}, createdAt: new Date('2026-03-01'), updatedAt: new Date(),
    },
    {
      id: 'obj-plat-2', teamId: null, businessUnitId: 'bu-digital',
      title: 'Adoptar prácticas SRE en todos los equipos de producto',
      description: 'Scorecard balanceado de adopción SRE: definición de SLOs, SLIs, error budgets y runbooks',
      type: 'balanced_scorecard', periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-10-31'),
      progress: 25, status: 'behind',
      keyResults: [
        { id: 'kr-plat-2a', title: 'Definir SLOs para todos los servicios críticos', measure: '% servicios', baseline: 0, target: 100, current: 60, status: 'on_track' },
        { id: 'kr-plat-2b', title: 'Implementar dashboards de SLI en Grafana', measure: 'dashboards', baseline: 0, target: 8, current: 3, status: 'at_risk' },
        { id: 'kr-plat-2c', title: 'Establecer error budgets por servicio', measure: '% servicios', baseline: 0, target: 100, current: 15, status: 'behind' },
      ],
      metadata: {}, createdAt: new Date('2026-03-25'), updatedAt: new Date(),
    },
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

  // ── Junction: Microservice ←→ Vulnerabilities / Incidents / Risks / Audit ──
  // auth-service (ms-1): SQL Injection ─ la vulnerabilidad de autenticación afecta al auth-service
  const junctionVulns = [
    { id: 'jv-1', vulnerabilityId: 'vuln-1', microserviceId: 'ms-1' },
    // payment-processor (ms-6): Race condition en procesador de pagos
    { id: 'jv-2', vulnerabilityId: 'vuln-6', microserviceId: 'ms-6' },
    // account-service (ms-2): Deserialización insegura en API REST
    { id: 'jv-3', vulnerabilityId: 'vuln-7', microserviceId: 'ms-2' },
    // api-gateway (ms-4): XSS en formulario de búsqueda del portal
    { id: 'jv-4', vulnerabilityId: 'vuln-2', microserviceId: 'ms-4' },
    // fraud-detection (ms-7): Script injection en dashboard
    { id: 'jv-5', vulnerabilityId: 'vuln-9', microserviceId: 'ms-7' },
    // etl-orchestrator (ms-9): Desbordamiento de buffer en ETL
    { id: 'jv-6', vulnerabilityId: 'vuln-3', microserviceId: 'ms-9' },
  ]
  const junctionIncidents = [
    // auth-service (ms-1): Intento de acceso no autorizado (detectado hoy)
    { id: 'ji-1', incidentId: 'inc-4', microserviceId: 'ms-1' },
    // account-service (ms-2): Caída del servicio de pagos
    { id: 'ji-2', incidentId: 'inc-1', microserviceId: 'ms-2' },
    // payment-processor (ms-6): Caída del servicio de pagos (también afecta al procesador)
    { id: 'ji-3', incidentId: 'inc-1', microserviceId: 'ms-6' },
    // api-gateway (ms-4): Lentitud en portal
    { id: 'ji-4', incidentId: 'inc-2', microserviceId: 'ms-4' },
    // data-ingestion (ms-8): Caída del Data Lake
    { id: 'ji-5', incidentId: 'inc-5', microserviceId: 'ms-8' },
    // user-profile-service (ms-5): Error 500 en carrito — el perfil de usuario afecta al carrito
    { id: 'ji-6', incidentId: 'inc-3', microserviceId: 'ms-5' },
  ]
  const junctionRisks = [
    // auth-service (ms-1): Dependencia de tecnología EOL (SQL Server 2019)
    { id: 'jr-1', riskId: 'risk-1', microserviceId: 'ms-1' },
    // account-service (ms-2): Dependencia de tecnología EOL (SQL Server 2019)
    { id: 'jr-2', riskId: 'risk-1', microserviceId: 'ms-2' },
    // notification-service (ms-3): Dependencia de tecnología EOL (SQL Server 2019)
    { id: 'jr-3', riskId: 'risk-1', microserviceId: 'ms-3' },
  ]
  const junctionAudit = [
    // auth-service (ms-1): Controles de acceso insuficientes
    { id: 'jf-1', auditFindingId: 'find-1', microserviceId: 'ms-1' },
    // payment-processor (ms-6): Cifrado de datos en tránsito
    { id: 'jf-2', auditFindingId: 'find-3', microserviceId: 'ms-6' },
    // fraud-detection (ms-7): Cifrado de datos en tránsito
    { id: 'jf-3', auditFindingId: 'find-3', microserviceId: 'ms-7' },
    // api-gateway (ms-4): Política de backups
    { id: 'jf-4', auditFindingId: 'find-4', microserviceId: 'ms-4' },
    // user-profile-service (ms-5): Auditoría de accesos privilegiados
    { id: 'jf-5', auditFindingId: 'find-5', microserviceId: 'ms-5' },
  ]
  // ── Junction: Microservice ←→ Databases ──
  const junctionDatabases = databases.flatMap((db_) =>
    db_.microserviceIds.map((msId, i) => ({
      id: `jd-${db_.id}-${i}`,
      appDatabaseId: db_.id,
      microserviceId: msId,
    }))
  )
  await db.vulnerabilityMicroservices.bulkAdd(junctionVulns)
  await db.incidentMicroservices.bulkAdd(junctionIncidents)
  await db.riskMicroservices.bulkAdd(junctionRisks)
  await db.auditFindingMicroservices.bulkAdd(junctionAudit)
  await db.appDatabaseMicroservices.bulkAdd(junctionDatabases)
  await db.healthIndexHistory.bulkAdd(healthHistory)
  await db.users.bulkAdd(users)

  // ── Execution seed data ──
  const ds = (daysOffset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    d.setHours(12, 0, 0, 0)
    return d
  }

  // ── Plan 1: Modernización Core (en progreso, yellow) ──
  const plan1Activities: Activity[] = [
    { id: 'act-1', planId: 'plan-1', parentActivityId: null, title: 'Migrar Core Banking a .NET 8', description: 'Actualizar el framework del core bancario de .NET 6 a .NET 8', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'critical', status: 'in_progress', estimatedHours: 80, actualHours: 45, plannedPoints: 21, completedPoints: 8, startDate: ds(-40), dueDate: ds(20), completedAt: null, metadata: {}, createdAt: ds(-40), updatedAt: ds(-1) },
    { id: 'act-2', planId: 'plan-1', parentActivityId: 'act-1', title: 'Actualizar dependencias NuGet', description: 'Actualizar paquetes a versiones compatibles con .NET 8', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'high', status: 'completed', estimatedHours: 16, actualHours: 14, plannedPoints: 5, completedPoints: 5, startDate: ds(-40), dueDate: ds(-15), completedAt: ds(-16), metadata: {}, createdAt: ds(-40), updatedAt: ds(-16) },
    { id: 'act-3', planId: 'plan-1', parentActivityId: 'act-1', title: 'Migrar controladores MVC', description: 'Migrar todos los controladores a la nueva versión de ASP.NET Core', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-1', priority: 'high', status: 'in_progress', estimatedHours: 32, actualHours: 20, plannedPoints: 8, completedPoints: 4, startDate: ds(-30), dueDate: ds(10), completedAt: null, metadata: {}, createdAt: ds(-30), updatedAt: ds(-1) },
    { id: 'act-18', planId: 'plan-1', parentActivityId: 'act-1', title: 'Migrar capa de datos a EF Core', description: 'Migrar la capa de acceso a datos de ADO.NET a Entity Framework Core', assigneeId: null, teamId: 'team-1', applicationId: 'app-1', priority: 'medium', status: 'pending', estimatedHours: 24, actualHours: null, plannedPoints: 8, completedPoints: null, startDate: ds(2), dueDate: ds(20), completedAt: null, metadata: {}, createdAt: ds(-5), updatedAt: ds(-5) },
    { id: 'act-4', planId: 'plan-1', parentActivityId: null, title: 'Actualizar PostgreSQL 16', description: 'Migración de base de datos de PostgreSQL 14 a 16', assigneeId: 'user-2', teamId: 'team-1', applicationId: 'app-1', priority: 'medium', status: 'in_progress', estimatedHours: 40, actualHours: 25, plannedPoints: 13, completedPoints: 6, startDate: ds(-35), dueDate: ds(5), completedAt: null, metadata: {}, createdAt: ds(-35), updatedAt: ds(-1) },
    { id: 'act-5', planId: 'plan-1', parentActivityId: null, title: 'Implementar OAuth2 en Portal', description: 'Migrar autenticación a OAuth2 con Keycloak — BLOQUEADO por certificado SSL vencido', assigneeId: 'user-1', teamId: 'team-1', applicationId: 'app-2', priority: 'high', status: 'pending', estimatedHours: 24, actualHours: null, plannedPoints: 8, completedPoints: null, startDate: ds(1), dueDate: ds(0), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
    { id: 'act-19', planId: 'plan-1', parentActivityId: null, title: 'Actualizar librerías de logging', description: 'Actualizar Serilog y NLog a versiones compatibles con .NET 8', assigneeId: 'user-3', teamId: 'team-1', applicationId: 'app-1', priority: 'low', status: 'completed', estimatedHours: 8, actualHours: 6, plannedPoints: 3, completedPoints: 3, startDate: ds(-45), dueDate: ds(-30), completedAt: ds(-31), metadata: {}, createdAt: ds(-45), updatedAt: ds(-31) },
    { id: 'act-20', planId: 'plan-1', parentActivityId: null, title: 'Pruebas de integración del core', description: 'Suite completa de pruebas de integración post-migración', assigneeId: null, teamId: 'team-1', applicationId: 'app-1', priority: 'high', status: 'pending', estimatedHours: 40, actualHours: null, plannedPoints: 13, completedPoints: null, startDate: ds(15), dueDate: ds(45), completedAt: null, metadata: {}, createdAt: ds(-1), updatedAt: ds(-1) },
  ]

  // ── Plan 2: Seguridad (en progreso, green) ──
  const plan2Activities: Activity[] = [
    { id: 'act-6', planId: 'plan-2', parentActivityId: null, title: 'Auditoría de vulnerabilidades', description: 'Escaneo completo de vulnerabilidades en todas las apps del portafolio', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-2', priority: 'critical', status: 'completed', estimatedHours: 16, actualHours: 18, plannedPoints: 13, completedPoints: 13, startDate: ds(-20), dueDate: ds(-5), completedAt: ds(-6), metadata: {}, createdAt: ds(-20), updatedAt: ds(-6) },
    { id: 'act-7', planId: 'plan-2', parentActivityId: null, title: 'Corregir XSS en formularios de búsqueda', description: 'Sanitizar inputs en el portal clientes — VENCE HOY', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-2', priority: 'high', status: 'in_progress', estimatedHours: 12, actualHours: 6, plannedPoints: 5, completedPoints: 2, startDate: ds(-14), dueDate: ds(0), completedAt: null, metadata: {}, createdAt: ds(-14), updatedAt: ds(-1) },
    { id: 'act-8', planId: 'plan-2', parentActivityId: null, title: 'Implementar CSP headers', description: 'Agregar Content Security Policy headers a todas las respuestas HTTP', assigneeId: null, teamId: 'team-2', applicationId: 'app-2', priority: 'medium', status: 'pending', estimatedHours: 8, actualHours: null, plannedPoints: 3, completedPoints: null, startDate: ds(2), dueDate: ds(10), completedAt: null, metadata: {}, createdAt: ds(-7), updatedAt: ds(-1) },
    { id: 'act-21', planId: 'plan-2', parentActivityId: null, title: 'Implementar WAF en API Gateway', description: 'Configurar Web Application Firewall en el API Gateway del portal', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-2', priority: 'high', status: 'in_progress', estimatedHours: 20, actualHours: 8, plannedPoints: 8, completedPoints: 3, startDate: ds(-10), dueDate: ds(15), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
    { id: 'act-22', planId: 'plan-2', parentActivityId: null, title: 'Parchear servidores Ubuntu 20.04', description: 'Aplicar parches de seguridad críticos a servidores Ubuntu con CVE-2024-6387', assigneeId: 'user-5', teamId: 'team-2', applicationId: 'app-9', priority: 'critical', status: 'in_progress', estimatedHours: 16, actualHours: 4, plannedPoints: 5, completedPoints: 1, startDate: ds(-25), dueDate: ds(-3), completedAt: null, metadata: {}, createdAt: ds(-25), updatedAt: ds(-3) },
  ]

  // ── Plan 3: Migración CRM (planned, green) ──
  const plan3Activities: Activity[] = [
    { id: 'act-9', planId: 'plan-3', parentActivityId: null, title: 'Análisis de impacto y dependencias del CRM', description: 'Evaluar el impacto de migrar el CRM legacy al nuevo sistema', assigneeId: 'user-4', teamId: 'team-2', applicationId: 'app-5', priority: 'high', status: 'pending', estimatedHours: 24, actualHours: null, plannedPoints: 8, completedPoints: null, startDate: ds(15), dueDate: ds(30), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-10) },
    { id: 'act-10', planId: 'plan-3', parentActivityId: null, title: 'Migración de datos a nuevo CRM', description: 'Migrar datos históricos del CRM legacy al nuevo sistema', assigneeId: null, teamId: 'team-2', applicationId: 'app-5', priority: 'critical', status: 'pending', estimatedHours: 80, actualHours: null, plannedPoints: 21, completedPoints: null, startDate: ds(30), dueDate: ds(60), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-10) },
    { id: 'act-11', planId: 'plan-3', parentActivityId: null, title: 'Capacitación usuarios nuevo CRM', description: 'Entrenar a los usuarios finales en el nuevo sistema CRM', assigneeId: null, teamId: 'team-2', applicationId: 'app-5', priority: 'medium', status: 'pending', estimatedHours: 16, actualHours: null, plannedPoints: 5, completedPoints: null, startDate: ds(60), dueDate: ds(75), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-10) },
  ]

  // ── Plan 4: App Móvil (en progreso, red — en crisis) ──
  const plan4Activities: Activity[] = [
    { id: 'act-12', planId: 'plan-4', parentActivityId: null, title: 'Implementar modo offline', description: 'Soporte offline completo para la app móvil con sincronización', assigneeId: 'user-3', teamId: 'team-1', applicationId: 'app-3', priority: 'critical', status: 'in_progress', estimatedHours: 60, actualHours: 20, plannedPoints: 21, completedPoints: 5, startDate: ds(-15), dueDate: ds(30), completedAt: null, metadata: {}, createdAt: ds(-20), updatedAt: ds(-1) },
    { id: 'act-23', planId: 'plan-4', parentActivityId: 'act-12', title: 'Diseñar esquema de caché local', description: 'Diseñar esquema de almacenamiento offline con IndexedDB', assigneeId: 'user-3', teamId: 'team-1', applicationId: 'app-3', priority: 'high', status: 'in_progress', estimatedHours: 12, actualHours: 10, plannedPoints: 5, completedPoints: 3, startDate: ds(-15), dueDate: ds(-5), completedAt: null, metadata: {}, createdAt: ds(-20), updatedAt: ds(-5) },
    { id: 'act-24', planId: 'plan-4', parentActivityId: 'act-12', title: 'Implementar sincronización en segundo plano', description: 'Sincronización automática al recuperar conectividad', assigneeId: 'user-3', teamId: 'team-1', applicationId: 'app-3', priority: 'high', status: 'in_progress', estimatedHours: 24, actualHours: 8, plannedPoints: 8, completedPoints: 2, startDate: ds(-8), dueDate: ds(10), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
    { id: 'act-25', planId: 'plan-4', parentActivityId: 'act-12', title: 'Pruebas de sincronización offline', description: 'Suite de pruebas para el modo offline en múltiples escenarios de red', assigneeId: null, teamId: 'team-1', applicationId: 'app-3', priority: 'medium', status: 'pending', estimatedHours: 16, actualHours: null, plannedPoints: 5, completedPoints: null, startDate: ds(10), dueDate: ds(30), completedAt: null, metadata: {}, createdAt: ds(-5), updatedAt: ds(-5) },
    { id: 'act-13', planId: 'plan-4', parentActivityId: null, title: 'Rediseño de navegación principal', description: 'Nuevo diseño de navegación con bottom tabs y gestos', assigneeId: 'user-3', teamId: 'team-1', applicationId: 'app-3', priority: 'high', status: 'in_progress', estimatedHours: 32, actualHours: 12, plannedPoints: 8, completedPoints: 3, startDate: ds(-10), dueDate: ds(-2), completedAt: null, metadata: {}, createdAt: ds(-15), updatedAt: ds(-2) },
    { id: 'act-14', planId: 'plan-4', parentActivityId: null, title: 'Integración notificaciones push', description: 'Integrar Firebase Cloud Messaging para notificaciones push', assigneeId: null, teamId: 'team-1', applicationId: 'app-3', priority: 'medium', status: 'pending', estimatedHours: 16, actualHours: null, plannedPoints: 5, completedPoints: null, startDate: ds(10), dueDate: ds(45), completedAt: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
  ]

  // ── Plan 5: Infraestructura (completado, green) ──
  const plan5Activities: Activity[] = [
    { id: 'act-15', planId: 'plan-5', parentActivityId: null, title: 'Migrar servidores a Ubuntu 24.04', description: 'Migración completa de servidores de Ubuntu 20.04 a 24.04 LTS', assigneeId: 'user-5', teamId: 'team-2', applicationId: 'app-9', priority: 'critical', status: 'completed', estimatedHours: 40, actualHours: 38, plannedPoints: 13, completedPoints: 13, startDate: ds(-90), dueDate: ds(-60), completedAt: ds(-61), metadata: {}, createdAt: ds(-90), updatedAt: ds(-61) },
    { id: 'act-16', planId: 'plan-5', parentActivityId: null, title: 'Actualizar Kubernetes a 1.29', description: 'Upgrade del cluster Kubernetes de 1.27 a 1.29', assigneeId: 'user-2', teamId: 'team-2', applicationId: 'app-9', priority: 'high', status: 'completed', estimatedHours: 24, actualHours: 28, plannedPoints: 8, completedPoints: 8, startDate: ds(-80), dueDate: ds(-50), completedAt: ds(-51), metadata: {}, createdAt: ds(-80), updatedAt: ds(-51) },
    { id: 'act-17', planId: 'plan-5', parentActivityId: null, title: 'Implementar monitoring con Prometheus', description: 'Desplegar stack Prometheus + Grafana para monitoreo de infraestructura', assigneeId: 'user-5', teamId: 'team-2', applicationId: 'app-9', priority: 'medium', status: 'completed', estimatedHours: 32, actualHours: 30, plannedPoints: 8, completedPoints: 8, startDate: ds(-60), dueDate: ds(-30), completedAt: ds(-31), metadata: {}, createdAt: ds(-60), updatedAt: ds(-31) },
  ]

  const allActivities = [
    ...plan1Activities, ...plan2Activities,
    ...plan3Activities, ...plan4Activities, ...plan5Activities,
  ]

  // ── Tasks ──
  const tasks: Task[] = [
    { id: 'task-1', activityId: 'act-1', planId: 'plan-1', title: 'Evaluar cambios de versión .NET 8', description: 'Revisar breaking changes y planificar migración', assigneeId: 'user-1', status: 'done', priority: 'medium', estimatedHours: 4, dueDate: ds(-38), completedAt: ds(-39), dependsOn: [], metadata: {}, createdAt: ds(-40), updatedAt: ds(-39) },
    { id: 'task-2', activityId: 'act-1', planId: 'plan-1', title: 'Actualizar Dockerfile a .NET 8 SDK', description: 'Cambiar imagen base en Dockerfile', assigneeId: 'user-1', status: 'done', priority: 'high', estimatedHours: 2, dueDate: ds(-35), completedAt: ds(-36), dependsOn: ['task-1'], metadata: {}, createdAt: ds(-40), updatedAt: ds(-36) },
    { id: 'task-3', activityId: 'act-1', planId: 'plan-1', title: 'Verificar compatibilidad de paquetes NuGet', description: 'Validar que todos los paquetes tengan versión para .NET 8', assigneeId: 'user-1', status: 'in_progress', priority: 'high', estimatedHours: 8, dueDate: ds(-1), completedAt: null, dependsOn: ['task-2'], metadata: {}, createdAt: ds(-30), updatedAt: ds(-2) },
    { id: 'task-4', activityId: 'act-4', planId: 'plan-1', title: 'Hacer dump de BD actual', description: 'Respaldar base de datos PostgreSQL 14 antes de migrar', assigneeId: 'user-2', status: 'done', priority: 'critical', estimatedHours: 2, dueDate: ds(-30), completedAt: ds(-31), dependsOn: [], metadata: {}, createdAt: ds(-35), updatedAt: ds(-31) },
    { id: 'task-5', activityId: 'act-4', planId: 'plan-1', title: 'Ejecutar pg_upgrade en staging', description: 'Probar la migración en entorno de staging primero', assigneeId: 'user-2', status: 'done', priority: 'critical', estimatedHours: 4, dueDate: ds(-10), completedAt: ds(-11), dependsOn: ['task-4'], metadata: {}, createdAt: ds(-10), updatedAt: ds(-11) },
    { id: 'task-5b', activityId: 'act-4', planId: 'plan-1', title: 'Ejecutar pg_upgrade en producción', description: 'Migrar base de datos de producción a PostgreSQL 16', assigneeId: 'user-2', status: 'todo', priority: 'critical', estimatedHours: 4, dueDate: ds(2), completedAt: null, dependsOn: ['task-5'], metadata: {}, createdAt: ds(-10), updatedAt: ds(-2) },
    { id: 'task-5c', activityId: 'act-4', planId: 'plan-1', title: 'Verificar integridad post-migración', description: 'Ejecutar scripts de validación de datos tras la migración', assigneeId: 'user-2', status: 'todo', priority: 'high', estimatedHours: 2, dueDate: ds(3), completedAt: null, dependsOn: ['task-5b'], metadata: {}, createdAt: ds(-5), updatedAt: ds(-5) },

    { id: 'task-6', activityId: 'act-7', planId: 'plan-2', title: 'Identificar endpoints vulnerables', description: 'Mapear endpoints del portal que aceptan input de usuario', assigneeId: 'user-2', status: 'done', priority: 'high', estimatedHours: 3, dueDate: ds(-10), completedAt: ds(-11), dependsOn: [], metadata: {}, createdAt: ds(-14), updatedAt: ds(-11) },
    { id: 'task-7', activityId: 'act-7', planId: 'plan-2', title: 'Implementar sanitización en backend XSS', description: 'Sanitizar inputs en todos los endpoints de búsqueda — VENCE HOY', assigneeId: 'user-2', status: 'in_progress', priority: 'high', estimatedHours: 6, dueDate: ds(0), completedAt: null, dependsOn: ['task-6'], metadata: {}, createdAt: ds(-10), updatedAt: ds(0) },
    { id: 'task-7b', activityId: 'act-7', planId: 'plan-2', title: 'Validar formulario de login', description: 'Verificar que el formulario de login sanitiza correctamente', assigneeId: 'user-2', status: 'done', priority: 'medium', estimatedHours: 2, dueDate: ds(0), completedAt: ds(-1), dependsOn: [], metadata: {}, createdAt: ds(-3), updatedAt: ds(-1) },
    { id: 'task-8', activityId: 'act-7', planId: 'plan-2', title: 'Agregar tests de seguridad XSS', description: 'Escribir tests automatizados para validar sanitización', assigneeId: 'user-2', status: 'todo', priority: 'medium', estimatedHours: 4, dueDate: ds(2), completedAt: null, dependsOn: ['task-7'], metadata: {}, createdAt: ds(-7), updatedAt: ds(-2) },
    { id: 'task-22a', activityId: 'act-22', planId: 'plan-2', title: 'Evaluar parches disponibles', description: 'Revisar parches de seguridad para CVE-2024-6387', assigneeId: 'user-5', status: 'done', priority: 'critical', estimatedHours: 2, dueDate: ds(-20), completedAt: ds(-21), dependsOn: [], metadata: {}, createdAt: ds(-25), updatedAt: ds(-21) },
    { id: 'task-22b', activityId: 'act-22', planId: 'plan-2', title: 'Aplicar parches en servidores staging', description: 'Probar parches en entorno de staging', assigneeId: 'user-5', status: 'in_progress', priority: 'critical', estimatedHours: 8, dueDate: ds(-5), completedAt: null, dependsOn: ['task-22a'], metadata: {}, createdAt: ds(-20), updatedAt: ds(-5) },
    { id: 'task-22c', activityId: 'act-22', planId: 'plan-2', title: 'Aplicar parches en producción', description: 'Desplegar parches en servidores productivos', assigneeId: 'user-5', status: 'todo', priority: 'critical', estimatedHours: 6, dueDate: ds(2), completedAt: null, dependsOn: ['task-22b'], metadata: {}, createdAt: ds(-15), updatedAt: ds(-5) },

    { id: 'task-12a', activityId: 'act-23', planId: 'plan-4', title: 'Definir schema IndexedDB para caché', description: 'Diseñar las tablas de almacenamiento offline', assigneeId: 'user-3', status: 'done', priority: 'high', estimatedHours: 4, dueDate: ds(-12), completedAt: ds(-13), dependsOn: [], metadata: {}, createdAt: ds(-15), updatedAt: ds(-13) },
    { id: 'task-12b', activityId: 'act-23', planId: 'plan-4', title: 'Implementar service worker', description: 'Crear service worker para caché de assets y API — VENCE HOY', assigneeId: 'user-3', status: 'todo', priority: 'high', estimatedHours: 8, dueDate: ds(0), completedAt: null, dependsOn: ['task-12a'], metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
    { id: 'task-12c', activityId: 'act-24', planId: 'plan-4', title: 'Implementar cola de sincronización', description: 'Crear cola de operaciones pendientes para sincronizar al reconectar', assigneeId: 'user-3', status: 'todo', priority: 'high', estimatedHours: 12, dueDate: ds(8), completedAt: null, dependsOn: ['task-12b'], metadata: {}, createdAt: ds(-8), updatedAt: ds(-2) },
    { id: 'task-13a', activityId: 'act-13', planId: 'plan-4', title: 'Diseñar prototipo navegación', description: 'Crear prototipo Figma de la nueva navegación con bottom tabs', assigneeId: 'user-3', status: 'done', priority: 'high', estimatedHours: 8, dueDate: ds(-8), completedAt: ds(-9), dependsOn: [], metadata: {}, createdAt: ds(-10), updatedAt: ds(-9) },
    { id: 'task-13b', activityId: 'act-13', planId: 'plan-4', title: 'Implementar bottom tab navigator', description: 'Implementar navegación con tabs inferiores en React Native', assigneeId: 'user-3', status: 'in_progress', priority: 'high', estimatedHours: 16, dueDate: ds(-2), completedAt: null, dependsOn: ['task-13a'], metadata: {}, createdAt: ds(-8), updatedAt: ds(-2) },
    { id: 'task-13c', activityId: 'act-13', planId: 'plan-4', title: 'Agregar gestos de navegación', description: 'Implementar gestos swipe entre tabs', assigneeId: 'user-3', status: 'todo', priority: 'medium', estimatedHours: 8, dueDate: ds(3), completedAt: null, dependsOn: ['task-13b'], metadata: {}, createdAt: ds(-5), updatedAt: ds(-2) },
  ]

  // ── Commitments ──
  const commitments: Commitment[] = [
    { id: 'comm-1', title: 'Entregar plan de migración CRM', description: 'Documento con estrategia y cronograma detallado de migración', ownerId: 'user-4', accountableId: 'user-1', teamId: 'team-2', applicationId: 'app-5', objectiveId: null, deliverableId: 'del-6', status: 'active', commitmentDate: ds(3), fulfilledAt: null, metadata: {}, createdAt: ds(-20), updatedAt: ds(-5) },
    { id: 'comm-2', title: 'Corregir vulnerabilidades críticas', description: 'Todas las vulnerabilidades P1 deben estar corregidas antes del auditoría', ownerId: 'user-1', accountableId: 'user-2', teamId: 'team-1', applicationId: 'app-1', objectiveId: 'obj-1', deliverableId: null, status: 'at_risk', commitmentDate: ds(-1), fulfilledAt: null, metadata: {}, createdAt: ds(-30), updatedAt: ds(-3) },
    { id: 'comm-3', title: 'Certificación SSL renovada', description: 'Renovar certificados SSL del portal de clientes (vencido)', ownerId: 'user-2', accountableId: 'user-1', teamId: 'team-2', applicationId: 'app-2', objectiveId: null, deliverableId: 'del-2', status: 'breached', commitmentDate: ds(-10), fulfilledAt: null, metadata: {}, createdAt: ds(-60), updatedAt: ds(-11) },
    { id: 'comm-4', title: 'Migración a .NET 8 completada', description: 'Migrar el core bancario a .NET 8 exitosamente', ownerId: 'user-1', accountableId: 'user-1', teamId: 'team-1', applicationId: 'app-1', objectiveId: null, deliverableId: 'del-1', status: 'fulfilled', commitmentDate: ds(-30), fulfilledAt: ds(-35), metadata: {}, createdAt: ds(-60), updatedAt: ds(-35) },
    { id: 'comm-5', title: 'Pruebas de seguridad de portal', description: 'Completar todas las pruebas de seguridad post-parche — VENCE HOY', ownerId: 'user-2', accountableId: 'user-1', teamId: 'team-2', applicationId: 'app-2', objectiveId: null, deliverableId: null, status: 'active', commitmentDate: ds(0), fulfilledAt: null, metadata: {}, createdAt: ds(-7), updatedAt: ds(-1) },
  ]

  // ── Blockers ──
  const blockers: Blocker[] = [
    { id: 'blk-1', sourceType: 'activity', sourceId: 'act-5', title: 'Certificado SSL vencido', description: 'El certificado SSL del portal de clientes venció el mes pasado y debe ser renovado para implementar OAuth2', severity: 'high', status: 'open', raisedById: 'user-1', assigneeId: 'user-2', escalatedAt: null, resolvedAt: null, resolutionNotes: null, metadata: {}, createdAt: ds(-5), updatedAt: ds(-2) },
    { id: 'blk-2', sourceType: 'activity', sourceId: 'act-4', title: 'Credenciales proveedor SMS no entregadas', description: 'El proveedor de SMS no ha entregado las credenciales para el entorno de staging de notificaciones', severity: 'medium', status: 'open', raisedById: 'user-2', assigneeId: 'user-1', escalatedAt: null, resolvedAt: null, resolutionNotes: null, metadata: {}, createdAt: ds(-3), updatedAt: ds(-1) },
    { id: 'blk-3', sourceType: 'activity', sourceId: 'act-14', title: 'API de notificaciones push no disponible', description: 'Firebase Cloud Messaging no está configurado en el proyecto — se necesita acceso de admin', severity: 'high', status: 'escalated', raisedById: 'user-3', assigneeId: 'user-1', escalatedAt: ds(-2), resolvedAt: null, resolutionNotes: null, metadata: {}, createdAt: ds(-7), updatedAt: ds(-2) },
    { id: 'blk-4', sourceType: 'activity', sourceId: 'act-22', title: 'Parche de kernel requiere reinicio', description: 'El parche de seguridad de Ubuntu requiere reinicio del servidor, coordinado con el equipo de operaciones para el fin de semana', severity: 'critical', status: 'resolved', raisedById: 'user-5', assigneeId: 'user-5', escalatedAt: null, resolvedAt: ds(-1), resolutionNotes: 'Reinicio programado realizado sin incidentes', metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
  ]

  // ── Dependencies ──
  const executionDependencies: Dependency[] = [
    { id: 'depex-1', sourceType: 'activity', sourceId: 'act-5', targetType: 'blocker', targetId: 'blk-1', relationType: 'depends_on', description: 'OAuth2 bloqueado por certificado SSL vencido', status: 'active', expectedResolutionDate: ds(7), metadata: {}, createdAt: ds(-5), updatedAt: ds(-2) },
    { id: 'depex-2', sourceType: 'activity', sourceId: 'act-24', targetType: 'activity', targetId: 'act-23', relationType: 'depends_on', description: 'Sincronización depende del diseño de caché local', status: 'active', expectedResolutionDate: ds(3), metadata: {}, createdAt: ds(-8), updatedAt: ds(-2) },
    { id: 'depex-3', sourceType: 'activity', sourceId: 'act-25', targetType: 'activity', targetId: 'act-24', relationType: 'depends_on', description: 'Pruebas dependen de sincronización implementada', status: 'active', expectedResolutionDate: null, metadata: {}, createdAt: ds(-5), updatedAt: ds(-5) },
    { id: 'depex-4', sourceType: 'activity', sourceId: 'act-14', targetType: 'activity', targetId: 'act-13', relationType: 'depends_on', description: 'Notificaciones push dependen del rediseño de navegación', status: 'active', expectedResolutionDate: null, metadata: {}, createdAt: ds(-10), updatedAt: ds(-1) },
  ]

  // ── Plans ──
  const plans: Plan[] = [
    { id: 'plan-1', title: 'Modernización Core Bancario',   description: 'Migración a .NET 8, PostgreSQL 16 y OAuth2 para el core bancario (Q2 2026)', teamId: 'team-1', businessUnitId: 'bu-core',    objectiveId: 'obj-1', status: 'in_progress', health: 'yellow', startDate: ds(-45), endDate: ds(45),  metadata: {}, createdAt: ds(-45), updatedAt: ds(-1) },
    { id: 'plan-2', title: 'Seguridad y Hardening',         description: 'Corrección de vulnerabilidades, WAF, hardening de servidores (Q2 2026)',   teamId: 'team-2', businessUnitId: 'bu-digital', objectiveId: 'obj-1', status: 'in_progress', health: 'green',  startDate: ds(-30), endDate: ds(60),  metadata: {}, createdAt: ds(-30), updatedAt: ds(-1) },
    { id: 'plan-3', title: 'Migración CRM Legacy',          description: 'Plan de reemplazo del CRM legacy (Q3 2026)',                               teamId: 'team-2', businessUnitId: 'bu-legacy',  objectiveId: null,      status: 'planned',     health: 'green',  startDate: ds(15),  endDate: ds(75),  metadata: {}, createdAt: ds(-10), updatedAt: ds(-10) },
    { id: 'plan-4', title: 'App Móvil v2 — Offline First',  description: 'Soporte offline, sincronización y rediseño de navegación — EN RIESGO',    teamId: 'team-1', businessUnitId: 'bu-digital', objectiveId: null,      status: 'in_progress', health: 'red',    startDate: ds(-20), endDate: ds(50),  metadata: {}, createdAt: ds(-20), updatedAt: ds(-1) },
    { id: 'plan-5', title: 'Actualización Infraestructura Q1', description: 'Migración Ubuntu 24.04, upgrade Kubernetes, stack Prometheus (Q1 2026)', teamId: 'team-2', businessUnitId: 'bu-core', objectiveId: null,      status: 'completed',   health: 'green',  startDate: ds(-90), endDate: ds(-30), metadata: {}, createdAt: ds(-90), updatedAt: ds(-31) },
  ]

  // Persist execution data
  await db.plans.bulkAdd(plans)
  await db.activities.bulkAdd(allActivities)
  await db.tasks.bulkAdd(tasks)
  await db.commitments.bulkAdd(commitments)
  await db.blockers.bulkAdd(blockers)
  await db.dependencies.bulkAdd(executionDependencies)

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

  // ── Recruitment seed data ──
  const cId = (n: number) => `cand-${n}`
  const mkCID = () => `ct-${candidateIdx++}`
  let candidateIdx = 1

  const candidates: Candidate[] = [
    { id: cId(1), name: 'Elena Vargas', email: 'elena.vargas@email.com', phone: '+56912340001', position: 'senior_developer', interviewDate: days(3), comments: '<p>Excelente candidata con amplia experiencia en microservicios. Demostró conocimiento profundo de patrones de diseño y arquitectura hexagonal. Comunicación clara y actitud proactiva.</p>', status: 'interviewed', teamId: 'team-1', totalScore: 0, createdAt: days(15), updatedAt: days(3) },
    { id: cId(2), name: 'Roberto Méndez', email: 'roberto.mendez@email.com', phone: '+56912340002', position: 'developer', interviewDate: days(1), comments: '<p>Buen conocimiento de JavaScript y React. Sin experiencia en backend. Potencial para crecer con mentoría.</p>', status: 'interviewed', teamId: null, totalScore: 0, createdAt: days(10), updatedAt: days(1) },
    { id: cId(3), name: 'Camila Ríos', email: 'camila.rios@email.com', phone: '+56912340003', position: 'tech_lead', interviewDate: days(7), comments: '<p>Perfil excepcional para Tech Lead. Experiencia liderando equipos de hasta 8 personas. Domina arquitecturas cloud-native y metodologías ágiles. Referencias verificadas excelentes.</p>', status: 'pending', teamId: 'team-2', totalScore: 0, createdAt: days(8), updatedAt: days(8) },
    { id: cId(4), name: 'Diego Herrera', email: 'diego.herrera@email.com', phone: '+56912340004', position: 'senior_developer', interviewDate: days(5), comments: '<p>Sólidos conocimientos en Java y Spring Boot. Experiencia en sistemas transaccionales de alta criticidad. Buen comunicador, pero mostró poca flexibilidad para aprender nuevas tecnologías.</p>', status: 'interviewed', teamId: null, totalScore: 0, createdAt: days(12), updatedAt: days(5) },
    { id: cId(5), name: 'Sofía Paredes', email: 'sofia.paredes@email.com', phone: '+56912340005', position: 'ux_designer', interviewDate: null, comments: '', status: 'pending', teamId: null, totalScore: 0, createdAt: days(6), updatedAt: days(6) },
    { id: cId(6), name: 'Andrés Muñoz', email: 'andres.munoz@email.com', phone: '+56912340006', position: 'developer', interviewDate: days(10), comments: '<p>Buenos fundamentos pero poca experiencia práctica. Demostró interés genuino en aprender. Recomendable para posición junior.</p>', status: 'pending', teamId: null, totalScore: 0, createdAt: days(5), updatedAt: days(5) },
    { id: cId(7), name: 'Valentina Soto', email: 'valentina.soto@email.com', phone: '+56912340007', position: 'qa', interviewDate: days(2), comments: '<p>Sólida experiencia en automatización de pruebas con Selenium y Cypress. Conocimiento de CI/CD y pruebas de performance. Excelente candidata.</p>', status: 'interviewed', teamId: 'team-1', totalScore: 0, createdAt: days(14), updatedAt: days(2) },
    { id: cId(8), name: 'Felipe Torres', email: 'felipe.torres@email.com', phone: '+56912340008', position: 'manager', interviewDate: days(14), comments: '<p>Perfil gerencial con experiencia en transformación digital. Buen manejo de equipos multidisciplinarios. Se le pidió una segunda entrevista con el director.</p>', status: 'pending', teamId: null, totalScore: 0, createdAt: days(4), updatedAt: days(4) },
    { id: cId(9), name: 'Daniela Castro', email: 'daniela.castro@email.com', phone: '+56912340009', position: 'devops', interviewDate: days(8), comments: '<p>Experta en Kubernetes y Terraform. Implementó GitOps en su empresa anterior. Certificada CKA y AWS. Altamente recomendada.</p>', status: 'interviewed', teamId: 'team-2', totalScore: 0, createdAt: days(20), updatedAt: days(8) },
    { id: cId(10), name: 'Marcelo Vega', email: 'marcelo.vega@email.com', phone: '+56912340010', position: 'senior_developer', interviewDate: days(12), comments: '<p>No cumplió con las expectativas técnicas. Dificultad para resolver problemas de complejidad media en el coding challenge. Se descarta.</p>', status: 'rejected', teamId: null, totalScore: 0, createdAt: days(18), updatedAt: days(12) },
  ]

  const candidateTechs: CandidateTechnology[] = [
    // Elena Vargas — senior_developer .NET + Cloud
    { id: mkCID(), candidateId: cId(1), name: '.NET', points: 90 },
    { id: mkCID(), candidateId: cId(1), name: 'Azure', points: 85 },
    { id: mkCID(), candidateId: cId(1), name: 'PostgreSQL', points: 75 },
    { id: mkCID(), candidateId: cId(1), name: 'Docker', points: 80 },
    { id: mkCID(), candidateId: cId(1), name: 'Angular', points: 60 },
    // Roberto Méndez — developer frontend
    { id: mkCID(), candidateId: cId(2), name: 'React', points: 70 },
    { id: mkCID(), candidateId: cId(2), name: 'JavaScript', points: 75 },
    { id: mkCID(), candidateId: cId(2), name: 'Node.js', points: 45 },
    // Camila Ríos — tech_lead full-stack
    { id: mkCID(), candidateId: cId(3), name: 'Java', points: 85 },
    { id: mkCID(), candidateId: cId(3), name: 'Kubernetes', points: 80 },
    { id: mkCID(), candidateId: cId(3), name: 'AWS', points: 90 },
    { id: mkCID(), candidateId: cId(3), name: 'Python', points: 70 },
    { id: mkCID(), candidateId: cId(3), name: 'PostgreSQL', points: 75 },
    // Diego Herrera — senior_developer Java
    { id: mkCID(), candidateId: cId(4), name: 'Java', points: 88 },
    { id: mkCID(), candidateId: cId(4), name: 'Spring Boot', points: 85 },
    { id: mkCID(), candidateId: cId(4), name: 'PostgreSQL', points: 70 },
    { id: mkCID(), candidateId: cId(4), name: 'Angular', points: 40 },
    // Sofía Paredes — ux_designer (sin techs, es diseño)
    // Andrés Muñoz — developer
    { id: mkCID(), candidateId: cId(6), name: 'JavaScript', points: 50 },
    { id: mkCID(), candidateId: cId(6), name: 'React', points: 40 },
    // Valentina Soto — qa
    { id: mkCID(), candidateId: cId(7), name: 'Selenium', points: 85 },
    { id: mkCID(), candidateId: cId(7), name: 'Python', points: 70 },
    { id: mkCID(), candidateId: cId(7), name: 'Docker', points: 55 },
    // Felipe Torres — manager (sin techs)
    // Daniela Castro — devops
    { id: mkCID(), candidateId: cId(9), name: 'Kubernetes', points: 90 },
    { id: mkCID(), candidateId: cId(9), name: 'Terraform', points: 85 },
    { id: mkCID(), candidateId: cId(9), name: 'AWS', points: 80 },
    { id: mkCID(), candidateId: cId(9), name: 'Docker', points: 85 },
    { id: mkCID(), candidateId: cId(9), name: 'Python', points: 65 },
    // Marcelo Vega — senior_developer rejected
    { id: mkCID(), candidateId: cId(10), name: 'Java', points: 60 },
    { id: mkCID(), candidateId: cId(10), name: 'PostgreSQL', points: 50 },
    { id: mkCID(), candidateId: cId(10), name: 'Node.js', points: 45 },
  ]

  const candidateEvals: CandidateEvaluation[] = [
    // Elena Vargas
    { id: `ev-1`, candidateId: cId(1), category: 'technical_knowledge', points: 90 },
    { id: `ev-2`, candidateId: cId(1), category: 'experience', points: 85 },
    { id: `ev-3`, candidateId: cId(1), category: 'communication', points: 80 },
    { id: `ev-4`, candidateId: cId(1), category: 'attitude', points: 85 },
    { id: `ev-5`, candidateId: cId(1), category: 'problem_solving', points: 88 },
    { id: `ev-6`, candidateId: cId(1), category: 'teamwork', points: 80 },
    { id: `ev-7`, candidateId: cId(1), category: 'leadership', points: 70 },
    // Roberto Méndez
    { id: `ev-8`, candidateId: cId(2), category: 'technical_knowledge', points: 60 },
    { id: `ev-9`, candidateId: cId(2), category: 'experience', points: 35 },
    { id: `ev-10`, candidateId: cId(2), category: 'communication', points: 75 },
    { id: `ev-11`, candidateId: cId(2), category: 'attitude', points: 85 },
    { id: `ev-12`, candidateId: cId(2), category: 'problem_solving', points: 55 },
    { id: `ev-13`, candidateId: cId(2), category: 'teamwork', points: 80 },
    { id: `ev-14`, candidateId: cId(2), category: 'leadership', points: 30 },
    // Camila Ríos
    { id: `ev-15`, candidateId: cId(3), category: 'technical_knowledge', points: 92 },
    { id: `ev-16`, candidateId: cId(3), category: 'experience', points: 90 },
    { id: `ev-17`, candidateId: cId(3), category: 'communication', points: 88 },
    { id: `ev-18`, candidateId: cId(3), category: 'attitude', points: 95 },
    { id: `ev-19`, candidateId: cId(3), category: 'problem_solving', points: 90 },
    { id: `ev-20`, candidateId: cId(3), category: 'teamwork', points: 85 },
    { id: `ev-21`, candidateId: cId(3), category: 'leadership', points: 92 },
    // Diego Herrera
    { id: `ev-22`, candidateId: cId(4), category: 'technical_knowledge', points: 85 },
    { id: `ev-23`, candidateId: cId(4), category: 'experience', points: 80 },
    { id: `ev-24`, candidateId: cId(4), category: 'communication', points: 60 },
    { id: `ev-25`, candidateId: cId(4), category: 'attitude', points: 50 },
    { id: `ev-26`, candidateId: cId(4), category: 'problem_solving', points: 75 },
    { id: `ev-27`, candidateId: cId(4), category: 'teamwork', points: 55 },
    { id: `ev-28`, candidateId: cId(4), category: 'leadership', points: 40 },
    // Valentina Soto
    { id: `ev-29`, candidateId: cId(7), category: 'technical_knowledge', points: 80 },
    { id: `ev-30`, candidateId: cId(7), category: 'experience', points: 75 },
    { id: `ev-31`, candidateId: cId(7), category: 'communication', points: 78 },
    { id: `ev-32`, candidateId: cId(7), category: 'attitude', points: 85 },
    { id: `ev-33`, candidateId: cId(7), category: 'problem_solving', points: 72 },
    { id: `ev-34`, candidateId: cId(7), category: 'teamwork', points: 80 },
    { id: `ev-35`, candidateId: cId(7), category: 'leadership', points: 45 },
    // Daniela Castro
    { id: `ev-36`, candidateId: cId(9), category: 'technical_knowledge', points: 92 },
    { id: `ev-37`, candidateId: cId(9), category: 'experience', points: 85 },
    { id: `ev-38`, candidateId: cId(9), category: 'communication', points: 75 },
    { id: `ev-39`, candidateId: cId(9), category: 'attitude', points: 80 },
    { id: `ev-40`, candidateId: cId(9), category: 'problem_solving', points: 85 },
    { id: `ev-41`, candidateId: cId(9), category: 'teamwork', points: 75 },
    { id: `ev-42`, candidateId: cId(9), category: 'leadership', points: 55 },
    // Marcelo Vega (rejected)
    { id: `ev-43`, candidateId: cId(10), category: 'technical_knowledge', points: 50 },
    { id: `ev-44`, candidateId: cId(10), category: 'experience', points: 55 },
    { id: `ev-45`, candidateId: cId(10), category: 'communication', points: 60 },
    { id: `ev-46`, candidateId: cId(10), category: 'attitude', points: 65 },
    { id: `ev-47`, candidateId: cId(10), category: 'problem_solving', points: 40 },
    { id: `ev-48`, candidateId: cId(10), category: 'teamwork', points: 55 },
    { id: `ev-49`, candidateId: cId(10), category: 'leadership', points: 30 },
  ]

  await db.candidates.bulkAdd(candidates)
  await db.candidateTechnologies.bulkAdd(candidateTechs)
  await db.candidateEvaluations.bulkAdd(candidateEvals)

  // Recalculate totalScores (50% tech + 50% eval)
  for (const c of candidates) {
    const techs = candidateTechs.filter((t) => t.candidateId === c.id)
    const evals = candidateEvals.filter((e) => e.candidateId === c.id)
    const techAvg = techs.length > 0 ? Math.round(techs.reduce((s, t) => s + t.points, 0) / techs.length) : 0
    const evalAvg = evals.length > 0 ? Math.round(evals.reduce((s, e) => s + e.points, 0) / evals.length) : 0
    const totalScore = Math.round(techAvg * 0.5 + evalAvg * 0.5)
    await db.candidates.update(c.id, { totalScore })
  }

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
