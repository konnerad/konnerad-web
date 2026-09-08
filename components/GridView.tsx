'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const BORDER = '0.5px solid rgba(0,0,0,0.12)'

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const THUMB = isMobile ? 48 : 64
  const TITLE_SIZE = isMobile ? '15px' : '18px'
  const META_SIZE = isMobile ? '15px' : '18px'
  const HEAD_SIZE = isMobile ? '11px' : '13px'
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
          const img = p.thumbnail || p.images?.[0]
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
                background: isHov ? 'rgba(0,0,0,0.025)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
                transition: 'background 0.15s ease',
                fontFamily: F,
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: THUMB, height: THUMB, flexShrink: 0, overflow: 'hidden', background: '#f0eeeb' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={p.label} style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transform: isHov ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.4s ease',
                  }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: p.color, opacity: 0.3 }} />
                )}
              </div>

              {/* Title */}
              <span style={{ fontSize: TITLE_SIZE, color: '#111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.label}
              </span>

              {/* Kind — desktop only */}
              {!isMobile && (
                <span style={{ fontSize: META_SIZE, color: 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.tag || '—'}
                </span>
              )}

              {/* Client — desktop only */}
              {!isMobile && (
                <span style={{ fontSize: META_SIZE, color: 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.client || '—'}
                </span>
              )}

              {/* Year */}
              <span style={{ fontSize: META_SIZE, color: 'rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
                {p.year || '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
