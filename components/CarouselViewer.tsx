'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Mermaid } from './Mermaid'
import { Button } from './ui/Button'
import html2canvas from 'html2canvas'

interface CarouselViewerProps {
  content: string
}

export function CarouselViewer({ content }: CarouselViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Parse content into slides
  // Assuming slides are separated by "## Slide X" or similar headings
  const parseSlides = (markdown: string): string[] => {
    // Split by slide markers (headings that start with Slide or numbered sections)
    const slidePattern = /(?=^##\s+(?:Slide\s+\d+|[\d]+\.))/gm
    const slides = markdown.split(slidePattern).filter(s => s.trim())

    // If no specific slide markers, split by ## headings
    if (slides.length <= 1) {
      const headingPattern = /(?=^##\s+)/gm
      const altSlides = markdown.split(headingPattern).filter(s => s.trim())
      return altSlides.length > 1 ? altSlides : [markdown]
    }

    return slides
  }

  const slides = parseSlides(content)

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const downloadSlide = async (index: number) => {
    const slideElement = slideRefs.current[index]
    if (!slideElement) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(slideElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `slide-${index + 1}.png`
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Error downloading slide:', error)
      alert('Failed to download slide. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const downloadAllSlides = async () => {
    setDownloading(true)
    try {
      for (let i = 0; i < slides.length; i++) {
        await downloadSlide(i)
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Slide Navigation */}
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <span className="text-sm font-medium text-gray-700">
            Slide {currentSlide + 1} of {slides.length}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadSlide(currentSlide)}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download Current'}
          </Button>

          <Button
            size="sm"
            onClick={downloadAllSlides}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download All'}
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="relative">
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(el) => { slideRefs.current[index] = el }}
            className={`
              bg-white rounded-lg shadow-lg p-8 min-h-[500px]
              ${index === currentSlide ? 'block' : 'hidden'}
            `}
            style={{
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const code = String(children).replace(/\n$/, '')

                    if (className === 'language-mermaid') {
                      return <Mermaid chart={code} />
                    }

                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {code}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {slide}
              </ReactMarkdown>
            </div>

            {/* Slide number indicator */}
            <div className="absolute bottom-4 right-4 text-sm text-gray-400">
              {index + 1} / {slides.length}
            </div>
          </div>
        ))}
      </div>

      {/* Slide Thumbnails */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">All Slides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`
                relative aspect-[4/3] rounded-lg border-2 overflow-hidden
                transition-all hover:shadow-md
                ${currentSlide === index
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Slide {index + 1}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
