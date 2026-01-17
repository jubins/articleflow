'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface GenerateSuccess {
  article: {
    title: string
    word_count: number
    google_doc_url?: string
  }
  metadata: {
    generation_time_ms: number
  }
}

const ARTICLE_TYPES = [
  {
    value: 'technical',
    label: 'Technical Article',
    description: 'In-depth technical content with code examples, architecture diagrams, and detailed explanations',
  },
  {
    value: 'tutorial',
    label: 'Tutorial / How-To',
    description: 'Step-by-step guide to accomplish a specific task or learn a technology',
  },
  {
    value: 'comparison',
    label: 'Comparison / Review',
    description: 'Compare tools, frameworks, or approaches with detailed analysis tables',
  },
  {
    value: 'best-practices',
    label: 'Best Practices',
    description: 'Industry best practices and recommendations for developers',
  },
  {
    value: 'case-study',
    label: 'Case Study',
    description: 'Real-world implementation story with architecture and results',
  },
  {
    value: 'carousel',
    label: 'LinkedIn Carousel',
    description: 'Engaging 4-10 slide carousel starting with basics and ending with advanced insights',
  },
]

export default function GeneratePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<GenerateSuccess | null>(null)

  const [formData, setFormData] = useState({
    topic: '',
    articleType: 'technical' as string,
    aiProvider: 'gemini' as 'claude' | 'gemini',
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

      // Redirect to the generated article after 2 seconds
      setTimeout(() => {
        router.push(`/articles/${data.article.id}`)
      }, 2000)
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
          <Card className="shadow-lg">
            <CardContent className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Article Generated Successfully!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Your article &quot;{success.article.title}&quot; has been generated.
              </p>
              <div className="space-y-3 mb-8 bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Word Count:</span> {success.article.word_count}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Generation Time:</span> {(success.metadata.generation_time_ms / 1000).toFixed(2)}s
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
                <Button onClick={() => router.push(`/articles/${success.article.id}`)} className="px-8">
                  View Article
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  const selectedType = ARTICLE_TYPES.find(t => t.value === formData.articleType)

  return (
    <AuthLayout>
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Generate Article</h1>
          <p className="text-gray-600 mt-2 text-lg">Create high-quality technical content with AI in seconds</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Article Details</CardTitle>
            <CardDescription className="text-base">
              Choose your topic and article type - we&apos;ll handle the rest
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
                label="Article Topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Getting Started with React Hooks, Docker Best Practices, GraphQL vs REST"
                required
                helperText="Enter the main topic or title for your article"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Type
                </label>
                <select
                  value={formData.articleType}
                  onChange={(e) => setFormData({ ...formData, articleType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ARTICLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={formData.aiProvider}
                  onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value as 'claude' | 'gemini' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gemini">Gemini 3 Flash Preview (Google)</option>
                  <option value="claude">Claude 4.5 Sonnet (Anthropic)</option>
                </select>
              </div>

              {selectedType && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                  <div className="flex items-start space-x-3">
                    <svg className="h-6 w-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-green-900 mb-2">What you&apos;ll get:</h4>
                      <ul className="space-y-1.5 text-sm text-green-800">
                        {formData.articleType === 'technical' && (
                          <>
                            <li>• Architecture diagrams with Mermaid</li>
                            <li>• Code examples with syntax highlighting</li>
                            <li>• Comparison tables</li>
                            <li>• Technical deep-dive content (~2000 words)</li>
                          </>
                        )}
                        {formData.articleType === 'tutorial' && (
                          <>
                            <li>• Step-by-step instructions</li>
                            <li>• Code snippets for each step</li>
                            <li>• Diagrams showing the workflow</li>
                            <li>• Prerequisites and setup guide</li>
                          </>
                        )}
                        {formData.articleType === 'comparison' && (
                          <>
                            <li>• Detailed comparison tables</li>
                            <li>• Pros and cons analysis</li>
                            <li>• Use case recommendations</li>
                            <li>• Performance and feature comparisons</li>
                          </>
                        )}
                        {formData.articleType === 'best-practices' && (
                          <>
                            <li>• Industry-standard recommendations</li>
                            <li>• Code examples of good vs bad practices</li>
                            <li>• Common pitfalls to avoid</li>
                            <li>• Real-world implementation tips</li>
                          </>
                        )}
                        {formData.articleType === 'case-study' && (
                          <>
                            <li>• System architecture diagrams</li>
                            <li>• Implementation details with code</li>
                            <li>• Performance metrics and results</li>
                            <li>• Lessons learned and takeaways</li>
                          </>
                        )}
                        {formData.articleType === 'carousel' && (
                          <>
                            <li>• 4-5 engaging slides with visual diagrams</li>
                            <li>• Progressive learning from basic to advanced</li>
                            <li>• Mermaid diagrams or text-based slides</li>
                            <li>• Ends with enlightening insights or key takeaways</li>
                            <li>• Perfect for LinkedIn engagement</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
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
                  className="px-8"
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
