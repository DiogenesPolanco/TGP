import { db } from '@/services/db/database'
import type { Technology, TechCategory, SupportStatus } from '@/types/domain'

interface TechEntry {
  name: string
  version: string
  category: TechCategory
  vendor: string
  eolDate: string | null
  supportStatus: SupportStatus
}

const TECH_CATALOG: TechEntry[] = [
  // ── Languages ──
  { name: 'Java', version: '21', category: 'language', vendor: 'Oracle', eolDate: '2028-09-30', supportStatus: 'active' },
  { name: 'Java', version: '17', category: 'language', vendor: 'Oracle', eolDate: '2027-09-30', supportStatus: 'active' },
  { name: 'Java', version: '11', category: 'language', vendor: 'Oracle', eolDate: '2024-09-30', supportStatus: 'eol' },
  { name: 'Java', version: '8', category: 'language', vendor: 'Oracle', eolDate: '2022-03-31', supportStatus: 'eol' },
  { name: 'Python', version: '3.13', category: 'language', vendor: 'Python Software Foundation', eolDate: '2029-10-31', supportStatus: 'active' },
  { name: 'Python', version: '3.12', category: 'language', vendor: 'Python Software Foundation', eolDate: '2028-10-31', supportStatus: 'active' },
  { name: 'Python', version: '3.11', category: 'language', vendor: 'Python Software Foundation', eolDate: '2027-10-31', supportStatus: 'active' },
  { name: 'Python', version: '3.10', category: 'language', vendor: 'Python Software Foundation', eolDate: '2026-10-31', supportStatus: 'extended' },
  { name: 'Python', version: '3.9', category: 'language', vendor: 'Python Software Foundation', eolDate: '2025-10-31', supportStatus: 'eol' },
  { name: 'TypeScript', version: '5.x', category: 'language', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'JavaScript', version: 'ES2024', category: 'language', vendor: 'TC39', eolDate: null, supportStatus: 'active' },
  { name: 'C#', version: '13', category: 'language', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'C#', version: '12', category: 'language', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'Go', version: '1.24', category: 'language', vendor: 'Google', eolDate: null, supportStatus: 'active' },
  { name: 'Go', version: '1.23', category: 'language', vendor: 'Google', eolDate: null, supportStatus: 'extended' },
  { name: 'Rust', version: '2024', category: 'language', vendor: 'Rust Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Kotlin', version: '2.1', category: 'language', vendor: 'JetBrains', eolDate: null, supportStatus: 'active' },
  { name: 'Kotlin', version: '2.0', category: 'language', vendor: 'JetBrains', eolDate: null, supportStatus: 'active' },
  { name: 'Swift', version: '6.0', category: 'language', vendor: 'Apple', eolDate: null, supportStatus: 'active' },
  { name: 'PHP', version: '8.4', category: 'language', vendor: 'PHP Group', eolDate: null, supportStatus: 'active' },
  { name: 'PHP', version: '8.3', category: 'language', vendor: 'PHP Group', eolDate: null, supportStatus: 'active' },
  { name: 'PHP', version: '8.2', category: 'language', vendor: 'PHP Group', eolDate: '2025-12-31', supportStatus: 'eol' },
  { name: 'Ruby', version: '3.4', category: 'language', vendor: 'Ruby Core Team', eolDate: null, supportStatus: 'active' },
  { name: 'Ruby', version: '3.3', category: 'language', vendor: 'Ruby Core Team', eolDate: null, supportStatus: 'active' },
  { name: 'Scala', version: '3.x', category: 'language', vendor: 'EPFL', eolDate: null, supportStatus: 'active' },

  // ── Frameworks ──
  { name: '.NET', version: '9', category: 'framework', vendor: 'Microsoft', eolDate: '2026-05-31', supportStatus: 'extended' },
  { name: '.NET', version: '8', category: 'framework', vendor: 'Microsoft', eolDate: '2026-11-30', supportStatus: 'active' },
  { name: '.NET', version: '6', category: 'framework', vendor: 'Microsoft', eolDate: '2024-11-30', supportStatus: 'eol' },
  { name: '.NET Framework', version: '4.8', category: 'framework', vendor: 'Microsoft', eolDate: null, supportStatus: 'extended' },
  { name: 'ASP.NET Core', version: '9', category: 'framework', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'ASP.NET Core', version: '8', category: 'framework', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'Angular', version: '19', category: 'framework', vendor: 'Google', eolDate: null, supportStatus: 'active' },
  { name: 'Angular', version: '18', category: 'framework', vendor: 'Google', eolDate: null, supportStatus: 'active' },
  { name: 'Angular', version: '17', category: 'framework', vendor: 'Google', eolDate: '2025-05-15', supportStatus: 'eol' },
  { name: 'Angular', version: '16', category: 'framework', vendor: 'Google', eolDate: '2024-11-15', supportStatus: 'eol' },
  { name: 'Angular', version: '15', category: 'framework', vendor: 'Google', eolDate: '2024-05-15', supportStatus: 'eol' },
  { name: 'React', version: '19', category: 'framework', vendor: 'Meta', eolDate: null, supportStatus: 'active' },
  { name: 'React', version: '18', category: 'framework', vendor: 'Meta', eolDate: null, supportStatus: 'active' },
  { name: 'Vue.js', version: '3.x', category: 'framework', vendor: 'Evan You', eolDate: null, supportStatus: 'active' },
  { name: 'Next.js', version: '15', category: 'framework', vendor: 'Vercel', eolDate: null, supportStatus: 'active' },
  { name: 'Next.js', version: '14', category: 'framework', vendor: 'Vercel', eolDate: null, supportStatus: 'active' },
  { name: 'Spring Boot', version: '3.4', category: 'framework', vendor: 'VMware', eolDate: null, supportStatus: 'active' },
  { name: 'Spring Boot', version: '3.3', category: 'framework', vendor: 'VMware', eolDate: null, supportStatus: 'extended' },
  { name: 'NestJS', version: '11', category: 'framework', vendor: 'NestJS Team', eolDate: null, supportStatus: 'active' },
  { name: 'Express', version: '5', category: 'framework', vendor: 'OpenJS Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Express', version: '4', category: 'framework', vendor: 'OpenJS Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Django', version: '5.1', category: 'framework', vendor: 'Django Software Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Django', version: '5.0', category: 'framework', vendor: 'Django Software Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Django', version: '4.2', category: 'framework', vendor: 'Django Software Foundation', eolDate: '2026-04-30', supportStatus: 'extended' },
  { name: 'Flask', version: '3.x', category: 'framework', vendor: 'Pallets Project', eolDate: null, supportStatus: 'active' },
  { name: 'Laravel', version: '11', category: 'framework', vendor: 'Laravel LLC', eolDate: null, supportStatus: 'active' },
  { name: 'Laravel', version: '10', category: 'framework', vendor: 'Laravel LLC', eolDate: null, supportStatus: 'active' },
  { name: 'Ruby on Rails', version: '8.0', category: 'framework', vendor: 'Rails Core Team', eolDate: null, supportStatus: 'active' },
  { name: 'Ruby on Rails', version: '7.2', category: 'framework', vendor: 'Rails Core Team', eolDate: null, supportStatus: 'active' },

  // ── Databases ──
  { name: 'PostgreSQL', version: '17', category: 'database', vendor: 'PostgreSQL Global Development Group', eolDate: '2027-11-09', supportStatus: 'active' },
  { name: 'PostgreSQL', version: '16', category: 'database', vendor: 'PostgreSQL Global Development Group', eolDate: '2026-11-09', supportStatus: 'active' },
  { name: 'PostgreSQL', version: '15', category: 'database', vendor: 'PostgreSQL Global Development Group', eolDate: '2025-11-09', supportStatus: 'eol' },
  { name: 'PostgreSQL', version: '14', category: 'database', vendor: 'PostgreSQL Global Development Group', eolDate: '2024-11-09', supportStatus: 'eol' },
  { name: 'MySQL', version: '9.0', category: 'database', vendor: 'Oracle', eolDate: null, supportStatus: 'active' },
  { name: 'MySQL', version: '8.4', category: 'database', vendor: 'Oracle', eolDate: null, supportStatus: 'active' },
  { name: 'MySQL', version: '8.0', category: 'database', vendor: 'Oracle', eolDate: '2026-04-30', supportStatus: 'extended' },
  { name: 'MySQL', version: '5.7', category: 'database', vendor: 'Oracle', eolDate: '2023-10-21', supportStatus: 'eol' },
  { name: 'MariaDB', version: '11.6', category: 'database', vendor: 'MariaDB Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'MariaDB', version: '11.4', category: 'database', vendor: 'MariaDB Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'MariaDB', version: '10.11', category: 'database', vendor: 'MariaDB Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'SQL Server', version: '2022', category: 'database', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'SQL Server', version: '2019', category: 'database', vendor: 'Microsoft', eolDate: '2025-01-08', supportStatus: 'extended' },
  { name: 'SQL Server', version: '2017', category: 'database', vendor: 'Microsoft', eolDate: '2024-10-08', supportStatus: 'eol' },
  { name: 'Oracle Database', version: '23c', category: 'database', vendor: 'Oracle', eolDate: null, supportStatus: 'active' },
  { name: 'Oracle Database', version: '21c', category: 'database', vendor: 'Oracle', eolDate: null, supportStatus: 'extended' },
  { name: 'Oracle Database', version: '19c', category: 'database', vendor: 'Oracle', eolDate: '2026-05-31', supportStatus: 'extended' },
  { name: 'MongoDB', version: '8.0', category: 'database', vendor: 'MongoDB Inc', eolDate: null, supportStatus: 'active' },
  { name: 'MongoDB', version: '7.0', category: 'database', vendor: 'MongoDB Inc', eolDate: null, supportStatus: 'active' },
  { name: 'MongoDB', version: '6.0', category: 'database', vendor: 'MongoDB Inc', eolDate: null, supportStatus: 'active' },
  { name: 'CockroachDB', version: '24.x', category: 'database', vendor: 'Cockroach Labs', eolDate: null, supportStatus: 'active' },

  // ── Caches ──
  { name: 'Redis', version: '7.4', category: 'cache', vendor: 'Redis Ltd', eolDate: null, supportStatus: 'active' },
  { name: 'Redis', version: '7.2', category: 'cache', vendor: 'Redis Ltd', eolDate: null, supportStatus: 'active' },
  { name: 'Redis', version: '6.2', category: 'cache', vendor: 'Redis Ltd', eolDate: null, supportStatus: 'extended' },
  { name: 'Memcached', version: '1.6', category: 'cache', vendor: 'Dormando', eolDate: null, supportStatus: 'active' },

  // ── Message Brokers ──
  { name: 'RabbitMQ', version: '4.0', category: 'message_broker', vendor: 'VMware', eolDate: null, supportStatus: 'active' },
  { name: 'RabbitMQ', version: '3.13', category: 'message_broker', vendor: 'VMware', eolDate: null, supportStatus: 'active' },
  { name: 'RabbitMQ', version: '3.12', category: 'message_broker', vendor: 'VMware', eolDate: null, supportStatus: 'extended' },
  { name: 'Apache Kafka', version: '3.9', category: 'message_broker', vendor: 'Apache Software Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Apache Kafka', version: '3.8', category: 'message_broker', vendor: 'Apache Software Foundation', eolDate: null, supportStatus: 'extended' },
  { name: 'Apache ActiveMQ', version: '6.x', category: 'message_broker', vendor: 'Apache Software Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Amazon SQS', version: 'SaaS', category: 'message_broker', vendor: 'Amazon Web Services', eolDate: null, supportStatus: 'active' },

  // ── Runtimes ──
  { name: 'Node.js', version: '22', category: 'runtime', vendor: 'OpenJS Foundation', eolDate: '2027-10-31', supportStatus: 'active' },
  { name: 'Node.js', version: '20', category: 'runtime', vendor: 'OpenJS Foundation', eolDate: '2026-04-30', supportStatus: 'active' },
  { name: 'Node.js', version: '18', category: 'runtime', vendor: 'OpenJS Foundation', eolDate: '2025-10-31', supportStatus: 'eol' },
  { name: 'Node.js', version: '23', category: 'runtime', vendor: 'OpenJS Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Bun', version: '1.2', category: 'runtime', vendor: 'Oven', eolDate: null, supportStatus: 'active' },
  { name: 'Deno', version: '2.x', category: 'runtime', vendor: 'Deno Land', eolDate: null, supportStatus: 'active' },

  // ── Web Servers ──
  { name: 'Nginx', version: '1.26', category: 'web_server', vendor: 'F5', eolDate: null, supportStatus: 'active' },
  { name: 'Nginx', version: '1.24', category: 'web_server', vendor: 'F5', eolDate: null, supportStatus: 'extended' },
  { name: 'Apache HTTP Server', version: '2.4', category: 'web_server', vendor: 'Apache Software Foundation', eolDate: null, supportStatus: 'active' },
  { name: 'Caddy', version: '2.x', category: 'web_server', vendor: 'Caddy Team', eolDate: null, supportStatus: 'active' },
  { name: 'IIS', version: '10', category: 'web_server', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },

  // ── Operating Systems ──
  { name: 'Ubuntu', version: '24.04', category: 'os', vendor: 'Canonical', eolDate: '2029-06-30', supportStatus: 'active' },
  { name: 'Ubuntu', version: '22.04', category: 'os', vendor: 'Canonical', eolDate: '2027-06-30', supportStatus: 'active' },
  { name: 'Ubuntu', version: '20.04', category: 'os', vendor: 'Canonical', eolDate: '2025-04-02', supportStatus: 'eol' },
  { name: 'Windows Server', version: '2025', category: 'os', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'Windows Server', version: '2022', category: 'os', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'Windows Server', version: '2019', category: 'os', vendor: 'Microsoft', eolDate: null, supportStatus: 'extended' },
  { name: 'Windows Server', version: '2016', category: 'os', vendor: 'Microsoft', eolDate: '2027-01-12', supportStatus: 'extended' },
  { name: 'RHEL', version: '9', category: 'os', vendor: 'Red Hat', eolDate: null, supportStatus: 'active' },
  { name: 'RHEL', version: '8', category: 'os', vendor: 'Red Hat', eolDate: '2029-05-31', supportStatus: 'active' },
  { name: 'Debian', version: '12', category: 'os', vendor: 'Debian Project', eolDate: '2028-06-30', supportStatus: 'active' },
  { name: 'Debian', version: '11', category: 'os', vendor: 'Debian Project', eolDate: '2026-08-31', supportStatus: 'active' },
  { name: 'Alpine Linux', version: '3.21', category: 'os', vendor: 'Alpine Linux Team', eolDate: null, supportStatus: 'active' },
  { name: 'Alpine Linux', version: '3.20', category: 'os', vendor: 'Alpine Linux Team', eolDate: null, supportStatus: 'active' },

  // ── Containers & Orchestration ──
  { name: 'Docker', version: '27', category: 'runtime', vendor: 'Docker Inc', eolDate: null, supportStatus: 'active' },
  { name: 'Docker', version: '26', category: 'runtime', vendor: 'Docker Inc', eolDate: null, supportStatus: 'active' },
  { name: 'Docker', version: '25', category: 'runtime', vendor: 'Docker Inc', eolDate: null, supportStatus: 'active' },
  { name: 'Docker', version: '24', category: 'runtime', vendor: 'Docker Inc', eolDate: null, supportStatus: 'active' },
  { name: 'Kubernetes', version: '1.32', category: 'runtime', vendor: 'CNCF', eolDate: null, supportStatus: 'active' },
  { name: 'Kubernetes', version: '1.31', category: 'runtime', vendor: 'CNCF', eolDate: null, supportStatus: 'active' },
  { name: 'Kubernetes', version: '1.30', category: 'runtime', vendor: 'CNCF', eolDate: null, supportStatus: 'active' },
  { name: 'Kubernetes', version: '1.29', category: 'runtime', vendor: 'CNCF', eolDate: null, supportStatus: 'extended' },
  { name: 'Kubernetes', version: '1.28', category: 'runtime', vendor: 'CNCF', eolDate: null, supportStatus: 'extended' },
  { name: 'Podman', version: '5.x', category: 'runtime', vendor: 'Red Hat', eolDate: null, supportStatus: 'active' },

  // ── Infrastructure as Code ──
  { name: 'Terraform', version: '1.x', category: 'tool', vendor: 'HashiCorp', eolDate: null, supportStatus: 'active' },
  { name: 'Ansible', version: '11', category: 'tool', vendor: 'Red Hat', eolDate: null, supportStatus: 'active' },
  { name: 'Pulumi', version: '3.x', category: 'tool', vendor: 'Pulumi Corp', eolDate: null, supportStatus: 'active' },

  // ── CI/CD ──
  { name: 'Jenkins', version: '2.x', category: 'tool', vendor: 'Jenkins Project', eolDate: null, supportStatus: 'active' },
  { name: 'GitHub Actions', version: 'SaaS', category: 'tool', vendor: 'GitHub', eolDate: null, supportStatus: 'active' },
  { name: 'GitLab CI', version: '17.x', category: 'tool', vendor: 'GitLab', eolDate: null, supportStatus: 'active' },
  { name: 'Azure DevOps', version: 'SaaS', category: 'tool', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },

  // ── Monitoring & Observability ──
  { name: 'Prometheus', version: '2.x', category: 'tool', vendor: 'CNCF', eolDate: null, supportStatus: 'active' },
  { name: 'Grafana', version: '11.x', category: 'tool', vendor: 'Grafana Labs', eolDate: null, supportStatus: 'active' },
  { name: 'Datadog', version: 'SaaS', category: 'tool', vendor: 'Datadog Inc', eolDate: null, supportStatus: 'active' },
  { name: 'Elasticsearch', version: '8.x', category: 'database', vendor: 'Elastic NV', eolDate: null, supportStatus: 'active' },
  { name: 'Elasticsearch', version: '7.x', category: 'database', vendor: 'Elastic NV', eolDate: null, supportStatus: 'extended' },
  { name: 'OpenSearch', version: '2.x', category: 'database', vendor: 'OpenSearch Foundation', eolDate: null, supportStatus: 'active' },

  // ── Libraries ──
  { name: 'React Native', version: '0.76', category: 'library', vendor: 'Meta', eolDate: null, supportStatus: 'active' },
  { name: 'RxJS', version: '7.x', category: 'library', vendor: 'ReactiveX', eolDate: null, supportStatus: 'active' },
  { name: 'Zustand', version: '5.x', category: 'library', vendor: 'Zustand Team', eolDate: null, supportStatus: 'active' },
  { name: 'TanStack Query', version: '5.x', category: 'library', vendor: 'TanStack', eolDate: null, supportStatus: 'active' },
  { name: 'Tailwind CSS', version: '4.x', category: 'library', vendor: 'Tailwind Labs', eolDate: null, supportStatus: 'active' },

  // ── Cloud & Infrastructure ──
  { name: 'Amazon Web Services', version: 'SaaS', category: 'cloud_service', vendor: 'Amazon', eolDate: null, supportStatus: 'active' },
  { name: 'Microsoft Azure', version: 'SaaS', category: 'cloud_service', vendor: 'Microsoft', eolDate: null, supportStatus: 'active' },
  { name: 'Google Cloud Platform', version: 'SaaS', category: 'cloud_service', vendor: 'Google', eolDate: null, supportStatus: 'active' },
  { name: 'Cloudflare', version: 'SaaS', category: 'cloud_service', vendor: 'Cloudflare Inc', eolDate: null, supportStatus: 'active' },
]

export interface SeedResult {
  added: number
  skipped: number
  total: number
}

export async function seedTechnologies(): Promise<SeedResult> {
  const existing = await db.technologies.toArray()
  const existingKeys = new Set(existing.map((t) => `${t.name.toLowerCase()}::${t.version.toLowerCase()}`))

  let added = 0
  let skipped = 0

  for (const entry of TECH_CATALOG) {
    const key = `${entry.name.toLowerCase()}::${entry.version.toLowerCase()}`
    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    const tech: Technology = {
      id: crypto.randomUUID(),
      name: entry.name,
      version: entry.version,
      category: entry.category,
      vendor: entry.vendor,
      eolDate: entry.eolDate ? new Date(entry.eolDate) : null,
      supportStatus: entry.supportStatus,
      cveList: [],
      metadata: {},
      createdAt: new Date(),
    }

    await db.technologies.add(tech)
    added++
  }

  return { added, skipped, total: TECH_CATALOG.length }
}
