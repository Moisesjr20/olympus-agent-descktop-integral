/**
 * Monte Olimpo — Central command dock for Olympus Desktop
 * Displays Council, Kanban, Neural Map and Browser in a unified view.
 */

import type { HermesPlugin } from '@hermes/plugin-sdk'
import { ROUTES_AREA, SIDEBAR_NAV_AREA } from '@hermes/plugin-sdk'
import type { RouteContribution, SidebarNavContribution } from '@hermes/plugin-sdk'
import { MonteOlimpoPage } from './dock'

export const plugin: HermesPlugin = {
  id: 'olympus-neural-map',
  name: 'Monte Olimpo',
  description: 'Dock central: Council, Kanban, Mapa Neural e Navegador num só lugar.',
  defaultEnabled: false,

  register(ctx) {
    ctx.register({
      id: 'route',
      area: ROUTES_AREA,
      data: {
        path: '/monte-olimpo',
        component: MonteOlimpoPage
      } satisfies RouteContribution
    })

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
