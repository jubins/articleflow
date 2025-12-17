'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export default function GeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<any>(null)

  const [formData, setFormData] = useState({
    topic: '',
    prompt: '',
    wordCount: 2000,
    platform: 'all' as 'medium' | 'devto' | 'dzone' | 'all',
    aiProvider: 'claude' as 'claude' | 'gemini',
    fileId: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSuccess(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate article')
      }

      setSuccess(data)

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Article Generated Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                Your article "{success.article.title}" has been generated.
              </p>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-600">
                  Word Count: <span className="font-semibold">{success.article.word_count}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Generation Time: <span className="font-semibold">{(success.metadata.generation_time_ms / 1000).toFixed(2)}s</span>
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                {success.article.google_doc_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(success.article.google_doc_url, '_blank')}
                  >
                    Open Google Doc
                  </Button>
                )}
                <Button onClick={() => router.push('/dashboard')}>
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Generate Article</h1>
          <p className="text-gray-600 mt-1">Create a new technical article with AI</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
            <CardDescription>
              Fill in the details below to generate your article
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Input
                label="Topic / Title"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Getting Started with React Hooks"
                required
                helperText="The main topic or title for your article"
              />

              <TextArea
                label="Prompt / Instructions"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="Provide detailed instructions for the article..."
                required
                rows={6}
                helperText="Detailed instructions on what the article should cover"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Platforms</option>
                    <option value="medium">Medium</option>
                    <option value="devto">Dev.to</option>
                    <option value="dzone">DZone</option>
                  </select>
                </div>

                <Input
                  label="Word Count"
                  type="number"
                  value={formData.wordCount}
                  onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) })}
                  min={500}
                  max={5000}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Provider
                </label>
                <select
                  value={formData.aiProvider}
                  onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Gemini (Google)</option>
                </select>
              </div>

              <Input
                label="File ID (Optional)"
                value={formData.fileId}
                onChange={(e) => setFormData({ ...formData, fileId: e.target.value })}
                placeholder="Custom file ID for naming output files"
                helperText="Leave empty to use auto-generated ID"
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  Generate Article
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
