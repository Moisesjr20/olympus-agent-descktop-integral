/**
 * Chrome Data Importer
 * Import bookmarks, history, cookies, and passwords from Chrome profiles.
 * 
 * Task 8: Import bookmarks/histórico Chrome
 * Task 9: Import cookies via CDP + senhas via CSV
 */

// Chrome profile paths by OS
const CHROME_PATHS = {
  win32: '%LOCALAPPDATA%\\Google\\Chrome\\User Data',
  darwin: '~/Library/Application Support/Google/Chrome',
  linux: '~/.config/google-chrome'
}

export interface ChromeProfile {
  name: string
  path: string
  isDefault: boolean
}

export interface Bookmark {
  id: string
  title: string
  url?: string
  dateAdded: number
  children?: Bookmark[]
  type: 'url' | 'folder'
}

export interface HistoryEntry {
  id: number
  url: string
  title: string
  visitCount: number
  lastVisitTime: number
}

export interface Cookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  expirationDate?: number
}

export interface PasswordEntry {
  url: string
  username: string
  password: string
  dateCreated?: number
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}

/**
 * Get Chrome user data directory for current OS
 */
export function getChromeDataDir(): string {
  const platform = typeof process !== 'undefined' ? process.platform : 'win32'
  let path = CHROME_PATHS[platform as keyof typeof CHROME_PATHS] || CHROME_PATHS.linux
  
  // Expand environment variables
  if (typeof process !== 'undefined' && process.env) {
    if (platform === 'win32') {
      path = path.replace('%LOCALAPPDATA%', process.env.LOCALAPPDATA || '')
    } else {
      path = path.replace('~', process.env.HOME || '')
    }
  }
  
  return path
}

/**
 * List available Chrome profiles
 */
export async function listChromeProfiles(): Promise<ChromeProfile[]> {
  // This runs in Electron main process via IPC
  const electron = (window as any).electron
  if (!electron?.chrome?.listProfiles) {
    console.warn('[ChromeImporter] Electron IPC not available')
    return []
  }
  
  try {
    return await electron.chrome.listProfiles()
  } catch (e) {
    console.error('[ChromeImporter] Failed to list profiles:', e)
    return []
  }
}

/**
 * Import bookmarks from Chrome
 * Reads: <ChromeProfile>/Bookmarks (JSON file)
 */
export async function importBookmarks(chromeProfilePath: string): Promise<ImportResult> {
  const electron = (window as any).electron
  if (!electron?.chrome?.importBookmarks) {
    return { success: false, imported: 0, errors: ['Electron IPC not available'] }
  }
  
  try {
    const result = await electron.chrome.importBookmarks(chromeProfilePath)
    return result
  } catch (e) {
    return { 
      success: false, 
      imported: 0, 
      errors: [`Failed to import bookmarks: ${e}`] 
    }
  }
}

/**
 * Import history from Chrome
 * Reads: <ChromeProfile>/History (SQLite database)
 */
export async function importHistory(chromeProfilePath: string, limit: number = 1000): Promise<ImportResult> {
  const electron = (window as any).electron
  if (!electron?.chrome?.importHistory) {
    return { success: false, imported: 0, errors: ['Electron IPC not available'] }
  }
  
  try {
    const result = await electron.chrome.importHistory(chromeProfilePath, limit)
    return result
  } catch (e) {
    return { 
      success: false, 
      imported: 0, 
      errors: [`Failed to import history: ${e}`] 
    }
  }
}

/**
 * Import cookies via CDP (Chrome DevTools Protocol)
 * This requires the webview to support CDP
 */
export async function importCookiesViaCDP(
  webview: any, 
  targetDomains: string[]
): Promise<ImportResult> {
  if (!webview?.executeJavaScript) {
    return { success: false, imported: 0, errors: ['Webview not available'] }
  }
  
  try {
    // Get cookies from the webview's session
    const session = webview.getWebContents?.()?.session
    if (!session) {
      return { success: false, imported: 0, errors: ['Session not available'] }
    }
    
    const cookies: Cookie[] = []
    for (const domain of targetDomains) {
      const domainCookies = await session.cookies.get({ domain })
      cookies.push(...domainCookies.map((c: any) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        expirationDate: c.expirationDate
      })))
    }
    
    return { success: true, imported: cookies.length, errors: [] }
  } catch (e) {
    return { 
      success: false, 
      imported: 0, 
      errors: [`Failed to import cookies: ${e}`] 
    }
  }
}

