'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Article } from '@/lib/types/database'

interface PublishToDevToModalProps {
  article: Article
  onClose: () => void
  onSuccess: (publishedUrl: string) => void
}

export function PublishToDevToModal({ article, onClose, onSuccess }: PublishToDevToModalProps) {
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')

  const handlePublish = async () => {
    setPublishing(true)
    setError('')

    try {
      const response = await fetch(`/api/articles/${article.id}/publish/devto`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish article')
      }

      onSuccess(data.published_url)
    } catch (err) {
      console.error('Publish error:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish article')
      setPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Publish to Dev.to</h2>
              <p className="text-sm text-gray-600">Your article will be published as a draft</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={publishing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Article Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Article Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Title:</span>
                <p className="font-medium text-gray-900 mt-1">{article.title}</p>
              </div>
              {article.description && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="text-gray-700 mt-1">{article.description}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {article.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 4 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{article.tags.length - 4} more (Dev.to allows max 4 tags)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Word Count:</span>
                <p className="text-gray-700 mt-1">{article.word_count?.toLocaleString() || 'N/A'} words</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Before you publish:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Article will be published as a <strong>draft</strong> on Dev.to</li>
                  <li>You can review and edit it before making it public</li>
                  <li>Your profile signature will be automatically added</li>
                  <li>Only the first 4 tags will be included (Dev.to limit)</li>
                  <li>This action cannot be undone (article will remain on Dev.to)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-900">
                  <p className="font-semibold mb-1">Error</p>
                  <p>{error}</p>
                  {error.includes('API key not configured') && (
                    <p className="mt-2">
                      <a href="/publishing" className="text-red-700 underline hover:text-red-800">
                        Go to Publishing settings to add your Dev.to API key
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            loading={publishing}
            disabled={publishing}
            className="bg-black hover:bg-gray-800"
          >
            {publishing ? 'Publishing...' : 'Publish to Dev.to'}
          </Button>
        </div>
      </div>
    </div>
  )
}
