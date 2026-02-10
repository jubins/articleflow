'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Article } from '@/lib/types/database'
import { format } from 'date-fns'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'generated' | 'draft' | 'failed'>('all')
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  const handleBulkDelete = async () => {
    if (selectedArticles.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedArticles.size} article(s)? This action cannot be undone.`)) {
      return
    }

    setBulkDeleting(true)
    try {
      // Delete all selected articles in parallel
      await Promise.all(
        Array.from(selectedArticles).map(articleId =>
          fetch(`/api/articles/${articleId}/delete`, {
            method: 'DELETE',
          })
        )
      )

      // Remove deleted articles from state
      setArticles(articles.filter(a => !selectedArticles.has(a.id)))
      setSelectedArticles(new Set())
    } catch (error) {
      console.error('Error deleting articles:', error)
      alert('Failed to delete some articles. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelectArticle = (articleId: string) => {
    const newSelected = new Set(selectedArticles)
    if (newSelected.has(articleId)) {
      newSelected.delete(articleId)
    } else {
      newSelected.add(articleId)
    }
    setSelectedArticles(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(filteredArticles.map(a => a.id)))
    }
  }

  const filteredArticles = filter === 'all'
    ? articles
    : articles.filter(a => a.status === filter)

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: 'all' | 'generated' | 'draft' | 'failed') => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Articles</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {filteredArticles.length} total articles
              {selectedArticles.size > 0 && ` • ${selectedArticles.size} selected`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {selectedArticles.size > 0 && (
              <Button
                variant="outline"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm sm:text-base"
              >
                {bulkDeleting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Deleting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Delete {selectedArticles.size} {selectedArticles.size === 1 ? 'Article' : 'Articles'}</span>
                    <span className="sm:hidden">Delete ({selectedArticles.size})</span>
                  </>
                )}
              </Button>
            )}
            <Link href="/dashboard" className="flex-shrink-0">
              <Button variant="outline" className="text-sm sm:text-base">
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </Button>
            </Link>
            <Link href="/generate" className="flex-shrink-0">
              <Button className="text-sm sm:text-base">
                <span className="hidden sm:inline">Generate Article</span>
                <span className="sm:hidden">Generate</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 -mx-4 sm:mx-0">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-0 min-w-max">
              <button
                onClick={() => handleFilterChange('all')}
                className={`${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <span>All Articles</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {articles.length}
                </span>
              </button>
              <button
                onClick={() => handleFilterChange('generated')}
                className={`${
                  filter === 'generated'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <span>Generated</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {articles.filter(a => a.status === 'generated').length}
                </span>
              </button>
              <button
                onClick={() => handleFilterChange('draft')}
                className={`${
                  filter === 'draft'
                    ? 'border-gray-500 text-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <span>Drafts</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {articles.filter(a => a.status === 'draft').length}
                </span>
              </button>
              <button
                onClick={() => handleFilterChange('failed')}
                className={`${
                  filter === 'failed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <span>Failed</span>
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {articles.filter(a => a.status === 'failed').length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredArticles.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-gray-600">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 sm:px-3 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs sm:text-sm text-gray-600">items</span>
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>

                <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    if (!showPage) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 sm:px-3 py-1 text-gray-500 text-xs sm:text-sm">
                            ...
                          </span>
                        )
                      }
                      return null
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}

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
              <>
                {/* Desktop Table View - hidden on mobile */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedArticles.size === filteredArticles.length && filteredArticles.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
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
                      {paginatedArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedArticles.has(article.id)}
                              onChange={() => toggleSelectArticle(article.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-6 py-4">
                            {article.status !== 'failed' ? (
                              <Link
                                href={`/articles/${article.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 max-w-md truncate block hover:underline"
                              >
                                {article.title}
                              </Link>
                            ) : (
                              <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                                {article.title}
                              </div>
                            )}
                            {article.word_count && (
                              <div className="text-sm text-gray-500">{article.word_count} words</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {article.article_type || 'technical'}
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
                            <div className="flex items-center gap-2">
                              {article.google_doc_url && (
                                <a
                                  href={article.google_doc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                                  title="Open in Google Docs"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              )}
                              <button
                                onClick={(e) => handleDelete(article.id, e)}
                                disabled={deleting === article.id}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Delete article"
                              >
                                {deleting === article.id ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - visible only on mobile */}
                <div className="lg:hidden divide-y divide-gray-200">
                  {/* Select All Card */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedArticles.size === filteredArticles.length && filteredArticles.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Select All</span>
                    </div>
                  </div>

                  {/* Article Cards */}
                  {paginatedArticles.map((article) => (
                    <div key={article.id} className="bg-white p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedArticles.has(article.id)}
                          onChange={() => toggleSelectArticle(article.id)}
                          className="w-4 h-4 mt-1 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <div className="mb-2">
                            {article.status !== 'failed' ? (
                              <Link
                                href={`/articles/${article.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2"
                              >
                                {article.title}
                              </Link>
                            ) : (
                              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                {article.title}
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            <div>
                              <span className="text-gray-500">Type:</span>{' '}
                              <span className="text-gray-900 capitalize">{article.article_type || 'technical'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">AI:</span>{' '}
                              <span className="text-gray-900 capitalize">{article.ai_provider}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Words:</span>{' '}
                              <span className="text-gray-900">{article.word_count || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Created:</span>{' '}
                              <span className="text-gray-900">{format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center justify-between">
                            <StatusBadge status={article.status as 'draft' | 'generated' | 'published' | 'failed'} />
                            <div className="flex items-center gap-2">
                              {article.google_doc_url && (
                                <a
                                  href={article.google_doc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                                  title="Open in Google Docs"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              )}
                              <button
                                onClick={(e) => handleDelete(article.id, e)}
                                disabled={deleting === article.id}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Delete article"
                              >
                                {deleting === article.id ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {!loading && filteredArticles.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{Math.min(endIndex, filteredArticles.length)}</span> of{' '}
            <span className="font-medium">{filteredArticles.length}</span> results
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
