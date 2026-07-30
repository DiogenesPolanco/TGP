import { db } from '@/services/db/database'
import {
  DEFAULT_HEALTH_WEIGHTS,
  THI_RANGES,
  DORA_BENCHMARKS,
  RISK_THRESHOLDS,
  DEFAULT_SLA_CONFIG,
  APP_NAME,
  APP_VERSION,
} from '@/constants/config'
import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS } from '@/constants/roleLabels'
import { criticalityOptions, taskStatusOptions } from '@/constants/options'
import { COMMON_SKILLS } from '@/constants/commonSkills'
import type { CatalogEntry, SystemConfig, ContentBlock } from '@/types/system'

let seeded = false

export async function seedSystemData(force = false): Promise<void> {
  if (seeded && !force) return
  const count = await db.systemConfig.count()
  if (count > 0 && !force) return

  await db.transaction(
    'rw',
    db.systemConfig,
    db.catalogs,
    db.contentBlocks,
    db.skills,
    async () => {
      await seedConfigs()
      await seedCatalogs()
      await seedContentBlocks()
      await seedSkills()
    },
  )

  seeded = true
}

/* ─── system_config ─── */
async function seedConfigs(): Promise<void> {
  const configs: SystemConfig[] = [
    {
      key: 'thi.weights',
      value: DEFAULT_HEALTH_WEIGHTS,
      description: 'Pesos de dimensiones THI (global)',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'thi.ranges',
      value: THI_RANGES,
      description: 'Rangos de color y etiquetas THI',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'dora.benchmarks',
      value: DORA_BENCHMARKS,
      description: 'Thresholds DORA para benchmarking Elite/Alto/Medio/Bajo',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'risk.thresholds',
      value: RISK_THRESHOLDS,
      description: 'Rangos de riesgo (probabilidad × impacto)',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'vulnerability.sla',
      value: DEFAULT_SLA_CONFIG,
      description: 'SLA en días por severidad de vulnerabilidad',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'app.name',
      value: APP_NAME,
      description: 'Nombre de la aplicación',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'app.version',
      value: APP_VERSION,
      description: 'Versión actual',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'sync.endoflifeCacheHours',
      value: 24,
      description: 'Horas de cache para endoflife.date',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'sync.nvdCacheMinutes',
      value: 30,
      description: 'Minutos de cache para NVD API',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'feature.flags',
      value: { gobia: true, publicLinks: true, equipment: true, recruitment: false },
      description: 'Feature flags del sistema',
      updatedAt: new Date().toISOString(),
    },
  ]

  for (const c of configs) {
    await db.systemConfig.put(c)
  }
}

