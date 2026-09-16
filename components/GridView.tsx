'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"

function isNearWhite(color: string) {
  const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/)
  if (!m) return true
  return +m[1] > 238 && +m[2] > 238 && +m[3] > 238
}

function thumb(url: string, w = 128) {
  if (!url || url.includes('youtube') || /\.(mp4|mov|webm)$/i.test(url)) return url
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=80`
}
const BORDER = '0.5px solid rgba(0,0,0,0.12)'

function extractColor(imgUrl: string, cb: (color: string) => void) {
  if (!imgUrl || imgUrl.includes('youtube')) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, 64, 64)
    const { data } = ctx.getImageData(0, 0, 64, 64)
    const buckets: Record<string, { count: number; r: number; g: number; b: number; vibrant: boolean }> = {}
    let total = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      total++
      const pr = data[i], pg = data[i + 1], pb = data[i + 2]
      const vibrant = Math.max(pr, pg, pb) - Math.min(pr, pg, pb) > 60
      const key = `${Math.floor(pr / 32)},${Math.floor(pg / 32)},${Math.floor(pb / 32)}`
      if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0, vibrant }
      buckets[key].count++; buckets[key].r += pr; buckets[key].g += pg; buckets[key].b += pb
    }
    if (!total) return
    const all = Object.values(buckets)
    const vib = all.filter(b => b.vibrant).sort((a, b) => b.count - a.count)
    const pick = (vib[0]?.count / total >= 0.30) ? vib[0] : all.sort((a, b) => b.count - a.count)[0]
    if (!pick) return
    const r = Math.round(pick.r / pick.count)
    const g = Math.round(pick.g / pick.count)
    const b = Math.round(pick.b / pick.count)
    const mix = (c: number) => Math.round(c * 0.14 + 255 * 0.86)
    cb(`rgb(${mix(r)},${mix(g)},${mix(b)})`)
  }
  img.onerror = () => {}
  img.src = `/api/dominant-color?url=${encodeURIComponent(imgUrl)}`
}

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [colors, setColors] = useState<Record<string, string>>({})

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    projects.forEach(p => {
      const img = p.thumbnail || p.images?.[0]
      if (img && !colors[p.id] && !img.includes('youtube')) {
        extractColor(img, color => setColors(prev => ({ ...prev, [p.id]: color })))
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects])

  const hoveredColor = hoveredIdx != null ? (colors[projects[hoveredIdx]?.id] ?? null) : null

  const THUMB = isMobile ? 48 : 64
  const TITLE_SIZE = isMobile ? '13px' : '14px'
  const META_SIZE = isMobile ? '13px' : '14px'
  const HEAD_SIZE = isMobile ? '10px' : '11px'
  const PAD = isMobile ? '0 12px 80px' : '0 20px 80px'

  // Mobile: thumbnail + title + year only
  // Desktop: thumbnail + title + kind + client + year
  const gridCols = isMobile
    ? `${THUMB}px 1fr 52px`
    : `${THUMB}px 2fr 1.2fr 1.2fr 80px`

  const headers = isMobile
    ? ['Image', 'Title', 'Year']
    : ['Image', 'Title', 'Kind', 'Client', 'Year']

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: '#ffffff', fontFamily: F }}>
      <div style={{ padding: PAD }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: `0 ${isMobile ? 12 : 24}px`,
          padding: '52px 0 12px',
          borderBottom: '0.5px solid rgba(0,0,0,0.25)',
        }}>
          {headers.map((h, i) => (
            <span key={i} style={{
              fontSize: HEAD_SIZE, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.35)', fontFamily: F,
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {projects.map((p, i) => {
          const img = thumb(p.thumbnail || p.images?.[0] || '', 128)
          const isHov = hoveredIdx === i

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: `0 ${isMobile ? 12 : 24}px`,
                width: '100%',
                padding: `${isMobile ? 12 : 16}px 0`,
                borderBottom: BORDER,
                background: isHov
                  ? (!colors[p.id] || isNearWhite(colors[p.id]) ? 'rgba(0,0,0,0.05)' : colors[p.id])
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
                transition: 'background 0.15s ease',
                fontFamily: F,
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: THUMB, height: THUMB, flexShrink: 0, overflow: 'hidden', background: '#fff' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={p.label} style={{
                    width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                  }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#f0eeeb' }} />
                )}
              </div>

              {/* Title */}
              <span style={{ fontSize: TITLE_SIZE, color: '#111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.label}
              </span>

              {/* Kind — desktop only */}
              {!isMobile && (
                <span style={{ fontSize: META_SIZE, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.tag || '—'}
                </span>
              )}

              {/* Client — desktop only */}
              {!isMobile && (
                <span style={{ fontSize: META_SIZE, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.client || '—'}
                </span>
              )}

              {/* Year */}
              <span style={{ fontSize: META_SIZE, color: '#111', whiteSpace: 'nowrap' }}>
                {p.year || '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
