import { NextRequest, NextResponse } from 'next/server'
import { validateDevToApiKey } from '@/lib/services/devto-publisher'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const result = await validateDevToApiKey(apiKey)

    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Invalid API key' }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      username: result.username,
      message: `Connected successfully! Welcome, @${result.username}`,
    })
  } catch (error) {
    console.error('Dev.to connection test error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to test connection',
      },
      { status: 500 }
    )
  }
}
