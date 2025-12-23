'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidProps {
  chart: string
  id: string
}

export function Mermaid({ chart, id }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
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
    })

    const renderDiagram = async () => {
      if (!ref.current) return

      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Failed to render diagram')
      }
    }

    renderDiagram()
  }, [chart, id])

  const handleDownload = () => {
    if (!ref.current) return

    const svg = ref.current.querySelector('svg')
    if (!svg) return

    // Convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `diagram-${id}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(pngUrl)
      })
    }

    img.src = url
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 my-4">
        <p className="text-red-700 text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-xs text-red-600 cursor-pointer">Show diagram code</summary>
          <pre className="mt-2 text-xs overflow-x-auto">{chart}</pre>
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
          Download Diagram (PNG)
        </button>
      </div>
    </div>
  )
}
