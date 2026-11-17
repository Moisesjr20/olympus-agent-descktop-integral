/**
 * Browser Extensions Manager
 * Load and manage Chrome extensions per profile (opt-in).
 * 
 * Task 10: Extensões opt-in
 */

export interface Extension {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  path: string
  icons?: {
    '16'?: string
    '48'?: string
    '128'?: string
  }
  permissions?: string[]
  hostPermissions?: string[]
}

export interface ExtensionManifest {
  manifest_version: number
  name: string
  version: string
  description?: string
  icons?: Record<string, string>
  permissions?: string[]
  host_permissions?: string[]
  background?: {
    service_worker?: string
    scripts?: string[]
  }
  content_scripts?: Array<{
    matches: string[]
    js?: string[]
    css?: string[]
  }>
  action?: {
    default_popup?: string
    default_icon?: Record<string, string>
  }
}

// Well-known extensions that are safe to recommend
export const RECOMMENDED_EXTENSIONS: Array<{
  id: string
  name: string
  description: string
  chromeWebStoreUrl: string
}> = [
  {
    id: 'ublock-origin',
    name: 'uBlock Origin',
    description: 'Bloqueador de anúncios eficiente',
    chromeWebStoreUrl: 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm'
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    description: 'Gerenciador de senhas gratuito',
    chromeWebStoreUrl: 'https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb'
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Modo escuro para todos os sites',
    chromeWebStoreUrl: 'https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh'
  },
  {
    id: 'json-viewer',
    name: 'JSON Viewer',
    description: 'Visualizador de JSON formatado',
    chromeWebStoreUrl: 'https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh'
  }
]

/**
 * Parse extension manifest from path
 */
export async function parseExtensionManifest(extensionPath: string): Promise<ExtensionManifest | null> {
  const electron = (window as any).electron
  if (!electron?.fs?.readFile) {
    console.warn('[ExtensionManager] Electron IPC not available')
    return null
  }
  
  try {
    const manifestPath = `${extensionPath}/manifest.json`
    const content = await electron.fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(content) as ExtensionManifest
  } catch (e) {
    console.error('[ExtensionManager] Failed to parse manifest:', e)
    return null
  }
}

/**
 * Load extension into a webview session
 * Note: Requires Electron with extension support enabled
 */
export async function loadExtension(
  session: any,
  extensionPath: string
): Promise<Extension | null> {
  if (!session?.loadExtension) {
    console.warn('[ExtensionManager] Session.loadExtension not available')
    return null
  }
  
  try {
    const ext = await session.loadExtension(extensionPath, {
      allowFileAccess: true
    })
    
    const manifest = await parseExtensionManifest(extensionPath)
    if (!manifest) return null
    
    return {
      id: ext.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description || '',
      enabled: true,
      path: extensionPath,
      icons: manifest.icons,
      permissions: manifest.permissions,
      hostPermissions: manifest.host_permissions
    }
  } catch (e) {
    console.error('[ExtensionManager] Failed to load extension:', e)
    return null
  }
}

/**
 * Remove extension from session
 */
export async function removeExtension(session: any, extensionId: string): Promise<boolean> {
  if (!session?.removeExtension) {
    return false
  }
  
  try {
    await session.removeExtension(extensionId)
    return true
  } catch (e) {
    console.error('[ExtensionManager] Failed to remove extension:', e)
    return false
  }
}

/**
 * Get all loaded extensions for a session
 */
export function getLoadedExtensions(session: any): Extension[] {
  if (!session?.getAllExtensions) {
    return []
  }
  
  try {
    const extensions = session.getAllExtensions()
    return extensions.map((ext: any) => ({
      id: ext.id,
      name: ext.name,
      version: ext.version || '0.0.0',
      description: '',
      enabled: true,
      path: ext.path
    }))
  } catch (e) {
    console.error('[ExtensionManager] Failed to get extensions:', e)
    return []
  }
}

/**
 * Extensions Store - persists enabled extensions per profile
 */
const EXTENSIONS_STORAGE_KEY = 'olympus-browser-extensions'

interface ExtensionsConfig {
  [profileId: string]: {
    enabled: string[]  // Extension paths
    disabled: string[] // Explicitly disabled
  }
}

export class ExtensionsStore {
  private config: ExtensionsConfig = {}
  
  constructor() {
    this.load()
  }
  
  private load(): void {
    try {
      const stored = localStorage.getItem(EXTENSIONS_STORAGE_KEY)
      if (stored) {
        this.config = JSON.parse(stored)
      }
    } catch (e) {
      console.error('[ExtensionsStore] Failed to load:', e)
    }
  }
  
  private save(): void {
    try {
      localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(this.config))
    } catch (e) {
      console.error('[ExtensionsStore] Failed to save:', e)
    }
  }
  
  getEnabled(profileId: string): string[] {
    return this.config[profileId]?.enabled || []
  }
  
  getDisabled(profileId: string): string[] {
    return this.config[profileId]?.disabled || []
  }
  
  enable(profileId: string, extensionPath: string): void {
    if (!this.config[profileId]) {
      this.config[profileId] = { enabled: [], disabled: [] }
    }
    
    const cfg = this.config[profileId]
    if (!cfg.enabled.includes(extensionPath)) {
      cfg.enabled.push(extensionPath)
    }
    cfg.disabled = cfg.disabled.filter(p => p !== extensionPath)
    
    this.save()
  }
  
  disable(profileId: string, extensionPath: string): void {
    if (!this.config[profileId]) {
      this.config[profileId] = { enabled: [], disabled: [] }
    }
    
    const cfg = this.config[profileId]
    cfg.enabled = cfg.enabled.filter(p => p !== extensionPath)
    if (!cfg.disabled.includes(extensionPath)) {
      cfg.disabled.push(extensionPath)
    }
    
    this.save()
  }
  
  isEnabled(profileId: string, extensionPath: string): boolean {
    return this.getEnabled(profileId).includes(extensionPath)
  }
}

// Singleton
let _extensionsStore: ExtensionsStore | null = null

export function getExtensionsStore(): ExtensionsStore {
  if (!_extensionsStore) {
    _extensionsStore = new ExtensionsStore()
  }
  return _extensionsStore
}

/**
 * Load all enabled extensions for a profile into its session
 */
export async function loadProfileExtensions(
  profileId: string,
  session: any
): Promise<Extension[]> {
  const store = getExtensionsStore()
  const enabledPaths = store.getEnabled(profileId)
  
  const loaded: Extension[] = []
  for (const path of enabledPaths) {
    const ext = await loadExtension(session, path)
    if (ext) {
      loaded.push(ext)
    }
  }
  
  return loaded
}
