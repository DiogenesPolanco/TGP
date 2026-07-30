import {
  PageH1,
  Divider,
  SectionTitle,
  SubSection,
  Body,
  Table,
  CodeBlock,
  BulletList,
  InlineCode,
  Green,
} from '../components/DocComponents'

export function PrimerosPasosSection() {
  return (
    <section id="primeros-pasos" className="mb-20 scroll-mt-20">
      <PageH1>Primeros Pasos</PageH1>
      <Divider />

      <SectionTitle>¿Qué es TGP?</SectionTitle>
      <Body>
        TGP (<Green>T</Green>echnology <Green>G</Green>overnance <Green>P</Green>latform) es una
        plataforma de gobierno tecnológico 100% cliente-side. Unifica en un solo lugar el inventario
        de aplicaciones, vulnerabilidades, riesgos, OKRs, métricas DORA, seguimiento de ejecución y
        más — todo sin depender de un backend externo.
      </Body>

      <SectionTitle>Stack tecnológico</SectionTitle>
      <Table
        rows={[
          ['Core', 'React 19', 'TypeScript 5.7'],
          ['Build tool', 'Vite 6', 'SWC (Rust-based compiler)'],
          ['Routing', 'React Router v7', 'createBrowserRouter'],
          ['State', 'Zustand 5', 'Stores atómicos + persist middleware'],
          ['DB', 'Dexie.js 4', 'Wrapper IndexedDB · 25+ tablas'],
          ['Styles', 'Tailwind CSS 4', 'Design system propio con CSS layers'],
          ['Icons', 'Lucide React', 'Tree-shakeable, ~800 iconos'],
          ['Charts', 'Recharts + ApexCharts', 'Gráficos responsive SVG'],
          ['Forms', 'React Hook Form', 'Zod schemas + validación'],
          ['Auth', 'TOTP (otpauth)', 'QR code · sin backend'],
          ['Cloud', 'Azure Blob Storage', '@azure/storage-blob SDK'],
        ]}
      />

      <SectionTitle>Arquitectura general</SectionTitle>
      <Body>
        La aplicación sigue una arquitectura <strong>feature-first</strong> con separación por
        dominio. Cada feature encapsula páginas, componentes, hooks y servicios propios. La capa de
        datos unificada (Dexie.js repos) vive en <InlineCode>src/services/</InlineCode> y expone
        operaciones CRUD reactivas mediante hooks personalizados.
      </Body>
      <CodeBlock>
        {`src/\n├── components/     # UI compartida (botones, modales, badges, layout)\n├── features/       # Módulos por dominio\n│   ├── dashboard/\n│   ├── catalog/\n│   ├── security/\n│   ├── teams/\n│   ├── strategy/\n│   ├── execution/\n│   ├── obsolescence/\n│   ├── governance/\n│   ├── ai/\n│   └── equipment/\n├── services/       # Capa de datos (Dexie repos, import/export, THI engine)\n├── stores/         # Zustand stores\n├── hooks/          # Hooks compartidos\n├── types/          # Tipos de dominio\n└── lib/            # Utilidades genéricas`}
      </CodeBlock>

      <SectionTitle>Decisiones arquitectónicas</SectionTitle>
      <Body>
        TGP toma decisiones técnicas deliberadas que definen su modelo de desarrollo y despliegue:
      </Body>

      <SubSection>Feature-first sobre capas técnicas</SubSection>
      <Body>
        En lugar de organizar por tipo técnico (pages/, components/, hooks/), cada feature agrupa
        todo lo que necesita: página, componentes específicos, hooks de datos, servicios. Esto
        permite desarrollar, testear y eliminar features de forma independiente. El código
        compartido entre features vive en <InlineCode>src/components/</InlineCode> (UI atómica) y{' '}
        <InlineCode>src/services/</InlineCode> (repos de datos).
      </Body>

      <SubSection>Offline-first con IndexedDB</SubSection>
      <Body>
        Todos los datos de dominio residen en IndexedDB mediante Dexie.js. No hay caché ni
        sincronización con un backend — IndexedDB <strong>es</strong> la fuente de verdad. Esto
        elimina la necesidad de servidor, base de datos externa, conexión de red y caching layer.
        Las operaciones en la nube (backup Azure Blob, enlaces públicos) son adicionales y
        completamente opcionales.
      </Body>

      <SubSection>UI como máquina de estados</SubSection>
      <Body>
        Cada vista sigue el patrón: <InlineCode>loading → data | empty | error</InlineCode>. Los
        hooks de datos (custom hooks sobre Dexie.js <InlineCode>useLiveQuery</InlineCode>) exponen
        estos cuatro estados de forma consistente, eliminando la necesidad de manejar estados
        implícitos en cada componente.
      </Body>

      <SubSection>Sin dependencias de framework CSS</SubSection>
      <Body>
        TGP no usa componentes de librerías UI (shadcn, MUI, Chakra). Todo el design system es
        propio sobre Tailwind CSS 4 con CSS layers. Esto garantiza consistencia visual, evita vendor
        lock-in y mantiene el bundle size mínimo (~150 KB gzip sin datos). Los componentes
        compuestos (modales, tabs, tooltips) usan React Aria Components por su accesibilidad
        headless.
      </Body>

      <SectionTitle>Requisitos del sistema</SectionTitle>
      <Table
        rows={[
          ['Chrome', '≥ 120', 'Full support'],
          ['Firefox', '≥ 120', 'Full support'],
          ['Edge', '≥ 120', 'Chromium-based, full support'],
          ['Safari', '≥ 17', 'Full support (macOS 14+)'],
          ['Storage', '≥ 50 MB', 'IndexedDB quota (puede solicitar más)'],
          ['Network', 'Opcional', 'Sin conexión para operación local'],
        ]}
      />

      <SectionTitle>Instalación y despliegue</SectionTitle>

      <SubSection>Desarrollo local</SubSection>
      <CodeBlock>
        {`git clone https://github.com/DiogenesPolanco/TGP.git\ncd TGP\nnpm install\n\n# Servidor de desarrollo (HMR via SWC)\nnpm run dev\n# → http://localhost:5173`}
      </CodeBlock>

      <SubSection>Build de producción</SubSection>
      <CodeBlock>
        {`npm run build\n# → dist/  (archivos estáticos)\n\n# Preview local del build\nnpm run preview`}
      </CodeBlock>
      <Body>
        El build genera archivos estáticos en <InlineCode>dist/</InlineCode>. No necesita Node.js,
        SSR, ni base de datos. Puedes servirlos con cualquier servidor HTTP estático.
      </Body>

      <SubSection>Despliegue en Vercel</SubSection>
      <CodeBlock>
        {`# 1. Conectar repo a Vercel\n# 2. Framework preset: Vite\n# 3. Build command: npm run build\n# 4. Output directory: dist\n# 5. Deploy → https://tup proyecto.vercel.app`}
      </CodeBlock>

      <SubSection>Despliegue en Netlify</SubSection>
      <CodeBlock>
        {`# netlify.toml (opcional)\n[build]\n  command = "npm run build"\n  publish = "dist"\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200`}
      </CodeBlock>

      <SubSection>Despliegue con Nginx</SubSection>
      <CodeBlock>
        {`server {\n    listen 80;\n    server_name tgp.miempresa.com;\n    root /var/www/tgp/dist;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ /index.html;\n    }\n\n    # Cache busting para assets con hash\n    location ~* \\.(js|css|png|jpg|svg)$ {\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n    }\n}`}
      </CodeBlock>

      <SubSection>Despliegue con Docker (próximamente)</SubSection>
      <CodeBlock>
        {`FROM nginx:alpine\nCOPY dist/ /usr/share/nginx/html\nCOPY nginx.conf /etc/nginx/conf.d/default.conf\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`}
      </CodeBlock>

      <SectionTitle>Variables de entorno</SectionTitle>
      <Body>
        TGP expone configuración vía variables <InlineCode>VITE_*</InlineCode> (estándar Vite). Son
        opcionales — la app funciona sin ninguna:
      </Body>
      <Table
        rows={[
          ['Variable', 'Default', 'Propósito'],
          ['VITE_AZURE_ACCOUNT', '—', 'Cuenta Azure Blob Storage para backup'],
          ['VITE_AZURE_CONTAINER', '—', 'Contenedor Azure Blob'],
          ['VITE_AZURE_SAS', '—', 'SAS token para Azure Blob'],
          ['VITE_DEFAULT_AI_PROVIDER', 'openai', 'Proveedor IA por defecto'],
          ['VITE_DEFAULT_AI_MODEL', 'gpt-4o', 'Modelo IA por defecto'],
          ['VITE_APP_TITLE', 'TGP', 'Título del dashboard'],
        ]}
      />

      <SectionTitle>Scripts NPM</SectionTitle>
      <Body>
        Referencia rápida de los comandos disponibles en <InlineCode>package.json</InlineCode>:
      </Body>
      <Table
        rows={[
          ['Comando', 'Acción'],
          ['npm run dev', 'Servidor de desarrollo con HMR (SWC) · localhost:5173'],
          ['npm run build', 'Compilar TS + build Vite → dist/'],
          ['npm run preview', 'Servir build local (pruebas de producción)'],
          ['npm run lint', 'ESLint sobre src/'],
          ['npm run typecheck', 'tsc --noEmit (solo verificación de tipos)'],
        ]}
      />

      <SectionTitle>Primer inicio — Onboarding</SectionTitle>
      <Body>
        Al ingresar por primera vez, un asistente interactivo de <strong>10 pasos</strong> guía la
        configuración inicial. El flujo crea secuencialmente:
      </Body>
      <CodeBlock>
        {`Paso   Acción                        Tabla destino\n────   ──────────────────────────── ─────────────────\n  1    Crear unidad de negocio      business_units\n  2    Registrar aplicación           applications\n  3    Registrar tecnología           technologies\n  4    Crear equipo                   teams\n  5    Agregar miembros               team_members\n  6    Registrar métricas DORA        dora_metrics\n  7    Cargar vulnerabilidades        vulnerabilities\n  8    Configurar OKRs                objectives\n  9    Vincular GobIA                 ai_config\n 10    Cargar dataset demo            (múltiples tablas)`}
      </CodeBlock>

      <SectionTitle>Carga de datos demo</SectionTitle>
      <Body>
        La función <InlineCode>useDemoData()</InlineCode> en{' '}
        <InlineCode>src/hooks/useDemoData.ts</InlineCode> popula 25+ tablas con un dataset
        representativo. Los datos se generan con UUIDs determinísticos para evitar duplicados en
        re-ejecuciones. Incluye:
      </Body>
      <BulletList>
        <li>3 unidades de negocio con 12 aplicaciones distribuidas</li>
        <li>8 tecnologías con estados de obsolescencia variados</li>
        <li>Vulnerabilidades CVSS simuladas con severidades mezcladas</li>
        <li>2 equipos DORA con métricas en rangos Elite/Bajo</li>
        <li>OKRs anidados con progreso parcial</li>
        <li>Plan de ejecución con actividades, bloqueos y compromisos</li>
      </BulletList>
    </section>
  )
}
