'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settings, setSettings] = useState({
    anthropic_api_key: '',
    google_ai_api_key: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedData = data as any
        setSettings({
          anthropic_api_key: typedData.anthropic_api_key || '',
          google_ai_api_key: typedData.google_ai_api_key || '',
        })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAPIKeys = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_settings')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase type inference issue
        .update({
          anthropic_api_key: settings.anthropic_api_key,
          google_ai_api_key: settings.google_ai_api_key,
        })
        .eq('user_id', user.id)

      if (error) throw error

      setSuccess('API keys saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving API keys:', err)
      setError(err instanceof Error ? err.message : 'Failed to save API keys')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">AI Settings</h1>
          <p className="text-gray-600 mt-2 text-lg">Configure your AI provider API keys to start generating articles</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* AI API Keys */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">AI Provider API Keys</CardTitle>
            <CardDescription className="text-base">
              Add your AI provider API keys to generate articles with Claude or Gemini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAPIKeys} className="space-y-6">
              <div>
                <PasswordInput
                  id="anthropic_api_key"
                  label="Claude API Key (Anthropic)"
                  value={settings.anthropic_api_key}
                  onChange={(value) => setSettings({ ...settings, anthropic_api_key: value })}
                  placeholder="sk-ant-..."
                />
                <p className="mt-2 text-sm text-gray-600">
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Claude Console
                  </a>
                </p>
              </div>

              <div>
                <PasswordInput
                  id="google_ai_api_key"
                  label="Gemini API Key (Google AI)"
                  value={settings.google_ai_api_key}
                  onChange={(value) => setSettings({ ...settings, google_ai_api_key: value })}
                  placeholder="AIza..."
                />
                <p className="mt-2 text-sm text-gray-600">
                  Get your API key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-base font-semibold text-blue-900 mb-2">Why are API keys needed?</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      ArticleFlow uses your own API keys to generate articles. This ensures:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        You only pay for what you use
                      </li>
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Your usage stays within your own API limits
                      </li>
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Full control over your AI provider choice
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving} disabled={saving} className="px-8 py-2.5">
                  Save API Keys
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