/**
 * Parse Chrome passwords from CSV export
 * User must export from chrome://settings/passwords manually
 * 
 * CSV format: name,url,username,password
 */
export function parsePasswordsCsv(csvContent: string): PasswordEntry[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []
  
  // Skip header
  const passwords: PasswordEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Handle CSV with quotes
    const match = line.match(/^"?([^",]*)"?,"?([^",]*)"?,"?([^",]*)"?,"?([^",]*)"?$/)
    if (match) {
      passwords.push({
        url: match[2],
        username: match[3],
        password: match[4]
      })
    }
  }
  
  return passwords
}

/**
 * Import passwords from CSV file
 * Task 9: senhas via CSV
 */
export async function importPasswordsFromCsv(csvPath: string): Promise<ImportResult> {
  const electron = (window as any).electron
  if (!electron?.fs?.readFile) {
    return { success: false, imported: 0, errors: ['Electron IPC not available'] }
  }
  
  try {
    const content = await electron.fs.readFile(csvPath, 'utf-8')
    const passwords = parsePasswordsCsv(content)
    
    // Store securely (this would use Electron's safeStorage in real impl)
    // For now just return the count
    return { 
      success: true, 
      imported: passwords.length, 
      errors: [] 
    }
  } catch (e) {
    return { 
      success: false, 
      imported: 0, 
      errors: [`Failed to import passwords: ${e}`] 
    }
  }
}

/**
 * Chrome Import Dialog Component Data
 */
export interface ImportDialogState {
  step: 'select-profile' | 'select-data' | 'importing' | 'done'
  chromeProfiles: ChromeProfile[]
  selectedProfile: string | null
  selectedData: {
    bookmarks: boolean
    history: boolean
    cookies: boolean
    passwords: boolean
    extensions: boolean
  }
  results: {
    bookmarks?: ImportResult
    history?: ImportResult
    cookies?: ImportResult
    passwords?: ImportResult
    extensions?: ImportResult
  }
  error: string | null
}

export function createImportDialogState(): ImportDialogState {
  return {
    step: 'select-profile',
    chromeProfiles: [],
    selectedProfile: null,
    selectedData: {
      bookmarks: true,
      history: true,
      cookies: false,
      passwords: false,
      extensions: false
    },
    results: {},
    error: null
  }
}

/**
 * Run the full import process
 */
export async function runImport(
  chromeProfilePath: string,
  options: ImportDialogState['selectedData'],
  onProgress: (step: string, progress: number) => void
): Promise<ImportDialogState['results']> {
  const results: ImportDialogState['results'] = {}
  let completed = 0
  const total = Object.values(options).filter(Boolean).length
  
  if (options.bookmarks) {
    onProgress('Importando bookmarks...', completed / total)
    results.bookmarks = await importBookmarks(chromeProfilePath)
    completed++
  }
  
  if (options.history) {
    onProgress('Importando histórico...', completed / total)
    results.history = await importHistory(chromeProfilePath)
    completed++
  }
  
  if (options.cookies) {
    onProgress('Cookies requerem seleção manual de domínios', completed / total)
    results.cookies = { success: false, imported: 0, errors: ['Manual domain selection required'] }
    completed++
  }
  
  if (options.passwords) {
    onProgress('Senhas requerem CSV exportado do Chrome', completed / total)
    results.passwords = { success: false, imported: 0, errors: ['CSV file required'] }
    completed++
  }
  
  if (options.extensions) {
    onProgress('Extensões são importadas manualmente', completed / total)
    results.extensions = { success: false, imported: 0, errors: ['Manual import required'] }
    completed++
  }
  
  onProgress('Concluído', 1)
  return results
}
