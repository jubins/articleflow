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
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
          <CardContent className="pt-8 px-8 pb-8">
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
              [&_img]:rounded-lg [&_img]:shadow-lg [&_img]:my-6"
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
                        style={tomorrow}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: '1.5rem 0',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.875rem',
                          lineHeight: '1.6',
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
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
