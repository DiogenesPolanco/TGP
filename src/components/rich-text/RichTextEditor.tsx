import { useCallback, useEffect } from 'react'
import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Plugin } from '@tiptap/pm/state'
import { common, createLowlight } from 'lowlight'
import { Button } from '@/components/ui/Button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from 'lucide-react'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  editable?: boolean
}

const MenuButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) => (
  <Button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-neutral-50 hover:bg-neutral-10 hover:text-neutral-70 dark:text-neutral-40 dark:hover:bg-neutral-70 dark:hover:text-neutral-20'
    }`}
  >
    {children}
  </Button>
)

const Divider = () => <div className="w-px h-5 bg-neutral-20 dark:bg-neutral-60 mx-1" />

const PasteMarkdown = Extension.create({
  name: 'pasteMarkdown',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData('text/plain')
            if (!text || !looksLikeMarkdown(text)) return false

            const { editor } = this
            if (!editor?.markdown) return false

            try {
              const json = editor.markdown.parse(text)
              editor.commands.insertContent(json)
              return true
            } catch {
              return false
            }
          },
        },
      }),
    ]
  },
})

function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,6}\s/.test(text) || // Headings
    /\*\*[^*]+\*\*/.test(text) || // Bold
    /__[^_]+__/.test(text) || // Bold (underscore)
    /`{3}/.test(text) || // Code blocks
    /\[.+\]\(.+\)/.test(text) || // Links
    /^[-*+]\s/.test(text) || // Unordered lists
    /^\d+\.\s/.test(text) || // Ordered lists
    /^>\s/.test(text) // Blockquotes
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  minHeight = '250px',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Markdown,
      PasteMarkdown,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Sync external value changes to editor (e.g. edit form loading async data)
  useEffect(() => {
    if (!editor || !value) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div
      className="border border-neutral-30 dark:border-neutral-60 rounded-lg overflow-hidden"
      style={{ minWidth: 0 }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-boundary bg-neutral-5 dark:bg-neutral-80">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Cursiva"
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Subrayado"
        >
          <UnderlineIcon size={16} />
        </MenuButton>

        <Divider />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Título 1"
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Título 2"
        >
          <Heading2 size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Título 3"
        >
          <Heading3 size={16} />
        </MenuButton>

        <Divider />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista"
        >
          <List size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote size={16} />
        </MenuButton>

        <Divider />

        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Bloque de código"
        >
          <Code size={16} />
        </MenuButton>
        <MenuButton onClick={addTable} active={editor.isActive('table')} title="Tabla">
          <TableIcon size={16} />
        </MenuButton>

        <Divider />

        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinear izquierda"
        >
          <AlignLeft size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centrar"
        >
          <AlignCenter size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinear derecha"
        >
          <AlignRight size={16} />
        </MenuButton>

        <Divider />

        <MenuButton onClick={setLink} active={editor.isActive('link')} title="Enlace">
          <LinkIcon size={16} />
        </MenuButton>
        <MenuButton onClick={addImage} title="Imagen">
          <ImageIcon size={16} />
        </MenuButton>

        <Divider />

        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
          <Undo size={16} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo size={16} />
        </MenuButton>
      </div>

      {/* Editor */}
      <div
        className="px-4 py-3 dark:bg-neutral-85 [&_.tiptap]:text-neutral-90 [&_.tiptap]:dark:text-neutral-10 overflow-x-auto"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
