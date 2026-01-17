'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'

export default function PublishingPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [devtoApiKey, setDevtoApiKey] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)

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
        .select('devto_api_key')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedData = data as any
        setDevtoApiKey(typedData.devto_api_key || '')
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const testDevToConnection = async () => {
    if (!devtoApiKey) {
      toast.error('Please enter a Dev.to API key first')
      return
    }

    setTestingConnection(true)
    try {
      const response = await fetch('/api/publishing/test-devto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: devtoApiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid API key or connection failed')
      }

      toast.success(data.message)
    } catch (err) {
      console.error('Connection test error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to connect to Dev.to')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
          devto_api_key: devtoApiKey || null,
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Publishing settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
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
      <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Publishing</h1>
          <p className="text-gray-600 mt-2 text-lg">Configure integrations to publish your articles to external platforms</p>
        </div>

        {/* Dev.to Integration */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-2xl">Dev.to</CardTitle>
                <CardDescription className="text-base">
                  Publish articles as drafts to your Dev.to account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <PasswordInput
                  id="devto_api_key"
                  label="Dev.to API Key"
                  value={devtoApiKey}
                  onChange={(value) => setDevtoApiKey(value)}
                  placeholder="Enter your Dev.to API key"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Get your API key from{' '}
                  <a
                    href="https://dev.to/settings/extensions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Dev.to Settings → Extensions
                  </a>
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <svg className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-base font-semibold text-blue-900 mb-2">How Dev.to Publishing Works</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Articles are published as <strong>drafts</strong> — you review and publish them manually on Dev.to
                      </li>
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Your profile signature is automatically added to the end of each article
                      </li>
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Tags and cover images are included (Dev.to supports up to 4 tags)
                      </li>
                      <li className="flex items-start text-sm text-blue-800">
                        <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        We track where your articles are published to prevent duplicates
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testDevToConnection}
                  loading={testingConnection}
                  disabled={!devtoApiKey || testingConnection}
                >
                  Test Connection
                </Button>
                <Button type="submit" loading={saving} disabled={saving} className="px-8 py-2.5">
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Coming Soon Section */}
        <Card className="shadow-lg opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-600">Medium, Hashnode & More</CardTitle>
                <CardDescription className="text-base">
                  Additional publishing platforms coming soon
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              We're working on integrations with Medium, Hashnode, and other popular publishing platforms.
              Stay tuned for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}
