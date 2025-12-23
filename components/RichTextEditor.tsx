'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Underline } from '@tiptap/extension-underline'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange?: (html: string) => void
  editable?: boolean
}

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72']
const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
]

export function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const [fontSize, setFontSize] = useState('11')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      Image,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-8 py-6',
        style: `font-size: ${fontSize}pt; font-family: 'Times New Roman', serif;`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
      }
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Update editable state when prop changes
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  if (!editor) {
    return null
  }

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }

  const setHighlightColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run()
    setShowHighlightPicker(false)
  }

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  ]

  return (
    <div className={`rounded-lg overflow-hidden bg-white ${editable ? 'border border-gray-300' : ''}`}>
      {editable && (
        <div className="border-b border-gray-300 bg-gray-50 px-3 py-2">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Font Family */}
            <select
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>

            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <div className="w-px h-6 bg-gray-300" />

            {/* Bold */}
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-300' : ''
              }`}
              title="Bold (Ctrl+B)"
            >
              <span className="font-bold text-sm">B</span>
            </button>

            {/* Italic */}
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-300' : ''
              }`}
              title="Italic (Ctrl+I)"
            >
              <span className="italic text-sm">I</span>
            </button>

            {/* Underline */}
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('underline') ? 'bg-gray-300' : ''
              }`}
              title="Underline (Ctrl+U)"
            >
              <span className="underline text-sm">U</span>
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Text Color */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Text color"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <div className="w-4 h-1 bg-current" style={{ color: editor.getAttributes('textStyle').color || '#000' }} />
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Color */}
            <div className="relative">
              <button
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                className="p-2 rounded hover:bg-gray-200 transition-colors"
                title="Highlight color"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setHighlightColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Link */}
            <button
              onClick={() => {
                const url = window.prompt('Enter URL:')
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                }
              }}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('link') ? 'bg-gray-300' : ''
              }`}
              title="Insert Link"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Headings */}
            <select
              onChange={(e) => {
                const level = parseInt(e.target.value)
                if (level === 0) {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Normal text</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="4">Heading 4</option>
            </select>

            <div className="w-px h-6 bg-gray-300" />

            {/* Lists */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bulletList') ? 'bg-gray-300' : ''
              }`}
              title="Bullet List"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4h2v2H4V4zm0 5h2v2H4V9zm0 5h2v2H4v-2zm4-10v2h10V4H8zm0 5v2h10V9H8zm0 5v2h10v-2H8z"/>
              </svg>
            </button>

            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('orderedList') ? 'bg-gray-300' : ''
              }`}
              title="Numbered List"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h10V5H7zm0 14h10v-2H7v2zm0-6h10v-2H7v2z"/>
              </svg>
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Undo/Redo */}
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Undo"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 10a7 7 0 0112.93-3.93l1.42-1.42A9 9 0 003 10z"/>
                <path d="M13.93 6.07A7 7 0 004 10H2a9 9 0 0113.93-5.93l-2 2z"/>
              </svg>
            </button>

            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Redo"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17 10a7 7 0 01-12.93 3.93l-1.42 1.42A9 9 0 0017 10z"/>
                <path d="M6.07 13.93A7 7 0 0116 10h2a9 9 0 01-13.93 5.93l2-2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[600px] overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
