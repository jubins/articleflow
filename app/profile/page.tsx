'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Profile } from '@/lib/types/database'
import Image from 'next/image'

export default function ProfilePage() {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [userEmail, setUserEmail] = useState<string>('')
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    avatar_url: '',
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

      // Set user email
      setUserEmail(user.email || '')

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
          avatar_url: typedData.avatar_url || '',
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveAvatar = async () => {
    if (!profile.avatar_url) return

    setUploadingAvatar(true)
    toast.info('Removing avatar...')

    try {
      const response = await fetch('/api/profile/avatar/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove avatar')
      }

      setProfile({ ...profile, avatar_url: '' })
      toast.success('Avatar removed successfully!')
    } catch (err) {
      console.error('Avatar removal error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setUploadingAvatar(true)
    toast.info('Uploading avatar...')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload avatar')
      }

      const data = await response.json()
      setProfile({ ...profile, avatar_url: data.avatar_url })
      toast.success('Avatar uploaded successfully!')
    } catch (err) {
      console.error('Avatar upload error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || null,
          linkedin_handle: profile.linkedin_handle || null,
          twitter_handle: profile.twitter_handle || null,
          github_handle: profile.github_handle || null,
          website: profile.website || null,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSuccess('Profile updated successfully!')
      toast.success('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile'
      setError(errorMessage)
      toast.error(errorMessage)
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
          {/* Avatar Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload your profile picture (max 5MB, JPEG/PNG/WebP/GIF)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profile.avatar_url ? (
                    <>
                      <Image
                        src={profile.avatar_url}
                        alt="Profile avatar"
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                      {/* Remove Avatar Button */}
                      {!uploadingAvatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Remove avatar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-white text-4xl font-bold">
                        {profile.full_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="md" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                label="Email"
                type="email"
                value={userEmail}
                disabled
                className="bg-gray-100 cursor-not-allowed"
                helperText="Your email address cannot be changed"
              />

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
              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={profile.linkedin_handle || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin_handle: e.target.value })}
                    placeholder="johndoe"
                    className="pl-10 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Just your username (not the full URL). Example: johndoe</p>
              </div>

              {/* Twitter/X */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter/X Handle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={profile.twitter_handle || ''}
                    onChange={(e) => setProfile({ ...profile, twitter_handle: e.target.value })}
                    placeholder="@johndoe or johndoe"
                    className="pl-10 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Your Twitter/X username (with or without @)</p>
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={profile.github_handle || ''}
                    onChange={(e) => setProfile({ ...profile, github_handle: e.target.value })}
                    placeholder="johndoe"
                    className="pl-10 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Your GitHub username</p>
              </div>
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
                      <div className="flex flex-wrap gap-3 items-center">
                        {profile.linkedin_handle && (
                          <a
                            href={`https://linkedin.com/in/${profile.linkedin_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            {profile.linkedin_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.twitter_handle && (
                          <a
                            href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            @{profile.twitter_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.github_handle && (
                          <a
                            href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            {profile.github_handle.replace(/^@/, '')}
                          </a>
                        )}
                        {profile.website && (
                          <a
                            href={profile.website}
                            className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Website
                          </a>
                        )}
                      </div>
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
