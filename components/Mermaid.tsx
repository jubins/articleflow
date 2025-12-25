'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import html2canvas from 'html2canvas'

interface MermaidProps {
  chart: string
  id: string
}

// Initialize mermaid once
let isInitialized = false

export function Mermaid({ chart, id }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string>('')

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
        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Failed to render diagram')
        setErrorDetails(err instanceof Error ? err.message : String(err))
      }
    }

    renderDiagram()
  }, [chart, id])

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

      // Convert canvas to WebP blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', 0.95)
      })

      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `diagram-${id}.webp`
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
        <p className="text-red-700 text-sm font-semibold">{error}</p>
        {errorDetails && (
          <p className="text-red-600 text-xs mt-1">{errorDetails}</p>
        )}
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer font-medium">Show diagram code</summary>
          <pre className="mt-2 text-xs overflow-x-auto bg-white p-2 rounded border border-red-200">{chart}</pre>
        </details>
      </div>
    )
  }

  return (
    <div className="my-6 p-6 bg-white rounded-lg">
      <div ref={ref} className="flex justify-center bg-white" />
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleDownload}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Download Diagram (WebP)
        </button>
      </div>
    </div>
  )
}
