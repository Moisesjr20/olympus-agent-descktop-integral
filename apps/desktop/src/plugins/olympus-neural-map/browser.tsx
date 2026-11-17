/**
 * Multi-Profile Browser Component
 * Electron BrowserView wrapper with 14 isolated profile contexts.
 * 
 * Features:
 * - Isolated partitions per profile (cookies, localStorage, sessions)
 * - Chrome data import (bookmarks, history, passwords)
 * - Quick profile switching
 * - Tab management within each profile
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { host, useQuery, GlyphSpinner, Codicon, Badge } from '@hermes/plugin-sdk'
import './browser.css'

// Profile configuration
interface BrowserProfile {
  id: string
  name: string
  color: string
  icon: string
  partition: string
  lastUsed?: string
  tabs?: BrowserTab[]
}

interface BrowserTab {
  id: string
  url: string
  title: string
  favicon?: string
  loading?: boolean
}

// Default 14 profiles based on Olympus agents/contexts
const DEFAULT_PROFILES: BrowserProfile[] = [
  { id: 'hermes', name: 'Hermes', color: '#e8623d', icon: '⚡', partition: 'persist:hermes' },
  { id: 'athena', name: 'Athena', color: '#60a5fa', icon: '🦉', partition: 'persist:athena' },
  { id: 'apollo', name: 'Apollo', color: '#fbbf24', icon: '☀️', partition: 'persist:apollo' },
  { id: 'artemis', name: 'Artemis', color: '#a78bfa', icon: '🌙', partition: 'persist:artemis' },
  { id: 'ares', name: 'Ares', color: '#ef4444', icon: '⚔️', partition: 'persist:ares' },
  { id: 'hephaestus', name: 'Hefesto', color: '#f97316', icon: '🔨', partition: 'persist:hephaestus' },
  { id: 'demeter', name: 'Demeter', color: '#22c55e', icon: '🌾', partition: 'persist:demeter' },
  { id: 'dionysus', name: 'Dionísio', color: '#c084fc', icon: '🍇', partition: 'persist:dionysus' },
  { id: 'poseidon', name: 'Poseidon', color: '#06b6d4', icon: '🔱', partition: 'persist:poseidon' },
  { id: 'hades', name: 'Hades', color: '#6b7280', icon: '💀', partition: 'persist:hades' },
  { id: 'hera', name: 'Hera', color: '#ec4899', icon: '👑', partition: 'persist:hera' },
  { id: 'zeus', name: 'Zeus', color: '#eab308', icon: '⚡', partition: 'persist:zeus' },
  { id: 'work', name: 'Trabalho', color: '#3b82f6', icon: '💼', partition: 'persist:work' },
  { id: 'personal', name: 'Pessoal', color: '#10b981', icon: '🏠', partition: 'persist:personal' },
]

// Profile selector pill
function ProfilePill({ 
  profile, 
  isActive, 
  onClick 
}: { 
  profile: BrowserProfile
  isActive: boolean
  onClick: () => void 
}) {
  return (
    <button
      className={`browser-profile-pill ${isActive ? 'browser-profile-pill--active' : ''}`}
      style={{ '--profile-color': profile.color } as React.CSSProperties}
      onClick={onClick}
      title={profile.name}
    >
      <span className="browser-profile-pill__icon">{profile.icon}</span>
      <span className="browser-profile-pill__name">{profile.name}</span>
    </button>
  )
}

// Tab bar within a profile
function TabBar({ 
  tabs, 
  activeTabId, 
  onSelectTab, 
  onCloseTab, 
  onNewTab 
}: {
  tabs: BrowserTab[]
  activeTabId: string | null
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
}) {
  return (
    <div className="browser-tabs">
      {tabs.map(tab => (
        <div 
          key={tab.id}
          className={`browser-tab ${tab.id === activeTabId ? 'browser-tab--active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.loading ? (
            <GlyphSpinner size="sm" />
          ) : tab.favicon ? (
            <img src={tab.favicon} alt="" className="browser-tab__favicon" />
          ) : (
            <Codicon name="globe" />
          )}
          <span className="browser-tab__title">{tab.title || 'Nova aba'}</span>
          <button 
            className="browser-tab__close"
            onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
          >
            <Codicon name="close" />
          </button>
        </div>
      ))}
      <button className="browser-tab browser-tab--new" onClick={onNewTab}>
        <Codicon name="add" />
      </button>
    </div>
  )
}

// Address bar
function AddressBar({ 
  url, 
  onNavigate, 
  onBack, 
  onForward, 
  onRefresh,
  canGoBack,
  canGoForward,
  isLoading
}: {
  url: string
  onNavigate: (url: string) => void
  onBack: () => void
  onForward: () => void
  onRefresh: () => void
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
}) {
  const [inputValue, setInputValue] = useState(url)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(url)
  }, [url])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let targetUrl = inputValue.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl
      } else {
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`
      }
    }
    onNavigate(targetUrl)
  }

  return (
    <div className="browser-address-bar">
      <div className="browser-nav-buttons">
        <button 
          className="browser-nav-btn" 
          onClick={onBack} 
          disabled={!canGoBack}
          title="Voltar"
        >
          <Codicon name="arrow-left" />
        </button>
        <button 
          className="browser-nav-btn" 
          onClick={onForward} 
          disabled={!canGoForward}
          title="Avançar"
        >
          <Codicon name="arrow-right" />
        </button>
        <button 
          className="browser-nav-btn" 
          onClick={onRefresh}
          title={isLoading ? 'Parar' : 'Recarregar'}
        >
          <Codicon name={isLoading ? 'close' : 'refresh'} />
        </button>
      </div>
      <form className="browser-address-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="browser-address-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Pesquisar ou digitar URL"
        />
      </form>
      <div className="browser-actions">
        <button className="browser-nav-btn" title="Importar Chrome">
          <Codicon name="cloud-download" />
        </button>
        <button className="browser-nav-btn" title="Configurações">
          <Codicon name="settings-gear" />
        </button>
      </div>
    </div>
  )
}

// Webview wrapper (uses Electron webview or iframe fallback)
function BrowserWebview({ 
  url, 
  partition,
  onTitleChange,
  onUrlChange,
  onLoadStart,
  onLoadEnd,
  onNavigationState
}: {
  url: string
  partition: string
  onTitleChange: (title: string) => void
  onUrlChange: (url: string) => void
  onLoadStart: () => void
  onLoadEnd: () => void
  onNavigationState: (canBack: boolean, canForward: boolean) => void
}) {
  const webviewRef = useRef<any>(null)
  const [isElectron] = useState(() => !!(window as any).electron)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !isElectron) return

    const handleTitleUpdate = (e: any) => onTitleChange(e.title)
    const handleNavigate = (e: any) => {
      onUrlChange(e.url)
      onNavigationState(webview.canGoBack(), webview.canGoForward())
    }
    const handleLoadStart = () => onLoadStart()
    const handleLoadEnd = () => onLoadEnd()

    webview.addEventListener('page-title-updated', handleTitleUpdate)
    webview.addEventListener('did-navigate', handleNavigate)
    webview.addEventListener('did-navigate-in-page', handleNavigate)
    webview.addEventListener('did-start-loading', handleLoadStart)
    webview.addEventListener('did-stop-loading', handleLoadEnd)

    return () => {
      webview.removeEventListener('page-title-updated', handleTitleUpdate)
      webview.removeEventListener('did-navigate', handleNavigate)
      webview.removeEventListener('did-navigate-in-page', handleNavigate)
      webview.removeEventListener('did-start-loading', handleLoadStart)
      webview.removeEventListener('did-stop-loading', handleLoadEnd)
    }
  }, [isElectron, onTitleChange, onUrlChange, onLoadStart, onLoadEnd, onNavigationState])

  if (isElectron) {
    return (
      <webview
        ref={webviewRef}
        src={url}
        partition={partition}
        className="browser-webview"
        allowpopups="true"
        webpreferences="contextIsolation=yes"
      />
    )
  }

  // Fallback for non-Electron (limited functionality)
  return (
    <div className="browser-webview-fallback">
      <div className="browser-webview-fallback__message">
        <Codicon name="warning" />
        <p>Navegador completo disponível apenas no app desktop.</p>
        <p>URL: <a href={url} target="_blank" rel="noopener">{url}</a></p>
      </div>
    </div>
  )
}

// Main browser component
export function MultiBrowser() {
  const [profiles] = useState<BrowserProfile[]>(DEFAULT_PROFILES)
  const [activeProfileId, setActiveProfileId] = useState<string>('hermes')
  const [tabs, setTabs] = useState<Map<string, BrowserTab[]>>(new Map([
    ['hermes', [{ id: '1', url: 'https://google.com', title: 'Google' }]]
  ]))
  const [activeTabIds, setActiveTabIds] = useState<Map<string, string>>(new Map([
    ['hermes', '1']
  ]))
  const [navState, setNavState] = useState({ canBack: false, canForward: false, loading: false })

  const activeProfile = profiles.find(p => p.id === activeProfileId)!
  const profileTabs = tabs.get(activeProfileId) || []
  const activeTabId = activeTabIds.get(activeProfileId) || null
  const activeTab = profileTabs.find(t => t.id === activeTabId)

  const handleSelectProfile = useCallback((profileId: string) => {
    setActiveProfileId(profileId)
    // Initialize tabs for profile if needed
    if (!tabs.has(profileId)) {
      const newTab: BrowserTab = { id: Date.now().toString(), url: 'https://google.com', title: 'Nova aba' }
      setTabs(prev => new Map(prev).set(profileId, [newTab]))
      setActiveTabIds(prev => new Map(prev).set(profileId, newTab.id))
    }
  }, [tabs])

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabIds(prev => new Map(prev).set(activeProfileId, tabId))
  }, [activeProfileId])

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = new Map(prev)
      const profileTabs = [...(newTabs.get(activeProfileId) || [])]
      const idx = profileTabs.findIndex(t => t.id === tabId)
      if (idx !== -1) {
        profileTabs.splice(idx, 1)
        if (profileTabs.length === 0) {
          // Add a new blank tab if closing the last one
          profileTabs.push({ id: Date.now().toString(), url: 'https://google.com', title: 'Nova aba' })
        }
        newTabs.set(activeProfileId, profileTabs)
        
        // Update active tab if needed
        if (activeTabId === tabId) {
          const newActiveIdx = Math.min(idx, profileTabs.length - 1)
          setActiveTabIds(prev => new Map(prev).set(activeProfileId, profileTabs[newActiveIdx].id))
        }
      }
      return newTabs
    })
  }, [activeProfileId, activeTabId])

  const handleNewTab = useCallback(() => {
    const newTab: BrowserTab = { 
      id: Date.now().toString(), 
      url: 'https://google.com', 
      title: 'Nova aba' 
    }
    setTabs(prev => {
      const newTabs = new Map(prev)
      const profileTabs = [...(newTabs.get(activeProfileId) || []), newTab]
      newTabs.set(activeProfileId, profileTabs)
      return newTabs
    })
    setActiveTabIds(prev => new Map(prev).set(activeProfileId, newTab.id))
  }, [activeProfileId])

  const handleNavigate = useCallback((url: string) => {
    if (!activeTabId) return
    setTabs(prev => {
      const newTabs = new Map(prev)
      const profileTabs = [...(newTabs.get(activeProfileId) || [])]
      const tab = profileTabs.find(t => t.id === activeTabId)
      if (tab) {
        tab.url = url
        tab.loading = true
      }
      newTabs.set(activeProfileId, profileTabs)
      return newTabs
    })
  }, [activeProfileId, activeTabId])

  const handleTitleChange = useCallback((title: string) => {
    if (!activeTabId) return
    setTabs(prev => {
      const newTabs = new Map(prev)
      const profileTabs = [...(newTabs.get(activeProfileId) || [])]
      const tab = profileTabs.find(t => t.id === activeTabId)
      if (tab) tab.title = title
      newTabs.set(activeProfileId, profileTabs)
      return newTabs
    })
  }, [activeProfileId, activeTabId])

  const handleUrlChange = useCallback((url: string) => {
    if (!activeTabId) return
    setTabs(prev => {
      const newTabs = new Map(prev)
      const profileTabs = [...(newTabs.get(activeProfileId) || [])]
      const tab = profileTabs.find(t => t.id === activeTabId)
      if (tab) tab.url = url
      newTabs.set(activeProfileId, profileTabs)
      return newTabs
    })
  }, [activeProfileId, activeTabId])

  return (
    <div className="browser-container" style={{ '--active-profile-color': activeProfile.color } as React.CSSProperties}>
      {/* Profile bar */}
      <div className="browser-profile-bar">
        {profiles.map(profile => (
          <ProfilePill
            key={profile.id}
            profile={profile}
            isActive={profile.id === activeProfileId}
            onClick={() => handleSelectProfile(profile.id)}
          />
        ))}
      </div>

      {/* Tab bar */}
      <TabBar
        tabs={profileTabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      {/* Address bar */}
      <AddressBar
        url={activeTab?.url || ''}
        onNavigate={handleNavigate}
        onBack={() => {}}
        onForward={() => {}}
        onRefresh={() => {}}
        canGoBack={navState.canBack}
        canGoForward={navState.canForward}
        isLoading={navState.loading}
      />

      {/* Webview */}
      {activeTab && (
        <BrowserWebview
          url={activeTab.url}
          partition={activeProfile.partition}
          onTitleChange={handleTitleChange}
          onUrlChange={handleUrlChange}
          onLoadStart={() => setNavState(s => ({ ...s, loading: true }))}
          onLoadEnd={() => setNavState(s => ({ ...s, loading: false }))}
          onNavigationState={(canBack, canForward) => setNavState(s => ({ ...s, canBack, canForward }))}
        />
      )}
    </div>
  )
}

// Compact browser section for the dock
export function BrowserSection() {
  return (
    <div className="browser-section">
      <div className="browser-section__header">
        <Codicon name="globe" />
        <span>Navegador Multi-Perfil</span>
        <Badge variant="accent">14 perfis</Badge>
      </div>
      <div className="browser-section__profiles">
        {DEFAULT_PROFILES.slice(0, 7).map(profile => (
          <button
            key={profile.id}
            className="browser-section__profile"
            style={{ '--profile-color': profile.color } as React.CSSProperties}
            onClick={() => host.navigate(`/monte-olimpo/browser?profile=${profile.id}`)}
            title={profile.name}
          >
            {profile.icon}
          </button>
        ))}
        <button 
          className="browser-section__profile browser-section__profile--more"
          onClick={() => host.navigate('/monte-olimpo/browser')}
        >
          +7
        </button>
      </div>
      <p className="browser-section__hint">
        Perfis isolados com partitions separadas. Importação de Chrome disponível.
      </p>
    </div>
  )
}
