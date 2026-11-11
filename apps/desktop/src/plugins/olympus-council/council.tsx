/** Council page — agents roster, missions/ledger summary, pending HITL
 *  approvals. Read-only; approve/reject actions are a follow-up. */
import { Badge, Codicon, EmptyState, ErrorState, GlyphSpinner, useQuery } from '@hermes/plugin-sdk'
import type { ReactNode } from 'react'

import { fetchAgents, fetchGuardPending, fetchLedger, fetchMissions } from './api'

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[0.75rem] font-medium text-(--ui-text-secondary)">{title}</div>
      {children}
    </div>
  )
}

function AgentsSection() {
  const { data, error, isLoading } = useQuery({
    queryFn: fetchAgents,
    queryKey: ['olympus-council', 'agents'],
    refetchInterval: 30_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState description={String(error)} title="Falha ao carregar agentes" />

  const agents = data?.agents ?? []
  if (agents.length === 0) return <EmptyState title="Nenhum agente reportado" />

  return (
    <Section title={`Agentes (${agents.length})`}>
      <div className="olympus-council-grid">
        {agents.map(a => (
          <div className="flex flex-col gap-0.5 rounded-md border border-(--ui-stroke-secondary) p-2" key={a.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.8125rem] font-medium">{a.id}</span>
              <Badge variant="muted">{a.department || '—'}</Badge>
            </div>
            <div className="text-[0.6875rem] text-(--ui-text-tertiary)">{a.mission || ''}</div>
            <div className="text-[0.625rem] text-(--ui-text-quaternary)">
              superior: {a.superior || '—'} · budget:{' '}
              {typeof a.budget_remaining === 'number' ? a.budget_remaining.toFixed(2) : '—'}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function MissionsSection() {
  const { data, error, isLoading } = useQuery({
    queryFn: fetchMissions,
    queryKey: ['olympus-council', 'missions'],
    refetchInterval: 30_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState description={String(error)} title="Falha ao carregar missões" />

  return (
    <Section title="Missões">
      <div className="text-[0.75rem] text-(--ui-text-tertiary)">
        {data?.missions ?? 0} missões · {data?.envelopes ?? 0} envelopes
      </div>
    </Section>
  )
}

function LedgerSection() {
  const { data, error, isLoading } = useQuery({
    queryFn: fetchLedger,
    queryKey: ['olympus-council', 'ledger'],
    refetchInterval: 30_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState description={String(error)} title="Falha ao carregar ledger" />

  return (
    <Section title="Ledger">
      <div className="text-[0.75rem] text-(--ui-text-tertiary)">
        ${(data?.global_spent ?? 0).toFixed(2)} / ${(data?.global_budget ?? 0).toFixed(2)} ·{' '}
        {data?.agents_active ?? 0} agentes ativos · {data?.entries_today ?? 0} entradas hoje
      </div>
    </Section>
  )
}

function GuardPendingSection() {
  const { data, error, isLoading } = useQuery({
    queryFn: fetchGuardPending,
    queryKey: ['olympus-council', 'guard-pending'],
    refetchInterval: 15_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState description={String(error)} title="Falha ao carregar aprovações" />

  const pending = data?.pending ?? []

  return (
    <Section title={`Aprovações pendentes (${pending.length})`}>
      {pending.length === 0 ? (
        <EmptyState title="Nada esperando aprovação" />
      ) : (
        <div className="flex flex-col gap-1.5">
          {pending.map((p, i) => (
            <div
              className="rounded-md border border-(--ui-stroke-secondary) p-2 text-[0.75rem]"
              key={(p as { id?: string }).id ?? i}
            >
              {JSON.stringify(p)}
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

export function CouncilPage() {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="flex items-center gap-2">
        <Codicon name="organization" size="1rem" />
        <div className="text-[0.9375rem] font-medium">Olympus Council</div>
      </div>
      <GuardPendingSection />
      <AgentsSection />
      <MissionsSection />
      <LedgerSection />
    </div>
  )
}
