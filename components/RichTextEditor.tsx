'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style/text-style'
import { Color } from '@tiptap/extension-text-style/color'
import { Highlight } from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-text-style/font-family'
import { FontSize } from '@tiptap/extension-text-style/font-size'
import { useEffect, useState, useRef } from 'react'
import { InputModal } from '@/components/ui/Modal'

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
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const highlightPickerRef = useRef<HTMLDivElement>(null)

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target as Node)) {
        setShowHighlightPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      FontSize,
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
    // Row 1 - Blacks and Grays
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    // Row 2 - Vibrant colors
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    // Row 3 - Pastels
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
    // Row 4 - Light tones
    '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
    // Row 5 - Medium tones
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
    // Row 6 - Dark tones
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
  ]

  return (
    <div className={`rounded-lg overflow-hidden bg-white ${editable ? 'border border-gray-300' : ''}`}>
      {editable && (
        <div className="border-b border-gray-300 bg-gray-50 px-3 py-2">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Font Family */}
            <select
              value={editor.getAttributes('textStyle').fontFamily || 'Arial, sans-serif'}
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
              value={(editor.getAttributes('textStyle').fontSize || '11pt').replace('pt', '')}
              onChange={(e) => editor.chain().focus().setFontSize(`${e.target.value}pt`).run()}
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
            <div className="relative" ref={colorPickerRef}>
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker)
                  setShowHighlightPicker(false)
                }}
                className={`px-2.5 py-1.5 rounded hover:bg-gray-200 transition-colors flex flex-col items-center ${showColorPicker ? 'bg-gray-200' : ''}`}
                title="Text color"
              >
                <span className="text-lg font-bold leading-none">A</span>
                <div className="w-full h-0.5 mt-0.5" style={{ backgroundColor: editor?.getAttributes('textStyle')?.color || '#000000' }}></div>
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[280px]">
                  <div className="grid grid-cols-10 gap-1.5">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className="w-6 h-6 rounded-sm border border-gray-200 hover:border-gray-400 hover:scale-110 transition-all"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Color */}
            <div className="relative" ref={highlightPickerRef}>
              <button
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker)
                  setShowColorPicker(false)
                }}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${showHighlightPicker ? 'bg-gray-200' : ''}`}
                title="Highlight color"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
              {showHighlightPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[280px]">
                  <div className="grid grid-cols-10 gap-1.5">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setHighlightColor(color)}
                        className="w-6 h-6 rounded-sm border border-gray-200 hover:border-gray-400 hover:scale-110 transition-all"
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
              onClick={() => setShowLinkModal(true)}
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
              value={
                editor.isActive('heading', { level: 1 }) ? '1' :
                editor.isActive('heading', { level: 2 }) ? '2' :
                editor.isActive('heading', { level: 3 }) ? '3' :
                editor.isActive('heading', { level: 4 }) ? '4' : '0'
              }
              onChange={(e) => {
                const level = parseInt(e.target.value)
                if (level === 0) {
                  editor.chain().focus().setParagraph().run()
                } else {
                  editor.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 }).run()
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Redo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[600px] overflow-auto">
        <EditorContent editor={editor} />
      </div>

      <InputModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={(url) => {
          editor.chain().focus().setLink({ href: url }).run()
        }}
        title="Insert Link"
        message="Enter the URL for the link:"
        placeholder="https://example.com"
        confirmText="Insert"
        cancelText="Cancel"
      />
    </div>
  )
}