/* ─── catalogs ─── */
async function seedCatalogs(): Promise<void> {
  const entries: Omit<CatalogEntry, 'id' | 'updatedAt'>[] = [
    // criticality
    ...criticalityOptions.map((o, i) => ({
      category: 'criticality' as const,
      value: o.value,
      label: o.label,
      sortOrder: i,
      enabled: true,
    })),

    // member_role
    ...Object.entries(MEMBER_ROLE_LABELS).map(([value, label], i) => ({
      category: 'member_role' as const,
      value,
      label,
      sortOrder: i,
      enabled: true,
    })),

    // member_status
    ...Object.entries(MEMBER_STATUS_LABELS).map(([value, label], i) => ({
      category: 'member_status' as const,
      value,
      label,
      sortOrder: i,
      enabled: true,
    })),

    // task_status
    ...taskStatusOptions.map((o, i) => ({
      category: 'task_status' as const,
      value: o.value,
      label: o.label,
      sortOrder: i,
      enabled: true,
    })),

    // application_status
    {
      category: 'application_status' as const,
      value: 'active',
      label: 'Activo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'application_status' as const,
      value: 'deprecated',
      label: 'Deprecado',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'application_status' as const,
      value: 'retired',
      label: 'Retirado',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'application_status' as const,
      value: 'planned',
      label: 'Planificado',
      sortOrder: 3,
      enabled: true,
    },

    // architecture_type
    {
      category: 'architecture_type' as const,
      value: 'monolith',
      label: 'Monolito',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'architecture_type' as const,
      value: 'microservices',
      label: 'Microservicios',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'architecture_type' as const,
      value: 'serverless',
      label: 'Serverless',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'architecture_type' as const,
      value: 'soa',
      label: 'SOA',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'architecture_type' as const,
      value: 'event_driven',
      label: 'Event Driven',
      sortOrder: 4,
      enabled: true,
    },
    {
      category: 'architecture_type' as const,
      value: 'hybrid',
      label: 'Híbrida',
      sortOrder: 5,
      enabled: true,
    },

    // severity
    {
      category: 'severity' as const,
      value: 'critical',
      label: 'Crítica',
      sortOrder: 0,
      enabled: true,
    },
    { category: 'severity' as const, value: 'high', label: 'Alta', sortOrder: 1, enabled: true },
    { category: 'severity' as const, value: 'medium', label: 'Media', sortOrder: 2, enabled: true },
    { category: 'severity' as const, value: 'low', label: 'Baja', sortOrder: 3, enabled: true },
    {
      category: 'severity' as const,
      value: 'info',
      label: 'Informativo',
      sortOrder: 4,
      enabled: true,
    },

    // vuln_status
    {
      category: 'vuln_status' as const,
      value: 'open',
      label: 'Abierta',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'vuln_status' as const,
      value: 'in_progress',
      label: 'En Progreso',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'vuln_status' as const,
      value: 'fixed',
      label: 'Corregida',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'vuln_status' as const,
      value: 'accepted',
      label: 'Aceptada',
      sortOrder: 3,
      enabled: true,
    },

    // vuln_source
    {
      category: 'vuln_source' as const,
      value: 'fluid_attacks',
      label: 'Fluid Attacks',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'vuln_source' as const,
      value: 'sonarqube',
      label: 'SonarQube',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'vuln_source' as const,
      value: 'manual',
      label: 'Manual',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'vuln_source' as const,
      value: 'github_advisory',
      label: 'GitHub Advisory',
      sortOrder: 3,
      enabled: true,
    },

    // incident_status
    {
      category: 'incident_status' as const,
      value: 'detected',
      label: 'Detectado',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'incident_status' as const,
      value: 'acknowledged',
      label: 'Reconocido',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'incident_status' as const,
      value: 'in_progress',
      label: 'En Progreso',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'incident_status' as const,
      value: 'resolved',
      label: 'Resuelto',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'incident_status' as const,
      value: 'closed',
      label: 'Cerrado',
      sortOrder: 4,
      enabled: true,
    },

    // risk_category
    {
      category: 'risk_category' as const,
      value: 'technical',
      label: 'Técnico',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'risk_category' as const,
      value: 'security',
      label: 'Seguridad',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'risk_category' as const,
      value: 'operational',
      label: 'Operacional',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'risk_category' as const,
      value: 'regulatory',
      label: 'Regulatorio',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'risk_category' as const,
      value: 'financial',
      label: 'Financiero',
      sortOrder: 4,
      enabled: true,
    },

    // risk_status
    {
      category: 'risk_status' as const,
      value: 'open',
      label: 'Abierto',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'risk_status' as const,
      value: 'mitigated',
      label: 'Mitigado',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'risk_status' as const,
      value: 'accepted',
      label: 'Aceptado',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'risk_status' as const,
      value: 'closed',
      label: 'Cerrado',
      sortOrder: 3,
      enabled: true,
    },

    // risk_level
    {
      category: 'risk_level' as const,
      value: 'very_low',
      label: 'Muy Bajo',
      sortOrder: 0,
      enabled: true,
    },
    { category: 'risk_level' as const, value: 'low', label: 'Bajo', sortOrder: 1, enabled: true },
    {
      category: 'risk_level' as const,
      value: 'medium',
      label: 'Medio',
      sortOrder: 2,
      enabled: true,
    },
    { category: 'risk_level' as const, value: 'high', label: 'Alto', sortOrder: 3, enabled: true },
    {
      category: 'risk_level' as const,
      value: 'critical',
      label: 'Crítico',
      sortOrder: 4,
      enabled: true,
    },

    // audit_category
    {
      category: 'audit_category' as const,
      value: 'security',
      label: 'Seguridad',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'compliance',
      label: 'Cumplimiento',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'architecture',
      label: 'Arquitectura',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'process',
      label: 'Proceso',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'data_governance',
      label: 'Gobierno de Datos',
      sortOrder: 4,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'access_control',
      label: 'Control de Acceso',
      sortOrder: 5,
      enabled: true,
    },
    {
      category: 'audit_category' as const,
      value: 'business_continuity',
      label: 'Continuidad de Negocio',
      sortOrder: 6,
      enabled: true,
    },

    // audit_status
    {
      category: 'audit_status' as const,
      value: 'open',
      label: 'Abierto',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'audit_status' as const,
      value: 'in_progress',
      label: 'En Progreso',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'audit_status' as const,
      value: 'resolved',
      label: 'Resuelto',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'audit_status' as const,
      value: 'closed',
      label: 'Cerrado',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'audit_status' as const,
      value: 'overdue',
      label: 'Vencido',
      sortOrder: 4,
      enabled: true,
    },

    // objective_status
    {
      category: 'objective_status' as const,
      value: 'on_track',
      label: 'En Camino',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'objective_status' as const,
      value: 'at_risk',
      label: 'En Riesgo',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'objective_status' as const,
      value: 'behind',
      label: 'Atrasado',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'objective_status' as const,
      value: 'achieved',
      label: 'Logrado',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'objective_status' as const,
      value: 'not_started',
      label: 'No Iniciado',
      sortOrder: 4,
      enabled: true,
    },

    // plan_status
    {
      category: 'plan_status' as const,
      value: 'active',
      label: 'Activo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'plan_status' as const,
      value: 'completed',
      label: 'Completado',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'plan_status' as const,
      value: 'cancelled',
      label: 'Cancelado',
      sortOrder: 2,
      enabled: true,
    },

    // user_role
    {
      category: 'user_role' as const,
      value: 'admin',
      label: 'Administrador',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'user_role' as const,
      value: 'executive',
      label: 'Ejecutivo',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'user_role' as const,
      value: 'manager',
      label: 'Gerente',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'user_role' as const,
      value: 'operator',
      label: 'Operador',
      sortOrder: 3,
      enabled: true,
    },

    // environment_type
    {
      category: 'environment_type' as const,
      value: 'dev',
      label: 'Desarrollo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'qa',
      label: 'QA',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'staging',
      label: 'Staging',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'prod',
      label: 'Producción',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'dr',
      label: 'DR',
      sortOrder: 4,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'test',
      label: 'Pruebas',
      sortOrder: 5,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'uat',
      label: 'UAT',
      sortOrder: 6,
      enabled: true,
    },
    {
      category: 'environment_type' as const,
      value: 'perf',
      label: 'Rendimiento',
      sortOrder: 7,
      enabled: true,
    },

    // tech_category
    {
      category: 'tech_category' as const,
      value: 'framework',
      label: 'Framework',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'language',
      label: 'Lenguaje',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'database',
      label: 'Base de Datos',
      sortOrder: 2,
      enabled: true,
    },
    { category: 'tech_category' as const, value: 'os', label: 'OS', sortOrder: 3, enabled: true },
    {
      category: 'tech_category' as const,
      value: 'library',
      label: 'Librería',
      sortOrder: 4,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'runtime',
      label: 'Runtime',
      sortOrder: 5,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'message_broker',
      label: 'Message Broker',
      sortOrder: 6,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'cache',
      label: 'Cache',
      sortOrder: 7,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'web_server',
      label: 'Web Server',
      sortOrder: 8,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'cloud_service',
      label: 'Cloud Service',
      sortOrder: 9,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'tool',
      label: 'Herramienta',
      sortOrder: 10,
      enabled: true,
    },
    {
      category: 'tech_category' as const,
      value: 'other',
      label: 'Otro',
      sortOrder: 11,
      enabled: true,
    },

    // support_status
    {
      category: 'support_status' as const,
      value: 'active',
      label: 'Soporte Activo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'support_status' as const,
      value: 'extended',
      label: 'Soporte Extendido',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'support_status' as const,
      value: 'eol',
      label: 'Fin de Vida',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'support_status' as const,
      value: 'unknown',
      label: 'Desconocido',
      sortOrder: 3,
      enabled: true,
    },

    // dependency_type
    {
      category: 'dependency_type' as const,
      value: 'api',
      label: 'API',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'dependency_type' as const,
      value: 'database',
      label: 'Base de Datos',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'dependency_type' as const,
      value: 'library',
      label: 'Librería',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'dependency_type' as const,
      value: 'infrastructure',
      label: 'Infraestructura',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'dependency_type' as const,
      value: 'message',
      label: 'Mensajería',
      sortOrder: 4,
      enabled: true,
    },
    {
      category: 'dependency_type' as const,
      value: 'external',
      label: 'Externo',
      sortOrder: 5,
      enabled: true,
    },

    // deliverable_status
    {
      category: 'deliverable_status' as const,
      value: 'pending',
      label: 'Pendiente',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'deliverable_status' as const,
      value: 'in_progress',
      label: 'En Progreso',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'deliverable_status' as const,
      value: 'completed',
      label: 'Completado',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'deliverable_status' as const,
      value: 'cancelled',
      label: 'Cancelado',
      sortOrder: 3,
      enabled: true,
    },

    // blocker_severity
    {
      category: 'blocker_severity' as const,
      value: 'low',
      label: 'Bajo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'blocker_severity' as const,
      value: 'medium',
      label: 'Medio',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'blocker_severity' as const,
      value: 'high',
      label: 'Alto',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'blocker_severity' as const,
      value: 'critical',
      label: 'Crítico',
      sortOrder: 3,
      enabled: true,
    },

    // blocker_status
    {
      category: 'blocker_status' as const,
      value: 'open',
      label: 'Abierto',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'blocker_status' as const,
      value: 'escalated',
      label: 'Escalado',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'blocker_status' as const,
      value: 'resolved',
      label: 'Resuelto',
      sortOrder: 2,
      enabled: true,
    },

    // commitment_status
    {
      category: 'commitment_status' as const,
      value: 'active',
      label: 'Activo',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'commitment_status' as const,
      value: 'at_risk',
      label: 'En Riesgo',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'commitment_status' as const,
      value: 'breached',
      label: 'Incumplido',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'commitment_status' as const,
      value: 'fulfilled',
      label: 'Cumplido',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'commitment_status' as const,
      value: 'cancelled',
      label: 'Cancelado',
      sortOrder: 4,
      enabled: true,
    },

    // dora_level
    {
      category: 'dora_level' as const,
      value: 'elite',
      label: 'Elite',
      sortOrder: 0,
      enabled: true,
    },
    { category: 'dora_level' as const, value: 'high', label: 'Alto', sortOrder: 1, enabled: true },
    {
      category: 'dora_level' as const,
      value: 'medium',
      label: 'Medio',
      sortOrder: 2,
      enabled: true,
    },
    { category: 'dora_level' as const, value: 'low', label: 'Bajo', sortOrder: 3, enabled: true },

    // project_status
    {
      category: 'project_status' as const,
      value: 'planned',
      label: 'Planificado',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'project_status' as const,
      value: 'in_progress',
      label: 'En Progreso',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'project_status' as const,
      value: 'on_hold',
      label: 'En Espera',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'project_status' as const,
      value: 'completed',
      label: 'Completado',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'project_status' as const,
      value: 'cancelled',
      label: 'Cancelado',
      sortOrder: 4,
      enabled: true,
    },

    // project_health
    {
      category: 'project_health' as const,
      value: 'green',
      label: 'Verde',
      sortOrder: 0,
      enabled: true,
      metadata: { color: '#36B37E' },
    },
    {
      category: 'project_health' as const,
      value: 'yellow',
      label: 'Amarillo',
      sortOrder: 1,
      enabled: true,
      metadata: { color: '#FFAB00' },
    },
    {
      category: 'project_health' as const,
      value: 'red',
      label: 'Rojo',
      sortOrder: 2,
      enabled: true,
      metadata: { color: '#FF5630' },
    },

    // source_system
    {
      category: 'source_system' as const,
      value: 'jira',
      label: 'Jira',
      sortOrder: 0,
      enabled: true,
    },
    {
      category: 'source_system' as const,
      value: 'azure_devops',
      label: 'Azure DevOps',
      sortOrder: 1,
      enabled: true,
    },
    {
      category: 'source_system' as const,
      value: 'github',
      label: 'GitHub',
      sortOrder: 2,
      enabled: true,
    },
    {
      category: 'source_system' as const,
      value: 'gitlab',
      label: 'GitLab',
      sortOrder: 3,
      enabled: true,
    },
    {
      category: 'source_system' as const,
      value: 'manual',
      label: 'Manual',
      sortOrder: 4,
      enabled: true,
    },
  ]

  for (const e of entries) {
    await db.catalogs.add({ id: crypto.randomUUID(), ...e, updatedAt: new Date().toISOString() })
  }
}

