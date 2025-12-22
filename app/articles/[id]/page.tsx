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

export default function ArticleViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

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

    setDownloading(true)
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
      setDownloading(false)
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
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDownload('md')}
                disabled={downloading}
                variant="outline"
              >
                {downloading ? 'Downloading...' : 'Download Markdown (.md)'}
              </Button>
              <Button
                onClick={() => handleDownload('docx')}
                disabled={downloading}
                variant="outline"
              >
                {downloading ? 'Downloading...' : 'Download Word (.docx)'}
              </Button>
              {article.google_doc_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(article.google_doc_url!, '_blank')}
                >
                  Open in Google Docs
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Article Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="prose prose-lg max-w-none
              prose-headings:text-gray-900 prose-headings:font-bold
              prose-h1:text-4xl prose-h1:mb-6 prose-h1:leading-tight
              prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:leading-snug
              prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:leading-snug
              prose-p:text-gray-900 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
              prose-a:text-blue-600 prose-a:font-medium hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:shadow-lg
              prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4 prose-ul:text-gray-900
              prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4 prose-ol:text-gray-900
              prose-li:mb-2 prose-li:text-gray-900 prose-li:leading-relaxed
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:my-4
              prose-table:border-collapse prose-table:w-full prose-table:my-6 prose-table:shadow-md prose-table:rounded-lg
              prose-th:border prose-th:border-gray-300 prose-th:bg-blue-50 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900
              prose-td:border prose-td:border-gray-300 prose-td:p-3 prose-td:text-gray-900
              prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6"
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
