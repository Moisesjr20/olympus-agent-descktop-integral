/**
 * Monte Olimpo — Central command dock for Olympus Desktop
 * Displays Council, Kanban, Neural Map and Browser in a unified view.
 */

import type { HermesPlugin } from '@hermes/plugin-sdk'
import { ROUTES_AREA, SIDEBAR_NAV_AREA } from '@hermes/plugin-sdk'
import type { RouteContribution, SidebarNavContribution } from '@hermes/plugin-sdk'
import { MonteOlimpoPage } from './dock'
import { NeuralMapCanvas } from './neural-map'
import { MultiBrowser } from './browser'

// Wrapper components for fullscreen views
function NeuralMapFullscreen() {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--olympus-navy-950)' }}>
      <NeuralMapCanvas />
    </div>
  )
}

function BrowserFullscreen() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <MultiBrowser />
    </div>
  )
}

export const plugin: HermesPlugin = {
  id: 'olympus-neural-map',
  name: 'Monte Olimpo',
  description: 'Dock central: Council, Kanban, Mapa Neural e Navegador num só lugar.',
  defaultEnabled: false,

  register(ctx) {
    // Main dock page
    ctx.register({
      id: 'route',
      area: ROUTES_AREA,
      data: {
        path: '/monte-olimpo',
        component: MonteOlimpoPage
      } satisfies RouteContribution
    })

    // Neural Map fullscreen
    ctx.register({
      id: 'route-mapa',
      area: ROUTES_AREA,
      data: {
        path: '/monte-olimpo/mapa',
        component: NeuralMapFullscreen
      } satisfies RouteContribution
    })

    // Browser fullscreen
    ctx.register({
      id: 'route-browser',
      area: ROUTES_AREA,
      data: {
        path: '/monte-olimpo/browser',
        component: BrowserFullscreen
      } satisfies RouteContribution
    })

    // Sidebar navigation
    ctx.register({
      id: 'nav',
      area: SIDEBAR_NAV_AREA,
      data: {
        codicon: 'home',
        label: 'Monte Olimpo',
        path: '/monte-olimpo'
      } satisfies SidebarNavContribution
    })
  }
}

export default plugin
