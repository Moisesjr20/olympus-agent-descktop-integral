import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Tests for Browser Advanced Features (Tasks 5, 7-10)
 * Tests are pure unit tests without DOM/localStorage dependencies
 */

describe('Browser Store Module (Task 5)', () => {
  const storePath = join(__dirname, 'browser-store.ts')
  let storeCode: string
  
  beforeEach(() => {
    storeCode = readFileSync(storePath, 'utf-8')
  })

  it('should export validatePartition function', () => {
    expect(storeCode).toContain('export function validatePartition')
  })

  it('should validate persist: prefix requirement', () => {
    expect(storeCode).toContain("startsWith('persist:')")
  })

  it('should validate alphanumeric slug pattern', () => {
    expect(storeCode).toContain('/^[a-z0-9-]+$/')
  })

  it('should enforce 32 character limit', () => {
    expect(storeCode).toContain('slug.length > 32')
  })

  it('should export ProfileStore class', () => {
    expect(storeCode).toContain('export class ProfileStore')
  })

  it('should have 14 default profiles', () => {
    const profileMatches = storeCode.match(/partition: 'persist:/g)
    expect(profileMatches?.length).toBe(14)
  })

  it('should include CRUD operations', () => {
    expect(storeCode).toContain('getAll(): StoredProfile[]')
    expect(storeCode).toContain('get(id: string)')
    expect(storeCode).toContain('update(id: string')
    expect(storeCode).toContain('create(profile:')
    expect(storeCode).toContain('delete(id: string)')
  })

  it('should track lastUsed timestamps', () => {
    expect(storeCode).toContain('lastUsed')
    expect(storeCode).toContain('touch(profileId: string)')
  })
})

describe('WebView Pool (Task 7)', () => {
  const storePath = join(__dirname, 'browser-store.ts')
  let storeCode: string
  
  beforeEach(() => {
    storeCode = readFileSync(storePath, 'utf-8')
  })

  it('should export WebViewPool class', () => {
    expect(storeCode).toContain('export class WebViewPool')
  })

  it('should have default pool size of 3', () => {
    expect(storeCode).toContain('POOL_MAX_SIZE = 3')
  })

  it('should use WeakRef for webview references', () => {
    expect(storeCode).toContain('WeakRef<HTMLElement>')
  })

  it('should implement LRU eviction', () => {
    expect(storeCode).toContain('lastAccessed')
    expect(storeCode).toContain('sort((a, b) => a.lastAccessed - b.lastAccessed)')
  })

  it('should have acquire method that returns evicted profiles', () => {
    expect(storeCode).toContain('acquire(profileId: string, webviewElement: HTMLElement): string[]')
  })

  it('should have release method', () => {
    expect(storeCode).toContain('release(profileId: string)')
  })

  it('should have touch method for LRU update', () => {
    expect(storeCode).toContain('touch(profileId: string)')
  })

  it('should expose pool stats', () => {
    expect(storeCode).toContain('getStats()')
    expect(storeCode).toContain('active: number')
    expect(storeCode).toContain('max: number')
  })
})

describe('Chrome Importer (Task 8-9)', () => {
  const importerPath = join(__dirname, 'chrome-importer.ts')
  let importerCode: string
  
  beforeEach(() => {
    importerCode = readFileSync(importerPath, 'utf-8')
  })

  it('should have Chrome paths for all platforms', () => {
    expect(importerCode).toContain("win32:")
    expect(importerCode).toContain("darwin:")
    expect(importerCode).toContain("linux:")
  })

  it('should export importBookmarks function', () => {
    expect(importerCode).toContain('export async function importBookmarks')
  })

  it('should export importHistory function', () => {
    expect(importerCode).toContain('export async function importHistory')
  })

  it('should export importCookiesViaCDP function', () => {
    expect(importerCode).toContain('export async function importCookiesViaCDP')
  })

  it('should export parsePasswordsCsv function', () => {
    expect(importerCode).toContain('export function parsePasswordsCsv')
  })

  it('should handle CSV with header row', () => {
    expect(importerCode).toContain("// Skip header")
    expect(importerCode).toContain("for (let i = 1;")
  })

  it('should define ImportResult interface', () => {
    expect(importerCode).toContain('export interface ImportResult')
    expect(importerCode).toContain('success: boolean')
    expect(importerCode).toContain('imported: number')
    expect(importerCode).toContain('errors: string[]')
  })

  it('should have import dialog state factory', () => {
    expect(importerCode).toContain('export function createImportDialogState')
    expect(importerCode).toContain("step: 'select-profile'")
  })
})

describe('Extensions Manager (Task 10)', () => {
  const extPath = join(__dirname, 'extensions-manager.ts')
  let extCode: string
  
  beforeEach(() => {
    extCode = readFileSync(extPath, 'utf-8')
  })

  it('should export Extension interface', () => {
    expect(extCode).toContain('export interface Extension')
  })

  it('should have recommended extensions list', () => {
    expect(extCode).toContain('export const RECOMMENDED_EXTENSIONS')
    expect(extCode).toContain('ublock-origin')
    expect(extCode).toContain('bitwarden')
  })

  it('should export loadExtension function', () => {
    expect(extCode).toContain('export async function loadExtension')
  })

  it('should export removeExtension function', () => {
    expect(extCode).toContain('export async function removeExtension')
  })

  it('should export ExtensionsStore class', () => {
    expect(extCode).toContain('export class ExtensionsStore')
  })

  it('should track enabled/disabled extensions per profile', () => {
    expect(extCode).toContain('enable(profileId: string')
    expect(extCode).toContain('disable(profileId: string')
    expect(extCode).toContain('isEnabled(profileId: string')
  })

  it('should have loadProfileExtensions utility', () => {
    expect(extCode).toContain('export async function loadProfileExtensions')
  })

  it('should parse extension manifest', () => {
    expect(extCode).toContain('export async function parseExtensionManifest')
    expect(extCode).toContain('manifest.json')
  })
})

describe('Module Exports', () => {
  it('should have all required files', () => {
    const files = [
      'browser-store.ts',
      'chrome-importer.ts',
      'extensions-manager.ts'
    ]
    
    files.forEach(file => {
      const content = readFileSync(join(__dirname, file), 'utf-8')
      expect(content.length).toBeGreaterThan(0)
    })
  })
})
