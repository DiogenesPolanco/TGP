import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { RichTextViewer } from '@/components/rich-text/RichTextViewer'

interface Props {
  documentation: string
  setDocumentation: (v: string) => void
  markDirty: () => void
}

export function MicroserviceDocsSection({ documentation, setDocumentation, markDirty }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-90 dark:text-white">
        Documentación Técnica
      </h2>
      {documentation ? (
        <RichTextViewer
          content={documentation}
          onChange={(html) => { setDocumentation(html); markDirty() }}
          editable
        />
      ) : (
        <RichTextEditor
          value={documentation}
          onChange={(html) => { setDocumentation(html); markDirty() }}
          placeholder="## Arquitectura&#10;&#10;Describe la arquitectura del microservicio...&#10;&#10;## API&#10;&#10;Endpoints principales...&#10;&#10;## Integraciones&#10;&#10;Sistemas con los que se comunica..."
        />
      )}
    </div>
  )
}
