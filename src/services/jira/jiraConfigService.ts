export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  selectedProjectKeys: string[]
}

const STORAGE_KEY = 'tgp-jira-config'

const defaultConfig: JiraConfig = {
  baseUrl: '',
  email: '',
  apiToken: '',
  selectedProjectKeys: [],
}

export function getJiraConfig(): JiraConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...defaultConfig }
    return JSON.parse(stored) as JiraConfig
  } catch {
    return { ...defaultConfig }
  }
}

export function saveJiraConfig(config: JiraConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function resetJiraConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function isJiraConfigured(): boolean {
  const config = getJiraConfig()
  return Boolean(config.baseUrl && config.email && config.apiToken)
}

export function getJiraAuthHeader(): string {
  const config = getJiraConfig()
  return 'Basic ' + btoa(`${config.email}:${config.apiToken}`)
}
