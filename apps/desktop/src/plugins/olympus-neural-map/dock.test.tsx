import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Monte Olimpo Plugin', () => {
  const pluginPath = join(__dirname, 'plugin.tsx')
  const dockPath = join(__dirname, 'dock.tsx')
  const cssPath = join(__dirname, 'dock.css')

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
    expect(content).toContain('NeuralMapPlaceholder')
    expect(content).toContain('BrowserPlaceholder')
    expect(content).toContain('Em breve — Plano B')
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
})
