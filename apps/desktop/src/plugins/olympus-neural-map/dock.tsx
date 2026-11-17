/**
 * Monte Olimpo Dock — Central command view with peeks of Council, Kanban,
 * Neural Map (Plano B) and Browser (Plano C).
 */

import { useQuery } from '@hermes/plugin-sdk'
import {
  Badge,
  Codicon,
  EmptyState,
  ErrorState,
  GlyphSpinner,
  host
} from '@hermes/plugin-sdk'
import './dock.css'

// ════════════════════════════════════════════════════════════════════════════
// Section wrapper
// ════════════════════════════════════════════════════════════════════════════

interface SectionProps {
  title: string
  icon: string
  children: React.ReactNode
  action?: { label: string; onClick: () => void }
}

function Section({ title, icon, children, action }: SectionProps) {
  return (
    <section className="olympus-dock-section">
      <div className="olympus-dock-section__header">
        <div className="olympus-dock-section__title">
          <Codicon name={icon} />
          <span>{title}</span>
        </div>
        {action && (
          <button 
            className="olympus-dock-section__action"
            onClick={action.onClick}
          >
            {action.label} →
          </button>
        )}
      </div>
      <div className="olympus-dock-section__body">
        {children}
      </div>
    </section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Council Peek
// ════════════════════════════════════════════════════════════════════════════

function CouncilPeek() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['olympus-council', 'summary'],
    queryFn: async () => {
      const rest = host.rest()
      const agents = await rest('/api/plugins/olympus-council/agents', { method: 'GET' })
      const missions = await rest('/api/plugins/olympus-council/missions', { method: 'GET' })
      return { agents: agents?.agents ?? [], missions: missions?.missions ?? 0 }
    },
    refetchInterval: 30_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState title="Council offline" description="Backend 8701 indisponível" />
  
  const agentCount = data?.agents?.length ?? 0
  const activeAgents = data?.agents?.filter((a: { status?: string }) => a.status === 'active') ?? []

  return (
    <Section 
      title="Council" 
      icon="organization"
      action={{ label: 'Ver todos', onClick: () => host.navigate('/council') }}
    >
      <div className="olympus-peek-stats">
        <div className="olympus-peek-stat">
          <span className="olympus-peek-stat__value">{agentCount}</span>
          <span className="olympus-peek-stat__label">agentes</span>
        </div>
        <div className="olympus-peek-stat">
          <span className="olympus-peek-stat__value">{activeAgents.length}</span>
          <span className="olympus-peek-stat__label">ativos</span>
        </div>
        <div className="olympus-peek-stat">
          <span className="olympus-peek-stat__value">{data?.missions ?? 0}</span>
          <span className="olympus-peek-stat__label">missões</span>
        </div>
      </div>
      {activeAgents.length > 0 && (
        <div className="olympus-peek-list">
          {activeAgents.slice(0, 3).map((a: { id: string; department?: string }) => (
            <div key={a.id} className="olympus-peek-item">
              <span className="olympus-peek-item__name">{a.id}</span>
              <Badge variant="muted">{a.department || '—'}</Badge>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Kanban Peek
// ════════════════════════════════════════════════════════════════════════════

function KanbanPeek() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['kanban', 'summary'],
    queryFn: async () => {
      const rest = host.rest()
      const board = await rest('/api/plugins/kanban/board', { method: 'GET' })
      return board
    },
    refetchInterval: 15_000
  })

  if (isLoading) return <GlyphSpinner />
  if (error) return <ErrorState title="Kanban offline" description="Plugin desativado ou indisponível" />

  const tasks = data?.tasks ?? []
  const inForja = tasks.filter((t: { status: string }) => t.status === 'in_progress')
  const inRevisao = tasks.filter((t: { status: string }) => t.status === 'review')

  return (
    <Section 
      title="Kanban" 
      icon="project"
      action={{ label: 'Abrir board', onClick: () => host.navigate('/kanban') }}
    >
      <div className="olympus-peek-columns">
        <div className="olympus-peek-column">
          <div className="olympus-peek-column__header">
            <Codicon name="flame" />
            <span>Em Forja ({inForja.length})</span>
          </div>
          {inForja.slice(0, 2).map((t: { id: string; title: string }) => (
            <div key={t.id} className="olympus-peek-card">{t.title}</div>
          ))}
          {inForja.length === 0 && <div className="olympus-peek-empty">Nenhuma</div>}
        </div>
        <div className="olympus-peek-column">
          <div className="olympus-peek-column__header">
            <Codicon name="eye" />
            <span>Revisão ({inRevisao.length})</span>
          </div>
          {inRevisao.slice(0, 2).map((t: { id: string; title: string }) => (
            <div key={t.id} className="olympus-peek-card">{t.title}</div>
          ))}
          {inRevisao.length === 0 && <div className="olympus-peek-empty">Nenhuma</div>}
        </div>
      </div>
    </Section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Placeholder sections for Plano B and C
// ════════════════════════════════════════════════════════════════════════════

function NeuralMapPlaceholder() {
  return (
    <Section title="Mapa Neural" icon="circuit-board">
      <EmptyState 
        title="Em breve — Plano B"
        description="Visualização do Monte Olimpo com 490 nós e conexões entre agentes"
      />
    </Section>
  )
}

function BrowserPlaceholder() {
  return (
    <Section title="Navegador" icon="globe">
      <EmptyState 
        title="Em breve — Plano C"
        description="Navegador multi-perfil com 14 contextos isolados e controle Olympus"
      />
    </Section>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════

export function MonteOlimpoPage() {
  return (
    <div className="olympus-monte-olimpo">
      <header className="olympus-monte-olimpo__header">
        <h1>
          <Codicon name="home" />
          Monte Olimpo
        </h1>
        <p>Central de comando do Olympus</p>
      </header>

      <div className="olympus-monte-olimpo__grid">
        <CouncilPeek />
        <KanbanPeek />
        <NeuralMapPlaceholder />
        <BrowserPlaceholder />
      </div>
    </div>
  )
}
