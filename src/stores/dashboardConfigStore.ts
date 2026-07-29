import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DashboardWidget {
  id: string
  title: string
  defaultEnabled: boolean
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'thi-gauge', title: 'THI Gauge', defaultEnabled: true },
  { id: 'kpi-critical-vulns', title: 'Vulnerabilidades Críticas', defaultEnabled: true },
  { id: 'kpi-p1-incidents', title: 'Incidentes P1', defaultEnabled: true },
  { id: 'kpi-thi-score', title: 'Total Aplicaciones', defaultEnabled: true },
  { id: 'kpi-eol-techs', title: 'Tecnologías EOL', defaultEnabled: true },
  { id: 'kpi-risk-exposure', title: 'Exposición de Riesgos', defaultEnabled: true },
  { id: 'kpi-compliance', title: 'Compliance Score', defaultEnabled: true },
  { id: 'kpi-elite-teams', title: 'Equipos Elite DORA', defaultEnabled: true },
  { id: 'kpi-total-apps', title: 'Total Aplicaciones', defaultEnabled: true },
  { id: 'kpi-overdue-findings', title: 'Hallazgos Vencidos', defaultEnabled: true },
  { id: 'kpi-active-plans', title: 'Planes Activos', defaultEnabled: true },
  { id: 'kpi-blockers', title: 'Bloqueos Abiertos', defaultEnabled: true },
  { id: 'kpi-overdue-commitments', title: 'Compromisos Vencidos', defaultEnabled: true },
  { id: 'kpi-activities-today', title: 'Actividades Hoy', defaultEnabled: true },
  { id: 'chart-thi-by-bu', title: 'Gráfico THI por BU', defaultEnabled: true },
  { id: 'chart-tech-status', title: 'Estado de Tecnologías', defaultEnabled: true },
  { id: 'chart-alerts', title: 'Alertas', defaultEnabled: true },
  { id: 'widget-predictions', title: 'Análisis Predictivo', defaultEnabled: false },
]

interface DashboardConfigState {
  enabledWidgets: Record<string, boolean>
  isEditing: boolean
  toggleWidget: (id: string) => void
  enableAll: () => void
  disableAll: () => void
  setEditing: (editing: boolean) => void
}

export const useDashboardConfigStore = create<DashboardConfigState>()(
  persist(
    (set) => {
      const defaults: Record<string, boolean> = {}
      for (const w of DASHBOARD_WIDGETS) defaults[w.id] = w.defaultEnabled

      return {
        enabledWidgets: defaults,
        isEditing: false,
        toggleWidget: (id) =>
          set((state) => ({
            enabledWidgets: { ...state.enabledWidgets, [id]: !state.enabledWidgets[id] },
          })),
        enableAll: () => {
          const all: Record<string, boolean> = {}
          for (const w of DASHBOARD_WIDGETS) all[w.id] = true
          set({ enabledWidgets: all })
        },
        disableAll: () => {
          const all: Record<string, boolean> = {}
          for (const w of DASHBOARD_WIDGETS) all[w.id] = false
          set({ enabledWidgets: all })
        },
        setEditing: (editing) => set({ isEditing: editing }),
      }
    },
    { name: 'tgp-dashboard-config' },
  ),
)
