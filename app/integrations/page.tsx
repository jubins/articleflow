'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  const [settings, setSettings] = useState({
    anthropic_api_key: '',
    google_ai_api_key: '',
    google_connected: false,
    google_connected_at: null as string | null,
  })

  useEffect(() => {
    loadSettings()

    // Check for OAuth callback messages
    if (searchParams.get('google_connected') === 'true') {
      setSuccess('Google account connected successfully!')
      // Remove query params
      router.replace('/integrations')
    } else if (searchParams.get('error')) {
      setError(`Failed to connect Google: ${searchParams.get('error')}`)
    }
  }, [searchParams, router])

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
          google_connected: typedData.google_connected || false,
          google_connected_at: typedData.google_connected_at,
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

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    setError('')

    try {
      const response = await fetch('/api/integrations/google/auth')
      const data = await response.json()

      if (!response.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to get OAuth URL')
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Google')
      setConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account?')) {
      return
    }

    try {
      const response = await fetch('/api/integrations/google/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect')
      }

      setSettings({ ...settings, google_connected: false, google_connected_at: null })
      setSuccess('Google account disconnected successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Google')
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect your accounts and configure API keys</p>
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

        {/* Google Integration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Google Account</CardTitle>
            <CardDescription>
              Connect your Google account to read Google Sheets and create Google Docs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settings.google_connected ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Connected</p>
                    {settings.google_connected_at && (
                      <p className="text-sm text-gray-500">
                        Connected on {new Date(settings.google_connected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Your Google account is connected. You can now read Google Sheets and create Google Docs.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect your Google account to enable:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Reading prompts from Google Sheets</li>
                  <li>Creating formatted Google Docs for your articles</li>
                  <li>Automatic file management in your Google Drive</li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {settings.google_connected ? (
              <Button
                variant="outline"
                onClick={handleDisconnectGoogle}
              >
                Disconnect Google
              </Button>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                loading={connectingGoogle}
                disabled={connectingGoogle}
              >
                Connect Google Account
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* AI API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>AI Provider API Keys</CardTitle>
            <CardDescription>
              Add your AI provider API keys to generate articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAPIKeys} className="space-y-4">
              <PasswordInput
                id="anthropic_api_key"
                label="Claude API Key (Anthropic)"
                value={settings.anthropic_api_key}
                onChange={(value) => setSettings({ ...settings, anthropic_api_key: value })}
                placeholder="sk-ant-..."
                helperText="Get your API key from https://console.anthropic.com"
              />

              <PasswordInput
                id="google_ai_api_key"
                label="Gemini API Key (Google AI)"
                value={settings.google_ai_api_key}
                onChange={(value) => setSettings({ ...settings, google_ai_api_key: value })}
                placeholder="AIza..."
                helperText="Get your API key from https://makersuite.google.com/app/apikey"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Why are API keys needed?</h4>
                <p className="text-sm text-blue-700">
                  ContentForge uses your own API keys to generate articles. This ensures:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>You only pay for what you use</li>
                  <li>Your usage stays within your own API limits</li>
                  <li>Full control over your AI provider</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={saving} disabled={saving}>
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
