import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

interface RichTextViewerProps {
  content: string
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      Link.configure({ HTMLAttributes: { class: 'text-primary underline' } }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  )
}
