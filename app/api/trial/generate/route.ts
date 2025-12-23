import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// This endpoint uses OUR API key to generate a trial article
// We absorb the cost as a free trial for users
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use environment variable for trial generations
    const apiKey = process.env.TRIAL_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Trial service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const client = new Anthropic({ apiKey })

    // Generate a shorter article for trial (saves cost)
    const systemPrompt = `You are an expert technical writer. Generate a well-structured, informative article based on the user's prompt.

Guidelines:
- Make it approximately 800-1200 words
- Use proper markdown formatting
- Include code examples where relevant
- Structure with clear sections and headings
- Be technical but accessible

Return ONLY a JSON object with this structure:
{
  "title": "Article Title Here",
  "content": "Full article content in markdown format here..."
}

Do not include any text before or after the JSON.`

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from AI')
    }

    // Parse the JSON response
    let articleData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      articleData = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse AI response:', content.text)
      throw new Error('Failed to parse article data from AI response')
    }

    if (!articleData.title || !articleData.content) {
      throw new Error('Invalid article structure from AI')
    }

    return NextResponse.json({
      title: articleData.title,
      content: articleData.content,
    })
  } catch (error) {
    console.error('Trial generation error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate article',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
