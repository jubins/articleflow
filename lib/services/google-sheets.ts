// Google Sheets integration service
import { google } from 'googleapis'
import { Prompt } from '@/lib/types/database'

export interface GoogleSheetsConfig {
  clientEmail: string
  privateKey: string
  projectId: string
}

export interface SheetRow {
  topic: string
  prompt: string
  fileId: string
  generatedDate?: string
  rowNumber: number
}

export class GoogleSheetsService {
  private sheets
  private auth

  constructor(config: GoogleSheetsConfig) {
    // Create JWT auth client
    this.auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  /**
   * Read prompts from the "generator" tab
   */
  async readPrompts(spreadsheetId: string): Promise<SheetRow[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'generator!A:D', // Read columns A-D (Topics, Prompt, FileId, GeneratedDate)
      })

      const rows = response.data.values || []

      if (rows.length === 0) {
        return []
      }

      // Skip header row and process data rows
      const dataRows = rows.slice(1)

      return dataRows
        .map((row, index) => ({
          topic: row[0] || '',
          prompt: row[1] || '',
          fileId: row[2] || '',
          generatedDate: row[3] || undefined,
          rowNumber: index + 2, // +2 because: +1 for 0-based index, +1 for header row
        }))
        .filter(row => row.topic && row.prompt) // Only include rows with topic and prompt
    } catch (error) {
      console.error('Error reading from Google Sheets:', error)
      throw new Error(
        `Failed to read from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Update the GeneratedDate column for a specific row
   */
  async updateGeneratedDate(
    spreadsheetId: string,
    rowNumber: number,
    date: string = new Date().toISOString()
  ): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `generator!D${rowNumber}`, // Column D is GeneratedDate
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[date]],
        },
      })
    } catch (error) {
      console.error('Error updating GeneratedDate in Google Sheets:', error)
      throw new Error(
        `Failed to update GeneratedDate: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get unprocessed prompts (those without a GeneratedDate)
   */
  async getUnprocessedPrompts(spreadsheetId: string): Promise<SheetRow[]> {
    const allPrompts = await this.readPrompts(spreadsheetId)
    return allPrompts.filter(row => !row.generatedDate)
  }

  /**
   * Validate spreadsheet access
   */
  async validateAccess(spreadsheetId: string): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId,
      })
      return true
    } catch (error) {
      console.error('Error validating spreadsheet access:', error)
      return false
    }
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetInfo(spreadsheetId: string) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      })
      return {
        title: response.data.properties?.title || 'Unknown',
        sheets: response.data.sheets?.map(sheet => sheet.properties?.title || 'Unknown') || [],
      }
    } catch (error) {
      console.error('Error getting spreadsheet info:', error)
      throw new Error(
        `Failed to get spreadsheet info: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

/**
 * Create a Google Sheets service instance from environment variables
 */
export function createGoogleSheetsService(): GoogleSheetsService {
  const config: GoogleSheetsConfig = {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!,
    projectId: process.env.GOOGLE_PROJECT_ID!,
  }

  return new GoogleSheetsService(config)
}
