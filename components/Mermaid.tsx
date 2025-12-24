'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

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

    const svg = ref.current.querySelector('svg')
    if (!svg) return

    try {
      // Clone the SVG to avoid modifying the displayed version
      const svgClone = svg.cloneNode(true) as SVGElement

      // Ensure SVG has proper dimensions
      const bbox = svg.getBBox()
      const width = svg.getAttribute('width') || bbox.width || 800
      const height = svg.getAttribute('height') || bbox.height || 600

      // Set explicit dimensions on the clone
      svgClone.setAttribute('width', String(width))
      svgClone.setAttribute('height', String(height))

      // Ensure viewBox is set
      if (!svgClone.getAttribute('viewBox')) {
        svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`)
      }

      // Add xmlns if not present
      if (!svgClone.getAttribute('xmlns')) {
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

      // Get SVG data from the properly formatted clone
      const svgData = new XMLSerializer().serializeToString(svgClone)

      console.log('Sending SVG for conversion. Dimensions:', width, 'x', height)

      // Send to server for conversion to WebP
      const response = await fetch('/api/mermaid/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg: svgData }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to convert diagram')
      }

      // Get the image blob directly from the response
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `diagram-${id}.webp`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
