// Google Docs integration service with OAuth support
import { google, Auth } from 'googleapis'
import { getGoogleOAuthClient } from './google-oauth'

export interface CreateDocOptions {
  title: string
  content: string // Markdown content
  description?: string
  tags?: string[]
}

export interface CreatedDoc {
  docId: string
  docUrl: string
}

export class GoogleDocsService {
  private docs
  private drive
  private userId: string

  constructor(userId: string, oauthClient: Auth.OAuth2Client) {
    this.userId = userId
    this.docs = google.docs({ version: 'v1', auth: oauthClient })
    this.drive = google.drive({ version: 'v3', auth: oauthClient })
  }

  /**
   * Create a new instance with user's OAuth credentials
   */
  static async createForUser(userId: string): Promise<GoogleDocsService> {
    const oauthClient = await getGoogleOAuthClient(userId)
    return new GoogleDocsService(userId, oauthClient)
  }

  /**
   * Create a Google Doc with formatted content
   */
  async createDocument(options: CreateDocOptions): Promise<CreatedDoc> {
    try {
      // Create a new blank document
      const createResponse = await this.docs.documents.create({
        requestBody: {
          title: options.title,
        },
      })

      const docId = createResponse.data.documentId!

      // Convert markdown to Google Docs format and insert content
      await this.insertContent(docId, options.content, options.description, options.tags)

      // Get the document URL
      const docUrl = `https://docs.google.com/document/d/${docId}/edit`

      return {
        docId,
        docUrl,
      }
    } catch (error) {
      console.error('Error creating Google Doc:', error)
      throw new Error(
        `Failed to create Google Doc: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Insert formatted content into a document
   */
  private async insertContent(
    docId: string,
    markdownContent: string,
    description?: string,
    tags?: string[]
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests: any[] = []

    // Parse markdown and create requests
    let index = 1

    // Add description if provided
    if (description) {
      requests.push({
        insertText: {
          location: { index },
          text: `${description}\n\n`,
        },
      })
      index += description.length + 2

      // Style description as italic
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: 1,
            endIndex: description.length + 1,
          },
          textStyle: {
            italic: true,
            foregroundColor: {
              color: {
                rgbColor: { red: 0.4, green: 0.4, blue: 0.4 },
              },
            },
          },
          fields: 'italic,foregroundColor',
        },
      })
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagsText = `Tags: ${tags.join(', ')}\n\n`
      requests.push({
        insertText: {
          location: { index },
          text: tagsText,
        },
      })
      index += tagsText.length
    }

    // Convert markdown to plain text (simplified - you may want to enhance this)
    const formattedContent = this.convertMarkdownToPlainText(markdownContent)

    requests.push({
      insertText: {
        location: { index },
        text: formattedContent,
      },
    })

    // Apply heading styles based on markdown headers
    const headingRequests = this.createHeadingStyles(formattedContent, index)
    requests.push(...headingRequests)

    // Batch update the document
    await this.docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests,
      },
    })
  }

  /**
   * Convert markdown to plain text with basic formatting
   */
  private convertMarkdownToPlainText(markdown: string): string {
    let text = markdown

    // Remove code blocks but keep the content
    text = text.replace(/```[\w]*\n([\s\S]*?)```/g, '$1')

    // Remove inline code markers
    text = text.replace(/`([^`]+)`/g, '$1')

    // Remove bold and italic markers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
    text = text.replace(/\*([^*]+)\*/g, '$1')
    text = text.replace(/__([^_]+)__/g, '$1')
    text = text.replace(/_([^_]+)_/g, '$1')

    // Convert markdown links to plain text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

    // Keep headers but clean them
    text = text.replace(/^#{1,6}\s+/gm, '')

    return text
  }

  /**
   * Create heading style requests based on markdown headers
   */
  private createHeadingStyles(content: string, startIndex: number): unknown[] {
    const requests = []
    const lines = content.split('\n')
    let currentIndex = startIndex

    for (const line of lines) {
      if (line.startsWith('# ')) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + line.length,
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_1',
            },
            fields: 'namedStyleType',
          },
        })
      } else if (line.startsWith('## ')) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + line.length,
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_2',
            },
            fields: 'namedStyleType',
          },
        })
      } else if (line.startsWith('### ')) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + line.length,
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_3',
            },
            fields: 'namedStyleType',
          },
        })
      }

      currentIndex += line.length + 1 // +1 for newline
    }

    return requests
  }

  /**
   * Share document with specific users or make it public
   */
  async shareDocument(
    docId: string,
    options: { publicRead?: boolean; emails?: string[] } = {}
  ): Promise<void> {
    try {
      if (options.publicRead) {
        await this.drive.permissions.create({
          fileId: docId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        })
      }

      if (options.emails && options.emails.length > 0) {
        for (const email of options.emails) {
          await this.drive.permissions.create({
            fileId: docId,
            requestBody: {
              role: 'writer',
              type: 'user',
              emailAddress: email,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error sharing document:', error)
      throw new Error(
        `Failed to share document: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(docId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: docId,
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error(
        `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
