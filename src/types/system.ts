/* ============================================================
 * System — Configuración dinámica del sistema
 *
 * Reemplaza todo el hardcoding actual:
 *   constants/config.ts     → system_config
 *   constants/enums.ts      → catalogs
 *   constants/options.ts    → catalogs
 *   constants/roleLabels.ts → catalogs
 *   constants/commonSkills.ts → skills
 *   Landing/copy/text       → content_blocks
 * ============================================================ */

/** ─── system_config ─── clave-valor versionado */
export interface SystemConfig {
  key: string
  value: unknown
  description: string
  updatedAt: string
}

export type SystemConfigKey =
  | 'thi.weights'
  | 'thi.ranges'
  | 'dora.benchmarks'
  | 'risk.thresholds'
  | 'vulnerability.sla'
  | 'app.name'
  | 'app.version'
  | 'app.defaultLocale'
  | 'thi.defaultWeights'
  | 'notification.escalationRules'
  | 'security.passwordPolicy'
  | 'security.sessionTimeout'
  | 'sync.endoflifeCacheHours'
  | 'sync.nvdCacheMinutes'
  | 'ui.sidebarCollapsed'
  | 'ui.theme'
  | 'feature.flags'

/** ─── catalogs ─── listas dinámicas (enums, options, labels) */
export interface CatalogEntry {
  id: string
  category: string
  value: string
  label: string
  sortOrder: number
  metadata?: Record<string, unknown>
  enabled: boolean
  updatedAt: string
}

export type CatalogCategory =
  | 'criticality'
  | 'architecture_type'
  | 'application_status'
  | 'tech_category'
  | 'support_status'
  | 'dependency_type'
  | 'severity'
  | 'vuln_source'
  | 'vuln_status'
  | 'incident_status'
  | 'risk_category'
  | 'risk_status'
  | 'risk_level'
  | 'audit_category'
  | 'audit_status'
  | 'plan_status'
  | 'source_system'
  | 'objective_type'
  | 'objective_status'
  | 'kr_status'
  | 'project_status'
  | 'project_health'
  | 'business_unit_status'
  | 'dora_level'
  | 'trend_direction'
  | 'deliverable_status'
  | 'user_role'
  | 'environment_type'
  | 'task_status'
  | 'commitment_status'
  | 'blocker_severity'
  | 'blocker_status'
  | 'dependency_relation'
  | 'member_role'
  | 'member_status'
  | 'skill_category'
  | 'equipment_type'
  | 'equipment_status'
  | 'recruitment_status'
  | 'notification_type'

/** ─── content_blocks ─── UI text, landing, docs, features */
export interface ContentBlock {
  key: string
  content: unknown
  description: string
  updatedAt: string
}

export type ContentBlockKey =
  | 'landing.hero'
  | 'landing.features'
  | 'landing.stats'
  | 'landing.roadmap'
  | 'landing.footer'
  | 'landing.testimonials'
  | 'security.cvssTable'
  | 'security.slaPolicy'
  | 'onboarding.steps'
  | 'onboarding.welcome'
  | 'app.description'
  | 'app.tagline'
  | 'notifications.templates'

/** ─── skills ─── habilidades/capacidades del sistema */
export interface Skill {
  id: string
  name: string
  category: string
  enabled: boolean
  updatedAt: string
}
