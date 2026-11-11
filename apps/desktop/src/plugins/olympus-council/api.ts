/** Thin `ctx.rest` binding — mirrors the kanban plugin's `bindApi` shape,
 *  minus board scoping (Council has no per-board concept). */
import type { PluginRestOptions } from '@hermes/plugin-sdk'

type Rest = <T>(path: string, opts?: PluginRestOptions) => Promise<T>

let _rest: Rest | null = null

export function bindRest(rest: Rest): () => void {
  _rest = rest
  return () => {
    _rest = null
  }
}

function get<T>(path: string): Promise<T> {
  if (!_rest) {
    return Promise.reject(new Error('olympus-council: not registered'))
  }
  return _rest(path, { method: 'GET' }) as Promise<T>
}

export interface CouncilAgent {
  id: string
  mission?: string
  department?: string
  superior?: string
  deliverable_type?: string
  tools_allowed?: string[]
  tools_denied?: string[]
  budget_remaining?: number
  accepts_from?: string[]
}

export interface CouncilAgentsResponse {
  agents: CouncilAgent[]
}

export interface CouncilMissionsResponse {
  missions: number
  envelopes: number
  db_path?: string
}

export interface CouncilLedgerResponse {
  global_spent: number
  global_budget: number
  agents_active: number
  entries_today: number
  top_agents?: unknown[]
  top_operations?: unknown[]
}

export interface CouncilGuardPendingResponse {
  pending: unknown[]
  total: number
}

export const fetchAgents = () => get<CouncilAgentsResponse>('/agents')
export const fetchMissions = () => get<CouncilMissionsResponse>('/missions')
export const fetchLedger = () => get<CouncilLedgerResponse>('/ledger')
export const fetchGuardPending = () => get<CouncilGuardPendingResponse>('/guard/pending')
