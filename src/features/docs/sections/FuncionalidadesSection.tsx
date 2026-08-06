import {
  PageH1,
  Divider,
  SectionTitle,
  SubSection,
  Body,
  Table,
  CodeBlock,
  InlineCode,
} from '../components/DocComponents'

export function FuncionalidadesSection() {
  return (
    <section id="funcionalidades" className="mb-20 scroll-mt-20">
      <PageH1>Funcionalidades</PageH1>
      <Divider />

      {/* --- DASHBOARD THI --- */}
      <SectionTitle>Dashboard THI</SectionTitle>

      <SubSection>Modelo de datos</SubSection>
      <Body>
        El THI se calcula desde la tabla <InlineCode>applications</InlineCode> y sus relaciones.
        Cada aplicación tiene puntuaciones en 7 dimensiones almacenadas como campos numéricos
        (0-100).
      </Body>
      <CodeBlock>
        {`// applications table (Dexie.js schema)
interface Application {
  id: string
  name: string
  businessUnitId: string
  criticality: 'baja' | 'media' | 'alta' | 'crítica'
  status: 'activo' | 'en_desarrollo' | 'deprecado' | 'eliminado'
  // THI dimensions (0-100)
  thiSeguridad: number
  thiDelivery: number
  thiObsolescencia: number
  thiRiesgo: number
  thiArquitectura: number
  thiCumplimiento: number
  thiCostos: number
  thiScore: number        // score compuesto
  thiUpdatedAt: string    // ISO timestamp
}`}
      </CodeBlock>

      <SubSection>Fórmula del THI compuesto</SubSection>
      <Body>
        Cada dimensión es un promedio ponderado de indicadores subyacentes. El score general se
        calcula como media ponderada de las 7 dimensiones:
      </Body>
      <CodeBlock>
        {`thiScore = Σ (dimensión_i × peso_i) / Σ peso_i

Pesos por defecto:
  Seguridad:      25%
  Delivery:       20%
  Obsolescencia:  15%
  Riesgo:         15%
  Arquitectura:   10%
  Cumplimiento:   10%
  Costos:          5%

  → Los pesos son configurables por unidad de negocio
    en src/config/thiWeights.ts

Cada dimensión se calcula de indicadores:
  thiSeguridad = mean(
    vulnsSeverityScore,     // inverso: más vulns → menor score
    incidentResponseTime,   // inverso: más tiempo → menor score
    auditFindingsRatio,     // ratio hallazgos cerrados/totales
    riskExposure            // inverso: mayor exposición → menor score
  )`}
      </CodeBlock>

      <SubSection>Sistema de pesos personalizable</SubSection>
      <Body>
        Los pesos del THI se pueden ajustar por unidad de negocio desde{' '}
        <InlineCode>src/config/thiWeights.ts</InlineCode>. El sistema soporta pesos globales y
        anulaciones por BU:
      </Body>
      <CodeBlock>
        {`interface ThiWeightConfig {
  global: Record<ThiDimension, number>  // pesos base
  overrides?: Record<string, Record<ThiDimension, number>>  // por BU
}

// Ejemplo: para una unidad de negocio con enfoque en seguridad
const config: ThiWeightConfig = {
  global: {
    thiSeguridad: 25, thiDelivery: 20, thiObsolescencia: 15,
    thiRiesgo: 15, thiArquitectura: 10, thiCumplimiento: 10, thiCostos: 5
  },
  overrides: {
    'bu-financiero': {
      thiSeguridad: 35, thiCumplimiento: 20,  // +10 y +10
      thiDelivery: 15, thiCostos: 5            // -5 y -0
    }
  }
}`}
      </CodeBlock>
      <Body>
        El motor de THI (<InlineCode>src/features/dashboard/services/thiEngine.ts</InlineCode>)
        aplica primero los pesos globales y luego reemplaza con overrides si existen para la BU de
        la aplicación. Esto permite que diferentes unidades de negocio tengan ponderaciones
        alineadas con sus prioridades estratégicas.
      </Body>

      <SubSection>Motor de cálculo</SubSection>
      <Body>
        El motor vive en <InlineCode>src/features/dashboard/hooks/useThiCalculation.ts</InlineCode>.
        Se ejecuta en tiempo real vía <InlineCode>useEffect</InlineCode> cuando cambian los datos
        fuente. Usa <InlineCode>useLiveQuery</InlineCode> de Dexie.js para reactividad.
      </Body>
      <CodeBlock>
        {`Flujo de cómputo:
1. useLiveQuery obtiene todas las applications desde IndexedDB
2. Por cada app, calcula cada dimensión
3. Agrega scores por unidad de negocio
4. Computa THI global como promedio ponderado
5. Actualiza thiScore + thiUpdatedAt en cada registro
6. Dispara re-render del DashboardHero y gráficos`}
      </CodeBlock>

      {/* --- CATÁLOGO --- */}
      <SectionTitle>Catálogo de Aplicaciones</SectionTitle>

      <SubSection>Modelo relacional</SubSection>
      <CodeBlock>
        {`applications ──┬── microservices (0..*)
               ├── vulnerabilities (0..*)  ← heredadas
               ├── risks (0..*)
               ├── incidents (0..*)
               ├── audit_findings (0..*)
               ├── technologies (M..N vía app_technologies)
               └── business_unit (N..1)

microservices ──┬── vulnerabilities (0..*)  ← heredables
                ├── risks (0..*)            ← heredables
                ├── incidents (0..*)         ← heredables
                └── audit_findings (0..*)    ← heredables`}
      </CodeBlock>
      <Body>
        Un patrón clave de herencia: vulnerabilidades, riesgos, incidentes y hallazgos vinculados a
        un microservicio se heredan automáticamente a la aplicación padre. Esto evita duplicación y
        garantiza visibilidad completa desde el nivel de aplicación.
      </Body>

      <SubSection>Búsqueda y filtros</SubSection>
      <Body>
        La búsqueda usa índices compuestos de Dexie.js sobre los campos{' '}
        <InlineCode>name</InlineCode>, <InlineCode>description</InlineCode>,{' '}
        <InlineCode>businessUnitId</InlineCode>. Los filtros se aplican con{' '}
        <InlineCode>where().and()</InlineCode> sobre colecciones indexadas, con paginación de 25
        registros por página.
      </Body>

      <SubSection>Búsqueda Global</SubSection>
      <Body>
        La barra de búsqueda en el header (<InlineCode>GlobalSearch.tsx</InlineCode>) consulta en{' '}
        <strong>40+ tablas</strong> simultáneamente. Los resultados se agrupan por dominio
        (aplicaciones, tecnologías, vulnerabilidades, equipos, riesgos, hallazgos, OKRs, planes,
        equipamiento, enlaces públicos) y cada resultado navega directamente a la vista de detalle
        correspondiente.
      </Body>
      <CodeBlock>
        {`// GlobalSearch.tsx — flujo de búsqueda multi-tabla
1. El usuario escribe en la barra del header (debounce 300ms)
2. Por cada tabla relevante, se ejecuta una query Dexie.js
   en paralelo con Promise.all()
3. Los resultados se agrupan por tipo de entidad
4. Se renderizan en un dropdown con icono + nombre + snippet
5. Al hacer clic, navega a la ruta de detalle de la entidad

Tablas incluidas:
  applications, technologies, vulnerabilities, incidents,
  risks, audit_findings, teams, objectives, plans,
  deliverables, equipment, candidates, microservices`}
      </CodeBlock>

      <SubSection>Importación Excel</SubSection>
      <Body>
        El pipeline de importación (<InlineCode>src/services/import/</InlineCode>) parsea el archivo
        XLSX con SheetJS, mapea columnas a la tabla <InlineCode>applications</InlineCode>, detecta
        duplicados por <InlineCode>name + businessUnitId</InlineCode>, y ejecuta upsert
        transaccional en una sola operación Dexie.js.
      </Body>

      {/* --- SEGURIDAD --- */}
      <SectionTitle>Seguridad</SectionTitle>

      <SubSection>Vulnerabilidades — CVSS y SLA</SubSection>
      <Table
        rows={[
          ['Criticidad', 'Rango CVSS', 'SLA objetivo'],
          ['P1 — Crítica', '9.0 – 10.0', '≤ 48 horas'],
          ['P2 — Alta', '7.0 – 8.9', '≤ 7 días'],
          ['P3 — Media', '4.0 – 6.9', '≤ 30 días'],
          ['P4 — Baja', '0.1 – 3.9', '≤ 90 días'],
        ]}
      />
      <Body>
        Cada vulnerabilidad tiene un flujo de estados:{' '}
        <InlineCode>abierta → en_análisis → en_remediación → verificada → cerrada</InlineCode>. El
        SLA se trackea desde <InlineCode>createdAt</InlineCode> y cambia a color según el tiempo
        restante. El servicio de escalamiento en{' '}
        <InlineCode>src/features/execution/services/escalationService.ts</InlineCode> notifica items
        vencidos.
      </Body>

      <SubSection>Consulta CVE/NVD integrada</SubSection>
      <Body>
        TGP incorpora consulta en tiempo real a las bases de vulnerabilidades más importantes del
        ecosistema:
      </Body>
      <Table
        rows={[
          ['Fuente', 'Endpoint', 'Uso', 'CSP requerido'],
          [
            'MITRE cveawg',
            'cveawg.mitre.org/api/cve/{id}',
            'Lookup individual por CVE-ID',
            'cveawg.mitre.org',
          ],
          [
            'NVD (NIST)',
            'services.nvd.nist.gov/rest/json/cves/2.0',
            'Búsqueda por keyword',
            'services.nvd.nist.gov',
          ],
        ]}
      />
      <Body>
        Desde el formulario de tecnologías y vulnerabilidades, un botón{' '}
        <strong>"Buscar CVEs"</strong> permite buscar vulnerabilidades conocidas por nombre de
        tecnología. Los resultados se muestran en un panel lateral (
        <InlineCode>CveInfoPanel</InlineCode>) con enlace directo al detalle en NVD.
      </Body>
      <CodeBlock>
        {`// cveService.ts — lookup individual desde MITRE
async function getCveById(cveId: string): Promise<CveResult>

// nvdService.ts — búsqueda por keyword desde NVD
async function searchNvd(keyword: string): Promise<CveResult[]>

// Panel embebido en TechnologyFormPage
<CveInfoPanel cve={cveResult} />
// Muestra: ID, descripción, severidad, CVSS vector, enlace a NVD`}
      </CodeBlock>
      <Body>
        La búsqueda se activa manualmente (no automática) para respetar los rate limits de las APIs
        externas. Cada resultado incluye enlace directo a{' '}
        <InlineCode>
          https://nvd.nist.gov/vuln/detail/{'{'}CVE-ID{'}'}
        </InlineCode>{' '}
        para consultar el detalle completo.
      </Body>

      <SubSection>Matriz de Riesgos</SubSection>
      <Body>
        La matriz calcula el nivel de riesgo como <InlineCode>probabilidad × impacto</InlineCode>,
        donde ambos ejes usan valores 1-5. El resultado se mapea a:
      </Body>
      <CodeBlock>
        {`Riesgo = Probabilidad × Impacto (1–25)

  Bajo     (1–4)   → verde
  Medio    (5–9)   → amarillo
  Alto     (10–16) → naranja
  Crítico  (17–25) → rojo`}
      </CodeBlock>

      {/* --- DORA --- */}
      <SectionTitle>Equipos DORA</SectionTitle>

      <SubSection>Métricas y thresholds</SubSection>
      <Table
        rows={[
          ['Métrica', 'Elite', 'Alto', 'Medio', 'Bajo'],
          ['Deploy Frequency', '≥ diario', '≥ semanal', '≥ mensual', '< mensual'],
          ['Lead Time', '< 1 día', '< 1 semana', '< 1 mes', '≥ 1 mes'],
          ['Change Failure Rate', '< 5%', '< 10%', '< 15%', '≥ 15%'],
          ['MTTR', '< 1 hora', '< 1 día', '< 1 semana', '≥ 1 semana'],
        ]}
      />
      <Body>
        Las métricas se registran manualmente por equipo en <InlineCode>dora_metrics</InlineCode>.
        El benchmark asigna automáticamente el nivel según los thresholds de DORA 2024. La
        vinculación con OKRs permite correlacionar entregables con desempeño de equipo.
      </Body>

      <SubSection>Cálculo de benchmark DORA</SubSection>
      <Body>
        TGP implementa los thresholds del <strong>DORA 2024 State of DevOps Report</strong>. Cada
        métrica se evalúa independientemente y el equipo recibe un nivel general igual a su peor
        métrica (el eslabón más débil):
      </Body>
      <CodeBlock>
        {`// Cálculo de nivel por métrica
function getDoraLevel(metric: DoraMetric): 'Elite' | 'Alto' | 'Medio' | 'Bajo' {
  switch (metric.name) {
    case 'deployFrequency':
      if (metric.value >= 1) return 'Elite'       // ≥ 1 deploy/día
      if (metric.value >= 1/7) return 'Alto'       // ≥ 1/semana
      if (metric.value >= 1/30) return 'Medio'     // ≥ 1/mes
      return 'Bajo'

    case 'leadTime':
      if (metric.value < 1) return 'Elite'         // < 1 día
      if (metric.value < 7) return 'Alto'          // < 1 semana
      if (metric.value < 30) return 'Medio'        // < 1 mes
      return 'Bajo'

    case 'changeFailureRate':
      if (metric.value < 5) return 'Elite'
      if (metric.value < 10) return 'Alto'
      if (metric.value < 15) return 'Medio'
      return 'Bajo'

    case 'mttr':
      if (metric.value < 1) return 'Elite'         // < 1 hora
      if (metric.value < 24) return 'Alto'         // < 1 día
      if (metric.value < 168) return 'Medio'       // < 1 semana
      return 'Bajo'
  }
}

// Nivel general = peor nivel entre las 4 métricas
const generalLevel = Math.min(
  getDoraLevel(deployFreq),
  getDoraLevel(leadTime),
  getDoraLevel(cfr),
  getDoraLevel(mttr)
)`}
      </CodeBlock>

      {/* --- OKRs --- */}
      <SectionTitle>OKRs y Estrategia</SectionTitle>

      <SubSection>Modelo de datos</SubSection>
      <CodeBlock>
        {`interface Objective {
  id: string
  title: string
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'anual'
  year: number
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved'
}

interface KeyResult {
  id: string
  objectiveId: string
  description: string
  currentValue: number
  targetValue: number
  unit: string
  weight: number  // 0-100, suma entre KRs = 100
}`}
      </CodeBlock>

      <SubSection>Cálculo de progreso</SubSection>
      <CodeBlock>
        {`KR_progress = currentValue / targetValue × 100 (capped at 100)
Objective_progress = Σ (KR_progress_i × weight_i) / Σ weight_i

Status:
  progress ≥ 90%   → achieved
  progress ≥ 70%   → on_track
  progress ≥ 40%   → at_risk
  progress < 40%   → behind`}
      </CodeBlock>

      <SubSection>Alineación con ejecución</SubSection>
      <Body>Los OKRs se vinculan con la ejecución operativa mediante dos mecanismos:</Body>
      <CodeBlock>
        {`1. Vinculación directa
   key_results.deliverables: string[]  // IDs de actividades del plan
   → El progreso del KR se actualiza automáticamente al completar
     actividades vinculadas

2. Alineación estratégica
   objectives.teamId → teams.id
   → Los OKRs de un equipo se visualizan junto a su plan de ejecución
     en la vista de timeline

3. Reporte de contribución
   Cada actividad completada muestra el OKR al que contribuye:
   "Actividad: Migrar servidores (contribuye a: Q3-2026-1: Reducir deuda técnica)"`}
      </CodeBlock>

      {/* --- EJECUCIÓN --- */}
      <SectionTitle>Ejecución</SectionTitle>

      <SubSection>Diagramas de Gantt</SubSection>
      <Body>
        Los planes tienen actividades con fechas <InlineCode>startDate</InlineCode> y{' '}
        <InlineCode>endDate</InlineCode>. El Gantt se renderiza en{' '}
        <InlineCode>ActivityGantt.tsx</InlineCode> usando posicionamiento CSS absoluto sobre un grid
        de días. Cada actividad es un bloque coloreado por estado.
      </Body>

      <SubSection>Escalamiento automático</SubSection>
      <Body>
        El servicio <InlineCode>escalationService.ts</InlineCode> ejecuta un barrido cada 5 minutos
        sobre actividades, bloqueos y compromisos vencidos. Cuando un item supera su fecha límite,
        se marca como <InlineCode>escalated</InlineCode> y se registra en el log de auditoría.
      </Body>

      {/* --- OBSOLESCENCIA --- */}
      <SectionTitle>Obsolescencia</SectionTitle>

      <SubSection>Integración con endoflife.date</SubSection>
      <Body>
        Las tecnologías registradas se comparan contra la API de{' '}
        <InlineCode>endoflife.date</InlineCode> para determinar su estado de soporte. La
        sincronización se ejecuta bajo demanda desde la vista de obsolescencia y cachea los
        resultados en IndexedDB por 24 horas.
      </Body>
      <CodeBlock>
        {`GET https://endoflife.date/api/{technology}.json

Response example:
{
  "eol": true,
  "latest": "17 LTS",
  "releaseDate": "2021-09-12",
  "support": {
    "active": "2024-09-30",
    "security": "2027-09-30",
    "end": "2029-09-30"
  },
  "cycle": "17"
}

Estados derivados:
  active        → dentro del período de soporte activo
  security_only → solo parches de seguridad
  eol           → fin de vida (sin parches)
  unknown       → no encontrado en API`}
      </CodeBlock>

      <SubSection>Mapa de obsolescencia</SubSection>
      <Body>
        El mapa renderiza un grafo dirigido donde los nodos son tecnologías y las aristas
        representan dependencias entre aplicaciones. Los nodos se colorean según su estado (activo,
        security-only, EOL) y el tamaño refleja la cantidad de aplicaciones impactadas.
      </Body>

      {/* --- GOBIA --- */}
      <SectionTitle>GobIA — Asistente de IA</SectionTitle>

      <SubSection>Arquitectura de proveedores</SubSection>
      <Body>GobIA soporta 4 proveedores de IA. Todos implementan la interfaz unificada:</Body>
      <CodeBlock>
        {`interface AiProvider {
  name: string
  enabled: boolean
  baseUrl: string
  defaultModel: string
  requiresApiKey: boolean
  supportsTools: boolean
}

// Configuración por proveedor
openai:   { baseUrl: "https://api.openai.com/v1", models: ["gpt-4o", "gpt-4o-mini"] }
groq:     { baseUrl: "https://api.groq.com/openai/v1", models: ["llama-4", "mixtral"] }
anthropic: { baseUrl: "https://api.anthropic.com/v1", models: ["claude-sonnet-4"] }
ollama:    { baseUrl: "http://localhost:11434/v1", models: ["llama3", "mistral"], requiresApiKey: false }`}
      </CodeBlock>

      <SubSection>Sistema de tool calls</SubSection>
      <Body>
        GobIA ejecuta tool calls nativos sobre la base de datos local. Los tools se registran en{' '}
        <InlineCode>src/features/ai/tools/registry.ts</InlineCode> y cada uno expone un schema Zod,
        un handler asíncrono y una descripción para el LLM.
      </Body>
      <CodeBlock>
        {`Tools disponibles:
  health-index    → consultar THI y dimensiones
  aplicaciones    → buscar/catalogar aplicaciones
  tecnologías     → consultar stack y obsolescencia
  equipo          → miembros, DORA metrics
  vulnerabilidades→ vulns activas, CVSS, SLA
  indicadores     → KPIs agregados
  auditoría       → hallazgos y riesgos
  dependencias    → mapa de dependencias
  bloqueos        → items escalados
  entregables     → OKR deliverables`}
      </CodeBlock>
      <Body>
        Cada tool ejecuta queries contra IndexedDB usando Dexie.js, serializa el resultado y lo
        inyecta en el contexto del mensaje al LLM. El sistema multi-turno mantiene el historial de
        conversación en memoria (store Zustand) para respuestas contextualizadas.
      </Body>

      <SubSection>Pipeline de ejecución de tool calls</SubSection>
      <Body>
        GobIA procesa cada mensaje del usuario a través de un pipeline secuencial de 6 etapas:
      </Body>
      <CodeBlock>
        {`1. Parseo de intención
   El mensaje del usuario se envía al LLM junto con las definiciones de tools
   disponibles (name + description + schema Zod serializado a JSON Schema).

2. Selección de tools
   El LLM responde con una o más llamadas a tool (function calling nativo).
   Cada tool incluye: { name, arguments: { ... } }.

3. Ejecución local
   Cada tool se resuelve contra el registro de tools (registry.ts):
   → Se valida arguments contra el schema Zod
   → Se ejecuta el handler asíncrono (query a IndexedDB)
   → Se captura el resultado o error

4. Inyección de contexto
   El resultado de cada tool se inyecta como mensaje del sistema:
   "tool {name} returned: {JSON serializado}"

5. Generación de respuesta
   El LLM recibe el contexto aumentado y genera la respuesta final en
   lenguaje natural, citando los datos obtenidos.

6. Actualización de historial
   El mensaje original + tool calls + respuesta se persisten en el store
   Zustand (aiStore). El historial completo se reenvía en cada turno
   para mantener coherencia multi-turno.`}
      </CodeBlock>
      <Body>
        Este pipeline se ejecuta en el hilo principal del navegador. Para datasets grandes (100k+
        registros), las queries a IndexedDB pueden superar los 50 ms — GobIA muestra un indicador de
        escritura ("GobIA está pensando...") mientras se completan.
      </Body>
    </section>
  )
}
