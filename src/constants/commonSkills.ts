export const COMMON_SKILLS: { id: string; name: string; category: string }[] = [
  // Metodologías ágiles
  { id: 'skill-scrum', name: 'Scrum', category: 'metodologia' },
  { id: 'skill-kanban', name: 'Kanban', category: 'metodologia' },
  { id: 'skill-agile', name: 'Agile', category: 'metodologia' },
  { id: 'skill-safe', name: 'SAFe', category: 'metodologia' },
  { id: 'skill-lean', name: 'Lean', category: 'metodologia' },
  // Prácticas de desarrollo
  { id: 'skill-solid', name: 'SOLID', category: 'practica' },
  { id: 'skill-clean-code', name: 'Clean Code', category: 'practica' },
  { id: 'skill-design-patterns', name: 'Design Patterns', category: 'practica' },
  { id: 'skill-ddd', name: 'Domain Driven Design', category: 'practica' },
  { id: 'skill-tdd', name: 'TDD', category: 'practica' },
  { id: 'skill-bdd', name: 'BDD', category: 'practica' },
  { id: 'skill-event-sourcing', name: 'Event Sourcing', category: 'practica' },
  { id: 'skill-cqrs', name: 'CQRS', category: 'practica' },
  { id: 'skill-hexagonal', name: 'Arquitectura Hexagonal', category: 'practica' },
  // Infraestructura y operaciones
  { id: 'skill-cicd', name: 'CI/CD', category: 'infraestructura' },
  { id: 'skill-devops', name: 'DevOps', category: 'infraestructura' },
  { id: 'skill-gitops', name: 'GitOps', category: 'infraestructura' },
  { id: 'skill-sre', name: 'Site Reliability Engineering', category: 'infraestructura' },
  { id: 'skill-cloud-native', name: 'Cloud Native', category: 'infraestructura' },
  { id: 'skill-12-factor', name: '12 Factor App', category: 'infraestructura' },
  // Gobierno y estándares
  { id: 'skill-itil', name: 'ITIL', category: 'gobierno' },
  { id: 'skill-cobit', name: 'COBIT', category: 'gobierno' },
  { id: 'skill-iso-27001', name: 'ISO 27001', category: 'gobierno' },
  { id: 'skill-iso-22301', name: 'ISO 22301', category: 'gobierno' },
  { id: 'skill-togaf', name: 'TOGAF', category: 'gobierno' },
  // Gestión de proyectos
  { id: 'skill-pmp', name: 'PMP', category: 'gestion' },
  { id: 'skill-prince2', name: 'Prince2', category: 'gestion' },
  { id: 'skill-pmbok', name: 'PMBOK', category: 'gestion' },
  // Arquitectura y diseño
  { id: 'skill-microservices', name: 'Microservicios', category: 'arquitectura' },
  { id: 'skill-api-first', name: 'API First', category: 'arquitectura' },
  { id: 'skill-openapi', name: 'OpenAPI', category: 'arquitectura' },
  { id: 'skill-graphql', name: 'GraphQL', category: 'arquitectura' },
  // Seguridad
  { id: 'skill-oauth2', name: 'OAuth 2.0', category: 'seguridad' },
  { id: 'skill-oidc', name: 'OpenID Connect', category: 'seguridad' },
  { id: 'skill-saml', name: 'SAML', category: 'seguridad' },
  // Datos y analytics
  { id: 'skill-bi', name: 'Business Intelligence', category: 'datos' },
  { id: 'skill-dw', name: 'Data Warehousing', category: 'datos' },
  { id: 'skill-datalake', name: 'Data Lake', category: 'datos' },
  { id: 'skill-ml', name: 'Machine Learning', category: 'datos' },
  { id: 'skill-data-science', name: 'Data Science', category: 'datos' },
  // UX
  { id: 'skill-ux', name: 'UX / UI', category: 'ux' },
  { id: 'skill-design-thinking', name: 'Design Thinking', category: 'ux' },
  { id: 'skill-user-research', name: 'User Research', category: 'ux' },
]

export function searchTechnologies(
  query: string,
  catalog: { id: string; name: string; category?: string; vendor?: string }[],
): { id: string; name: string; category: string; vendor?: string; isSkill: boolean }[] {
  if (!query.trim()) return []

  const q = query.toLowerCase()
  const fromCatalog = catalog
    .filter((t) => t.name.toLowerCase().includes(q) || (t.vendor && t.vendor.toLowerCase().includes(q)))
    .map((t) => ({ id: t.id, name: t.name, category: t.category ?? '', vendor: t.vendor, isSkill: false }))

  const fromSkills = COMMON_SKILLS
    .filter((s) => s.name.toLowerCase().includes(q))
    .filter((s) => !fromCatalog.some((c) => c.name.toLowerCase() === s.name.toLowerCase()))
    .map((s) => ({ id: s.id, name: s.name, category: s.category, isSkill: true }))

  return [...fromCatalog, ...fromSkills].slice(0, 20)
}
