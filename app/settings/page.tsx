'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [settings, setSettings] = useState({
    anthropic_api_key: '',
    google_ai_api_key: '',
    google_sheets_id: '',
    default_ai_provider: 'claude' as 'claude' | 'gemini',
    default_word_count: 2000,
    article_template: '',
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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedData = data as any
        setSettings({
          anthropic_api_key: typedData.anthropic_api_key || '',
          google_ai_api_key: typedData.google_ai_api_key || '',
          google_sheets_id: typedData.google_sheets_id || '',
          default_ai_provider: typedData.default_ai_provider,
          default_word_count: typedData.default_word_count,
          article_template: typedData.article_template || '',
        })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
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
        .upsert({
          user_id: user.id,
          ...settings,
        })

      if (error) throw error

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your API keys and preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Configure your API keys for AI providers and Google services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Claude API Key (Anthropic)"
                type="password"
                value={settings.anthropic_api_key}
                onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                placeholder="sk-ant-..."
                helperText="Get your API key from https://console.anthropic.com"
              />

              <Input
                label="Gemini API Key (Google AI)"
                type="password"
                value={settings.google_ai_api_key}
                onChange={(e) => setSettings({ ...settings, google_ai_api_key: e.target.value })}
                placeholder="AIza..."
                helperText="Get your API key from https://makersuite.google.com/app/apikey"
              />
            </CardContent>
          </Card>

          {/* Google Sheets */}
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Integration</CardTitle>
              <CardDescription>
                Configure Google Sheets for batch prompt processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                label="Google Sheets ID"
                value={settings.google_sheets_id}
                onChange={(e) => setSettings({ ...settings, google_sheets_id: e.target.value })}
                placeholder="1glBRMfYHBR64GniatmCv8o0UM_zWyXkeJQn_hkn0bp8"
                helperText="The ID from your Google Sheets URL"
              />
            </CardContent>
          </Card>

          {/* Default Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>
                Set default values for article generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default AI Provider
                </label>
                <select
                  value={settings.default_ai_provider}
                  onChange={(e) => setSettings({ ...settings, default_ai_provider: e.target.value as 'claude' | 'gemini' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="gemini">Gemini (Google)</option>
                </select>
              </div>

              <Input
                label="Default Word Count"
                type="number"
                value={settings.default_word_count}
                onChange={(e) => setSettings({ ...settings, default_word_count: parseInt(e.target.value) })}
                min={500}
                max={5000}
              />

              <TextArea
                label="Custom Article Template (Optional)"
                value={settings.article_template}
                onChange={(e) => setSettings({ ...settings, article_template: e.target.value })}
                placeholder="Leave empty to use default template..."
                rows={8}
                helperText="Custom template for article generation. Use {{topic}}, {{prompt}}, {{wordCount}}, {{platform}} as placeholders."
              />
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={saving}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
