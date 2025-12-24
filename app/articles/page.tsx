'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Article } from '@/lib/types/database'
import { format } from 'date-fns'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'generated' | 'draft' | 'failed'>('all')

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: articlesData, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setArticles((articlesData || []) as Article[])
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (articleId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    setDeleting(articleId)
    try {
      const response = await fetch(`/api/articles/${articleId}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete article')
      }

      setArticles(articles.filter(a => a.id !== articleId))
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(a => a.status === filter)

  if (loading) {
    return (
      <AuthLayout>
        <LoadingSpinner size="lg" className="mt-20" />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Articles</h1>
            <p className="text-gray-600 mt-1">{filteredArticles.length} total articles</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/generate">
              <Button>Generate Article</Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                All Articles
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {articles.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('generated')}
                className={`${
                  filter === 'generated'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Generated
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {articles.filter(a => a.status === 'generated').length}
                </span>
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`${
                  filter === 'draft'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Drafts
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {articles.filter(a => a.status === 'draft').length}
                </span>
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`${
                  filter === 'failed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Failed
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {articles.filter(a => a.status === 'failed').length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Articles List */}
        <Card>
          <CardContent className="p-0">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter !== 'all'
                    ? `No ${filter} articles yet.`
                    : 'Get started by generating your first article.'}
                </p>
                {filter === 'all' && (
                  <div className="mt-6">
                    <Link href="/generate">
                      <Button>Generate Article</Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                            {article.title}
                          </div>
                          {article.word_count && (
                            <div className="text-sm text-gray-500">{article.word_count} words</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={article.status as 'draft' | 'generated' | 'published' | 'failed'} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {article.ai_provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(article.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {article.status !== 'failed' && (
                              <Link
                                href={`/articles/${article.id}`}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                View
                              </Link>
                            )}
                            {article.google_doc_url && (
                              <a
                                href={article.google_doc_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-900 transition-colors"
                              >
                                Doc
                              </a>
                            )}
                            <button
                              onClick={(e) => handleDelete(article.id, e)}
                              disabled={deleting === article.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Delete article"
                            >
                              {deleting === article.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
