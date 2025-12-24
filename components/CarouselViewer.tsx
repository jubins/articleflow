'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from './ui/Button'
import html2canvas from 'html2canvas'
import mermaid from 'mermaid'

interface CarouselViewerProps {
  content: string
  title?: string
}

// Initialize mermaid once
let isMermaidInitialized = false

export function CarouselViewer({ content, title }: CarouselViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [teaserText, setTeaserText] = useState('')
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Initialize mermaid
  useEffect(() => {
    if (!isMermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
      })
      isMermaidInitialized = true
    }
  }, [])

  // Generate LinkedIn teaser text
  useEffect(() => {
    if (title) {
      const teasers = [
        `Want to learn more about ${title}? 📚`,
        `Curious about ${title}? Swipe through! 👉`,
        `Master ${title} in 5 slides! 💡`,
        `Everything you need to know about ${title} 🚀`,
        `Quick guide to ${title}! Save this for later 🔖`,
      ]
      // Pick a random teaser
      const randomTeaser = teasers[Math.floor(Math.random() * teasers.length)]
      setTeaserText(randomTeaser)
    }
  }, [title])

  // Parse content into slides
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

  const downloadSlideAsWebP = async (index: number) => {
    const slideElement = slideRefs.current[index]
    if (!slideElement) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(slideElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
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
        const link = document.createElement('a')
        link.href = url
        link.download = `carousel-slide-${index + 1}.webp`
        link.click()
        URL.revokeObjectURL(url)
      }
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
        await downloadSlideAsWebP(i)
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    } finally {
      setDownloading(false)
    }
  }

  const copyTeaserText = () => {
    navigator.clipboard.writeText(teaserText)
    alert('Teaser text copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* LinkedIn Teaser Text */}
      {teaserText && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn Post Ready
              </h3>
              <p className="text-base text-blue-800 font-medium mb-3">{teaserText}</p>
              <p className="text-xs text-blue-600">
                💡 Tip: Copy this text and post it with your carousel images on LinkedIn for maximum engagement!
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyTeaserText}
              className="ml-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Text
            </Button>
          </div>
        </div>
      )}

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
            onClick={() => downloadSlideAsWebP(currentSlide)}
            disabled={downloading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Downloading...' : 'Download Current'}
          </Button>

          <Button
            size="sm"
            onClick={downloadAllSlides}
            disabled={downloading}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {downloading ? 'Downloading All...' : 'Download All Slides'}
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
              bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-12 min-h-[600px]
              ${index === currentSlide ? 'block' : 'hidden'}
            `}
            style={{
              maxWidth: '1080px',
              aspectRatio: '1080 / 1350', // LinkedIn carousel aspect ratio
              margin: '0 auto',
            }}
          >
            <SlideContent slide={slide} slideNumber={index + 1} totalSlides={slides.length} />
          </div>
        ))}
      </div>

      {/* Slide Thumbnails */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">All Slides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`
                relative aspect-[4/5] rounded-lg border-2 overflow-hidden
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

// Separate component for slide content rendering
function SlideContent({ slide, slideNumber, totalSlides }: { slide: string; slideNumber: number; totalSlides: number }) {
  const [renderedContent, setRenderedContent] = useState<string>('')

  useEffect(() => {
    const renderMermaid = async () => {
      // Check if slide contains mermaid code
      const mermaidMatch = slide.match(/\`\`\`mermaid\n([\s\S]*?)\`\`\`/)
      if (mermaidMatch) {
        try {
          const { svg } = await mermaid.render(`mermaid-slide-${slideNumber}`, mermaidMatch[1])
          // Replace mermaid block with rendered SVG
          const updated = slide.replace(/\`\`\`mermaid\n[\s\S]*?\`\`\`/, `<div class="mermaid-diagram">${svg}</div>`)
          setRenderedContent(updated)
        } catch (err) {
          console.error('Mermaid rendering error:', err)
          setRenderedContent(slide)
        }
      } else {
        setRenderedContent(slide)
      }
    }

    renderMermaid()
  }, [slide, slideNumber])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const code = String(children).replace(/\n$/, '')

              // Skip mermaid blocks as they're handled separately
              if (className === 'language-mermaid') {
                return null
              }

              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ fontSize: '0.9rem' }}
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
            div({ children, ...props }) {
              return <div {...props}>{children}</div>
            },
          }}
        >
          {renderedContent || slide}
        </ReactMarkdown>
      </div>

      {/* Slide number indicator */}
      <div className="mt-auto pt-4 text-center text-sm text-gray-400 font-medium">
        {slideNumber} / {totalSlides}
      </div>
    </div>
  )
}
