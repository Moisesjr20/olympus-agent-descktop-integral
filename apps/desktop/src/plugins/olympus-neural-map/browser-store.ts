/**
 * Browser Profile Store
 * Persistent storage for browser profiles with LRU webview pool management.
 * 
 * Task 5: Store de perfis + validação de partition
 * Task 7: Pool webviews (≤3 vivas, LRU)
 */

// Profile configuration persisted to storage
export interface StoredProfile {
  id: string
  name: string
  color: string
  icon: string
  partition: string
  createdAt: string
  lastUsed: string
  // Chrome import status
  importedBookmarks?: boolean
  importedHistory?: boolean
  importedCookies?: boolean
  importedPasswords?: boolean
  importedExtensions?: string[]
  // Settings per profile
  settings: ProfileSettings
}

export interface ProfileSettings {
  homepage: string
  searchEngine: 'google' | 'duckduckgo' | 'bing' | 'custom'
  customSearchUrl?: string
  blockAds: boolean
  blockTrackers: boolean
  darkMode: 'system' | 'light' | 'dark'
  zoomLevel: number
}

// Tab state for restoration
export interface StoredTab {
  id: string
  url: string
  title: string
  favicon?: string
  lastAccessed: string
}

export interface ProfileState {
  profile: StoredProfile
  tabs: StoredTab[]
  activeTabId: string | null
}

// LRU Pool entry
interface PoolEntry {
  profileId: string
  webviewRef: WeakRef<HTMLElement>
  lastAccessed: number
}

const STORAGE_KEY = 'olympus-browser-profiles'
const POOL_MAX_SIZE = 3

// Default profiles (14 Olympus gods + contexts)
const DEFAULT_PROFILES: StoredProfile[] = [
  { id: 'hermes', name: 'Hermes', color: '#e8623d', icon: '⚡', partition: 'persist:hermes', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'athena', name: 'Athena', color: '#60a5fa', icon: '🦉', partition: 'persist:athena', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'apollo', name: 'Apollo', color: '#fbbf24', icon: '☀️', partition: 'persist:apollo', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'artemis', name: 'Artemis', color: '#a78bfa', icon: '🌙', partition: 'persist:artemis', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'ares', name: 'Ares', color: '#ef4444', icon: '⚔️', partition: 'persist:ares', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'hephaestus', name: 'Hefesto', color: '#f97316', icon: '🔨', partition: 'persist:hephaestus', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'demeter', name: 'Demeter', color: '#22c55e', icon: '🌾', partition: 'persist:demeter', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'dionysus', name: 'Dionísio', color: '#c084fc', icon: '🍇', partition: 'persist:dionysus', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'poseidon', name: 'Poseidon', color: '#06b6d4', icon: '🔱', partition: 'persist:poseidon', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'hades', name: 'Hades', color: '#6b7280', icon: '💀', partition: 'persist:hades', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'hera', name: 'Hera', color: '#ec4899', icon: '👑', partition: 'persist:hera', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'zeus', name: 'Zeus', color: '#eab308', icon: '⚡', partition: 'persist:zeus', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'work', name: 'Trabalho', color: '#3b82f6', icon: '💼', partition: 'persist:work', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
  { id: 'personal', name: 'Pessoal', color: '#10b981', icon: '🏠', partition: 'persist:personal', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString(), settings: defaultSettings() },
]

function defaultSettings(): ProfileSettings {
  return {
    homepage: 'https://google.com',
    searchEngine: 'google',
    blockAds: false,
    blockTrackers: false,
    darkMode: 'system',
    zoomLevel: 100
  }
}

/**
 * Validate partition name format
 * Must be: persist:<alphanumeric-slug>
 */
export function validatePartition(partition: string): { valid: boolean; error?: string } {
  if (!partition) {
    return { valid: false, error: 'Partition is required' }
  }
  
  if (!partition.startsWith('persist:')) {
    return { valid: false, error: 'Partition must start with "persist:"' }
  }
  
  const slug = partition.replace('persist:', '')
  if (!slug) {
    return { valid: false, error: 'Partition slug is required' }
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Partition slug must be lowercase alphanumeric with hyphens only' }
  }
  
  if (slug.length > 32) {
    return { valid: false, error: 'Partition slug must be 32 characters or less' }
  }
  
  return { valid: true }
}

/**
 * Profile Store - handles persistence and retrieval
 */
export class ProfileStore {
  private profiles: Map<string, StoredProfile> = new Map()
  private tabStates: Map<string, StoredTab[]> = new Map()
  private activeTabIds: Map<string, string> = new Map()
  
  constructor() {
    this.load()
  }
  
  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as { profiles: StoredProfile[]; tabStates: Record<string, StoredTab[]>; activeTabIds: Record<string, string> }
        data.profiles.forEach(p => this.profiles.set(p.id, p))
        Object.entries(data.tabStates || {}).forEach(([k, v]) => this.tabStates.set(k, v))
        Object.entries(data.activeTabIds || {}).forEach(([k, v]) => this.activeTabIds.set(k, v))
      } else {
        // Initialize with defaults
        DEFAULT_PROFILES.forEach(p => this.profiles.set(p.id, p))
        this.save()
      }
    } catch (e) {
      console.error('[ProfileStore] Failed to load:', e)
      DEFAULT_PROFILES.forEach(p => this.profiles.set(p.id, p))
    }
  }
  
  private save(): void {
    try {
      const data = {
        profiles: Array.from(this.profiles.values()),
        tabStates: Object.fromEntries(this.tabStates),
        activeTabIds: Object.fromEntries(this.activeTabIds)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('[ProfileStore] Failed to save:', e)
    }
  }
  
  getAll(): StoredProfile[] {
    return Array.from(this.profiles.values())
  }
  
  get(id: string): StoredProfile | undefined {
    return this.profiles.get(id)
  }
  
  update(id: string, updates: Partial<StoredProfile>): StoredProfile | undefined {
    const profile = this.profiles.get(id)
    if (!profile) return undefined
    
    const updated = { ...profile, ...updates, lastUsed: new Date().toISOString() }
    
    // Validate partition if changed
    if (updates.partition && updates.partition !== profile.partition) {
      const validation = validatePartition(updates.partition)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }
    
    this.profiles.set(id, updated)
    this.save()
    return updated
  }
  
  create(profile: Omit<StoredProfile, 'createdAt' | 'lastUsed'>): StoredProfile {
    const validation = validatePartition(profile.partition)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // Check for duplicate partition
    for (const p of this.profiles.values()) {
      if (p.partition === profile.partition) {
        throw new Error(`Partition "${profile.partition}" already in use by profile "${p.name}"`)
      }
    }
    
    const now = new Date().toISOString()
    const newProfile: StoredProfile = {
      ...profile,
      createdAt: now,
      lastUsed: now
    }
    
    this.profiles.set(profile.id, newProfile)
    this.save()
    return newProfile
  }
  
  delete(id: string): boolean {
    const deleted = this.profiles.delete(id)
    if (deleted) {
      this.tabStates.delete(id)
      this.activeTabIds.delete(id)
      this.save()
    }
    return deleted
  }
  
  // Tab state management
  getTabs(profileId: string): StoredTab[] {
    return this.tabStates.get(profileId) || []
  }
  
  setTabs(profileId: string, tabs: StoredTab[]): void {
    this.tabStates.set(profileId, tabs)
    this.save()
  }
  
  getActiveTabId(profileId: string): string | null {
    return this.activeTabIds.get(profileId) || null
  }
  
  setActiveTabId(profileId: string, tabId: string): void {
    this.activeTabIds.set(profileId, tabId)
    this.save()
  }
  
  // Mark last used for LRU
  touch(profileId: string): void {
    const profile = this.profiles.get(profileId)
    if (profile) {
      profile.lastUsed = new Date().toISOString()
      this.profiles.set(profileId, profile)
      this.save()
    }
  }
  
  // Get profiles sorted by last used (most recent first)
  getByLastUsed(): StoredProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
  }
}

