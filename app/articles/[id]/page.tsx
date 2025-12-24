'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Article } from '@/lib/types/database'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Mermaid } from '@/components/Mermaid'
import { RichTextEditor } from '@/components/RichTextEditor'
import { markdownToHtml } from '@/lib/utils/markdown'
import TurndownService from 'turndown'

export default function ArticleViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<'md' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'richtext'>('preview')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false)
  const [isEditingRichText, setIsEditingRichText] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [richTextHtml, setRichTextHtml] = useState('')

  useEffect(() => {
    loadArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Convert markdown to HTML when switching to rich text tab
  useEffect(() => {
    if (activeTab === 'richtext' && article && !isEditingRichText) {
      setRichTextHtml(markdownToHtml(article.content))
    }
  }, [activeTab, article, isEditingRichText])

  const loadArticle = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setArticle(data as Article)
    } catch (err) {
      console.error('Error loading article:', err)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: 'md' | 'docx') => {
    if (!article) return

    setDownloading(format)
    try {
      const response = await fetch(`/api/articles/${article.id}/download?format=${format}`)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${article.file_id || article.id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  const handleCopy = async () => {
    if (!article) return

    try {
      await navigator.clipboard.writeText(article.content)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Copy error:', err)
      setError('Failed to copy content')
    }
  }

  const handleEditMarkdown = () => {
    if (!article) return
    setEditedContent(article.content)
    setIsEditingMarkdown(true)
  }

  const handleSaveEdit = async () => {
    if (!article || !editedContent) return

    try {
      const supabase = createClient()

      // Convert markdown to rich text HTML
      const richTextHtml = markdownToHtml(editedContent)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('articles')
        .update({
          content: editedContent,
          rich_text_content: richTextHtml,
        })
        .eq('id', article.id)

      if (error) throw error

      setArticle({ ...article, content: editedContent })
      setIsEditingMarkdown(false)
      setIsEditingRichText(false)
      setError('')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save changes')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingMarkdown(false)
    setIsEditingRichText(false)
    setEditedContent('')
    setRichTextHtml('')
  }

  const handleSaveRichText = async () => {
    if (!article || !richTextHtml) return

    try {
      // Convert HTML back to markdown
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      })
      const markdown = turndownService.turndown(richTextHtml)

      const supabase = createClient()

      // Save both markdown and rich text HTML in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('articles')
        .update({
          content: markdown,
          rich_text_content: richTextHtml,
        })
        .eq('id', article.id)

      if (error) throw error

      setArticle({ ...article, content: markdown })
      setIsEditingRichText(false)
      setRichTextHtml('')
      setError('')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save changes')
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <LoadingSpinner size="lg" className="mt-20" />
      </AuthLayout>
    )
  }

  if (error || !article) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600">{error || 'Article not found'}</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        {/* Article Metadata Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{article.title}</CardTitle>
                {article.description && (
                  <p className="text-gray-600 mb-3">{article.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {article.tags && article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Platform: {article.platform}</span>
                  <span>•</span>
                  <span>{article.word_count} words</span>
                  <span>•</span>
                  <span>{format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                  <span>•</span>
                  <StatusBadge status={article.status as 'draft' | 'generated' | 'published' | 'failed'} />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Article Content with Tabs */}
        <Card className="!shadow-sm !border-gray-100">
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'preview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'markdown'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setActiveTab('richtext')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'richtext'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Rich Text
                </button>
                <div className="flex-1"></div>
                {article.google_doc_url && (
                  <div className="flex items-center pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(article.google_doc_url!, '_blank')}
                    >
                      Open in Google Docs
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Preview Tab */}
              {activeTab === 'preview' && (
            <article className="prose prose-lg max-w-none
              [&>*]:text-gray-900
              [&_h1]:text-gray-900 [&_h1]:font-bold [&_h1]:text-4xl [&_h1]:mb-6 [&_h1]:mt-8 [&_h1]:leading-tight
              [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-3xl [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:leading-snug
              [&_h3]:text-gray-900 [&_h3]:font-bold [&_h3]:text-2xl [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:leading-snug
              [&_h4]:text-gray-900 [&_h4]:font-semibold [&_h4]:text-xl [&_h4]:mb-2 [&_h4]:mt-4
              [&_p]:text-gray-900 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-base
              [&_strong]:text-gray-900 [&_strong]:font-bold
              [&_em]:text-gray-900 [&_em]:italic
              [&_a]:text-blue-600 [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline
              [&_p>code]:text-pink-600 [&_p>code]:bg-pink-50 [&_p>code]:px-1.5 [&_p>code]:py-0.5 [&_p>code]:rounded [&_p>code]:text-sm [&_p>code]:font-mono [&_p>code]:font-normal
              [&_li>code]:text-pink-600 [&_li>code]:bg-pink-50 [&_li>code]:px-1.5 [&_li>code]:py-0.5 [&_li>code]:rounded [&_li>code]:text-sm [&_li>code]:font-mono [&_li>code]:font-normal
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ul]:text-gray-900
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_ol]:text-gray-900
              [&_li]:mb-2 [&_li]:text-gray-900 [&_li]:leading-relaxed
              [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:bg-blue-50 [&_blockquote]:py-2 [&_blockquote]:my-4
              [&_table]:border-collapse [&_table]:w-full [&_table]:my-6 [&_table]:shadow-md [&_table]:rounded-lg [&_table]:overflow-hidden
              [&_th]:border [&_th]:border-gray-300 [&_th]:bg-blue-50 [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900
              [&_td]:border [&_td]:border-gray-300 [&_td]:p-3 [&_td]:text-gray-900
              [&_img]:rounded-lg [&_img]:my-6"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''
                    const code = String(children).replace(/\n$/, '')

                    // Render Mermaid diagrams
                    if (!inline && language === 'mermaid') {
                      return (
                        <Mermaid
                          chart={code}
                          id={Math.random().toString(36).substring(7)}
                        />
                      )
                    }

                    // Render code blocks with syntax highlighting
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: '1.5rem 0',
                          borderRadius: '0.5rem',
                          backgroundColor: '#1E1E1E',
                          fontSize: '0.875rem',
                          lineHeight: '1.6',
                          padding: '1rem',
                          border: 'none',
                          boxShadow: 'none',
                          outline: 'none',
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          }
                        }}
                        {...props}
                      >
                        {code}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {article.content}
              </ReactMarkdown>
                </article>
              )}

              {/* Markdown Tab */}
              {activeTab === 'markdown' && (
                <div className="relative">
                  {/* Action Icons */}
                  <div className="absolute top-0 right-0 flex gap-2 z-10">
                    {!isEditingMarkdown ? (
                      <>
                        <button
                          onClick={handleCopy}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors bg-white border border-gray-200"
                          title="Copy markdown"
                        >
                          {copySuccess ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={handleEditMarkdown}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors bg-white border border-gray-200"
                          title="Edit markdown"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload('md')}
                          disabled={downloading === 'md'}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 bg-white border border-gray-200"
                          title="Download markdown"
                        >
                          {downloading === 'md' ? (
                            <svg className="w-5 h-5 text-gray-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 hover:bg-green-100 rounded-md transition-colors bg-white border border-gray-200"
                          title="Save changes"
                        >
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 hover:bg-red-100 rounded-md transition-colors bg-white border border-gray-200"
                          title="Cancel editing"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Markdown Content */}
                  {isEditingMarkdown ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full bg-gray-50 p-6 rounded-lg text-sm font-mono text-gray-900 leading-relaxed border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                      rows={20}
                    />
                  ) : (
                    <pre className="bg-gray-50 p-6 rounded-lg overflow-auto text-sm font-mono text-gray-900 leading-relaxed border border-gray-200 max-h-[600px]">
                      {article.content}
                    </pre>
                  )}
                </div>
              )}

              {/* Rich Text Tab */}
              {activeTab === 'richtext' && (
                <div className="relative">
                  {/* Action Icons */}
                  <div className="flex justify-end gap-2 mb-4">
                    {!isEditingRichText ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingRichText(true)
                            setRichTextHtml(markdownToHtml(article.content))
                          }}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit content"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCopy}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                          title="Copy markdown"
                        >
                          {copySuccess ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload('docx')}
                          disabled={downloading === 'docx'}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                          title="Download Word document"
                        >
                          {downloading === 'docx' ? (
                            <svg className="w-5 h-5 text-gray-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveRichText}
                          className="p-2 hover:bg-green-100 rounded-md transition-colors"
                          title="Save changes"
                        >
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 hover:bg-red-100 rounded-md transition-colors"
                          title="Cancel editing"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Rich Text Editor */}
                  <div>
                    <RichTextEditor
                      content={richTextHtml}
                      onChange={setRichTextHtml}
                      editable={isEditingRichText}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
