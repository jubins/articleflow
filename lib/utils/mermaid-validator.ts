/**
 * Mermaid diagram validation and error detection utility
 * Validates Mermaid syntax and attempts to fix common issues
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fixedDiagram?: string
}

/**
 * Validate Mermaid diagram syntax
 * Returns validation result with errors and potential fixes
 */
export async function validateMermaidDiagram(diagram: string): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  let fixedDiagram = diagram

  // Check for empty diagram
  if (!diagram || diagram.trim().length === 0) {
    errors.push('Diagram is empty')
    return { isValid: false, errors, warnings }
  }

  // Check for common syntax issues
  const lines = diagram.split('\n').map(line => line.trim()).filter(Boolean)

  if (lines.length === 0) {
    errors.push('Diagram has no content')
    return { isValid: false, errors, warnings }
  }

  const firstLine = lines[0].toLowerCase()

  // Validate diagram type
  const validTypes = [
    'graph td', 'graph lr', 'graph bt', 'graph rl',
    'flowchart td', 'flowchart lr', 'flowchart bt', 'flowchart rl',
    'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram',
    'gantt', 'pie', 'journey', 'gitgraph'
  ]

  const hasValidType = validTypes.some(type => firstLine.startsWith(type))

  if (!hasValidType) {
    errors.push(`Invalid or missing diagram type. First line: "${lines[0]}"`)
    warnings.push('Diagram should start with a valid type like "graph TD", "flowchart LR", "sequenceDiagram", etc.')
  }

  // Check for forbidden C4/cloud keywords
  const forbiddenKeywords = ['cloud', 'server', 'database', 'compute', 'auth', 'c4context', 'c4container', 'c4component']
  const diagramLower = diagram.toLowerCase()

  for (const keyword of forbiddenKeywords) {
    if (diagramLower.includes(keyword)) {
      errors.push(`Forbidden keyword found: "${keyword}". Use basic Mermaid syntax only.`)
    }
  }

  // Check for balanced brackets
  const openBrackets = (diagram.match(/\[/g) || []).length
  const closeBrackets = (diagram.match(/\]/g) || []).length

  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`)
  }

  // Check for balanced parentheses
  const openParens = (diagram.match(/\(/g) || []).length
  const closeParens = (diagram.match(/\)/g) || []).length

  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`)
  }

  // Check for balanced braces
  const openBraces = (diagram.match(/\{/g) || []).length
  const closeBraces = (diagram.match(/\}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`)
  }

  // Check for arrows in graph/flowchart diagrams
  if (firstLine.includes('graph') || firstLine.includes('flowchart')) {
    const hasArrows = diagram.includes('-->') || diagram.includes('->') ||
                      diagram.includes('---') || diagram.includes('-.->') ||
                      diagram.includes('==>') || diagram.includes('~~>')

    if (!hasArrows && lines.length > 1) {
      warnings.push('Graph/flowchart diagram has no arrows/connections')
    }
  }

  // Attempt to fix common issues
  if (errors.length === 0 && warnings.length > 0) {
    // Only warnings, diagram is likely valid
    fixedDiagram = diagram
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedDiagram: errors.length === 0 ? fixedDiagram : undefined
  }
}

/**
 * Validate all Mermaid diagrams in markdown content
 * Returns array of validation results with diagram indices
 */
export async function validateAllMermaidDiagrams(content: string): Promise<{
  allValid: boolean
  results: Array<{ index: number; diagram: string; validation: ValidationResult }>
}> {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const results: Array<{ index: number; diagram: string; validation: ValidationResult }> = []

  let match
  let index = 0

  while ((match = mermaidRegex.exec(content)) !== null) {
    const diagram = match[1]
    const validation = await validateMermaidDiagram(diagram)
    results.push({ index, diagram, validation })
    index++
  }

  const allValid = results.every(r => r.validation.isValid)

  return { allValid, results }
}

/**
 * Browser-safe validation using mermaid.parse()
 * This should be called from the frontend with the mermaid library loaded
 */
export async function validateWithMermaid(diagram: string, mermaid: any): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Try to parse the diagram using mermaid's built-in parser
    await mermaid.parse(diagram)
    return { isValid: true, errors, warnings }
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    errors.push(`Mermaid parse error: ${errorMessage}`)

    return {
      isValid: false,
      errors,
      warnings
    }
  }
}
