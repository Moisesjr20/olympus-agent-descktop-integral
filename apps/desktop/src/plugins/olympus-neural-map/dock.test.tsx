import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Monte Olimpo Plugin', () => {
  const pluginPath = join(__dirname, 'plugin.tsx')
  const dockPath = join(__dirname, 'dock.tsx')
  const cssPath = join(__dirname, 'dock.css')
  const neuralMapPath = join(__dirname, 'neural-map.tsx')
  const neuralMapCssPath = join(__dirname, 'neural-map.css')
  const browserPath = join(__dirname, 'browser.tsx')
  const browserCssPath = join(__dirname, 'browser.css')

  it('should have plugin.tsx with all routes', () => {
    const content = readFileSync(pluginPath, 'utf-8')
    expect(content).toContain("id: 'olympus-neural-map'")
    expect(content).toContain("name: 'Monte Olimpo'")
    expect(content).toContain("path: '/monte-olimpo'")
    expect(content).toContain("path: '/monte-olimpo/mapa'")
    expect(content).toContain("path: '/monte-olimpo/browser'")
    expect(content).toContain('NeuralMapFullscreen')
    expect(content).toContain('BrowserFullscreen')
  })

  it('should have dock.tsx with all four sections', () => {
    const content = readFileSync(dockPath, 'utf-8')
    expect(content).toContain('CouncilPeek')
    expect(content).toContain('KanbanPeek')
    expect(content).toContain('NeuralMapSection')
    expect(content).toContain('NeuralMapCanvas')
    expect(content).toContain('BrowserPeek')
    expect(content).toContain('BrowserSection')
  })

  it('should have dock.css with Olympus tokens', () => {
    const content = readFileSync(cssPath, 'utf-8')
    expect(content).toContain('--olympus-navy-950')
    expect(content).toContain('--olympus-orange-500')
    expect(content).toContain('olympus-monte-olimpo')
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
  })

  it('should have neural-map.css with canvas styling', () => {
    const css = readFileSync(neuralMapCssPath, 'utf-8')
    expect(css).toContain('neural-map-container')
    expect(css).toContain('neural-map-canvas')
    expect(css).toContain('neural-map-controls')
  })

  // Plano C - Multi-Profile Browser
  it('should have browser.tsx with 14 profiles', () => {
    const content = readFileSync(browserPath, 'utf-8')
    expect(content).toContain('MultiBrowser')
    expect(content).toContain('BrowserSection')
    expect(content).toContain('DEFAULT_PROFILES')
    expect(content).toContain("partition: 'persist:hermes'")
    expect(content).toContain("partition: 'persist:athena'")
    expect(content).toContain('ProfilePill')
    expect(content).toContain('TabBar')
    expect(content).toContain('AddressBar')
    expect(content).toContain('BrowserWebview')
  })

  it('should have browser.css with multi-profile styling', () => {
    const css = readFileSync(browserCssPath, 'utf-8')
    expect(css).toContain('browser-container')
    expect(css).toContain('browser-profile-bar')
    expect(css).toContain('browser-profile-pill')
    expect(css).toContain('browser-tabs')
    expect(css).toContain('browser-address-bar')
    expect(css).toContain('browser-webview')
    expect(css).toContain('--profile-color')
    expect(css).toContain('--active-profile-color')
  })

  it('should have backend manifest.json', () => {
    const manifestPath = join(__dirname, 'dashboard', 'manifest.json')
    const content = readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(content)
    expect(manifest.name).toBe('olympus-neural-map')
  })

  it('should have plugin_api.py with graph endpoint', () => {
    const apiPath = join(__dirname, 'dashboard', 'plugin_api.py')
    const content = readFileSync(apiPath, 'utf-8')
    expect(content).toContain('/graph')
    expect(content).toContain('/stats')
    expect(content).toContain('olimpo.json')
  })
})
