'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from './ui/Button'
import html2canvas from 'html2canvas'
import mermaid from 'mermaid'
import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast, ToastContainer } from './ui/Toast'

interface CarouselViewerProps {
  content: string
  title?: string
  linkedinTeaser?: string
}

// Theme definitions
type CarouselTheme = 'classic' | 'academic' | 'modern' | 'elegant' | 'professional'

interface ThemeStyle {
  name: string
  description: string
  background: string
  className: string
  textColor: string
  isDark: boolean
  needsWhiteDiagramBg?: boolean
}

const THEMES: Record<CarouselTheme, ThemeStyle> = {
  classic: {
    name: 'Classic White',
    description: 'Clean white background',
    background: '#ffffff',
    className: 'bg-white',
    textColor: 'text-gray-900',
    isDark: false,
  },
  academic: {
    name: 'Academic Gray',
    description: 'Professional light gray',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
    className: 'bg-gradient-to-br from-gray-50 to-gray-100',
    textColor: 'text-gray-900',
    isDark: false,
  },
  modern: {
    name: 'Modern Blue',
    description: 'Soft blue gradient',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
    className: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    textColor: 'text-gray-900',
    isDark: false,
    needsWhiteDiagramBg: true,
  },
  elegant: {
    name: 'Elegant Pattern',
    description: 'Wavy blue dot pattern',
    background: `
      radial-gradient(ellipse at 10% 30%, rgba(96, 165, 250, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 90% 70%, rgba(147, 197, 253, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 30% 80%, rgba(59, 130, 246, 0.12) 0%, transparent 35%),
      radial-gradient(ellipse at 70% 20%, rgba(191, 219, 254, 0.12) 0%, transparent 35%),
      radial-gradient(circle, rgba(59, 130, 246, 0.35) 1.5px, transparent 1.5px),
      linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)
    `,
    className: 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200',
    textColor: 'text-gray-900',
    isDark: false,
    needsWhiteDiagramBg: true,
  },
  professional: {
    name: 'Professional Dark',
    description: 'Deep dark gradient',
    background: `
      radial-gradient(circle, rgba(100, 80, 200, 0.12) 1px, transparent 1px),
      linear-gradient(135deg, #0a0a1a 0%, #0f0f23 25%, #0c1220 75%, #020617 100%)
    `,
    className: 'bg-gradient-to-br from-gray-950 via-slate-950 to-black',
    textColor: 'text-white',
    isDark: true,
  },
}

// Initialize mermaid once
let isMermaidInitialized = false

