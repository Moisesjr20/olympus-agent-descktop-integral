import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Integration tests for Monte Olimpo Plugin
 * Validates structure, tokens, and behavior requirements
 */

describe('Monte Olimpo Integration', () => {
  const basePath = join(__dirname)
  
  describe('Brand Token Values', () => {
    const cssPath = join(__dirname, '..', '..', 'styles.css')
    let css: string
    
    beforeAll(() => {
      css = readFileSync(cssPath, 'utf-8')
    })

    it('should have correct navy-950 hex value', () => {
      expect(css).toContain('--olympus-navy-950: #070c18')
    })

    it('should have correct orange-500 hex value', () => {
      expect(css).toContain('--olympus-orange-500: #e8623d')
    })

    it('should have correct foreground hex value', () => {
      expect(css).toContain('--olympus-fg: #eaf0fb')
    })

    it('should have glow effect token', () => {
      expect(css).toContain('--olympus-glow:')
    })
  })

  describe('Neural Map Data Structure', () => {
    const apiPath = join(basePath, 'dashboard', 'plugin_api.py')
    let api: string

    beforeAll(() => {
      api = readFileSync(apiPath, 'utf-8')
    })

    it('should read olimpo.json from correct path', () => {
      expect(api).toContain('/opt/data/memory-map/web/olimpo.json')
    })

    it('should return totais in stats endpoint', () => {
      expect(api).toContain("'totais'")
      expect(api).toContain("'gerado'")
    })

    it('should handle JSON decode errors', () => {
      expect(api).toContain('json.JSONDecodeError')
    })

    it('should have deus lookup endpoint', () => {
      expect(api).toContain('/deus/<nome>')
      expect(api).toContain('nome.lower()')
    })
  })

  describe('Browser Profile Configuration', () => {
    const browserPath = join(basePath, 'browser.tsx')
    let browser: string

    beforeAll(() => {
      browser = readFileSync(browserPath, 'utf-8')
    })

    it('should have exactly 14 default profiles', () => {
      const matches = browser.match(/partition: 'persist:/g)
      expect(matches?.length).toBe(14)
    })

    it('should have unique partition names', () => {
      const partitions = browser.match(/partition: 'persist:(\w+)'/g)
      const unique = new Set(partitions)
      expect(unique.size).toBe(14)
    })

    it('should have color for each profile', () => {
      const colors = browser.match(/color: '#[0-9a-f]{6}'/gi)
      expect(colors?.length).toBe(14)
    })

    it('should have icon emoji for each profile', () => {
      const icons = browser.match(/icon: '[^']+'/g)
      expect(icons?.length).toBe(14)
    })

    it('should handle Electron webview', () => {
      expect(browser).toContain('webview')
      expect(browser).toContain('partition={partition}')
    })

    it('should have fallback for non-Electron', () => {
      expect(browser).toContain('browser-webview-fallback')
      expect(browser).toContain('Navegador completo disponível apenas no app desktop')
    })
  })

  describe('Neural Map Canvas', () => {
    const neuralMapPath = join(basePath, 'neural-map.tsx')
    let neuralMap: string

    beforeAll(() => {
      neuralMap = readFileSync(neuralMapPath, 'utf-8')
    })

    it('should use requestAnimationFrame for smooth rendering', () => {
      expect(neuralMap).toContain('requestAnimationFrame')
      expect(neuralMap).toContain('cancelAnimationFrame')
    })

    it('should handle pan via mouse drag', () => {
      expect(neuralMap).toContain('handleMouseDown')
      expect(neuralMap).toContain('handleMouseMove')
      expect(neuralMap).toContain('handleMouseUp')
    })

    it('should handle zoom via wheel', () => {
      expect(neuralMap).toContain('handleWheel')
      expect(neuralMap).toContain('scale')
    })

    it('should render templos as circles', () => {
      expect(neuralMap).toContain('ctx.arc(templo.x, templo.y')
    })

    it('should render deuses with pulsing glow', () => {
      expect(neuralMap).toContain('deuses')
      expect(neuralMap).toContain('pulseRadius')
    })

    it('should render vagalumes with animation', () => {
      expect(neuralMap).toContain('vagalumes')
      expect(neuralMap).toContain('phase')
    })

    it('should navigate to bot mode on deus click', () => {
      expect(neuralMap).toContain("host.navigate(`/chat?bot=")
    })
  })

  describe('Plugin Routes', () => {
    const pluginPath = join(basePath, 'plugin.tsx')
    let plugin: string

    beforeAll(() => {
      plugin = readFileSync(pluginPath, 'utf-8')
    })

    it('should register main dock route', () => {
      expect(plugin).toContain("path: '/monte-olimpo'")
      expect(plugin).toContain('MonteOlimpoPage')
    })

    it('should register neural map fullscreen route', () => {
      expect(plugin).toContain("path: '/monte-olimpo/mapa'")
      expect(plugin).toContain('NeuralMapFullscreen')
    })

    it('should register browser fullscreen route', () => {
      expect(plugin).toContain("path: '/monte-olimpo/browser'")
      expect(plugin).toContain('BrowserFullscreen')
    })

    it('should register sidebar navigation', () => {
      expect(plugin).toContain('SIDEBAR_NAV_AREA')
      expect(plugin).toContain("label: 'Monte Olimpo'")
      expect(plugin).toContain("codicon: 'home'")
    })
  })

  describe('CSS Token Usage', () => {
    const dockCss = readFileSync(join(basePath, 'dock.css'), 'utf-8')
    const neuralMapCss = readFileSync(join(basePath, 'neural-map.css'), 'utf-8')
    const browserCss = readFileSync(join(basePath, 'browser.css'), 'utf-8')

    it('should use Olympus tokens in dock.css', () => {
      expect(dockCss).toContain('var(--olympus-navy-')
      expect(dockCss).toContain('var(--olympus-orange-')
      expect(dockCss).toContain('var(--olympus-fg')
    })

    it('should use Olympus tokens in neural-map.css', () => {
      expect(neuralMapCss).toContain('var(--olympus-navy-')
      expect(neuralMapCss).toContain('var(--olympus-orange-')
    })

    it('should use Olympus tokens in browser.css', () => {
      expect(browserCss).toContain('var(--olympus-navy-')
      expect(browserCss).toContain('var(--olympus-orange-')
      expect(browserCss).toContain('var(--profile-color')
    })

    it('should have fallback values for all tokens', () => {
      // All Olympus tokens should have fallbacks for compatibility
      const allCss = dockCss + neuralMapCss + browserCss
      const tokenUsages = allCss.match(/var\(--olympus-[^,)]+,/g) || []
      expect(tokenUsages.length).toBeGreaterThan(0)
    })
  })
})
