import mermaid from 'mermaid'

/**
 * Mermaid initialization guard and config
 * This is client-safe (no Node.js dependencies)
 */
let initialized = false

export function initMermaid() {
  if (initialized) return

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

  initialized = true
}

/**
 * Renders Mermaid code to SVG (client-side safe)
 */
export async function renderMermaidToSvg(
  mermaidCode: string,
  renderId: string
): Promise<string> {
  initMermaid()
  const { svg } = await mermaid.render(renderId, mermaidCode)
  return svg
}
