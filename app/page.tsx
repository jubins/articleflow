'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function LandingPage() {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string
    content: string
  } | null>(null)
  const [error, setError] = useState('')
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  const handleGenerateTrial = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/trial/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate article')
      }

      const data = await response.json()
      setGeneratedArticle(data)
      setShowSignupPrompt(true)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate article')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ArticleFlow" width={32} height={32} className="h-8 w-8" />
              <span className="text-2xl font-bold text-blue-600">ArticleFlow</span>
            </div>
            <div className="flex gap-4">
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Generate High-Quality Articles with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create technical blog posts for Medium, Dev.to, and more using Claude and Gemini AI.
            Bring your own API key or purchase credits.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">View Pricing</Button>
            </Link>
          </div>
        </div>

        {/* Free Trial Generator */}
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Try It Free - No Sign Up Required
              </h2>
              <p className="text-gray-600">
                Generate one full article to see the power of ArticleFlow
              </p>
            </div>

            {!generatedArticle ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to write about?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Write a comprehensive guide on implementing authentication in Next.js 14 using Supabase..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    disabled={generating}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerateTrial}
                  disabled={generating}
                  loading={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? 'Generating Your Article...' : 'Generate Free Article'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  This will use our API credits. Sign up to use your own API key.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Generated Article Preview */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-auto">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {generatedArticle.title}
                  </h3>
                  <article className="prose prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {generatedArticle.content.slice(0, 1000) + '...'}
                    </ReactMarkdown>
                  </article>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-900 font-medium mb-2">
                      📄 Article generated successfully!
                    </p>
                    <p className="text-blue-700 text-sm">
                      Preview showing first 1000 characters. Sign up to download the full article.
                    </p>
                  </div>
                </div>

                {showSignupPrompt && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
                    <CardContent className="p-6 text-center">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        🎉 Your Article is Ready!
                      </h4>
                      <p className="text-gray-700 mb-4">
                        Sign up now to download the full article and generate unlimited articles with your own API key
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Link href="/signup">
                          <Button size="lg">Sign Up to Download</Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setGeneratedArticle(null)
                            setPrompt('')
                            setShowSignupPrompt(false)
                          }}
                        >
                          Generate Another
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Automate Content
            </h2>
            <p className="text-xl text-gray-600">
              From generation to publishing, all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Generation</h3>
                <p className="text-gray-600">
                  Use Claude or Gemini to generate high-quality technical articles with your own API keys
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Scheduled Publishing</h3>
                <p className="text-gray-600">
                  Auto-post to LinkedIn, Dev.to, Medium and more on a schedule
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Multiple Formats</h3>
                <p className="text-gray-600">
                  Download as Markdown, DOCX, or export directly to Google Docs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Google Sheets Integration</h3>
                <p className="text-gray-600">
                  Batch generate articles from prompts in your Google Sheets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-gray-600">
                  Share workspaces and collaborate with your team on content
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">BYOK (Bring Your Own Key)</h3>
                <p className="text-gray-600">
                  Use your own API keys so you only pay for what you use
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Automate Your Content?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join creators already using ArticleFlow to generate and publish articles
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="ghost" className="text-white border-white hover:bg-blue-500">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo-white.svg" alt="ArticleFlow" width={32} height={32} className="h-8 w-8" />
                <span className="text-xl font-bold text-white">ArticleFlow</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered article generation and publishing automation
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Guides</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 ArticleFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
