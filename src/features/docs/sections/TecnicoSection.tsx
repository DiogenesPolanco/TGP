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

export function TecnicoSection() {
  return (
    <section id="tecnico" className="mb-20 scroll-mt-20">
      <PageH1>Consideraciones Técnicas</PageH1>
      <Divider />

      <SectionTitle>Esquema de IndexedDB (Dexie.js)</SectionTitle>
      <Body>
        La base de datos local <InlineCode>TGP</InlineCode> contiene 25+ tablas. Las principales:
      </Body>
      <CodeBlock>
        {`// Versión 6 del schema Dexie.js
const db = new Dexie('TGP')
db.version(6).stores({
  // Core
  business_units:     'id, name',
  applications:       'id, name, businessUnitId, criticality, status, thiScore',
  microservices:      'id, name, applicationId',
  technologies:       'id, name, category',
  app_technologies:   'id, appId, techId',

  // Seguridad
  vulnerabilities:    'id, applicationId, severity, status, cvssScore, createdAt',
  incidents:          'id, applicationId, severity, status, createdAt',
  risks:              'id, applicationId, probability, impact',
  audit_findings:     'id, applicationId, status',

  // Equipos
  teams:              'id, name',
  team_members:       'id, teamId, name',
  dora_metrics:       'id, teamId, period',

  // Estrategia
  objectives:         'id, teamId, period, year, status',
  key_results:        'id, objectiveId',

  // Ejecución
  plans:              'id, teamId, status, startDate, endDate',
  activities:         'id, planId, status, startDate, endDate',
  blockers:           'id, planId, status, escalated',
  commitments:        'id, teamId, status, dueDate',
  tasks:              'id, activityId, status, assigneeId',

  // Eventos & Calendar
  events:             'id, type, startDate, endDate, category',

  // Equipamiento
  equipment:          'id, type, status, assignedTo',
  equipment_tickets:  'id, equipmentId, status, jiraIssueId',

  // Sharing
  share_links:        'id, hash, expiresAt',

  // Config
  ai_config:          'id, userId',
  user_preferences:   'id, userId',
})`}
      </CodeBlock>

      <SectionTitle>Estrategia de índices</SectionTitle>
      <Body>
        Dexie.js usa los índices declarados en <InlineCode>stores()</InlineCode> para queries
        eficientes. Las búsquedas compuestas se resuelven con índices agrupados:
      </Body>
      <CodeBlock>
        {`// Búsqueda eficiente: apps por BU + criticidad
db.applications
  .where('businessUnitId')
  .equals(buId)
  .filter((a) => a.criticality === 'crítica')
  .toArray()

// Búsqueda por rango: vulns abiertas con CVSS > 7
db.vulnerabilities
  .where('severity')
  .equals('alta')
  .filter((v) => v.cvssScore >= 7)
  .toArray()

// Ordenamiento por fecha (usando índice created_at)
db.vulnerabilities
  .where('createdAt')
  .between('2026-01-01', '2026-12-31')
  .reverse()
  .toArray()`}
      </CodeBlock>

      <SectionTitle>Ciclo de vida de los datos</SectionTitle>
      <Table
        rows={[
          ['Operación', 'Mecanismo', 'Persistencia'],
          ['Lectura', 'Dexie.js useLiveQuery', 'Reactivo (subscripción)'],
          ['Escritura', 'Repos service + transacción', 'Síncrono a IndexedDB'],
          ['Backup', 'Export JSON completo', 'Manual / Azure Blob'],
          ['Restore', 'Import JSON → upsert', 'Manual desde Admin'],
          ['Share', 'Cifrado AES-GCM-256', 'Azure Blob / localStorage'],
          ['Purga', 'Eliminación lógica', 'Borrado manual desde Admin'],
        ]}
      />

      <SectionTitle>Autenticación TOTP</SectionTitle>
      <Body>TGP usa TOTP (Time-based One-Time Password) para autenticación. El flujo completo:</Body>
      <CodeBlock>
        {`1. Setup: generar secret de 20 bytes (base32 encoded)
   secret = randomBytes(20).toString('base32')

2. Mostrar QR code al usuario
   otpauth://totp/TGP:{username}?secret={secret}&issuer=TGP

3. Verificar código OTP (RFC 6238)
   window = 30 segundos
   validCodes = [
     TOTP(secret, currentTime - 30s),
     TOTP(secret, currentTime),
     TOTP(secret, currentTime + 30s),
   ]
   // Se acepta ±1 ventana para tolerancia de desfase

4. Sesión: JWT simulado almacenado en sessionStorage
   session = { token, createdAt, expiresAt }
   expiresAt = now + 24h`}
      </CodeBlock>

      <SectionTitle>Performance targets</SectionTitle>
      <Table
        rows={[
          ['Operación', 'Target', 'Notas'],
          ['Query por ID', '< 1 ms', 'Índice primario Dexie.js'],
          ['Query por índice', '< 5 ms', 'Índice secundario'],
          ['Filtro + orden', '< 15 ms', 'Colección < 10k registros'],
          ['THI completo', '< 50 ms', '7 dimensiones × 100 apps'],
          ['Import Excel (100 rows)', '< 2 s', 'SheetJS + upsert transaccional'],
          ['Build production', '< 30 s', 'Vite + SWC (cold)'],
          ['Bundle size (gzip)', '~150 KB', 'Sin contar datos'],
        ]}
      />

      <SectionTitle>Límites de almacenamiento</SectionTitle>
      <Body>
        IndexedDB solicita cuota al navegador. La mayoría de navegadores permiten hasta{' '}
        <strong>60% del espacio en disco</strong> (o al menos 1 GB). TGP con uso típico ocupa entre
        5-50 MB. Para monitorear el uso actual:
      </Body>
      <CodeBlock>
        {`// En consola del navegador:
navigator.storage.estimate().then((e) => {
  console.log('Usado:', e.usage / 1024 / 1024, 'MB')
  console.log('Cuota:', e.quota / 1024 / 1024, 'MB')
})`}
      </CodeBlock>

      <SectionTitle>Cifrado de datos</SectionTitle>
      <Body>TGP implementa cifrado en múltiples capas según la sensibilidad de los datos:</Body>
      <Table
        rows={[
          ['Capa', 'Algoritmo', 'Aplicación'],
          ['En reposo (local)', 'N/A', 'IndexedDB (sandbox del navegador)'],
          ['En tránsito (API IA)', 'TLS 1.3', 'Llamadas a proveedores externos'],
          ['Enlaces públicos', 'AES-GCM-256', 'Payload cifrado + passphrase opcional'],
          ['API keys', 'btoa/atob', 'Ofuscación básica en IndexedDB'],
        ]}
      />

      <SectionTitle>Service Worker y PWA</SectionTitle>
      <Body>
        TGP usa <InlineCode>vite-plugin-pwa</InlineCode> con estrategia{' '}
        <strong>generateSW</strong> para generar el Service Worker automáticamente durante el build.
        Los detalles:
      </Body>
      <Table
        rows={[
          ['Estrategia SW', 'generateSW (Workbox v7)', 'Pre-cache de todos los assets'],
          ['Cache de navegación', 'NetworkFirst', 'API calls y navigations'],
          ['Offline fallback', 'index.html', 'App shell para cualquier ruta'],
          ['Pre-cache', '142 entries', 'JS, CSS, imágenes, fuentes'],
          ['Tamaño total cache', '~5.6 MB', 'Compressed en CDN'],
          ['Actualización', 'Al recargar', 'SW busca nueva versión en segundo plano'],
        ]}
      />
      <Body>
        Al abrir TGP en un navegador compatible, el Service Worker se instala automáticamente. En la
        segunda visita, la app carga completa incluso sin conexión de red (App Shell pattern). Para
        forzar actualización del SW:{' '}
        <InlineCode>DevTools → Application → Service Workers → Update</InlineCode>.
      </Body>

      <SectionTitle>Estrategia de manejo de errores</SectionTitle>
      <Body>
        TGP implementa 3 capas de captura de errores para garantizar que ningún crash deje la
        aplicación en blanco:
      </Body>
      <CodeBlock>
        {`1. Error Boundary (React)
   <ErrorBoundary fallback={<GenericErrorPage />}>
     <App />
   </ErrorBoundary>
   → Captura errores durante renderizado de componentes
   → Muestra página de error genérica con botón "Recargar"

2. Evento window.onerror
   window.addEventListener('error', (e) => {
     console.error('[TGP] Uncaught:', e.error)
     // Opcional: enviar a servicio de telemetría
   })
   → Captura errores no manejados fuera del árbol React
   → Errores de carga de módulos, promises sin catch

3. Promise rejection handler
   window.addEventListener('unhandledrejection', (e) => {
     console.error('[TGP] Unhandled promise:', e.reason)
   })
   → Captura promesas rechazadas sin catch
   → Común en errores de IndexedDB o fetch a APIs`}
      </CodeBlock>

      <SectionTitle>Optimización de bundle</SectionTitle>
      <Body>
        TGP aplica varias estrategias para mantener el bundle size mínimo (~150 KB gzip sin datos):
      </Body>
      <Table
        rows={[
          ['Técnica', 'Implementación', 'Impacto'],
          ['Tree shaking', 'ESM + Vite Rollup', 'Elimina código muerto automáticamente'],
          ['Code splitting', 'React.lazy + Suspense', 'Carga diferida por ruta'],
          ['SWC minify', 'SWC (Rust)', 'Minificación ~5× más rápida que Terser'],
          ['Lucide tree-shake', 'Importaciones nombradas', 'Solo iconos usados en el bundle'],
          ['CSS purging', 'Tailwind CSS v4', 'Solo clases utilizadas en HTML/JSX'],
          ['Compression', 'CDN con gzip/brotli', 'Reducción ~70% del tamaño transferido'],
          ['Dynamic imports', 'Import() en rutas pesadas', 'Azure SDK, SheetJS, ApexCharts'],
        ]}
      />
    </section>
  )
}
