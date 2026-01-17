'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import html2canvas from 'html2canvas'
import { validateMermaidDiagram } from '@/lib/utils/mermaid-validator'

interface MermaidProps {
  chart: string
  id: string
  onError?: (hasError: boolean) => void
}

// Initialize mermaid once
let isInitialized = false

export function Mermaid({ chart, id, onError }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#f0f9ff',
          primaryTextColor: '#1e293b',
          primaryBorderColor: '#3b82f6',
          lineColor: '#64748b',
          secondaryColor: '#e0f2fe',
          tertiaryColor: '#f8fafc',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f8fafc',
        },
        securityLevel: 'loose',
        fontFamily: 'system-ui, sans-serif',
        sequence: {
          wrap: true,
          width: 150,
        },
      })
      isInitialized = true
    }

    const renderDiagram = async () => {
      if (!ref.current) return

      try {
        setError(null)
        setErrorDetails('')
        setValidationWarnings([])

        // First, validate the diagram syntax
        const validation = await validateMermaidDiagram(chart)

        if (!validation.isValid) {
          const errorMsg = `Invalid Mermaid syntax: ${validation.errors.join(', ')}`
          setError('Invalid diagram syntax')
          setErrorDetails(errorMsg)
          if (onError) onError(true)
          return
        }

        // Set warnings if any
        if (validation.warnings.length > 0) {
          setValidationWarnings(validation.warnings)
        }

        // Try to render with mermaid
        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        if (ref.current) {
          ref.current.innerHTML = svg
        }
        if (onError) onError(false)
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Failed to render diagram')
        setErrorDetails(err instanceof Error ? err.message : String(err))
        if (onError) onError(true)
      }
    }

    renderDiagram()
  }, [chart, id, onError])

  const handleDownload = async () => {
    if (!ref.current) return

    try {
      // Use html2canvas to capture the diagram with proper font rendering
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 3, // High resolution
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Convert canvas to PNG blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png')
      })

      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `diagram-${id}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert(`Failed to download diagram: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 my-4">
        <div className="flex items-start gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-red-700 text-sm font-semibold">{error}</p>
            {errorDetails && (
              <p className="text-red-600 text-xs mt-1">{errorDetails}</p>
            )}
          </div>
        </div>
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer font-medium hover:text-red-800">Show diagram code</summary>
          <pre className="mt-2 text-xs overflow-x-auto bg-white p-2 rounded border border-red-200 font-mono">{chart}</pre>
        </details>
        <p className="text-xs text-red-500 mt-2 italic">
          This diagram contains syntax errors. Please regenerate the article or edit the diagram manually.
        </p>
      </div>
    )
  }

  return (
    <div className="my-6 p-6 bg-white rounded-lg border border-gray-100">
      {validationWarnings.length > 0 && (
        <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-2">
          <p className="text-yellow-800 text-xs font-medium">Warnings:</p>
          <ul className="text-yellow-700 text-xs mt-1 list-disc list-inside">
            {validationWarnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <div ref={ref} className="flex justify-center bg-white" />
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleDownload}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Download Diagram (PNG)
        </button>
      </div>
    </div>
  )
}
