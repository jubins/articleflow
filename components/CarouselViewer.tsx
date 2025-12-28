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
import md5 from 'md5'

interface CarouselViewerProps {
  content: string
  title?: string
  linkedinTeaser?: string
  articleId?: string
  cachedDiagrams?: Record<string, string> // Map of diagram cache keys to URLs
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
      radial-gradient(circle, rgba(59, 130, 246, 0.5) 2px, transparent 2px),
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

// Helper function to inline all computed styles for SVG elements
function inlineSvgStyles(svg: SVGElement): { svg: SVGElement; hasContent: boolean } {
  const clone = svg.cloneNode(true) as SVGElement

  // Check if SVG has any text content
  const textElements = clone.querySelectorAll('text, tspan')
  const hasTextContent = Array.from(textElements).some(el => el.textContent?.trim())

  if (!hasTextContent) {
    console.warn('SVG has no text content - may be incomplete')
    return { svg: clone, hasContent: false }
  }

  // Process all style tags and apply inline
  const styleTags = clone.querySelectorAll('style')
  const cssRules: { selector: string; rules: string }[] = []

  styleTags.forEach(styleTag => {
    const cssText = styleTag.textContent || ''
    // Parse CSS rules (basic parser for simple selectors)
    const ruleMatches = Array.from(cssText.matchAll(/([^{]+)\{([^}]+)\}/g))
    for (const match of ruleMatches) {
      const selector = match[1].trim()
      const rules = match[2].trim()
      cssRules.push({ selector, rules })
    }
  })

  // Get all elements and inline their computed styles
  const allElements = clone.querySelectorAll('*')
  const sourceElements = svg.querySelectorAll('*')

  allElements.forEach((element, index) => {
    const sourceElement = sourceElements[index]
    if (!sourceElement) return

    const computedStyle = window.getComputedStyle(sourceElement)
    const tagName = element.tagName.toLowerCase()

    // Comprehensive list of SVG properties to preserve
    const svgProperties = [
      // Text properties
      'font-family', 'font-size', 'font-weight', 'font-style',
      'text-anchor', 'dominant-baseline', 'text-decoration',
      'letter-spacing', 'word-spacing', 'line-height',
      // Color and fill
      'fill', 'stroke', 'color',
      // Stroke properties
      'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'stroke-dasharray', 'stroke-opacity',
      // General properties
      'opacity', 'visibility', 'display',
      // Transform
      'transform', 'transform-origin',
    ]

    const styles: Record<string, string> = {}

    // Get computed styles
    svgProperties.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop)
      if (value && value !== '' && value !== 'none' && value !== 'normal') {
        styles[prop] = value
      }
    })

    // Apply CSS rules that match this element
    cssRules.forEach(({ selector, rules }) => {
      // Simple selector matching (handles .class, #id, tag)
      if (
        (selector.startsWith('.') && element.classList.contains(selector.slice(1))) ||
        (selector.startsWith('#') && element.id === selector.slice(1)) ||
        (selector === tagName)
      ) {
        const rulePairs = rules.split(';').filter(r => r.trim())
        rulePairs.forEach(pair => {
          const [prop, value] = pair.split(':').map(s => s.trim())
          if (prop && value) {
            styles[prop] = value
          }
        })
      }
    })

    // Build style string
    const existingStyle = (element as HTMLElement).getAttribute('style') || ''
    const newStyles = Object.entries(styles)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';')

    if (newStyles) {
      (element as HTMLElement).setAttribute('style',
        existingStyle ? `${existingStyle};${newStyles}` : newStyles
      )
    }

    // Ensure text elements have explicit fill color
    if (tagName === 'text' || tagName === 'tspan') {
      const currentStyle = (element as HTMLElement).getAttribute('style') || ''
      if (!currentStyle.includes('fill:')) {
        const fillColor = computedStyle.fill || computedStyle.color || '#000000'
        ;(element as HTMLElement).setAttribute('style', `${currentStyle};fill:${fillColor}`)
      }
    }
  })

  // Remove style tags as they're now inlined
  styleTags.forEach(tag => tag.remove())

  return { svg: clone, hasContent: true }
}