/* ─── skills ─── */
async function seedSkills(): Promise<void> {
  for (const s of COMMON_SKILLS) {
    await db.skills.add({
      id: s.id,
      name: s.name,
      category: s.category,
      enabled: true,
      updatedAt: new Date().toISOString(),
    })
  }
}

/* ─── content_blocks ─── */
async function seedContentBlocks(): Promise<void> {
  const blocks: ContentBlock[] = [
    {
      key: 'landing.hero',
      content: {
        tagline: 'Technology Governance Platform',
        title: ['Gobierno de TI', 'en tiempo real', 'sin servidores'],
        subtitle:
          'TGP es la primera plataforma de governance tecnológico 100% cliente-side. Gestiona aplicaciones, vulnerabilidades, equipos y obsolescencia con privacidad total — tus datos nunca salen de tu dispositivo.',
      },
      description: 'Texto del hero section en landing page',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'landing.stats',
      content: [
        { value: '100%', label: 'Privacidad', note: 'local-first' },
        { value: '0', label: 'Servidores', note: 'sin backend' },
        { value: '40+', label: 'Tablas', note: 'dexie.js' },
        { value: '7', label: 'Dimensiones', note: 'THI score compuesto' },
      ],
      description: 'Estadísticas del hero en landing page',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'landing.features',
      content: [
        {
          icon: 'LayoutDashboard',
          title: 'Dashboard THI',
          desc: '"Está todo bien" no es un reporte. El THI sí.',
          highlights: [
            'THI compuesto en 7 dimensiones',
            'KPIs ejecutivos con drill-down',
            'Tendencias y distribución por severidad',
          ],
        },
        {
          icon: 'Layers',
          title: 'Catálogo',
          desc: 'Esa app que nadie recuerda — existe y ya está documentada.',
          highlights: [
            'CRUD completo con búsqueda avanzada',
            'Filtros por criticidad, estado y BU',
            'Vulnerabilidades y riesgos heredados',
          ],
        },
        {
          icon: 'Shield',
          title: 'Seguridad',
          desc: 'Vulnerabilidades que no se arreglan solas. Pero al menos sabes cuáles son.',
          highlights: [
            'CVSS scoring y SLA tracking',
            'Incidentes P1–P4 con tiempos de respuesta',
            'Consulta CVE/NVD integrada con lookups automáticos',
            'Matriz de riesgos y hallazgos de auditoría',
          ],
        },
        {
          icon: 'Users',
          title: 'Equipos DORA',
          desc: 'Benchmarking real. Porque "hacemos deploy rápido" no es una métrica.',
          highlights: [
            'Deploy frequency, Lead time, CFR, MTTR',
            'Benchmarking Elite / Alto / Medio / Bajo',
            'Vinculación con OKRs y entregables',
          ],
        },
        {
          icon: 'Crosshair',
          title: 'OKRs',
          desc: 'Objetivos que no se pierden en el Slack del Q3.',
          highlights: [
            'Key Results con progreso automático',
            'Estados: on track, at risk, behind, achieved',
            'Vinculación con planes y ejecución',
          ],
        },
        {
          icon: 'Kanban',
          title: 'Ejecución',
          desc: 'Planes, blockers y compromisos. Todo lo que un líder necesita seguir.',
          highlights: [
            'Diagramas de Gantt y timeline diaria',
            'Bloqueos con escalamiento automático',
            'Mapa de dependencias y compromisos',
          ],
        },
        {
          icon: 'CalendarClock',
          title: 'Obsolescencia',
          desc: '"Esa versión salió hace 3 años" — sí, y ya deberías haber migrado.',
          highlights: [
            'Sincronización con endoflife.date',
            'Alertas de vencimiento y mapa global',
            'Impacto sobre aplicaciones y tecnologías',
          ],
        },
        {
          icon: 'Bot',
          title: 'GobIA',
          desc: 'Un asistente que responde. No que "procesa tu solicitud".',
          highlights: [
            'Consultas en lenguaje natural sobre tus datos',
            'Proveedores: OpenAI, Groq, Anthropic, Ollama',
            'Tool calls: auditoría, consultas, análisis',
          ],
        },
      ],
      description: 'Catálogo de features en sección "Plataforma de Gobierno"',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'landing.roadmap',
      content: [
        {
          q: 'Q3 2026',
          active: true,
          items: [
            'Integración Jira · GitHub · GitLab',
            'Módulo FinOps — costo por aplicación',
            'Alertas vía Slack / Teams / Email',
          ],
        },
        {
          q: 'Q4 2026',
          active: false,
          items: [
            'Reportes PDF ejecutivos automatizados',
            'API pública REST para terceros',
            'Portal de proveedores con auto-evaluación',
          ],
        },
        {
          q: '2027',
          active: false,
          items: [
            'Benchmarking THI entre industrias',
            'On-premise deployment con Docker',
            'Marketplace de plugins y extensiones',
          ],
        },
      ],
      description: 'Roadmap de próximos hitos en landing page',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'security.cvssTable',
      content: [
        { severity: 'P1 — Crítica', range: '9.0 – 10.0', sla: '≤ 48 horas' },
        { severity: 'P2 — Alta', range: '7.0 – 8.9', sla: '≤ 7 días' },
        { severity: 'P3 — Media', range: '4.0 – 6.9', sla: '≤ 30 días' },
        { severity: 'P4 — Baja', range: '0.1 – 3.9', sla: '≤ 90 días' },
      ],
      description: 'Tabla CVSS con SLA por severidad',
      updatedAt: new Date().toISOString(),
    },
    {
      key: 'app.tagline',
      content:
        'SPA cliente-side para gobierno tecnológico empresarial — aplicaciones, seguridad, riesgos, OKRs, equipos y seguimiento de ejecución.',
      description: 'Tagline de la aplicación',
      updatedAt: new Date().toISOString(),
    },
  ]

  for (const b of blocks) {
    await db.contentBlocks.put(b)
  }
}
