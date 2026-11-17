import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Monte Olimpo Plugin', () => {
  const pluginPath = join(__dirname, 'plugin.tsx')
  const dockPath = join(__dirname, 'dock.tsx')
  const cssPath = join(__dirname, 'dock.css')
  const neuralMapPath = join(__dirname, 'neural-map.tsx')
  const neuralMapCssPath = join(__dirname, 'neural-map.css')

  it('should have plugin.tsx with correct registration', () => {
    const content = readFileSync(pluginPath, 'utf-8')
    expect(content).toContain("id: 'olympus-neural-map'")
    expect(content).toContain("name: 'Monte Olimpo'")
    expect(content).toContain("path: '/monte-olimpo'")
    expect(content).toContain("codicon: 'home'")
    expect(content).toContain('defaultEnabled: false')
  })

  it('should have dock.tsx with all four sections', () => {
    const content = readFileSync(dockPath, 'utf-8')
    expect(content).toContain('CouncilPeek')
    expect(content).toContain('KanbanPeek')
    expect(content).toContain('NeuralMapSection')
    expect(content).toContain('NeuralMapCanvas')
    expect(content).toContain('BrowserPlaceholder')
    expect(content).toContain('Em breve — Plano C')
  })

  it('should have dock.css with Olympus tokens', () => {
    const content = readFileSync(cssPath, 'utf-8')
    expect(content).toContain('--olympus-navy-950')
    expect(content).toContain('--olympus-orange-500')
    expect(content).toContain('--olympus-fg')
    expect(content).toContain('olympus-monte-olimpo')
    expect(content).toContain('olympus-dock-section')
  })

  it('should use Olympus glow animation', () => {
    const css = readFileSync(cssPath, 'utf-8')
    expect(css).toContain('@keyframes olympus-glow-pulse')
    expect(css).toContain('--olympus-glow')
  })

  // Plano B - Neural Map Canvas
  it('should have neural-map.tsx with canvas implementation', () => {
    const content = readFileSync(neuralMapPath, 'utf-8')
    expect(content).toContain('NeuralMapCanvas')
    expect(content).toContain('canvasRef')
    expect(content).toContain('requestAnimationFrame')
    expect(content).toContain('templos')
    expect(content).toContain('deuses')
    expect(content).toContain('vagalumes')
    expect(content).toContain('handleWheel')
    expect(content).toContain('handleMouseDown')
  })

  it('should have neural-map.css with canvas styling', () => {
    const css = readFileSync(neuralMapCssPath, 'utf-8')
    expect(css).toContain('neural-map-container')
    expect(css).toContain('neural-map-canvas')
    expect(css).toContain('neural-map-controls')
    expect(css).toContain('neural-map-stats')
    expect(css).toContain('cursor: grab')
  })

  it('should have backend manifest.json', () => {
    const manifestPath = join(__dirname, 'dashboard', 'manifest.json')
    const content = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(content)
    expect(manifest.name).toBe('olympus-neural-map')
    expect(manifest.api.module).toBe('plugin_api')
  })

  it('should have plugin_api.py with graph endpoint', () => {
    const apiPath = join(__dirname, 'dashboard', 'plugin_api.py')
    const content = readFileSync(apiPath, 'utf-8')
    expect(content).toContain('/graph')
    expect(content).toContain('/stats')
    expect(content).toContain('/deus/<nome>')
    expect(content).toContain('olimpo.json')
  })
})
