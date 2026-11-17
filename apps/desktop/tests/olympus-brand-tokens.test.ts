import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Olympus Brand Tokens', () => {
  const stylesPath = join(__dirname, '../src/styles.css')
  const css = readFileSync(stylesPath, 'utf-8')

  it('should have navy palette tokens', () => {
    expect(css).toContain('--olympus-navy-900: #0b1222')
    expect(css).toContain('--olympus-navy-950: #070c18')
    expect(css).toContain('--olympus-navy-850: #0f1830')
    expect(css).toContain('--olympus-navy-800: #16223e')
    expect(css).toContain('--olympus-navy-700: #1c2a4a')
    expect(css).toContain('--olympus-navy-600: #243458')
  })

  it('should have orange accent tokens', () => {
    expect(css).toContain('--olympus-orange-500: #e8623d')
    expect(css).toContain('--olympus-orange-400: #f2814f')
    expect(css).toContain('--olympus-orange-300: #ffa379')
  })

  it('should have semantic color tokens', () => {
    expect(css).toContain('--olympus-fg: #eaf0fb')
    expect(css).toContain('--olympus-fg-dim: #96a0b8')
    expect(css).toContain('--olympus-ok: #37e0a0')
    expect(css).toContain('--olympus-warn: #ffb547')
    expect(css).toContain('--olympus-err: #ff5470')
  })

  it('should have special effect tokens', () => {
    expect(css).toContain('--olympus-firefly: #ffe9a8')
    expect(css).toContain('--olympus-vale: #5a6a94')
    expect(css).toContain('--olympus-glow:')
  })

  it('should override dark theme with Olympus colors', () => {
    expect(css).toMatch(/\[data-theme="dark"\].*--theme-background-seed:\s*var\(--olympus-navy-900\)/s)
    expect(css).toMatch(/\[data-theme="dark"\].*--theme-primary:\s*var\(--olympus-orange-500\)/s)
  })
})
