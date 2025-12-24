'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Profile } from '@/lib/types/database'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    bio: '',
    linkedin_handle: '',
    twitter_handle: '',
    github_handle: '',
    website: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedData = data as any
        setProfile({
          full_name: typedData.full_name || '',
          bio: typedData.bio || '',
          linkedin_handle: typedData.linkedin_handle || '',
          twitter_handle: typedData.twitter_handle || '',
          github_handle: typedData.github_handle || '',
          website: typedData.website || '',
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
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
        .from('profiles')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase type inference issue
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile.full_name || null,
          bio: profile.bio || null,
          linkedin_handle: profile.linkedin_handle || null,
          twitter_handle: profile.twitter_handle || null,
          github_handle: profile.github_handle || null,
          website: profile.website || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
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
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">
            Manage your profile and social media handles for article signatures
          </p>
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your name and bio will be included in article signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="John Doe"
                helperText="Your full name as it should appear in articles"
              />

              <TextArea
                label="Bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Senior Software Engineer passionate about building scalable systems..."
                rows={4}
                helperText="A brief professional bio (2-3 sentences)"
              />

              <Input
                label="Website"
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                helperText="Your personal or professional website"
              />
            </CardContent>
          </Card>

          {/* Social Media Handles */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>
                Add your social media handles to include in article signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="LinkedIn Username"
                type="text"
                value={profile.linkedin_handle || ''}
                onChange={(e) => setProfile({ ...profile, linkedin_handle: e.target.value })}
                placeholder="johndoe"
                helperText="Just your username (not the full URL). Example: johndoe"
              />

              <Input
                label="Twitter/X Handle"
                type="text"
                value={profile.twitter_handle || ''}
                onChange={(e) => setProfile({ ...profile, twitter_handle: e.target.value })}
                placeholder="@johndoe or johndoe"
                helperText="Your Twitter/X username (with or without @)"
              />

              <Input
                label="GitHub Username"
                type="text"
                value={profile.github_handle || ''}
                onChange={(e) => setProfile({ ...profile, github_handle: e.target.value })}
                placeholder="johndoe"
                helperText="Your GitHub username"
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Signature Preview</CardTitle>
              <CardDescription>
                This is how your signature will appear at the end of articles.
                Customize by editing your name, bio, and social handles above.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="prose prose-sm max-w-none">
                  <hr className="my-4 border-gray-400" />
                  <h3 className="text-lg font-bold mb-3 text-gray-900">About the Author</h3>

                  {profile.full_name ? (
                    <p className="mb-2 text-gray-900">Written by <strong className="font-semibold">{profile.full_name}</strong></p>
                  ) : null}

                  {profile.bio ? (
                    <p className="mb-3 text-gray-900 leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-400 italic mb-3">Add your bio above to see it here</p>
                  )}

                  {(profile.linkedin_handle || profile.twitter_handle || profile.github_handle || profile.website) && (
                    <>
                      <p className="font-semibold mb-2 text-gray-900">Connect with me:</p>
                      <p className="text-gray-900">
                        {[
                          profile.linkedin_handle && (
                            <span key="linkedin">
                              🔗 <a href={`https://linkedin.com/in/${profile.linkedin_handle.replace(/^@/, '')}`} className="text-blue-600 font-medium hover:underline">LinkedIn</a>
                            </span>
                          ),
                          profile.twitter_handle && (
                            <span key="twitter">
                              🐦 <a href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`} className="text-blue-600 font-medium hover:underline">Twitter/X</a>
                            </span>
                          ),
                          profile.github_handle && (
                            <span key="github">
                              💻 <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} className="text-blue-600 font-medium hover:underline">GitHub</a>
                            </span>
                          ),
                          profile.website && (
                            <span key="website">
                              🌐 <a href={profile.website} className="text-blue-600 font-medium hover:underline">Website</a>
                            </span>
                          ),
                        ].filter(Boolean).map((item, index, array) => (
                          <span key={index}>
                            {item}
                            {index < array.length - 1 && <span className="mx-2">|</span>}
                          </span>
                        ))}
                      </p>
                    </>
                  )}

                  {!profile.linkedin_handle && !profile.twitter_handle && !profile.github_handle && !profile.website && (
                    <p className="text-gray-400 italic">Add your social media handles above to see them here</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
