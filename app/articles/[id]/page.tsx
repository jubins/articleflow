'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmModal } from '@/components/ui/Modal'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Article } from '@/lib/types/database'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Mermaid } from '@/components/Mermaid'
import { CarouselViewer } from '@/components/CarouselViewer'
import { PublishToDevToModal } from '@/components/PublishToDevToModal'
import { markdownToHtml } from '@/lib/utils/markdown'
import { replaceMermaidWithCachedImages } from '@/lib/utils/diagram-processor'
import { ArticlePublication } from '@/lib/types/database'

interface Profile {
  full_name?: string | null
  bio?: string | null
  linkedin_handle?: string | null
  twitter_handle?: string | null
  github_handle?: string | null
  website?: string | null
}

export default function ArticleViewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const toast = useToast()
  const [article, setArticle] = useState<Article | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<'md' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'carousel'>('preview')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingTab, setPendingTab] = useState<'preview' | 'markdown' | 'carousel' | null>(null)
  const [displayContent, setDisplayContent] = useState('')
  const [markdownContent, setMarkdownContent] = useState('')
  const [processingDiagrams, setProcessingDiagrams] = useState(false)
  const [copiedDescription, setCopiedDescription] = useState(false)
  const [copiedTags, setCopiedTags] = useState(false)
  const [copiedTldr, setCopiedTldr] = useState(false)
  const [diagramErrors, setDiagramErrors] = useState<Map<string, boolean>>(new Map())
  const [hasCriticalErrors, setHasCriticalErrors] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publications, setPublications] = useState<ArticlePublication[]>([])
  const [loadingPublications, setLoadingPublications] = useState(true)

  useEffect(() => {
    loadArticle()
    loadPublications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Process article content to replace mermaid diagrams with cached images
  useEffect(() => {
    if (article) {
      const cachedDiagrams = article.diagram_images as Record<string, string> | null
      const processedContent = replaceMermaidWithCachedImages(article.content, cachedDiagrams)
      setDisplayContent(processedContent)
      setMarkdownContent(processedContent)

      // Check if article has mermaid diagrams that need rendering
      const hasMermaid = article.content.includes('```mermaid')
      const hasCachedImages = cachedDiagrams && Object.keys(cachedDiagrams).length > 0

      // If there are mermaid diagrams and no cached images, they will be rendered and might have errors
      if (hasMermaid && !hasCachedImages) {
        // Errors will be detected during rendering via onError callbacks
      }
    }
  }, [article])

  // Track diagram errors
  const handleDiagramError = (diagramId: string, hasError: boolean) => {
    setDiagramErrors(prev => {
      const newMap = new Map(prev)
      newMap.set(diagramId, hasError)
      return newMap
    })
  }

  // Check for critical errors (any diagram has an error)
  useEffect(() => {
    const hasErrors = Array.from(diagramErrors.values()).some(error => error)
    setHasCriticalErrors(hasErrors)
  }, [diagramErrors])

  // Process diagrams when switching to markdown tab
  useEffect(() => {
    if (activeTab === 'markdown' && article && !isEditingMarkdown) {
      processDiagramsForMarkdown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, article])


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

      // Load user profile for signature
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, bio, linkedin_handle, twitter_handle, github_handle, website')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Error loading article:', err)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const processDiagramsForMarkdown = async () => {
    if (!article || processingDiagrams) return

    // Check if article has mermaid diagrams
    const hasMermaid = article.content.includes('```mermaid')
    if (!hasMermaid) return

    // Check if already cached
    const cachedDiagrams = article.diagram_images as Record<string, string> | null
    if (cachedDiagrams && Object.keys(cachedDiagrams).length > 0) {
      // Already cached, just use the processed content
      return
    }

    setProcessingDiagrams(true)

    try {
      const response = await fetch(`/api/articles/${article.id}/process-diagrams`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to process diagrams')
      }

      const data = await response.json()

      if (data.success && data.content) {
        setMarkdownContent(data.content)
        // Update article with cached diagrams
        setArticle({ ...article, diagram_images: data.diagrams })
      }
    } catch (err) {
      console.error('Error processing diagrams:', err)
      // Don't show error to user, just use original content
    } finally {
      setProcessingDiagrams(false)
    }
  }

  const handleDownload = async (format: 'md' | 'docx') => {
    if (!article) return

    setDownloading(format)

    // Show info toast with long duration so it doesn't auto-close during download
    toast.showToast(`Preparing ${format.toUpperCase()} download...`, 'info', 30000)

    try {
      const response = await fetch(`/api/articles/${article.id}/download?format=${format}`)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${article.id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Close all current toasts before showing success
      toast.toasts.forEach(t => toast.closeToast(t.id))
      toast.success(`${format.toUpperCase()} file downloaded successfully!`)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download file')
      // Close all current toasts before showing error
      toast.toasts.forEach(t => toast.closeToast(t.id))
      toast.error('Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  const handleCopy = async () => {
    if (!article) return

    try {
      // Copy displayContent which has cached diagram images if available
      await navigator.clipboard.writeText(displayContent || article.content)
      toast.success('Content copied to clipboard!')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Copy error:', err)
      toast.error('Failed to copy content')
      setError('Failed to copy content')
    }
  }

  const handleEditMarkdown = () => {
    if (!article) return
    setEditedContent(article.content)
    setIsEditingMarkdown(true)
    setHasUnsavedChanges(false)
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

      setArticle({ ...article, content: editedContent, rich_text_content: richTextHtml })
      setIsEditingMarkdown(false)
      setHasUnsavedChanges(false)
      setError('')
      toast.success('Changes saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save changes')
      toast.error('Failed to save changes')
    }
  }

  const handleCancelEdit = () => {
    setIsEditingMarkdown(false)
    setEditedContent('')
    setHasUnsavedChanges(false)
  }

  const loadPublications = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('article_publications')
        .select('*')
        .eq('article_id', params.id)

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPublications((data as any) || [])
    } catch (err) {
      console.error('Error loading publications:', err)
    } finally {
      setLoadingPublications(false)
    }
  }

  const handlePublishSuccess = (publishedUrl: string) => {
    setShowPublishModal(false)
    toast.success('Article published to Dev.to successfully!')
    window.open(publishedUrl, '_blank')
    // Reload publications to show the new one
    loadPublications()
  }

  const handleTabChange = (newTab: 'preview' | 'markdown' | 'carousel') => {
    if (hasUnsavedChanges && isEditingMarkdown) {
      setPendingTab(newTab)
      setShowUnsavedModal(true)
      return
    }
    setActiveTab(newTab)
  }

  const confirmTabChange = () => {
    // Reset editing states if user confirms
    setIsEditingMarkdown(false)
    setHasUnsavedChanges(false)
    setEditedContent('')
    if (pendingTab) {
      setActiveTab(pendingTab)
    }
    setShowUnsavedModal(false)
    setPendingTab(null)
  }

  const handleCopyDescription = async () => {
    if (!article?.description) return
    try {
      await navigator.clipboard.writeText(article.description)
      setCopiedDescription(true)
      setTimeout(() => setCopiedDescription(false), 2000)
      toast.success('Description copied!')
    } catch (err) {
      console.error('Copy error:', err)
      toast.error('Failed to copy description')
    }
  }

  const handleCopyTags = async () => {
    if (!article?.tags || article.tags.length === 0) return
    try {
      const tagsText = article.tags.map(tag => `#${tag}`).join(' ')
      await navigator.clipboard.writeText(tagsText)
      setCopiedTags(true)
      setTimeout(() => setCopiedTags(false), 2000)
      toast.success('Tags copied!')
    } catch (err) {
      console.error('Copy error:', err)
      toast.error('Failed to copy tags')
    }
  }

  const handleCopyTldr = async () => {
    if (!article?.tldr) return
    try {
      await navigator.clipboard.writeText(article.tldr)
      setCopiedTldr(true)
      setTimeout(() => setCopiedTldr(false), 2000)
      toast.success('TL;DR copied!')
    } catch (err) {
      console.error('Copy error:', err)
      toast.error('Failed to copy TL;DR')
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

  // Show error if article has critical diagram errors
  if (hasCriticalErrors) {
    return (
      <AuthLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Contains Errors</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  This article contains Mermaid diagrams with syntax errors that prevent it from being displayed correctly.
                  The diagrams need to be corrected before the article can be viewed.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
                  <p className="text-yellow-800 text-sm font-medium mb-2">What you can do:</p>
                  <ul className="text-yellow-700 text-sm text-left list-disc list-inside space-y-1">
                    <li>Generate a new article with the same topic</li>
                    <li>Contact support if this issue persists</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard?action=new')}
                  >
                    Create New Article
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      <ConfirmModal
        isOpen={showUnsavedModal}
        onClose={() => {
          setShowUnsavedModal(false)
          setPendingTab(null)
        }}
        onConfirm={confirmTabChange}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave this tab? Your changes will be lost."
        confirmText="Leave"
        cancelText="Stay"
        variant="warning"
      />
      {showPublishModal && article && (
        <PublishToDevToModal
          article={article}
          onClose={() => setShowPublishModal(false)}
          onSuccess={handlePublishSuccess}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/articles')}>
            ← Back to Articles
          </Button>
        </div>

        {/* Article Metadata Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{article.title}</CardTitle>
                {article.description && (
                  <div className="group flex items-start gap-2 mb-3">
                    <p className="text-gray-600 flex-1">{article.description}</p>
                    <button
                      onClick={handleCopyDescription}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="Copy description"
                    >
                      {copiedDescription ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                {article.tldr && (
                  <div className="group flex items-start gap-2 mb-3">
                    <p className="text-gray-700 flex-1 text-sm">
                      <span className="font-semibold">TL;DR:</span> {article.tldr}
                    </p>
                    <button
                      onClick={handleCopyTldr}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="Copy TL;DR"
                    >
                      {copiedTldr ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                {article.tags && article.tags.length > 0 && (
                  <div className="group flex items-start gap-2 mb-3">
                    <div className="flex flex-wrap gap-2 flex-1">
                      {article.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={handleCopyTags}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="Copy hashtags"
                    >
                      {copiedTags ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Type: {article.article_type || 'technical'}</span>
                  <span>•</span>
                  <span>{article.word_count} words</span>
                  <span>•</span>
                  <span>{format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                  <span>•</span>
                  <StatusBadge status={article.status as 'draft' | 'generated' | 'published' | 'failed'} />

                  {/* Publish to Dev.to Badge */}
                  {!loadingPublications && (
                    <>
                      {publications.some(p => p.platform === 'devto') ? (
                        // Show "Published on Dev.to" badge if already published
                        <a
                          href={publications.find(p => p.platform === 'devto')?.published_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-gray-800 transition-colors"
                          title="View on Dev.to"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
                          </svg>
                          Published on Dev.to
                        </a>
                      ) : (
                        // Show "Publish to Dev.to" button if not published yet
                        <button
                          onClick={() => setShowPublishModal(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                          title="Publish to Dev.to"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
                          </svg>
                          Publish to Dev.to
                        </button>
                      )}
                    </>
                  )}
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
                  onClick={() => handleTabChange('preview')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'preview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Rich Text
                </button>
                {article.article_type !== 'carousel' && (
                  <button
                    onClick={() => handleTabChange('markdown')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'markdown'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Markdown
                  </button>
                )}
                {article.article_type === 'carousel' && (
                  <button
                    onClick={() => handleTabChange('carousel')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'carousel'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Carousel View
                  </button>
                )}
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

                    // Render Mermaid diagrams (only if not replaced by cached images)
                    // If diagram_images exist, mermaid blocks will already be replaced with images
                    if (!inline && language === 'mermaid') {
                      const diagramId = Math.random().toString(36).substring(7)
                      return (
                        <Mermaid
                          chart={code}
                          id={diagramId}
                          onError={(hasError) => handleDiagramError(diagramId, hasError)}
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
                {displayContent}
              </ReactMarkdown>

              {/* Author Signature */}
              {profile && (profile.full_name || profile.bio || profile.linkedin_handle || profile.twitter_handle || profile.github_handle || profile.website) && (
                <div className="mt-12 pt-8 border-t-2 border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">About the Author</h3>

                  {profile.full_name && (
                    <p className="mb-2 text-gray-900 text-base">
                      Written by <strong className="font-semibold">{profile.full_name}</strong>
                    </p>
                  )}

                  {profile.bio && (
                    <p className="mb-4 text-gray-900 leading-relaxed text-base">{profile.bio}</p>
                  )}

                  {(profile.linkedin_handle || profile.twitter_handle || profile.github_handle || profile.website) && (
                    <div className="mt-4">
                      <p className="font-semibold mb-2 text-gray-900 text-base">Connect with me:</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        {profile.linkedin_handle && (
                          <a
                            href={`https://linkedin.com/in/${profile.linkedin_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline text-base"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            {profile.linkedin_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.twitter_handle && (
                          <a
                            href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline text-base"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            @{profile.twitter_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.github_handle && (
                          <a
                            href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline text-base"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            {profile.github_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.website && (
                          <a
                            href={profile.website}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline text-base"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  {processingDiagrams && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing diagrams...
                    </div>
                  )}
                  {isEditingMarkdown ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => {
                        setEditedContent(e.target.value)
                        setHasUnsavedChanges(true)
                      }}
                      className="w-full bg-gray-50 p-6 rounded-lg text-sm font-mono text-gray-900 leading-relaxed border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                      rows={20}
                    />
                  ) : (
                    <pre className="bg-gray-50 p-6 rounded-lg overflow-auto text-sm font-mono text-gray-900 leading-relaxed border border-gray-200 max-h-[600px]">
                      {markdownContent}
                    </pre>
                  )}
                </div>
              )}


              {/* Carousel Tab */}
              {activeTab === 'carousel' && article.article_type === 'carousel' && (
                <div>
                  <CarouselViewer
                    content={article.content}
                    title={article.title}
                    linkedinTeaser={article.linkedin_teaser || undefined}
                    articleId={params.id}
                    cachedDiagrams={(article.diagram_images as Record<string, string>) || {}}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
