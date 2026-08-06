import {
  PageH1,
  Divider,
  SectionTitle,
  SubSection,
  Body,
  Table,
  CodeBlock,
  StepList,
  BulletListInline,
  InlineCode,
} from '../components/DocComponents'

export function IntegracionesSection() {
  return (
    <section id="integraciones" className="mb-20 scroll-mt-20">
      <PageH1>Integraciones</PageH1>
      <Divider />

      <SectionTitle>Jira</SectionTitle>
      <Body>
        Los tickets de equipamiento se vinculan a Jira mediante los campos{' '}
        <InlineCode>jiraIssueId</InlineCode> e <InlineCode>issueUrl</InlineCode> en la tabla{' '}
        <InlineCode>equipment_tickets</InlineCode>. La integración es unidireccional: TGP almacena
        la referencia y provee un enlace directo al issue en Jira desde la vista de detalle del
        ticket.
      </Body>
      <CodeBlock>
        {`// Tabla equipment_tickets:
interface EquipmentTicket {
  id: string
  equipmentId: string
  type: 'reparación' | 'reemplazo' | 'nuevo'
  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'
  jiraIssueId?: string    // ej: "PROY-123"
  issueUrl?: string        // ej: "https://miempresa.atlassian.net/browse/PROY-123"
  description: string
  createdAt: string
}`}
      </CodeBlock>

      <SectionTitle>Azure Blob Storage</SectionTitle>

      <SubSection>Arquitectura de almacenamiento</SubSection>
      <Body>
        TGP usa Azure Blob Storage para respaldo y enlaces públicos. El contenedor se configura
        desde Administración → Configuración → Azure Cloud.
      </Body>
      <CodeBlock>
        {`Configuración requerida:
  accountName:     string  // nombre de la cuenta de almacenamiento
  containerName:   string  // nombre del contenedor (ej: "tgp-shares")
  sasToken:        string  // SAS token con permisos de lectura/escritura

Cada blob se nombra con UUID v4:
  {container}/{uuid}.json

El contenido del blob es un JSON cifrado con AES-GCM-256.`}
      </CodeBlock>

      <SubSection>API del servicio de Azure Blob</SubSection>
      <Body>
        El servicio <InlineCode>azureShareService.ts</InlineCode> expone 4 operaciones públicas:
      </Body>
      <CodeBlock>
        {`interface AzureBlobService {
  /** Guardar blob con cifrado AES-GCM */
  upload(hash: string, payload: object, passphrase?: string): Promise<void>

  /** Leer y descifrar blob por hash */
  download(hash: string, passphrase?: string): Promise<object | null>

  /** Listar todos los blobs del contenedor */
  list(): Promise<Array<{ hash: string; size: number; uploadedAt: string }>>

  /** Eliminar blob del contenedor */
  delete(hash: string): Promise<void>
}

// Configuración desde Admin → Azure Cloud
interface AzureConfig {
  accountName: string
  containerName: string
  sasToken: string        // Token SAS con permisos: cw (create+write)
                          // y rl (read+list) según operación
}`}
      </CodeBlock>

      <SubSection>Configuración paso a paso</SubSection>
      <Body>Sigue estos pasos para conectar TGP con Azure Blob Storage:</Body>
      <StepList
        items={[
          'Crear cuenta de almacenamiento: Azure Portal → Storage accounts → Create. Elegir "StorageV2 (general purpose v2)", rendimiento "Standard", redundancia "LRS".',
          'Crear contenedor: Dentro de la cuenta → Containers → + Container. Nombre: "tgp-backups" (o el que prefieras). Nivel de acceso: "Private (no anonymous access)".',
          'Generar SAS token: Ir a tu cuenta → "Shared access signature". Marcar los permisos necesarios: Read, Write, List, Delete. Fecha de expiración: elegir según necesidad (recomendado: 1 año). Protocolo: HTTPS only. Click en "Generate SAS and connection string". Copiar "SAS token".',
          'Alternativa — SAS de contenedor: Ir a Containers → tu contenedor → "Shared access tokens". Esto limita el SAS al contenedor específico. Permisos: Read, Write, List, Delete. Copiar el "Blob SAS token" generado.',
          'Configurar en TGP: Ir a Administración → Configuración → Azure Cloud. Ingresar Account Name, Container Name, y el SAS token. Click "Probar conexión" para verificar.',
          'Verificar: Si la conexión es exitosa, puedes crear enlaces públicos desde cualquier vista (compartir) y hacer backup desde Administración → Exportar → "Subir a Azure".',
        ]}
      />

      <SubSection>Uso de backups en Azure</SubSection>
      <Body>
        Una vez configurado, puedes gestionar backups desde la interfaz de Administración:
      </Body>
      <StepList
        items={[
          'Subir backup: Administración → Exportar datos → "Subir a Azure" → el sistema exporta todas las tablas a un JSON cifrado y lo sube como blob.',
          'Descargar backup: Administración → Importar → "Desde Azure" → lista los blobs disponibles, seleccionas uno y lo descargas/restauras.',
          'Restaurar automatic: seleccionar un blob de la lista → el sistema descarga, descifra e importa todas las tablas automáticamente.',
          'Eliminar backup: en la lista de blobs, hay un botón de eliminar por si necesitas limpiar backups antiguos.',
          'Los blobs se nombran con UUID v4 + timestamp: "tgp-backup-2026-07-19-a1b2c3d4.json".',
        ]}
      />

      <SubSection>Solución de problemas con Azure</SubSection>
      <Body>Si la conexión falla o los backups no funcionan:</Body>
      <BulletListInline
        items={[
          '"SAS token expirado" → generar un nuevo SAS con fecha futura y actualizar en TGP.',
          '"Permission denied (List)" → el SAS necesita permisos Read + Write + List + Delete.',
          '"Container not found" → verificar que el nombre del contenedor coincida exactamente (incluye mayúsculas/minúsculas).',
          '"Network error" → firewalls corporativos pueden bloquear Azure. Probar desde una red diferente.',
          '"Blob no encontrado" → si el contenedor tiene muchos blobs, la paginación puede fallar. Usar nombres cortos.',
        ]}
      />

      <SubSection>Cifrado de enlaces públicos</SubSection>
      <Body>Los enlaces públicos se cifran en reposo antes de almacenarse. El proceso:</Body>
      <CodeBlock>
        {`1. Generar clave AES-GCM-256 a partir de passphrase (opcional) + salt
   key = PBKDF2(passphrase, salt, 100000 iterations, 256 bits)

2. Cifrar payload JSON
   ciphertext = AES-GCM-256.encrypt(payload, key)
   → produce: nonce (12 bytes) + ciphertext + authTag (16 bytes)

3. Almacenar blob con: { salt, nonce, ciphertext }

4. El enlace público contiene:
   /public/{hash}?passphrase={opcional}

5. Al abrir, se descifra del lado del cliente
   Solo el navegador tiene la clave para descifrar`}
      </CodeBlock>

      <SectionTitle>Proveedores de IA — Configuración detallada</SectionTitle>
      <Body>
        GobIA se configura desde <strong>Ajustes → IA</strong>. Cada proveedor requiere:
      </Body>
      <Table
        rows={[
          ['Proveedor', 'API Key', 'Modelo por defecto', 'Tool calls', 'Costo'],
          ['OpenAI', 'Requerida', 'gpt-4o', 'Sí', 'Pago por uso'],
          ['Groq', 'Requerida', 'llama-4', 'Sí', 'Free tier disponible'],
          ['Anthropic', 'Requerida', 'claude-sonnet-4', 'Próximamente', 'Pago por uso'],
          ['Ollama', 'No requiere', 'llama3 (local)', 'Sí', 'Gratuito (local)'],
        ]}
      />
      <Body>
        Las API keys se almacenan en IndexedDB cifradas con <InlineCode>btoa/atob</InlineCode>{' '}
        (ofuscación básica). No se envían a ningún servidor externo — las llamadas se hacen
        directamente desde el navegador a la API del proveedor.
      </Body>

      <SubSection>Configuración paso a paso — OpenAI</SubSection>
      <StepList
        items={[
          'Crear cuenta en https://platform.openai.com/signup si no tienes una.',
          'Ir a API keys → "Create new secret key". Copiar la key (sk-...). No se puede recuperar después, guárdala.',
          'En TGP: Ajustes → IA → Proveedor: OpenAI. Pegar la API key en el campo correspondiente.',
          'Seleccionar modelo: gpt-4o (recomendado) o gpt-4o-mini (más económico).',
          'Configurar límites: OpenAI free tier tiene 3 RPM (requests por minuto) — si ves errores 429, reducir frecuencia.',
          'Probar: escribir "¿Cuántas aplicaciones hay?" en GobIA. Debería responder con datos si hay apps cargadas.',
        ]}
      />

      <SubSection>Configuración paso a paso — Groq</SubSection>
      <StepList
        items={[
          'Crear cuenta en https://console.groq.com/signup.',
          'Ir a API Keys → "Create API Key". Copiar la key (gsk_-...).',
          'En TGP: Ajustes → IA → Proveedor: Groq. Pegar la API key.',
          'Seleccionar modelo: llama-4 (recomendado por su soporte de tool calls). Alternativa: mixtral-8x7b.',
          'Groq ofrece free tier generoso (30 RPM en modelos populares) — ideal para pruebas.',
          'Probar con una consulta a GobIA. Si falla, verificar que el modelo elegido soporte function calling.',
        ]}
      />

      <SubSection>Configuración paso a paso — Ollama (local)</SubSection>
      <Body>
        Ollama es la opción gratuita y 100% local. No envía datos a ningún servidor externo.
      </Body>
      <StepList
        items={[
          'Instalar Ollama: https://ollama.com/download → descargar e instalar según tu SO.',
          'Abrir terminal y descargar un modelo con soporte de tool calls: ollama pull llama4 (recomendado) u ollama pull mistral.',
          'Configurar CORS: Ollama bloquea conexiones desde navegadores por seguridad. Ejecutar: OLLAMA_ORIGINS=* ollama serve (Linux/macOS) o set OLLAMA_ORIGINS=* && ollama serve (Windows).',
          'Verificar que Ollama corre: curl http://localhost:11434/api/tags — debe devolver JSON con los modelos instalados.',
          'En TGP: Ajustes → IA → Proveedor: Ollama. No requiere API key. Modelo: el que descargaste (ej: "llama4").',
          'Opcional — Docker: docker run -d -p 11434:11434 -e OLLAMA_ORIGINS="*" ollama/ollama.',
          'Probar: preguntar a GobIA "¿Qué tecnologías hay registradas?". Si falla, revisar la consola del navegador por errores CORS.',
        ]}
      />

      <SubSection>Configuración paso a paso — Anthropic (próximamente)</SubSection>
      <StepList
        items={[
          'Crear cuenta en https://console.anthropic.com/.',
          'Ir a API Keys → "Create Key". Copiar la key (sk-ant-...).',
          'En TGP: Ajustes → IA → Proveedor: Anthropic. Pegar la API key.',
          'Modelo por defecto: claude-sonnet-4. Soporte de tool calls en desarrollo.',
          'Nota: El soporte de tool calls para Anthropic está en implementación. Mientras tanto, GobIA responde sin consultar la base de datos local.',
        ]}
      />

      <SectionTitle>Importación Excel — Formato esperado</SectionTitle>
      <Body>
        El importador acepta archivos <InlineCode>.xlsx</InlineCode> con las siguientes columnas:
      </Body>
      <CodeBlock>
        {`Columnas de applications:
  name*             → nombre de la aplicación
  description       → descripción
  businessUnit*     → nombre de la unidad de negocio
  criticality       → baja | media | alta | crítica
  status            → activo | en_desarrollo | deprecado
  category          → categoría funcional
  technicalLead     → responsable técnico
  repositoryUrl     → URL del repositorio
  (*) = requerido`}
      </CodeBlock>
      <Body>
        El proceso de importación: 1) Lee el archivo con SheetJS, 2) Valúa cada fila contra un
        schema Zod, 3) Detecta duplicados por <InlineCode>name + businessUnitId</InlineCode>, 4)
        Ejecuta upsert en transacción Dexie.js, 5) Reporta resultados (insertados, actualizados,
        errores).
      </Body>

      <SectionTitle>Exportación de datos</SectionTitle>

      <SubSection>Formato JSON de exportación</SubSection>
      <Body>
        TGP exporta todas las tablas en un único archivo JSON con estructura versionada. Este mismo
        formato se usa para backup y restauración:
      </Body>
      <CodeBlock>
        {`{
  "version": 6,
  "exportedAt": "2026-07-19T12:00:00Z",
  "data": {
    "business_units": [ ... ],
    "applications": [ ... ],
    "vulnerabilities": [ ... ],
    "technologies": [ ... ],
    // ... 25+ tablas incluidas
  }
}

// El exportador omite tablas internas y de configuración:
// - share_links (los enlaces públicos no se respaldan)
// - ai_config (API keys no se exportan por seguridad)
// - user_preferences (preferencias locales no transferibles)`}
      </CodeBlock>
      <Body>
        La exportación se descarga como <InlineCode>.json</InlineCode> desde{' '}
        <InlineCode>Administración → Exportar datos</InlineCode>. Para restaurar, usar{' '}
        <InlineCode>Administración → Importar → JSON de backup</InlineCode>. El importador detecta
        la versión del schema y migra automáticamente si es necesario.
      </Body>

      <SubSection>Pipeline de SheetJS</SubSection>
      <Body>
        El motor de importación (<InlineCode>src/services/import/importService.ts</InlineCode>)
        sigue un pipeline de 6 etapas:
      </Body>
      <CodeBlock>
        {`1. Parseo binario
   SheetJS.read(data, { type: 'array', cellDates: true })
   → WorkBook con todas las hojas

2. Extracción de hoja activa
   const sheet = workbook.Sheets[workbook.SheetNames[0]]
   const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

3. Mapeo de columnas (heuristico)
   Busca coincidencias entre headers del Excel y campos del schema Zod:
   "Nombre aplicación" → name, "BU" → businessUnit, etc.
   Si no hay match exacto, muestra tabla de mapeo para confirmación manual.

4. Validación Zod por fila
   const result = applicationSchema.safeParse(row)
   Los errores se recolectan sin detener el proceso:
   { row: 42, field: 'criticality', error: 'Invalid enum value: "critica"' }

5. Detección de duplicados
   const existing = await db.applications
     .where({ name: row.name, businessUnitId: buId })
     .first()
   Si existe → UPDATE (upsert), si no → INSERT

6. Transacción Dexie.js
   await db.transaction('rw', db.applications, async () => {
     for (const record of records) {
       await db.applications.put(record)
     }
   })
   → Una transacción atómica: si falla, rollback completo`}
      </CodeBlock>
    </section>
  )
}
