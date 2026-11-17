/**
 * Monte Olimpo Neural Map — Canvas visualization of the Olympus knowledge graph
 * Renders ~400 nodes (templos, luas, deuses) with connections and animations.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { host, useQuery, GlyphSpinner, ErrorState, EmptyState } from '@hermes/plugin-sdk'
import './neural-map.css'

interface Templo {
  orig: number
  label: string
  n: number
  x: number
  y: number
  w: number
  alt: number
  tipos: Record<string, number>
  luas: Array<{ l: string; t: string; w: number; a: number }>
}

interface Ligacao {
  a: number
  b: number
  p: number
}

interface Deus {
  nome: string
  missao: string
  dept: string
  chefe: string
  x: number
  y: number
  templo: number
}

interface Vagalume {
  x: number
  y: number
  ph: number
}

interface OlimpoData {
  gerado: string
  totais: { planetas: number; luas: number; ligacoes: number; naves: number }
  templos: Templo[]
  ligacoes: Ligacao[]
  deuses: Deus[]
  vagalumes: Vagalume[]
  pico: { x: number; y: number }
  conselho: { x: number; y: number; n: number }
}

// Color palette from Olympus brand
const COLORS = {
  navy900: '#0b1222',
  navy850: '#0f1830',
  navy700: '#1c2a4a',
  orange500: '#e8623d',
  orange400: '#f2814f',
  orange300: '#ffa379',
  fg: '#eaf0fb',
  fgDim: '#96a0b8',
  firefly: '#ffe9a8',
  vale: '#5a6a94',
  ok: '#37e0a0',
  link: 'rgba(232, 98, 61, 0.3)'
}

// Type colors
const TYPE_COLORS: Record<string, string> = {
  agente: COLORS.orange500,
  skill: COLORS.ok,
  nota: COLORS.fgDim,
  default: COLORS.navy700
}

export function NeuralMapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.5 })
  const [hoveredNode, setHoveredNode] = useState<{ type: string; data: any } | null>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  const { data, error, isLoading } = useQuery<OlimpoData>({
    queryKey: ['olympus-neural-map', 'graph'],
    queryFn: async () => {
      const rest = host.rest()
      return rest('/api/plugins/olympus-neural-map/graph', { method: 'GET' })
    },
    refetchInterval: 60_000,
    staleTime: 30_000
  })

  // Draw the neural map
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    if (!data) return

    ctx.save()
    ctx.fillStyle = COLORS.navy900
    ctx.fillRect(0, 0, width, height)

    // Apply transform
    ctx.translate(width / 2 + transform.x, height / 2 + transform.y)
    ctx.scale(transform.scale, transform.scale)
    ctx.translate(-880, -400) // Center on the pico (880, 150)

    // Draw connections between templos
    ctx.strokeStyle = COLORS.link
    ctx.lineWidth = 1
    data.ligacoes.forEach(lig => {
      const a = data.templos[lig.a]
      const b = data.templos[lig.b]
      if (a && b) {
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.globalAlpha = Math.min(lig.p / 10, 0.6)
        ctx.stroke()
      }
    })
    ctx.globalAlpha = 1

    // Draw templos (clusters)
    data.templos.forEach((templo, i) => {
      const radius = Math.max(templo.w / 2, 20)
      
      // Glow effect for active templos
      const glowIntensity = Math.sin(time / 1000 + i) * 0.3 + 0.7
      
      // Draw templo circle
      ctx.beginPath()
      ctx.arc(templo.x, templo.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = templo.alt ? COLORS.navy850 : COLORS.navy700
      ctx.fill()
      ctx.strokeStyle = COLORS.orange500
      ctx.lineWidth = 2
      ctx.globalAlpha = glowIntensity
      ctx.stroke()
      ctx.globalAlpha = 1

      // Draw templo label
      ctx.fillStyle = COLORS.fg
      ctx.font = '10px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = templo.label.length > 20 ? templo.label.slice(0, 18) + '…' : templo.label
      ctx.fillText(label, templo.x, templo.y)
      
      // Draw node count
      ctx.fillStyle = COLORS.fgDim
      ctx.font = '8px system-ui'
      ctx.fillText(`${templo.n}`, templo.x, templo.y + 12)
    })

    // Draw deuses (gods/agents)
    data.deuses.forEach((deus, i) => {
      const x = deus.x
      const y = deus.y
      const pulseRadius = 6 + Math.sin(time / 500 + i * 0.5) * 2
      
      // Outer glow
      ctx.beginPath()
      ctx.arc(x, y, pulseRadius + 4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232, 98, 61, ${0.2 + Math.sin(time / 500 + i) * 0.1})`
      ctx.fill()
      
      // Inner circle
      ctx.beginPath()
      ctx.arc(x, y, pulseRadius, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.orange500
      ctx.fill()
      
      // Name label (only for top-level gods)
      if (deus.chefe === '' || deus.chefe === 'hermes') {
        ctx.fillStyle = COLORS.fg
        ctx.font = 'bold 9px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText(deus.nome, x, y - 14)
      }
    })

    // Draw vagalumes (fireflies = subagents)
    data.vagalumes.forEach((vaga, i) => {
      const phase = time / 1000 + vaga.ph
      const alpha = Math.sin(phase) * 0.4 + 0.6
      const size = 2 + Math.sin(phase * 2) * 1
      
      ctx.beginPath()
      ctx.arc(vaga.x, vaga.y, size, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.firefly
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Draw pico (summit)
    if (data.pico) {
      ctx.beginPath()
      ctx.arc(data.pico.x, data.pico.y, 12, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.orange500
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⚡', data.pico.x, data.pico.y)
      
      ctx.fillStyle = COLORS.fg
      ctx.font = 'bold 12px system-ui'
      ctx.fillText('HERMES', data.pico.x, data.pico.y - 20)
    }

    ctx.restore()
  }, [data, transform])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !data) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      timeRef.current = performance.now()
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      draw(ctx, canvas.width, canvas.height, timeRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data, draw])

  // Pan and zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({
      ...t,
      scale: Math.max(0.1, Math.min(3, t.scale * delta))
    }))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    const startTransform = { ...transform }

    const handleMouseMove = (e: MouseEvent) => {
      setTransform({
        ...startTransform,
        x: startTransform.x + (e.clientX - startX),
        y: startTransform.y + (e.clientY - startY)
      })
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [transform])

  // Handle click on node
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!data || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Transform click coordinates back to world space
    const worldX = (clickX - canvas.width / 2 - transform.x) / transform.scale + 880
    const worldY = (clickY - canvas.height / 2 - transform.y) / transform.scale + 400
    
    // Check if clicked on a deus
    for (const deus of data.deuses) {
      const dx = worldX - deus.x
      const dy = worldY - deus.y
      if (dx * dx + dy * dy < 100) { // 10px radius
        // Navigate to bot mode with this agent
        host.navigate(`/chat?bot=${deus.nome}`)
        return
      }
    }
  }, [data, transform])

  if (isLoading) {
    return (
      <div className="neural-map-loading">
        <GlyphSpinner />
        <span>Carregando Mapa Neural...</span>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState 
        title="Mapa Neural indisponível"
        description="olimpo.json não encontrado ou backend offline"
      />
    )
  }

  if (!data) {
    return (
      <EmptyState 
        title="Mapa Neural vazio"
        description="Execute memory_map_run.sh para gerar o grafo"
      />
    )
  }

  return (
    <div className="neural-map-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="neural-map-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      />
      <div className="neural-map-controls">
        <button onClick={() => setTransform(t => ({ ...t, scale: t.scale * 1.2 }))}>+</button>
        <button onClick={() => setTransform(t => ({ ...t, scale: t.scale / 1.2 }))}>−</button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 0.5 })}>⌂</button>
      </div>
      <div className="neural-map-stats">
        <span>{data.totais.planetas} templos</span>
        <span>{data.totais.luas} nós</span>
        <span>{data.deuses.length} deuses</span>
        <span>{data.vagalumes.length} vagalumes</span>
      </div>
      {hoveredNode && (
        <div className="neural-map-tooltip">
          <strong>{hoveredNode.data.nome || hoveredNode.data.label}</strong>
          <p>{hoveredNode.data.missao || hoveredNode.data.tipos}</p>
        </div>
      )}
    </div>
  )
}