export function CarouselViewer({ content, title, linkedinTeaser, articleId, cachedDiagrams = {} }: CarouselViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [downloadingCurrent, setDownloadingCurrent] = useState(false)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingPPTX, setDownloadingPPTX] = useState(false)
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

    // Store original SVGs to restore later
    const svgReplacements: Array<{ container: HTMLElement; originalSvg: SVGElement; img: HTMLImageElement; url: string }> = []

    try {
      // Step 1: Find all SVG diagrams and upload to R2
      const svgElements = slideElement.querySelectorAll('svg')

      if (svgElements.length > 0) {
        console.log(`Found ${svgElements.length} diagrams to upload to R2`)

        // Upload all diagrams to R2 in parallel
        const uploadPromises = Array.from(svgElements).map(async (svg, svgIndex) => {
          try {
            // Clone SVG and inline all computed styles
            const { svg: styledSvg, hasContent } = inlineSvgStyles(svg)

            // Skip uploading if diagram has no content
            if (!hasContent) {
              console.warn(`Skipping diagram ${svgIndex + 1} - no text content found`)
              return null
            }

            // Get mermaid code from SVG data attribute for consistent hashing
            const mermaidCode = svg.getAttribute('data-mermaid-code')
            if (mermaidCode) {
              // Decode the mermaid code
              const decodedCode = decodeURIComponent(mermaidCode)
              console.log(`Found mermaid code for diagram ${svgIndex + 1}, will use for consistent naming`)

              // Serialize SVG to string
              const serializer = new XMLSerializer()
              const svgString = serializer.serializeToString(styledSvg)

              // Upload to R2 with mermaid code for hash generation
              const response = await fetch('/api/carousel/diagrams/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  svg: svgString,
                  slideIndex: index,
                  articleId,
                  mermaidCode: decodedCode, // Pass mermaid code for consistent hash
                }),
              })

              if (!response.ok) {
                throw new Error(`Failed to upload diagram: ${response.statusText}`)
              }

              const { url } = await response.json()
              console.log(`Uploaded diagram ${svgIndex + 1} to R2:`, url)

              // Create img element to replace SVG
              const img = document.createElement('img')
              img.src = url

              // Get computed dimensions from SVG
              const computedMaxWidth = svg.style.maxWidth || '70%'
              const computedMaxHeight = svg.style.maxHeight || '200px'

              // Set dimensions explicitly for better rendering
              img.style.maxWidth = computedMaxWidth
              img.style.maxHeight = computedMaxHeight
              img.style.width = 'auto'
              img.style.height = 'auto'
              img.style.display = 'block'
              img.style.margin = '0 auto'
              img.style.objectFit = 'contain'

              // Copy other styles if present
              if (svg.style.background) img.style.background = svg.style.background
              if (svg.style.padding) img.style.padding = svg.style.padding
              if (svg.style.borderRadius) img.style.borderRadius = svg.style.borderRadius

              // Wait for image to load with proper timeout handling
              await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                  console.error(`Image ${svgIndex + 1} load timeout`)
                  reject(new Error('Image load timeout'))
                }, 10000)

                img.onload = () => {
                  clearTimeout(timeoutId)
                  console.log(`Image ${svgIndex + 1} loaded successfully (${img.naturalWidth}x${img.naturalHeight})`)
                  resolve()
                }

                img.onerror = (err) => {
                  clearTimeout(timeoutId)
                  console.error(`Image ${svgIndex + 1} failed to load:`, err)
                  reject(new Error('Image load failed'))
                }
              })

              return { svg, img, url }
            } else {
              console.warn(`No mermaid code found for diagram ${svgIndex + 1}, falling back to SVG hash`)

              // Fallback: use SVG string for hash
              const serializer = new XMLSerializer()
              const svgString = serializer.serializeToString(styledSvg)

              // Upload to R2
              const response = await fetch('/api/carousel/diagrams/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  svg: svgString,
                  slideIndex: index,
                  articleId,
                }),
              })

              if (!response.ok) {
                throw new Error(`Failed to upload diagram: ${response.statusText}`)
              }

              const { url } = await response.json()
              console.log(`Uploaded diagram ${svgIndex + 1} to R2:`, url)

              // Create img element to replace SVG
              const img = document.createElement('img')
              img.src = url

              // Get computed dimensions from SVG
              const computedMaxWidth = svg.style.maxWidth || '70%'
              const computedMaxHeight = svg.style.maxHeight || '200px'

              // Set dimensions explicitly for better rendering
              img.style.maxWidth = computedMaxWidth
              img.style.maxHeight = computedMaxHeight
              img.style.width = 'auto'
              img.style.height = 'auto'
              img.style.display = 'block'
              img.style.margin = '0 auto'
              img.style.objectFit = 'contain'

              // Copy other styles if present
              if (svg.style.background) img.style.background = svg.style.background
              if (svg.style.padding) img.style.padding = svg.style.padding
              if (svg.style.borderRadius) img.style.borderRadius = svg.style.borderRadius

              // Wait for image to load with proper timeout handling
              await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                  console.error(`Image ${svgIndex + 1} load timeout`)
                  reject(new Error('Image load timeout'))
                }, 10000)

                img.onload = () => {
                  clearTimeout(timeoutId)
                  console.log(`Image ${svgIndex + 1} loaded successfully (${img.naturalWidth}x${img.naturalHeight})`)
                  resolve()
                }

                img.onerror = (err) => {
                  clearTimeout(timeoutId)
                  console.error(`Image ${svgIndex + 1} failed to load:`, err)
                  reject(new Error('Image load failed'))
                }
              })

              return { svg, img, url }
            }
          } catch (error) {
            console.error(`Failed to upload diagram ${svgIndex + 1}:`, error)
            return null
          }
        })

        const results = await Promise.all(uploadPromises)

        // Step 2: Replace SVGs with img tags
        results.forEach(result => {
          if (result) {
            const { svg, img, url } = result
            const container = svg.parentElement
            if (container) {
              container.replaceChild(img, svg)
              svgReplacements.push({ container, originalSvg: svg, img, url })
              console.log(`Replaced SVG ${svgReplacements.length} with image from R2`)
            }
          }
        })

        // Wait longer for DOM to settle and images to render properly
        console.log(`Waiting for ${svgReplacements.length} images to settle in DOM...`)
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Double-check all images are loaded and visible
        svgReplacements.forEach(({ img }, index) => {
          if (!img.complete || !img.naturalHeight) {
            console.warn(`Image ${index + 1} may not be fully loaded:`, {
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            })
          } else {
            console.log(`Image ${index + 1} confirmed loaded: ${img.naturalWidth}×${img.naturalHeight}`)
          }
        })
      }

      // Step 3: Get the element's actual dimensions for consistent capture
      const rect = slideElement.getBoundingClientRect()

      // Use the actual rendered dimensions of the slide element
      // This ensures we capture exactly what's visible without excess whitespace
      const targetWidth = Math.round(rect.width)
      const targetHeight = Math.round(rect.height)

      // Step 4: Capture slide with html2canvas using actual dimensions
      const canvas = await html2canvas(slideElement, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher scale for better quality (3x native resolution)
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: targetWidth,
        height: targetHeight,
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

            // Ensure all images are visible and have proper dimensions
            const imgElements = clonedElement.querySelectorAll('img')
            imgElements.forEach((img: HTMLImageElement) => {
              img.style.visibility = 'visible'
              img.style.display = 'block'
              img.style.opacity = '1'
            })

            // Ensure tables are visible with proper styling
            const tableElements = clonedElement.querySelectorAll('table')
            tableElements.forEach((table: HTMLTableElement) => {
              table.style.visibility = 'visible'
              table.style.display = 'table'
              table.style.opacity = '1'
            })

            // Ensure SVG diagrams (if any remain) are visible
            const svgElements = clonedElement.querySelectorAll('svg')
            svgElements.forEach((svg: SVGElement) => {
              svg.style.visibility = 'visible'
              svg.style.display = 'block'
              svg.style.opacity = '1'
            })
          }
        }
      })

      // Step 5: Restore original SVGs
      svgReplacements.forEach(({ container, originalSvg, img }) => {
        container.replaceChild(originalSvg, img)
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

      // Restore SVGs in case of error
      svgReplacements.forEach(({ container, originalSvg, img }) => {
        try {
          container.replaceChild(originalSvg, img)
        } catch (e) {
          console.error('Failed to restore SVG:', e)
        }
      })

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

  const handleDownloadPPTX = async () => {
    setDownloadingPPTX(true)
    try {
      console.log('Exporting carousel to PPTX...')

      const response = await fetch('/api/carousel/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          theme: selectedTheme,
          title: title || 'LinkedIn Carousel',
          linkedinTeaser: displayTeaser,
          articleId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to generate PPTX')
      }

      // Download the PPTX file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = title
        ? `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pptx`
        : 'carousel-presentation.pptx'
      link.click()
      URL.revokeObjectURL(url)

      showSuccessToast('PowerPoint presentation downloaded successfully!', 3000)
    } catch (error) {
      console.error('Error downloading PPTX:', error)
      alert(error instanceof Error ? error.message : 'Failed to download PPTX. Please try again.')
    } finally {
      setDownloadingPPTX(false)
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
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="w-10 h-10 p-0 flex items-center justify-center"
              title="Previous slide (← key)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            <div className="flex flex-col items-center px-4">
              <span className="text-sm font-medium text-gray-700">
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <span className="text-xs text-gray-500">
                Use ← → keys
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              className="w-10 h-10 p-0 flex items-center justify-center"
              title="Next slide (→ key)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCurrent}
              disabled={downloadingCurrent || downloadingAll || downloadingPPTX}
              title="Download current slide as image"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloadingCurrent ? 'Saving...' : 'Current'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={downloadingCurrent || downloadingAll || downloadingPPTX}
              title="Download all slides as images"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              {downloadingAll ? 'Saving...' : 'All Slides'}
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadPPTX}
              disabled={downloadingCurrent || downloadingAll || downloadingPPTX}
              title="Download as PowerPoint presentation"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {downloadingPPTX ? 'Generating...' : 'PowerPoint'}
            </Button>
          </div>
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
              backgroundSize: '100%, 100%, 100%, 100%, 20px 20px, 100%',
            }}
          >
            <SlideContent
              slide={slide}
              slideNumber={index + 1}
              totalSlides={slides.length}
              theme={THEMES[selectedTheme]}
              cachedDiagrams={cachedDiagrams}
              articleId={articleId}
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
function SlideContent({ slide, slideNumber, totalSlides, theme, cachedDiagrams = {}, articleId }: { slide: string; slideNumber: number; totalSlides: number; theme: ThemeStyle; cachedDiagrams?: Record<string, string>; articleId?: string }) {
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
        const diagramCode = matches[i][1]

        // Check if we have a cached diagram URL
        // Use MD5 hash (matching server-side implementation)
        const hash = md5(diagramCode).substring(0, 8)
        const cacheKey = `mermaid-${hash}`
        const cachedUrl = cachedDiagrams[cacheKey]

        if (cachedUrl) {
          console.log(`✓ Using cached diagram URL for ${cacheKey}:`, cachedUrl)
          // Replace with cached image instead of rendering
          const placeholder = `<div id="${diagramId}" class="mermaid-rendered" data-svg="" data-cached-url="${encodeURIComponent(cachedUrl)}" data-mermaid-code="${encodeURIComponent(diagramCode)}" data-is-dark="${theme.isDark}" data-needs-white-bg="${theme.needsWhiteDiagramBg || false}" data-is-portrait="false"></div>`
          processed = processed.replace(matches[i][0], placeholder)
          continue
        }

        try {
          const { svg } = await mermaid.render(`mermaid-${diagramId}`, diagramCode)

          // Parse SVG to detect orientation
          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
          const svgElement = svgDoc.querySelector('svg')

          let isPortrait = false
          if (svgElement) {
            const viewBox = svgElement.getAttribute('viewBox')
            if (viewBox) {
              const [, , width, height] = viewBox.split(' ').map(Number)
              const aspectRatio = width / height
              isPortrait = aspectRatio < 0.9 // Portrait if height > width (aspect ratio < 1)
            }
          }

          // Store SVG and create placeholder with orientation data and original mermaid code
          const placeholder = `<div id="${diagramId}" class="mermaid-rendered" data-svg="${encodeURIComponent(svg)}" data-mermaid-code="${encodeURIComponent(diagramCode)}" data-is-dark="${theme.isDark}" data-needs-white-bg="${theme.needsWhiteDiagramBg || false}" data-is-portrait="${isPortrait}"></div>`
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
    // Note: cachedDiagrams is intentionally NOT in dependencies to avoid infinite re-renders
    // It's only used as a lookup during processing, not as a render trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, slideNumber, theme])

  // Auto-upload diagrams to R2 after rendering (for PPTX export)
  useEffect(() => {
    if (!processedContent || !articleId) return

    const uploadDiagramsInBackground = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Find all rendered SVG diagrams with mermaid code
      const svgElements = document.querySelectorAll(`[data-slide-content] svg[data-mermaid-code]`)

      if (svgElements.length === 0) return

      console.log(`[Auto-upload] Found ${svgElements.length} diagrams to upload in background`)

      // Upload each diagram
      for (let i = 0; i < svgElements.length; i++) {
        const svg = svgElements[i] as SVGElement
        const mermaidCode = svg.getAttribute('data-mermaid-code')

        if (!mermaidCode) continue

        try {
          const decodedCode = decodeURIComponent(mermaidCode)

          // Inline styles and serialize
          const { svg: styledSvg, hasContent } = inlineSvgStyles(svg)

          if (!hasContent) {
            console.warn(`[Auto-upload] Skipping diagram ${i + 1} - no content`)
            continue
          }

          const serializer = new XMLSerializer()
          const svgString = serializer.serializeToString(styledSvg)

          // Upload to R2
          console.log(`[Auto-upload] Uploading diagram ${i + 1}/${svgElements.length}`)

          const response = await fetch('/api/carousel/diagrams/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              svg: svgString,
              slideIndex: slideNumber - 1,
              articleId,
              mermaidCode: decodedCode,
            }),
          })

          if (response.ok) {
            const { url } = await response.json()
            console.log(`[Auto-upload] ✓ Diagram ${i + 1} uploaded:`, url)
          } else {
            console.warn(`[Auto-upload] Failed to upload diagram ${i + 1}:`, response.statusText)
          }
        } catch (error) {
          console.error(`[Auto-upload] Error uploading diagram ${i + 1}:`, error)
        }
      }

      console.log(`[Auto-upload] Finished uploading ${svgElements.length} diagrams`)
    }

    uploadDiagramsInBackground()
  }, [processedContent, articleId, slideNumber])

  if (isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading slide...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-12" data-slide-content>
      {/* Content area with constrained height */}
      <div className="flex-1 overflow-visible flex flex-col">
        <div className="h-full overflow-visible">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h2: ({ children }: { children?: ReactNode }) => (
                <h2 className={`text-[1.5rem] leading-tight font-bold ${theme.textColor} mb-2.5 tracking-tight`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</h2>
              ),
              h3: ({ children }: { children?: ReactNode }) => (
                <h3 className={`text-[1.15rem] leading-snug font-semibold ${theme.textColor} mb-2 tracking-tight`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</h3>
              ),
              p: ({ children }: { children?: ReactNode }) => (
                <p className={`text-[0.95rem] leading-relaxed ${theme.textColor} mb-2`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em', lineHeight: '1.45' }}>{children}</p>
              ),
              ul: ({ children }: { children?: ReactNode }) => (
                <ul className={`text-[0.95rem] ${theme.textColor} space-y-1.5 mb-2.5 list-disc pl-6`} style={{ letterSpacing: '0.01em', wordSpacing: '0.05em' }}>{children}</ul>
              ),
              li: ({ children }: { children?: ReactNode }) => (
                <li className="leading-relaxed" style={{ lineHeight: '1.45' }}>{children}</li>
              ),
              table: ({ children }: { children?: ReactNode }) => (
                <div className="my-3 overflow-x-auto">
                  <table
                    className="w-full border-collapse"
                    style={{
                      maxWidth: '100%',
                      border: `1px solid ${theme.isDark ? '#9ca3af' : '#6b7280'}`,
                    }}
                  >
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
                <tr style={{ borderBottom: `1px solid ${theme.isDark ? '#9ca3af' : '#6b7280'}` }}>{children}</tr>
              ),
              th: ({ children }: { children?: ReactNode }) => (
                <th
                  className={`px-3 py-1.5 text-left text-[0.9rem] font-semibold ${theme.textColor}`}
                  style={{
                    letterSpacing: '0.01em',
                    wordSpacing: '0.05em',
                    border: `1px solid ${theme.isDark ? '#9ca3af' : '#6b7280'}`,
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }: { children?: ReactNode }) => (
                <td
                  className={`px-3 py-1.5 text-[0.9rem] ${theme.textColor}`}
                  style={{
                    letterSpacing: '0.01em',
                    wordSpacing: '0.05em',
                    border: `1px solid ${theme.isDark ? '#9ca3af' : '#6b7280'}`,
                  }}
                >
                  {children}
                </td>
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
              div({ className, ...props }: { className?: string; 'data-svg'?: string; 'data-cached-url'?: string; 'data-mermaid-code'?: string; 'data-is-dark'?: string; 'data-needs-white-bg'?: string; 'data-is-portrait'?: string }) {
                if (className === 'mermaid-rendered') {
                  const svgData = props['data-svg']
                  const cachedUrl = props['data-cached-url']
                  const mermaidCode = props['data-mermaid-code']
                  const isDark = props['data-is-dark'] === 'true'
                  const needsWhiteBg = props['data-needs-white-bg'] === 'true'
                  const isPortrait = props['data-is-portrait'] === 'true'

                  // If we have a cached URL, render img tag instead of SVG
                  if (cachedUrl) {
                    const url = decodeURIComponent(cachedUrl)
                    const maxWidth = isPortrait ? '55%' : '70%'
                    const maxHeight = isPortrait ? '240px' : '200px'

                    return (
                      <div className="flex justify-center items-center my-2" style={{ maxHeight: isPortrait ? '260px' : '220px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Diagram"
                          data-mermaid-code={mermaidCode}
                          style={{
                            maxWidth,
                            maxHeight,
                            height: 'auto',
                            width: 'auto',
                            display: 'block',
                            margin: '0 auto',
                            ...(isDark || needsWhiteBg ? {
                              background: 'white',
                              padding: '8px',
                              borderRadius: '6px',
                            } : {})
                          }}
                        />
                      </div>
                    )
                  }

                  if (svgData) {
                    let svg = decodeURIComponent(svgData)

                    // Add mermaid code as data attribute to SVG for later use during download
                    if (mermaidCode) {
                      svg = svg.replace(
                        '<svg',
                        `<svg data-mermaid-code="${mermaidCode}"`
                      )
                    }

                    // Portrait diagrams: smaller size for text balance
                    // Landscape diagrams: wider but shorter for better fit
                    const maxWidth = isPortrait ? '55%' : '70%'
                    const maxHeight = isPortrait ? '240px' : '200px'

                    // Wrap in white background for dark themes or themes that need white diagram backgrounds
                    if (isDark || needsWhiteBg) {
                      svg = svg.replace(
                        '<svg',
                        `<svg style="max-width: ${maxWidth}; max-height: ${maxHeight}; height: auto; width: auto; background: white; padding: 8px; border-radius: 6px; display: block; margin: 0 auto;"`
                      )

                      return (
                        <div
                          className="flex justify-center items-center my-2"
                          style={{ maxHeight: isPortrait ? '260px' : '220px' }}
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      )
                    }

                    // For other light themes
                    svg = svg.replace(
                      '<svg',
                      `<svg style="max-width: ${maxWidth}; max-height: ${maxHeight}; height: auto; width: auto; display: block; margin: 0 auto;"`
                    )

                    return (
                      <div
                        className="flex justify-center items-center my-2"
                        style={{ maxHeight: isPortrait ? '260px' : '220px' }}
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
