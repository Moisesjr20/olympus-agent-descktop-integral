/**
 * Olympus Council — read-only view of the 36-agent Council backend
 * (Moisesjr20/olympus FastAPI process, 127.0.0.1:8701 on the VPS). Reuses
 * the `olympus-council` Hermes plugin's dashboard proxy
 * (`~/.hermes/plugins/olympus-council/dashboard/plugin_api.py`, mounted at
 * /api/plugins/olympus-council) through `ctx.rest` — same pattern as the
 * Kanban plugin's `bindApi(ctx.rest, ...)`.
 *
 * Ships bundled (compiled into the app) so it works over a REMOTE
 * connection too — the runtime desktop-plugins door only copies from a
 * backend on the same machine (#114079), which this install never is.
 *
 * Off by default — inventories in Capabilities ▸ Plugins until enabled.
 */
import './council.css'

import {
  Badge,
  Codicon,
  EmptyState,
  ErrorState,
  GlyphSpinner,
  type HermesPlugin,
  type RouteContribution,
  ROUTES_AREA,
  type SidebarNavContribution,
  SIDEBAR_NAV_AREA,
  useQuery
} from '@hermes/plugin-sdk'

import { CouncilPage } from './council'
import { bindRest } from './api'

const plugin: HermesPlugin = {
  id: 'olympus-council',
  name: 'Council',
  description: 'Visão somente-leitura dos 36 agentes, missões, ledger e aprovações pendentes do backend Olympus.',
  defaultEnabled: false,
  register(ctx) {
    ctx.onDispose(bindRest(ctx.rest))

    ctx.registerMany([
      {
        id: 'page',
        area: ROUTES_AREA,
        data: { path: '/olympus-council' } satisfies RouteContribution,
        render: () => <CouncilPage />
      },
      {
        id: 'nav',
        area: SIDEBAR_NAV_AREA,
        order: 51,
        data: { codicon: 'organization', label: 'Council', path: '/olympus-council' } satisfies SidebarNavContribution
      }
    ])
  }
}

export default plugin
