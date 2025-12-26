'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'

export default function GuidesPage() {
  const guides = [
    {
      title: 'Getting Started with ArticleFlow',
      description: 'A complete beginner\'s guide to creating your first AI-powered article',
      category: 'Beginner',
      readTime: '5 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Step 1: Create Your Account</h3>
          <p className="text-gray-700 mb-4">
            Sign up for a free account at ArticleFlow. You&apos;ll get one free trial article to test the service.
          </p>

          <h3 className="text-xl font-semibold mb-3">Step 2: Try the Free Trial</h3>
          <p className="text-gray-700 mb-4">
            Use the landing page trial generator to create your first article. Choose from tutorial,
            comparison, or case study types.
          </p>

          <h3 className="text-xl font-semibold mb-3">Step 3: Set Up Your API Keys (Optional)</h3>
          <p className="text-gray-700 mb-4">
            For unlimited generation, add your Claude or Gemini API key in Settings. This allows you to
            use the BYOK model and only pay for AI usage.
          </p>

          <h3 className="text-xl font-semibold mb-3">Step 4: Generate Your First Article</h3>
          <p className="text-gray-700 mb-4">
            Navigate to the Generate page, enter your topic, and click Generate. Your article will be
            ready in seconds!
          </p>
        </>
      ),
    },
    {
      title: 'Crafting Perfect Prompts',
      description: 'Learn how to write effective prompts for high-quality article generation',
      category: 'Intermediate',
      readTime: '7 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Be Specific</h3>
          <p className="text-gray-700 mb-2">Instead of:</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
            <p className="text-gray-800 font-mono text-sm">&quot;Write about React&quot;</p>
          </div>
          <p className="text-gray-700 mb-2">Use:</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-gray-800 font-mono text-sm">
              &quot;Write a comprehensive guide on React Hooks for beginners, covering useState, useEffect,
              and custom hooks with practical examples&quot;
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-3">Include Context</h3>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Target audience (beginners, intermediate, advanced)</li>
            <li>Specific technologies or versions</li>
            <li>Desired length or depth</li>
            <li>Code examples requirements</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Choose the Right Article Type</h3>
          <p className="text-gray-700 mb-4">
            Match your prompt to the article type. Tutorials need step-by-step instructions, while
            comparisons need multiple options to analyze.
          </p>
        </>
      ),
    },
    {
      title: 'Automating Your Content Workflow',
      description: 'Set up automated article generation and publishing with Google Sheets',
      category: 'Advanced',
      readTime: '10 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Prerequisites</h3>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Starter plan or higher</li>
            <li>Google account connected</li>
            <li>API keys configured</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Step 1: Create Your Content Sheet</h3>
          <ol className="list-decimal ml-6 mb-4 text-gray-700">
            <li>Create a new Google Sheet</li>
            <li>Add columns: prompt, article_type, status, article_url</li>
            <li>Fill in your article prompts and types</li>
            <li>Set status to &quot;pending&quot; for articles to generate</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3">Step 2: Connect to ArticleFlow</h3>
          <ol className="list-decimal ml-6 mb-4 text-gray-700">
            <li>Copy the Sheet ID from your Google Sheets URL</li>
            <li>Go to ArticleFlow Settings</li>
            <li>Paste the Sheet ID in the Google Sheets ID field</li>
            <li>Save your settings</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3">Step 3: Run Batch Generation</h3>
          <ol className="list-decimal ml-6 mb-4 text-gray-700">
            <li>Navigate to the Sheets Sync page</li>
            <li>Review pending articles</li>
            <li>Click &quot;Generate All&quot;</li>
            <li>Articles will be generated and sheet updated automatically</li>
          </ol>
        </>
      ),
    },
    {
      title: 'Integrating with Google Docs',
      description: 'Automatically create and edit articles in Google Docs',
      category: 'Intermediate',
      readTime: '6 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Connecting Your Account</h3>
          <ol className="list-decimal ml-6 mb-4 text-gray-700">
            <li>Go to Settings → Integrations</li>
            <li>Click &quot;Connect Google Account&quot;</li>
            <li>Sign in and authorize ArticleFlow</li>
            <li>You&apos;ll be redirected back to Settings</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3">Auto-Creating Docs</h3>
          <p className="text-gray-700 mb-4">
            When generating articles, toggle &quot;Create Google Doc&quot; to automatically create a
            formatted Google Doc with your article content.
          </p>

          <h3 className="text-xl font-semibold mb-3">Benefits</h3>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Edit with Google Docs&apos; familiar interface</li>
            <li>Share with team members for review</li>
            <li>Use version history to track changes</li>
            <li>Export to different formats (PDF, DOCX, etc.)</li>
          </ul>
        </>
      ),
    },
    {
      title: 'Understanding Article Types',
      description: 'Choose the right article type for your content goals',
      category: 'Beginner',
      readTime: '5 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Technical Article</h3>
          <p className="text-gray-700 mb-4">
            <strong>Best for:</strong> Deep dives into technologies, architecture discussions,
            advanced concepts
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Features:</strong> Code examples, diagrams, detailed explanations
          </p>

          <h3 className="text-xl font-semibold mb-3">Tutorial / How-To</h3>
          <p className="text-gray-700 mb-4">
            <strong>Best for:</strong> Teaching specific skills, step-by-step guides
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Features:</strong> Numbered steps, code snippets, screenshots
          </p>

          <h3 className="text-xl font-semibold mb-3">Comparison / Review</h3>
          <p className="text-gray-700 mb-4">
            <strong>Best for:</strong> Evaluating tools, comparing frameworks
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Features:</strong> Comparison tables, pros/cons lists
          </p>

          <h3 className="text-xl font-semibold mb-3">Case Study</h3>
          <p className="text-gray-700 mb-4">
            <strong>Best for:</strong> Real-world implementation stories
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Features:</strong> Problem statement, solution, results
          </p>

          <h3 className="text-xl font-semibold mb-3">LinkedIn Carousel</h3>
          <p className="text-gray-700 mb-4">
            <strong>Best for:</strong> Social media engagement, quick tips
          </p>
          <p className="text-gray-700 mb-4">
            <strong>Features:</strong> 4-5 slides, visual-focused, bite-sized content
          </p>
        </>
      ),
    },
    {
      title: 'API Key Management',
      description: 'Best practices for managing your AI provider API keys',
      category: 'Beginner',
      readTime: '4 min',
      content: (
        <>
          <h3 className="text-xl font-semibold mb-3">Security Best Practices</h3>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Never share your API keys publicly</li>
            <li>Rotate keys periodically</li>
            <li>Set usage limits in your AI provider console</li>
            <li>Monitor your usage regularly</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Cost Optimization</h3>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Use Gemini for cost-effective generation</li>
            <li>Use Claude for higher quality articles</li>
            <li>Set reasonable word count limits</li>
            <li>Review generated content before bulk operations</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">Troubleshooting</h3>
          <p className="text-gray-700 mb-2">
            <strong>Invalid API Key Error:</strong>
          </p>
          <ul className="list-disc ml-6 mb-4 text-gray-700">
            <li>Verify the key is copied correctly</li>
            <li>Check if the key is still active in your AI provider console</li>
            <li>Ensure you have credits/billing set up</li>
          </ul>
        </>
      ),
    },
  ]

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

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Guides</h1>
          <p className="text-xl text-gray-600">
            Step-by-step guides to help you master ArticleFlow
          </p>
        </div>

        {/* Guides Grid */}
        <div className="space-y-6">
          {guides.map((guide, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-2xl">{guide.title}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    guide.category === 'Beginner' ? 'bg-green-100 text-green-800' :
                    guide.category === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {guide.category}
                  </span>
                </div>
                <CardDescription>
                  {guide.description} · {guide.readTime} read
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none">
                {guide.content}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Start?</h3>
            <p className="text-gray-700 mb-4">
              Put these guides into practice and create amazing content
            </p>
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