/**
 * WebView Pool - manages active webviews with LRU eviction
 * Task 7: Pool webviews (≤3 vivas, LRU)
 */
export class WebViewPool {
  private pool: PoolEntry[] = []
  private maxSize: number
  
  constructor(maxSize: number = POOL_MAX_SIZE) {
    this.maxSize = maxSize
  }
  
  /**
   * Register a webview for a profile
   * Returns profiles that should be evicted (their webviews destroyed)
   */
  acquire(profileId: string, webviewElement: HTMLElement): string[] {
    // Update access time if already in pool
    const existing = this.pool.find(e => e.profileId === profileId)
    if (existing) {
      existing.lastAccessed = Date.now()
      existing.webviewRef = new WeakRef(webviewElement)
      return []
    }
    
    // Add new entry
    this.pool.push({
      profileId,
      webviewRef: new WeakRef(webviewElement),
      lastAccessed: Date.now()
    })
    
    // Evict if over capacity
    const toEvict: string[] = []
    while (this.pool.length > this.maxSize) {
      // Sort by last accessed, oldest first
      this.pool.sort((a, b) => a.lastAccessed - b.lastAccessed)
      const evicted = this.pool.shift()
      if (evicted) {
        toEvict.push(evicted.profileId)
      }
    }
    
    return toEvict
  }
  
  /**
   * Release a webview (profile switching away)
   */
  release(profileId: string): void {
    const idx = this.pool.findIndex(e => e.profileId === profileId)
    if (idx !== -1) {
      this.pool.splice(idx, 1)
    }
  }
  
  /**
   * Touch a profile to update its LRU position
   */
  touch(profileId: string): void {
    const entry = this.pool.find(e => e.profileId === profileId)
    if (entry) {
      entry.lastAccessed = Date.now()
    }
  }
  
  /**
   * Check if a profile has an active webview
   */
  has(profileId: string): boolean {
    const entry = this.pool.find(e => e.profileId === profileId)
    if (!entry) return false
    
    // Check if the webview is still alive
    const webview = entry.webviewRef.deref()
    if (!webview) {
      // Clean up dead reference
      this.release(profileId)
      return false
    }
    
    return true
  }
  
  /**
   * Get active profile IDs
   */
  getActiveProfiles(): string[] {
    // Clean up dead refs
    this.pool = this.pool.filter(e => e.webviewRef.deref() !== undefined)
    return this.pool.map(e => e.profileId)
  }
  
  /**
   * Get pool stats
   */
  getStats(): { active: number; max: number; profiles: string[] } {
    const profiles = this.getActiveProfiles()
    return {
      active: profiles.length,
      max: this.maxSize,
      profiles
    }
  }
}

// Singleton instances
let _store: ProfileStore | null = null
let _pool: WebViewPool | null = null

export function getProfileStore(): ProfileStore {
  if (!_store) {
    _store = new ProfileStore()
  }
  return _store
}

export function getWebViewPool(): WebViewPool {
  if (!_pool) {
    _pool = new WebViewPool()
  }
  return _pool
}