export function CarouselViewer({ content, title, linkedinTeaser }: CarouselViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloadingCurrent, setDownloadingCurrent] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<CarouselTheme>('classic')
  const [savingTheme, setSavingTheme] = useState(false)
  const [displayTeaser, setDisplayTeaser] = useState('')
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const { toasts, success: showSuccessToast, closeToast } = useToast()

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

  // Set display teaser (from prop or generate fallback)
  useEffect(() => {
    if (linkedinTeaser) {
      setDisplayTeaser(linkedinTeaser)
    } else if (title) {
      // Fallback: generate teaser if not in database
      const teasers = [
        `Want to learn more about ${title}? 📚`,
        `Curious about ${title}? Swipe through! 👉`,
        `Master ${title} in 5 slides! 💡`,
        `Everything you need to know about ${title} 🚀`,
        `Quick guide to ${title}! Save this for later 🔖`,
      ]
      setDisplayTeaser(teasers[Math.floor(Math.random() * teasers.length)])
    }
  }, [linkedinTeaser, title])

  // Load user's theme preference
  useEffect(() => {
    const loadTheme = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('carousel_theme')
          .eq('user_id', user.id)
          .single()

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase type inference issue
        if (data?.carousel_theme) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          setSelectedTheme(data.carousel_theme as CarouselTheme)
        }
      }
    }

    loadTheme()
  }, [])

  const handleThemeChange = async (theme: CarouselTheme) => {
    setSelectedTheme(theme)
    setSavingTheme(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('user_settings')
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - Supabase type inference issue
          .update({ carousel_theme: theme })
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    } finally {
      setSavingTheme(false)
    }
  }

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

  const nextSlide = useCallback(() => {
    setCurrentSlide((current) => {
      if (current < slides.length - 1) {
        return current + 1
      }
      return current
    })
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((current) => {
      if (current > 0) {
        return current - 1
      }
      return current
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        prevSlide()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextSlide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  const downloadSlideAsWebP = async (index: number, showSlide = false) => {
    const slideElement = slideRefs.current[index]
    if (!slideElement) return

    // Temporarily make the slide visible if it's hidden
    const wasHidden = slideElement.classList.contains('hidden')
    if (wasHidden && showSlide) {
      slideElement.classList.remove('hidden')
      // Wait for render and font loading
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    try {
      const canvas = await html2canvas(slideElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher scale for better quality (results in 3840×2160 for 4K quality)
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1920, // Full HD width (16:9 at 144 DPI)
        windowHeight: 1080, // Full HD height (16:9 at 144 DPI)
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in cloned document
          const clonedElement = clonedDoc.querySelector('[data-slide-content]') as HTMLElement
          if (clonedElement) {
            // Force font rendering and spacing
            clonedElement.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            clonedElement.style.letterSpacing = '0.01em'
            clonedElement.style.wordSpacing = '0.05em'

            // Fix all text elements
            const textElements = clonedElement.querySelectorAll('h2, h3, p, li, th, td, span')
            textElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement
              htmlEl.style.letterSpacing = '0.01em'
              htmlEl.style.wordSpacing = '0.05em'
            })
          }
        }
      })

      // Hide the slide again if it was hidden
      if (wasHidden && showSlide) {
        slideElement.classList.add('hidden')
      }

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
      // Make sure to unhide if there was an error
      if (wasHidden && showSlide) {
        slideElement.classList.add('hidden')
      }
      throw error
    }
  }

  const handleDownloadCurrent = async () => {
    setDownloadingCurrent(true)
    try {
      await downloadSlideAsWebP(currentSlide, false)
    } catch {
      alert('Failed to download slide. Please try again.')
    } finally {
      setDownloadingCurrent(false)
    }
  }

  const handleDownloadAll = async () => {
    setDownloadingAll(true)
    try {
      for (let i = 0; i < slides.length; i++) {
        await downloadSlideAsWebP(i, true)
        // Add small delay between downloads
        if (i < slides.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
      }
    } catch {
      alert('Failed to download all slides. Some slides may not have been downloaded.')
    } finally {
      setDownloadingAll(false)
    }
  }

  const copyTeaserText = () => {
    if (displayTeaser) {
      navigator.clipboard.writeText(displayTeaser)
      showSuccessToast('Teaser text copied to clipboard!', 3000)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <div className="space-y-6">
        {/* Theme Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Slide Theme</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(THEMES) as CarouselTheme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              disabled={savingTheme}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${selectedTheme === theme
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'}
                ${savingTheme ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div
                className={`h-12 rounded mb-2 ${THEMES[theme].className} border border-gray-200`}
                style={{
                  background: THEMES[theme].background,
                  backgroundSize: '40px 40px'
                }}
              />
              <div className="font-medium text-sm text-gray-900">{THEMES[theme].name}</div>
              <div className="text-xs text-gray-500">{THEMES[theme].description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* LinkedIn Teaser Text */}
      {displayTeaser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn Post Ready
              </h3>
              <p className="text-base text-blue-800 font-medium mb-3">{displayTeaser}</p>
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

          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-gray-700">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
              Use ← → arrow keys to navigate
            </span>
          </div>

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
            onClick={handleDownloadCurrent}
            disabled={downloadingCurrent || downloadingAll}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloadingCurrent ? 'Downloading...' : 'Download Current'}
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadAll}
            disabled={downloadingCurrent || downloadingAll}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {downloadingAll ? 'Downloading All...' : 'Download All Slides'}
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="relative flex justify-center w-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(el) => { slideRefs.current[index] = el }}
            className={`
              ${THEMES[selectedTheme].className} rounded-lg shadow-lg overflow-hidden
              ${index === currentSlide ? 'block' : 'hidden'}
            `}
            style={{
              width: '100%',
              maxWidth: '1280px',
              aspectRatio: '16/9', // Enforce 16:9 landscape ratio
              background: THEMES[selectedTheme].background,
              backgroundSize: '15px 15px, 100%',
            }}
          >
            <SlideContent
              slide={slide}
              slideNumber={index + 1}
              totalSlides={slides.length}
              theme={THEMES[selectedTheme]}
            />
          </div>
        ))}
      </div>

      {/* Slide Thumbnails */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">All Slides</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`
                relative aspect-[16/9] rounded-lg border-2 overflow-hidden
                transition-all hover:shadow-md
                ${currentSlide === index
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 p-2 text-[0.5rem] overflow-hidden">
                <SlideThumbnail slide={slide} slideNumber={index + 1} />
              </div>
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}

// Separate component for slide content rendering
function SlideContent({ slide, slideNumber, totalSlides, theme }: { slide: string; slideNumber: number; totalSlides: number; theme: ThemeStyle }) {
  const [processedContent, setProcessedContent] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processSlide = async () => {
      setIsProcessing(true)

      // Find all mermaid code blocks
      const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
      const matches = Array.from(slide.matchAll(mermaidRegex))

      if (matches.length === 0) {
        setProcessedContent(slide)
        setIsProcessing(false)
        return
      }

      let processed = slide

      // Replace each mermaid block with a placeholder div
      for (let i = 0; i < matches.length; i++) {
        const diagramId = `diagram-${slideNumber}-${i}`
        try {
          const { svg } = await mermaid.render(`mermaid-${diagramId}`, matches[i][1])

          // Store SVG and create placeholder
          const placeholder = `<div id="${diagramId}" class="mermaid-rendered" data-svg="${encodeURIComponent(svg)}" data-is-dark="${theme.isDark}" data-needs-white-bg="${theme.needsWhiteDiagramBg || false}"></div>`
          processed = processed.replace(matches[i][0], placeholder)
        } catch (err) {
          console.error('Mermaid rendering error:', err)
          processed = processed.replace(matches[i][0], `<div class="text-red-500">Error rendering diagram</div>`)
        }
      }

      setProcessedContent(processed)
      setIsProcessing(false)
    }

    processSlide()
  }, [slide, slideNumber, theme])

  if (isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading slide...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-14" data-slide-content>
      {/* Content area with constrained height */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h2: ({ children }: { children?: ReactNode }) => (
                <h2 className={`text-[2.5rem] leading-tight font-bold ${theme.textColor} mb-6 tracking-tight`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</h2>
              ),
              h3: ({ children }: { children?: ReactNode }) => (
                <h3 className={`text-[1.75rem] leading-snug font-semibold ${theme.textColor} mb-4 tracking-tight`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</h3>
              ),
              p: ({ children }: { children?: ReactNode }) => (
                <p className={`text-[1.25rem] leading-relaxed ${theme.textColor} mb-4`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em', lineHeight: '1.8' }}>{children}</p>
              ),
              ul: ({ children }: { children?: ReactNode }) => (
                <ul className={`text-[1.25rem] ${theme.textColor} space-y-3 mb-5 list-disc pl-8`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</ul>
              ),
              li: ({ children }: { children?: ReactNode }) => (
                <li className="leading-relaxed" style={{ lineHeight: '1.8' }}>{children}</li>
              ),
              table: ({ children }: { children?: ReactNode }) => (
                <div className="my-6 overflow-x-auto">
                  <table className={`w-full border-collapse ${theme.isDark ? 'border-gray-600' : 'border-gray-300'}`} style={{ maxWidth: '100%' }}>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }: { children?: ReactNode }) => (
                <thead className={`${theme.isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{children}</thead>
              ),
              tbody: ({ children }: { children?: ReactNode }) => (
                <tbody>{children}</tbody>
              ),
              tr: ({ children }: { children?: ReactNode }) => (
                <tr className={`border-b ${theme.isDark ? 'border-gray-700' : 'border-gray-200'}`}>{children}</tr>
              ),
              th: ({ children }: { children?: ReactNode }) => (
                <th className={`px-5 py-3 text-left text-[1.125rem] font-semibold ${theme.textColor}`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</th>
              ),
              td: ({ children }: { children?: ReactNode }) => (
                <td className={`px-5 py-3 text-[1.125rem] ${theme.textColor}`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</td>
              ),
              code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: ReactNode }) {
                const match = /language-(\w+)/.exec(className || '')
                const code = String(children).replace(/\n$/, '')

                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ fontSize: '0.95rem', maxHeight: '350px' }}
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
              // Render HTML divs (for mermaid placeholders)
              div({ className, ...props }: { className?: string; 'data-svg'?: string; 'data-is-dark'?: string; 'data-needs-white-bg'?: string }) {
                if (className === 'mermaid-rendered') {
                  const svgData = props['data-svg']
                  const isDark = props['data-is-dark'] === 'true'
                  const needsWhiteBg = props['data-needs-white-bg'] === 'true'

                  if (svgData) {
                    let svg = decodeURIComponent(svgData)

                    // Wrap in white background for dark themes or themes that need white diagram backgrounds
                    if (isDark || needsWhiteBg) {
                      // Inject white background and constrain SVG size with fixed dimensions
                      svg = svg.replace(
                        '<svg',
                        '<svg style="max-width: 95%; max-height: 400px; min-height: 250px; height: auto; width: auto; background: white; padding: 24px; border-radius: 8px; display: block; margin: 0 auto;"'
                      )

                      return (
                        <div
                          className="flex justify-center items-center my-6"
                          style={{ maxHeight: '450px', minHeight: '300px', overflow: 'hidden' }}
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      )
                    }

                    // For other light themes, just constrain size with fixed dimensions
                    svg = svg.replace(
                      '<svg',
                      '<svg style="max-width: 95%; max-height: 400px; min-height: 250px; height: auto; width: auto; display: block; margin: 0 auto;"'
                    )

                    return (
                      <div
                        className="flex justify-center items-center my-6"
                        style={{ maxHeight: '450px', minHeight: '300px', overflow: 'hidden' }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    )
                  }
                }
                return <div className={className} {...props} />
              },
            } as Partial<Components>}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Slide number indicator */}
      <div className="mt-5 text-center">
        <span className={`text-lg ${theme.isDark ? 'text-gray-300' : 'text-gray-400'} font-medium`}>
          {slideNumber} / {totalSlides}
        </span>
      </div>
    </div>
  )
}

// Thumbnail preview component
function SlideThumbnail({ slide, slideNumber }: { slide: string; slideNumber: number }) {
  const [processedContent, setProcessedContent] = useState<string>('')

  useEffect(() => {
    const processSlide = async () => {
      const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
      const matches = Array.from(slide.matchAll(mermaidRegex))

      if (matches.length === 0) {
        setProcessedContent(slide)
        return
      }

      let processed = slide

      for (let i = 0; i < matches.length; i++) {
        try {
          const { svg } = await mermaid.render(`mermaid-thumb-${slideNumber}-${i}`, matches[i][1])
          const placeholder = `<div class="mermaid-rendered-thumb" data-svg="${encodeURIComponent(svg)}"></div>`
          processed = processed.replace(matches[i][0], placeholder)
        } catch (err) {
          console.error('Mermaid thumbnail rendering error:', err)
          processed = processed.replace(matches[i][0], '')
        }
      }

      setProcessedContent(processed)
    }

    processSlide()
  }, [slide, slideNumber])

  return (
    <div className="prose prose-xs max-w-none text-[0.45rem] leading-tight">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children }: { children?: ReactNode }) => <div className="font-bold mb-0.5">{children}</div>,
          h2: ({ children }: { children?: ReactNode }) => <div className="font-bold mb-0.5">{children}</div>,
          h3: ({ children }: { children?: ReactNode }) => <div className="font-semibold mb-0.5">{children}</div>,
          p: ({ children }: { children?: ReactNode }) => <div className="mb-0.5">{children}</div>,
          ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-2 mb-0.5 space-y-0">{children}</ul>,
          ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-2 mb-0.5 space-y-0">{children}</ol>,
          li: ({ children }: { children?: ReactNode }) => <li className="mb-0">{children}</li>,
          code: ({ children }: { children?: ReactNode }) => <code className="text-[0.4rem]">{children}</code>,
          div({ className, ...props }: { className?: string; 'data-svg'?: string }) {
            if (className === 'mermaid-rendered-thumb') {
              const svgData = props['data-svg']
              if (svgData) {
                let svg = decodeURIComponent(svgData)

                // Scale down for thumbnail
                svg = svg.replace(
                  '<svg',
                  '<svg style="max-width: 100%; max-height: 80px; height: auto; width: auto;"'
                )

                return (
                  <div
                    className="my-0.5 flex justify-center items-center"
                    style={{ maxHeight: '80px', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                )
              }
            }
            return <div className={className} {...props} />
          },
        } as Partial<Components>}
      >
        {processedContent || slide}
      </ReactMarkdown>
    </div>
  )
}
