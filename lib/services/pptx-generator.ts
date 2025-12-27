import PptxGenJS from 'pptxgenjs'

export interface PPTXGeneratorOptions {
  content: string
  theme: 'classic' | 'academic' | 'modern' | 'elegant' | 'professional'
  title?: string
  linkedinTeaser?: string
  diagramUrls?: Map<number, string[]> // Map of slide index to diagram URLs
}

export interface SlideData {
  slideNumber: number
  heading: string
  content: string
  diagrams?: string[]
}

export class PPTXGeneratorService {
  private pptx: PptxGenJS
  private theme: PPTXGeneratorOptions['theme']

  constructor() {
    this.pptx = new PptxGenJS()
    this.theme = 'classic'

    // Set presentation properties
    this.pptx.author = 'ArticleFlow'
    this.pptx.company = 'ArticleFlow'
    this.pptx.subject = 'LinkedIn Carousel'
    this.pptx.title = 'Carousel Presentation'

    // Set layout to 16:9 (same as carousel)
    this.pptx.layout = 'LAYOUT_16x9'
  }

  /**
   * Generate PPTX from carousel content
   */
  async generate(options: PPTXGeneratorOptions): Promise<Blob> {
    this.theme = options.theme

    // Parse slides from markdown content
    const slides = this.parseSlides(options.content)

    // Add title slide if title provided
    if (options.title) {
      this.addTitleSlide(options.title)
    }

    // Add content slides
    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i]
      // Get diagram URLs for this slide if available
      const diagrams = options.diagramUrls?.get(i) || slideData.diagrams || []
      await this.addContentSlide(slideData, diagrams)
    }

    // Generate and return blob
    const blob = await this.pptx.write({ outputType: 'blob' }) as Blob
    return blob
  }

  /**
   * Parse markdown content into slide data
   */
  private parseSlides(markdown: string): SlideData[] {
    // Split by slide markers (headings that start with Slide or numbered sections)
    const slidePattern = /(?=^##\s+(?:Slide\s+\d+|[\d]+\.))/gm
    let slideContents = markdown.split(slidePattern).filter(s => s.trim())

    // If no specific slide markers, split by ## headings
    if (slideContents.length <= 1) {
      const headingPattern = /(?=^##\s+)/gm
      const altSlides = markdown.split(headingPattern).filter(s => s.trim())
      slideContents = altSlides.length > 1 ? altSlides : [markdown]
    }

    return slideContents.map((content, index) => {
      // Extract heading (first line starting with ##)
      const headingMatch = content.match(/^##\s+(.+)$/m)
      const heading = headingMatch ? headingMatch[1].replace(/^Slide\s+\d+:\s*/, '').trim() : `Slide ${index + 1}`

      // Remove heading from content
      const bodyContent = headingMatch ? content.replace(headingMatch[0], '').trim() : content.trim()

      return {
        slideNumber: index + 1,
        heading,
        content: bodyContent,
      }
    })
  }

  /**
   * Add title slide
   */
  private addTitleSlide(title: string) {
    const slide = this.pptx.addSlide()
    const colors = this.getThemeColors()

    // Set background
    slide.background = { color: colors.background }

    // Add title
    slide.addText(title, {
      x: 0.5,
      y: '40%',
      w: '90%',
      h: 1.5,
      fontSize: 44,
      bold: true,
      color: colors.text,
      align: 'center',
      fontFace: 'Arial',
    })

    // Don't add LinkedIn teaser to slides - it's for social media only
    // Add footer instead
    slide.addText('Created with ArticleFlow', {
      x: 0.5,
      y: '90%',
      w: '90%',
      h: 0.3,
      fontSize: 12,
      color: colors.subtitle,
      align: 'center',
      fontFace: 'Arial',
    })
  }

  /**
   * Add content slide
   */
  private async addContentSlide(slideData: SlideData, diagrams: string[]) {
    const slide = this.pptx.addSlide()
    const colors = this.getThemeColors()

    // Set background
    slide.background = { color: colors.background }

    // Add slide number in bottom right
    slide.addText(`${slideData.slideNumber}`, {
      x: '92%',
      y: '92%',
      w: '6%',
      h: 0.4,
      fontSize: 18,
      color: colors.subtitle,
      align: 'center',
      fontFace: 'Arial',
      bold: true,
    })

    // Add heading
    slide.addText(slideData.heading, {
      x: 0.5,
      y: 0.5,
      w: '90%',
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: colors.text,
      fontFace: 'Arial',
    })

    // Parse and add content
    await this.addSlideContent(slide, slideData.content, diagrams, colors)
  }

  /**
   * Parse and add slide content (text, lists, tables, code, diagrams)
   */
  private async addSlideContent(
    slide: PptxGenJS.Slide,
    content: string,
    diagrams: string[],
    colors: ReturnType<typeof this.getThemeColors>
  ) {
    let yPosition = 1.5 // Start below heading

    // Check if content has diagram
    const hasDiagram = diagrams.length > 0 || content.includes('```mermaid')

    // Split content into sections
    const sections = this.parseContentSections(content)

    for (const section of sections) {
      if (section.type === 'heading') {
        // Add subheading
        slide.addText(section.content, {
          x: 0.5,
          y: yPosition,
          w: '90%',
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: colors.text,
          fontFace: 'Arial',
        })
        yPosition += 0.6
      } else if (section.type === 'paragraph') {
        // Add paragraph (strip markdown formatting)
        const cleanText = this.stripMarkdown(section.content)
        const textHeight = Math.min(cleanText.length / 100, 1.2)
        slide.addText(cleanText, {
          x: hasDiagram ? 0.5 : 0.5,
          y: yPosition,
          w: hasDiagram ? '45%' : '90%',
          h: textHeight,
          fontSize: 18,
          color: colors.text,
          fontFace: 'Arial',
          valign: 'top',
        })
        yPosition += textHeight + 0.2
      } else if (section.type === 'list') {
        // Add bullet points (properly formatted)
        const bullets = section.content.split('\n').filter(line => line.trim())
        const bulletTexts = bullets.map(bullet => {
          // Strip markdown and list markers
          const cleanText = this.stripMarkdown(bullet.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, ''))
          return {
            text: cleanText,
            options: { bullet: true }
          }
        })

        slide.addText(bulletTexts, {
          x: hasDiagram ? 0.5 : 0.5,
          y: yPosition,
          w: hasDiagram ? '45%' : '90%',
          h: Math.min(bullets.length * 0.4, 3),
          fontSize: 16,
          color: colors.text,
          fontFace: 'Arial',
          valign: 'top',
        })
        yPosition += Math.min(bullets.length * 0.4, 3) + 0.2
      } else if (section.type === 'table') {
        // Add table
        await this.addTable(slide, section.content, yPosition, colors, hasDiagram)
        yPosition += 2.5
      } else if (section.type === 'code') {
        // Add code block
        slide.addText(section.content, {
          x: hasDiagram ? 0.5 : 0.5,
          y: yPosition,
          w: hasDiagram ? '45%' : '90%',
          h: Math.min(section.content.split('\n').length * 0.3, 2.5),
          fontSize: 12,
          color: colors.text,
          fontFace: 'Courier New',
          fill: { color: colors.codeBg },
          valign: 'top',
        })
        yPosition += Math.min(section.content.split('\n').length * 0.3, 2.5) + 0.2
      }

      // Stop adding content if we're running out of space
      if (yPosition > 4.5 && diagrams.length > 0) break
    }

    // Add diagram if present
    if (diagrams.length > 0) {
      try {
        // Add first diagram (most slides have one diagram)
        const diagramUrl = diagrams[0]

        console.log('Adding diagram to slide:', diagramUrl)

        // Convert URL to data URI for reliable embedding
        const dataUri = await this.urlToDataUri(diagramUrl)

        // Determine diagram position based on content
        const hasContent = sections.length > 0

        if (hasContent) {
          // Place diagram on the right side
          slide.addImage({
            data: dataUri,
            x: '50%',
            y: 1.8,
            w: '45%',
            h: 3.5,
            sizing: { type: 'contain', w: '45%', h: 3.5 },
          })
          console.log('Diagram added successfully (right side)')
        } else {
          // Center diagram if no text content
          slide.addImage({
            data: dataUri,
            x: '15%',
            y: 1.8,
            w: '70%',
            h: 3.8,
            sizing: { type: 'contain', w: '70%', h: 3.8 },
          })
          console.log('Diagram added successfully (centered)')
        }
      } catch (error) {
        console.error('Failed to add diagram to slide - skipping diagram:', error)
        // Don't show error message in PPTX - just skip the diagram silently
        // The text content will fill the space instead
      }
    }
  }

  /**
   * Parse content into sections (headings, paragraphs, lists, tables, code)
   */
  private parseContentSections(content: string): Array<{ type: string; content: string }> {
    const sections: Array<{ type: string; content: string }> = []

    // Remove mermaid code blocks as they'll be handled separately as diagrams
    const cleanContent = content.replace(/```mermaid[\s\S]*?```/g, '')

    const lines = cleanContent.split('\n')
    let currentSection: { type: string; content: string } | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip empty lines at the start of sections
      if (!line.trim() && !currentSection) continue

      // Heading (###)
      if (line.match(/^###\s+/)) {
        if (currentSection) sections.push(currentSection)
        currentSection = {
          type: 'heading',
          content: line.replace(/^###\s+/, '').trim()
        }
        continue
      }

      // Table
      if (line.includes('|')) {
        if (currentSection && currentSection.type !== 'table') {
          sections.push(currentSection)
          currentSection = null
        }
        if (!currentSection) {
          currentSection = { type: 'table', content: line }
        } else {
          currentSection.content += '\n' + line
        }
        continue
      }

      // Code block
      if (line.startsWith('```')) {
        if (currentSection && currentSection.type === 'code') {
          // End of code block
          sections.push(currentSection)
          currentSection = null
        } else {
          if (currentSection) sections.push(currentSection)
          currentSection = { type: 'code', content: '' }
        }
        continue
      }

      // List item
      if (line.match(/^[-*+]\s+/)) {
        if (currentSection && currentSection.type !== 'list') {
          sections.push(currentSection)
          currentSection = null
        }
        if (!currentSection) {
          currentSection = { type: 'list', content: line }
        } else {
          currentSection.content += '\n' + line
        }
        continue
      }

      // Regular text (paragraph)
      if (line.trim()) {
        if (currentSection && currentSection.type === 'code') {
          currentSection.content += (currentSection.content ? '\n' : '') + line
        } else {
          if (currentSection && currentSection.type !== 'paragraph') {
            sections.push(currentSection)
            currentSection = null
          }
          if (!currentSection) {
            currentSection = { type: 'paragraph', content: line }
          } else {
            currentSection.content += ' ' + line
          }
        }
      } else if (currentSection && currentSection.type === 'paragraph') {
        // Empty line ends paragraph
        sections.push(currentSection)
        currentSection = null
      }
    }

    if (currentSection) sections.push(currentSection)

    return sections
  }

  /**
   * Add markdown table to slide
   */
  private async addTable(
    slide: PptxGenJS.Slide,
    tableMarkdown: string,
    yPosition: number,
    colors: ReturnType<typeof this.getThemeColors>,
    hasDiagram: boolean
  ) {
    try {
      const lines = tableMarkdown.split('\n').filter(l => l.trim())

      // Skip separator line (the one with |---|---|)
      const dataLines = lines.filter(line => !line.match(/^\|[\s-:|]+\|$/))

      // Parse table rows
      const rows = dataLines.map(line =>
        line.split('|')
          .filter(cell => cell.trim())
          .map(cell => cell.trim())
      )

      if (rows.length === 0) return

      // Create table data with proper formatting
      const tableData: PptxGenJS.TableRow[] = rows.map((row, rowIndex) => {
        return row.map(cell => ({
          text: cell,
          options: {
            fontSize: rowIndex === 0 ? 14 : 12,
            bold: rowIndex === 0,
            color: colors.text,
            fill: rowIndex === 0 ? { color: colors.tableHeaderBg } : undefined,
            border: [
              { type: 'solid', pt: 1, color: colors.tableBorder },
              { type: 'solid', pt: 1, color: colors.tableBorder },
              { type: 'solid', pt: 1, color: colors.tableBorder },
              { type: 'solid', pt: 1, color: colors.tableBorder },
            ],
          }
        }))
      })

      // Calculate column widths
      const numCols = rows[0].length
      const tableWidth = hasDiagram ? 4.5 : 9
      const colWidth = tableWidth / numCols

      slide.addTable(tableData, {
        x: 0.5,
        y: yPosition,
        w: tableWidth,
        colW: Array(numCols).fill(colWidth),
        border: { type: 'solid', pt: 1, color: colors.tableBorder },
      })
    } catch (error) {
      console.error('Failed to add table:', error)
    }
  }

  /**
   * Strip markdown formatting from text
   */
  private stripMarkdown(text: string): string {
    return text
      // Remove bold/italic markers
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // bold + italic
      .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
      .replace(/\*(.+?)\*/g, '$1')         // italic
      .replace(/__(.+?)__/g, '$1')         // bold (underscores)
      .replace(/_(.+?)_/g, '$1')           // italic (underscores)
      // Remove inline code markers
      .replace(/`(.+?)`/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[.+?\]\(.+?\)/g, '')
      // Trim whitespace
      .trim()
  }

  /**
   * Convert image URL to data URI for reliable embedding in PPTX
   * This runs on the server side, so we fetch the image and convert to base64
   */
  private async urlToDataUri(url: string): Promise<string> {
    try {
      console.log('Fetching image from URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ArticleFlow-PPTX-Generator/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = response.headers.get('content-type') || 'image/webp'

      // Convert to base64 data URI
      const base64 = buffer.toString('base64')
      const dataUri = `data:${contentType};base64,${base64}`

      console.log(`Successfully converted image (${buffer.length} bytes) to data URI`)
      return dataUri
    } catch (error) {
      console.error('Error converting URL to data URI:', error)
      console.error('URL was:', url)
      throw error
    }
  }

  /**
   * Get theme-specific colors
   */
  private getThemeColors() {
    const themes = {
      classic: {
        background: 'FFFFFF',
        text: '1F2937',
        subtitle: '6B7280',
        codeBg: 'F3F4F6',
        tableHeaderBg: 'F3F4F6',
        tableBorder: 'D1D5DB',
      },
      academic: {
        background: 'F5F7FA',
        text: '1F2937',
        subtitle: '6B7280',
        codeBg: 'FFFFFF',
        tableHeaderBg: 'FFFFFF',
        tableBorder: 'D1D5DB',
      },
      modern: {
        background: 'E0F2FE',
        text: '1F2937',
        subtitle: '6B7280',
        codeBg: 'FFFFFF',
        tableHeaderBg: 'FFFFFF',
        tableBorder: 'BFDBFE',
      },
      elegant: {
        background: 'F0F9FF',
        text: '1F2937',
        subtitle: '3B82F6',
        codeBg: 'FFFFFF',
        tableHeaderBg: 'DBEAFE',
        tableBorder: '93C5FD',
      },
      professional: {
        background: '0F172A',
        text: 'FFFFFF',
        subtitle: 'CBD5E1',
        codeBg: '1E293B',
        tableHeaderBg: '334155',
        tableBorder: '475569',
      },
    }

    return themes[this.theme] || themes.classic
  }
}
