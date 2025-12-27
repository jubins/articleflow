'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ArticleFlow" width={32} height={32} className="h-8 w-8" />
              <span className="text-2xl font-bold text-blue-600">ArticleFlow</span>
            </Link>
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

      {/* Documentation Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-xl text-gray-600">
            Learn how to use ArticleFlow to generate and publish AI-powered articles
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <a href="#getting-started" className="text-blue-600 hover:underline">Getting Started</a>
              <a href="#api-keys" className="text-blue-600 hover:underline">Setting Up API Keys</a>
              <a href="#generating" className="text-blue-600 hover:underline">Generating Articles</a>
              <a href="#article-types" className="text-blue-600 hover:underline">Article Types</a>
              <a href="#google-docs" className="text-blue-600 hover:underline">Google Docs Integration</a>
              <a href="#google-sheets" className="text-blue-600 hover:underline">Google Sheets Integration</a>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <div id="getting-started">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Getting Started</CardTitle>
            </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3">1. Sign Up</h3>
            <p className="text-gray-700 mb-4">
              Create your free account at ArticleFlow. No credit card required for the free tier.
            </p>

            <h3 className="text-xl font-semibold mb-3">2. Choose Your Plan</h3>
            <p className="text-gray-700 mb-4">
              Start with our free tier to try out the service, or upgrade to access automation features
              and scheduling.
            </p>

            <h3 className="text-xl font-semibold mb-3">3. Configure API Keys (Optional)</h3>
            <p className="text-gray-700 mb-4">
              For unlimited generation with BYOK (Bring Your Own Key), add your Claude or Gemini API key
              in Settings. Free tier users can use our platform API keys with usage limits.
            </p>
          </CardContent>
          </Card>
        </div>

        {/* API Keys */}
        <div id="api-keys">
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Setting Up API Keys</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3">Claude (Anthropic) API Key</h3>
            <ol className="list-decimal ml-6 mb-4 text-gray-700">
              <li>Visit <a href="https://console.anthropic.com/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></li>
              <li>Sign up or log in to your account</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key</li>
              <li>Copy the key and paste it in ArticleFlow Settings</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">Gemini (Google AI) API Key</h3>
            <ol className="list-decimal ml-6 mb-4 text-gray-700">
              <li>Visit <a href="https://makersuite.google.com/app/apikey" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
              <li>Sign in with your Google account</li>
              <li>Click &quot;Get API Key&quot;</li>
              <li>Create or select a project</li>
              <li>Copy the key and paste it in ArticleFlow Settings</li>
            </ol>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900 font-medium">💡 Pro Tip</p>
              <p className="text-blue-800 text-sm mt-2">
                Keep your API keys secure and never share them. You can revoke and regenerate them at any time.
              </p>
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Generating Articles */}
        <div id="generating">
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Generating Articles</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3">Quick Generate</h3>
            <ol className="list-decimal ml-6 mb-4 text-gray-700">
              <li>Navigate to the Generate page from your dashboard</li>
              <li>Choose your article type (Tutorial, Comparison, Case Study, etc.)</li>
              <li>Select your preferred AI provider (Claude or Gemini)</li>
              <li>Enter your topic or prompt</li>
              <li>Click &quot;Generate Article&quot;</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">Best Practices for Prompts</h3>
            <ul className="list-disc ml-6 mb-4 text-gray-700">
              <li>Be specific about the topic you want to cover</li>
              <li>Include target audience if relevant (e.g., &quot;for beginners&quot;)</li>
              <li>Mention specific technologies or frameworks</li>
              <li>Specify if you want code examples or diagrams</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">Example Prompts</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-800 font-mono text-sm">
                &quot;Write a comprehensive tutorial on building a REST API with Node.js and Express for beginners,
                including authentication with JWT&quot;
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-gray-800 font-mono text-sm">
                &quot;Create a comparison article between React and Vue.js, focusing on performance,
                learning curve, and ecosystem&quot;
              </p>
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Article Types */}
        <div id="article-types">
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Article Types</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Technical Article</h3>
                <p className="text-gray-700">
                  In-depth technical content with code examples, architecture diagrams, and detailed explanations
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tutorial / How-To</h3>
                <p className="text-gray-700">
                  Step-by-step guide to accomplish a specific task or learn a technology
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comparison / Review</h3>
                <p className="text-gray-700">
                  Compare tools, frameworks, or approaches with detailed analysis tables
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Best Practices</h3>
                <p className="text-gray-700">
                  Industry best practices and recommendations for developers
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">Case Study</h3>
                <p className="text-gray-700">
                  Real-world implementation story with architecture and results
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">LinkedIn Carousel</h3>
                <p className="text-gray-700">
                  Engaging 4-10 slide carousel starting with basics and ending with advanced insights
                </p>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Google Docs Integration */}
        <div id="google-docs">
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Google Docs Integration</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3">Connecting Google Docs</h3>
            <ol className="list-decimal ml-6 mb-4 text-gray-700">
              <li>Go to Settings → Integrations</li>
              <li>Click &quot;Connect Google Account&quot;</li>
              <li>Authorize ArticleFlow to access your Google Drive</li>
              <li>Toggle &quot;Auto-create Google Doc&quot; when generating articles</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">Benefits</h3>
            <ul className="list-disc ml-6 mb-4 text-gray-700">
              <li>Automatically create Google Docs from generated articles</li>
              <li>Edit articles in Google Docs with full formatting</li>
              <li>Share with team members for collaboration</li>
              <li>Use Google Docs&apos; powerful editing features</li>
            </ul>
          </CardContent>
          </Card>
        </div>

        {/* Google Sheets Integration */}
        <div id="google-sheets">
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Google Sheets Integration</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-3">Batch Generation with Sheets</h3>
            <ol className="list-decimal ml-6 mb-4 text-gray-700">
              <li>Connect your Google account in Settings</li>
              <li>Create a Google Sheet with article prompts</li>
              <li>Copy the Sheet ID from the URL</li>
              <li>Paste it in Settings → Google Sheets ID</li>
              <li>Use the Sheets Sync feature to batch generate articles</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">Sheet Format</h3>
            <p className="text-gray-700 mb-2">Your sheet should have these columns:</p>
            <ul className="list-disc ml-6 mb-4 text-gray-700">
              <li><strong>prompt</strong>: The article topic/prompt</li>
              <li><strong>article_type</strong>: tutorial, comparison, case-study, etc.</li>
              <li><strong>status</strong>: pending, generated, published</li>
              <li><strong>article_url</strong>: Generated article URL (auto-filled)</li>
            </ul>
          </CardContent>
          </Card>
        </div>

        {/* Need Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-700 mb-4">
              Can&apos;t find what you&apos;re looking for? Check out our guides or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/guides">
                <Button variant="outline">View Guides</Button>
              </Link>
              <a href="mailto:support@articleflow.xyz">
                <Button>Contact Support</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
