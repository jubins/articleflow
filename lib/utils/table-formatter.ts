/**
 * Detects and converts plain text tables to markdown table format
 */
export function formatTablesInMarkdown(markdown: string): string {
  // Split content into lines
  const lines = markdown.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Check if this line looks like a table header or title
    // followed by lines that could be table cells
    if (line && !line.startsWith('|') && !line.startsWith('#') && !line.startsWith('-')) {
      // Look ahead to see if next few lines look like table data
      const potentialTableLines: string[] = []
      let j = i

      // Collect consecutive non-empty lines that aren't already markdown tables
      while (j < lines.length) {
        const nextLine = lines[j].trim()
        if (!nextLine) {
          break
        }
        if (nextLine.startsWith('|') || nextLine.startsWith('#') || nextLine.startsWith('```')) {
          break
        }
        potentialTableLines.push(nextLine)
        j++
      }

      // Check if this looks like a table (at least 3 rows with consistent structure)
      if (potentialTableLines.length >= 3) {
        const tableCandidate = tryConvertToTable(potentialTableLines)
        if (tableCandidate) {
          result.push(tableCandidate)
          i = j
          continue
        }
      }
    }

    // Not a table, add line as-is
    result.push(lines[i])
    i++
  }

  return result.join('\n')
}

/**
 * Try to detect if lines form a table pattern and convert to markdown table
 */
function tryConvertToTable(lines: string[]): string | null {
  if (lines.length < 3) return null

  // Skip the title line if present
  let startIdx = 0
  const firstLine = lines[0]

  // Check if first line might be a title (ends with common table indicators)
  if (firstLine.toLowerCase().includes('comparison') ||
      firstLine.toLowerCase().includes('table') ||
      firstLine.toLowerCase().includes('metrics') ||
      firstLine.toLowerCase().includes('results')) {
    startIdx = 1
  }

  const dataLines = lines.slice(startIdx)

  // Not enough data lines
  if (dataLines.length < 3) return null

  // Simple heuristic: if we have lines that could be headers and rows,
  // and they follow a pattern where some lines are shorter (headers)
  // and others are longer (data), convert to table

  // For simplicity, assume first line is headers, rest are rows
  // Detect number of columns by checking for common patterns
  // Try to detect column count by looking for repeated patterns
  let i = 1
  const potentialHeaders: string[] = [dataLines[0]]

  // Collect potential header cells (shorter lines before data starts)
  while (i < dataLines.length && dataLines[i].length < 100) {
    potentialHeaders.push(dataLines[i])
    i++
    if (potentialHeaders.length >= 5) break // reasonable column limit
  }

  // Remaining lines are data rows
  const dataRows = dataLines.slice(i)

  // If we don't have enough headers and data, not a table
  if (potentialHeaders.length < 2 || dataRows.length < 1) {
    return null
  }

  // Build markdown table
  const tableLines: string[] = []

  // Add title if it was present
  if (startIdx === 1) {
    tableLines.push(`### ${lines[0]}`)
    tableLines.push('')
  }

  // Create header row
  const headerRow = '| ' + potentialHeaders.join(' | ') + ' |'
  tableLines.push(headerRow)

  // Create separator row
  const separator = '| ' + potentialHeaders.map(() => '---').join(' | ') + ' |'
  tableLines.push(separator)

  // Create data rows (group remaining lines into rows based on header count)
  const colCount = potentialHeaders.length
  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx += colCount) {
    const rowCells = dataRows.slice(rowIdx, rowIdx + colCount)
    if (rowCells.length === colCount) {
      const dataRow = '| ' + rowCells.join(' | ') + ' |'
      tableLines.push(dataRow)
    }
  }

  // Only return if we created at least one data row
  if (tableLines.length > 3) {
    return tableLines.join('\n')
  }

  return null
}
