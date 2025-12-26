import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleSheetsService } from '@/lib/services/google-sheets'
import { z } from 'zod'

// Force Node.js runtime for googleapis compatibility
export const runtime = 'nodejs'

// Request validation schema
const syncRequestSchema = z.object({
  spreadsheetId: z.string().optional(), // Optional, will use user settings if not provided
  onlyUnprocessed: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = syncRequestSchema.parse(body)

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('google_sheets_id')
      .eq('user_id', user.id)
      .single()

    // Determine which spreadsheet ID to use
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue with settings
    const spreadsheetId = validatedData.spreadsheetId || settings?.google_sheets_id

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheets ID not provided and not configured in settings' },
        { status: 400 }
      )
    }

    // Create Google Sheets service
    const sheetsService = await GoogleSheetsService.createForUser(user.id)

    // Validate access to the spreadsheet
    const hasAccess = await sheetsService.validateAccess(spreadsheetId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unable to access Google Sheets. Please check the spreadsheet ID and permissions.' },
        { status: 403 }
      )
    }

    // Read prompts from the sheet
    const sheetRows = validatedData.onlyUnprocessed
      ? await sheetsService.getUnprocessedPrompts(spreadsheetId)
      : await sheetsService.readPrompts(spreadsheetId)

    if (sheetRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new prompts to sync',
        synced: 0,
        prompts: [],
      })
    }

    // Insert prompts into database
    const promptsToInsert = sheetRows.map(row => ({
      user_id: user.id,
      topic: row.topic,
      prompt_text: row.prompt,
      file_id: row.fileId || null,
      source: 'sheets' as const,
      processed: false,
      sheet_row_number: row.rowNumber,
    }))

    // Check for existing prompts to avoid duplicates
    const existingPrompts = await supabase
      .from('prompts')
      .select('sheet_row_number')
      .eq('user_id', user.id)
      .eq('source', 'sheets')
      .in('sheet_row_number', sheetRows.map(r => r.rowNumber))

    const existingRowNumbers = new Set(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      existingPrompts.data?.map(p => p.sheet_row_number) || []
    )

    // Filter out already synced prompts
    const newPrompts = promptsToInsert.filter(
      p => p.sheet_row_number && !existingRowNumbers.has(p.sheet_row_number)
    )

    if (newPrompts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All prompts already synced',
        synced: 0,
        prompts: [],
      })
    }

    // Insert new prompts
    const { data: insertedPrompts, error: insertError } = await supabase
      .from('prompts')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Supabase type inference issue
      .insert(newPrompts)
      .select()

    if (insertError) {
      console.error('Error inserting prompts:', insertError)
      return NextResponse.json(
        { error: 'Failed to save prompts to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${newPrompts.length} prompt(s)`,
      synced: newPrompts.length,
      prompts: insertedPrompts,
    })

  } catch (error) {
    console.error('Google Sheets sync error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to sync Google Sheets',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to view sheet info and unprocessed prompts
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('google_sheets_id')
      .eq('user_id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Supabase type inference issue with settings
    const spreadsheetId = settings?.google_sheets_id

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheets ID not configured in settings' },
        { status: 400 }
      )
    }

    // Create Google Sheets service
    const sheetsService = await GoogleSheetsService.createForUser(user.id)

    // Get spreadsheet info
    const info = await sheetsService.getSpreadsheetInfo(spreadsheetId)

    // Get unprocessed prompts
    const unprocessedPrompts = await sheetsService.getUnprocessedPrompts(spreadsheetId)

    return NextResponse.json({
      success: true,
      spreadsheet: {
        id: spreadsheetId,
        title: info.title,
        sheets: info.sheets,
      },
      unprocessedCount: unprocessedPrompts.length,
      unprocessedPrompts: unprocessedPrompts.slice(0, 10), // Return first 10 for preview
    })

  } catch (error) {
    console.error('Google Sheets info error:', error)

    return NextResponse.json(
      {
        error: 'Failed to get Google Sheets info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
