'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Project } from '@/lib/supabase'

const GALAXY_Y = 0.24
const GALAXY_ROT = 0.22
const ORBIT_FRACTIONS = [0.30, 0.54, 0.77, 1.00]
const PER_RING = 5

type Orb = Project & {
  radiusFraction: number
  speed: number
  phase: number
  sizeFraction: number
}

function buildOrbits(projects: Project[]): Orb[] {
  return projects.map((p, i) => {
    const orbitIndex = Math.floor(i / PER_RING)
    const fraction = ORBIT_FRACTIONS[Math.min(orbitIndex, 3)]
    const radiusFraction = fraction + (Math.random() * 0.025 - 0.0125)
    const speed = 0.00009 + Math.random() * 0.00004
    const posInRing = i % PER_RING
    const segmentSize = (Math.PI * 2) / PER_RING
    const phase = posInRing * segmentSize + Math.random() * segmentSize * 0.75
    const sizeFraction = (42 + Math.random() * 16) / 248
    return { ...p, radiusFraction, speed, phase, sizeFraction }
  })
}

export default function Galaxy({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project, screenX: number, screenY: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Map from URL → loaded HTMLImageElement (null while loading)
  const imgCache = useRef<Map<string, HTMLImageElement | null>>(new Map())
  const stateRef = useRef({
    orbits: [] as Orb[],
    W: 0, H: 0, cx: 0, cy: 0,
    baseRadius: 0,
    mouseX: -999, mouseY: -999,
    hovered: -1,
    lastPositions: [] as { x: number; y: number; depth: number }[],
    animFrame: 0,
    t: 0,
  })

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = stateRef.current
    const dpr = window.devicePixelRatio || 1
    s.W = canvas.offsetWidth
    s.H = canvas.offsetHeight
    // Physical pixel dimensions — prevents blurry images on retina/mobile screens
    canvas.width  = s.W * dpr
    canvas.height = s.H * dpr
    ctx.scale(dpr, dpr)
    s.cx = s.W / 2
    s.cy = s.H / 2
    s.baseRadius = Math.min(s.W * 0.46, s.H * 0.82)
  }, [])

  useEffect(() => {
    stateRef.current.orbits = buildOrbits(projects)
  }, [projects])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const s = stateRef.current

    resize()

    function getPos(orb: Orb, time: number) {
      const radius = orb.radiusFraction * s.baseRadius
      const angle = orb.phase + orb.speed * time
      const rawX = Math.cos(angle) * radius
      const rawY = Math.sin(angle) * radius * GALAXY_Y
      const x = s.cx + rawX * Math.cos(GALAXY_ROT) - rawY * Math.sin(GALAXY_ROT)
      const y = s.cy + rawX * Math.sin(GALAXY_ROT) + rawY * Math.cos(GALAXY_ROT)
      return { x, y, depth: Math.sin(angle) }
    }

    function drawRing(radius: number) {
      ctx.save()
      ctx.translate(s.cx, s.cy)
      ctx.rotate(GALAXY_ROT)
      ctx.scale(1, GALAXY_Y)
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,228,220,0.05)'
      ctx.lineWidth = 0.5
      ctx.stroke()
      ctx.restore()
    }

    // Returns the cached image if ready, kicks off load if not
    function getImg(url: string): HTMLImageElement | null {
      if (imgCache.current.has(url)) return imgCache.current.get(url) ?? null
      imgCache.current.set(url, null) // mark loading
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => imgCache.current.set(url, img)
      img.onerror = () => imgCache.current.delete(url)
      img.src = url
      return null
    }

    function drawOrb(
      orb: Orb, x: number, y: number, size: number, alpha: number, isHov: boolean
    ) {
      const r = size / 2
      const coverUrl = orb.thumbnail || orb.images?.[0]
      const img = coverUrl ? getImg(coverUrl) : null

      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha)

      if (img && img.naturalWidth > 0) {
        // Circular image
        ctx.shadowColor = 'rgba(255,255,255,0.25)'
        ctx.shadowBlur = isHov ? 22 : 10
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.clip()
        // cover-fit: scale to fill circle
        const aspect = img.naturalWidth / img.naturalHeight
        let sw = size, sh = size
        if (aspect > 1) { sw = size * aspect } else { sh = size / aspect }
        ctx.drawImage(img, x - sw / 2, y - sh / 2, sw, sh)
      } else {
        // Fallback: coloured shape while image loads (or no image)
        ctx.shadowColor = orb.color
        ctx.shadowBlur = 18 * (isHov ? 1 : 0.4)
        ctx.fillStyle = orb.color
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        if (orb.shape === 'circle') {
          ctx.arc(x, y, r, 0, Math.PI * 2)
        } else if (orb.shape === 'square') {
          const sq = size * 0.85
          ctx.rect(x - sq / 2, y - sq / 2, sq, sq)
        } else {
          const d = size * 0.6
          ctx.moveTo(x, y - d); ctx.lineTo(x + d, y)
          ctx.lineTo(x, y + d); ctx.lineTo(x - d, y)
          ctx.closePath()
        }
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()

      // Thin border ring on top
      ctx.save()
      ctx.globalAlpha = Math.min(1, alpha) * (isHov ? 0.8 : 0.35)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.strokeStyle = isHov ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'
      ctx.lineWidth = isHov ? 1.5 : 0.5
      ctx.stroke()
      ctx.restore()
    }

    function animate(timestamp: number) {
      s.t = timestamp
      ctx.clearRect(0, 0, s.W, s.H)

      ORBIT_FRACTIONS.forEach(f => drawRing(f * s.baseRadius))

      s.hovered = -1
      const positions = s.orbits.map(orb => getPos(orb, timestamp))
      s.lastPositions = positions

      const sorted = s.orbits
        .map((orb, i) => ({ orb, pos: positions[i], i }))
        .sort((a, b) => a.pos.depth - b.pos.depth)

      sorted.forEach(({ orb, pos, i }) => {
        const baseSize = orb.sizeFraction * s.baseRadius
        const dx = s.mouseX - pos.x, dy = s.mouseY - pos.y
        const isHov = Math.sqrt(dx * dx + dy * dy) < baseSize / 2 + 8
        if (isHov) s.hovered = i

        const d = pos.depth
        const alpha = Math.max(0.12, 0.55 + d * 0.45) + (isHov ? 0.15 : 0)
        const scale = Math.max(0.35, 0.65 + d * 0.55) + (isHov ? 0.12 : 0)
        const size = baseSize * scale

        drawOrb(orb, pos.x, pos.y, size, alpha, isHov)

        if (isHov) {
          ctx.save()
          ctx.globalAlpha = 0.9
          ctx.fillStyle = '#e8e4dc'
          ctx.font = '10px DM Mono, monospace'
          ctx.textAlign = 'center'
          ctx.fillText(orb.label.toUpperCase(), pos.x, pos.y + size / 2 + 14)
          ctx.globalAlpha = 0.4
          ctx.font = '9px DM Mono, monospace'
          ctx.fillText(orb.year, pos.x, pos.y + size / 2 + 25)
          ctx.restore()
        }
      })

      s.animFrame = requestAnimationFrame(animate)
    }

    s.animFrame = requestAnimationFrame(animate)

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      s.mouseX = e.clientX - rect.left
      s.mouseY = e.clientY - rect.top
      canvas.style.cursor = s.hovered !== -1 ? 'pointer' : 'default'
    }

    const onClick = () => {
      if (s.hovered === -1) return
      const rect = canvas.getBoundingClientRect()
      const pos = s.lastPositions[s.hovered]
      onSelect(s.orbits[s.hovered], rect.left + pos.x, rect.top + pos.y)
    }

    const onResize = () => resize()

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(s.animFrame)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [resize, onSelect])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  )
}
