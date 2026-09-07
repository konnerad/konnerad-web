'use client'

import { useState } from 'react'
import { Project } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const BORDER = '0.5px solid rgba(0,0,0,0.12)'

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project, refNum: string) => void
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ background: '#ffffff', fontFamily: F }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 40px 80px' }}>

        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 80px 72px',
          gap: '0 24px',
          padding: '52px 0 12px',
          borderBottom: '0.5px solid rgba(0,0,0,0.25)',
        }}>
          {['Title', 'Kind', 'Client', 'Year', ''].map((h, i) => (
            <span key={i} style={{
              fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.35)', fontFamily: F,
              textAlign: i === 4 ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {projects.map((p, i) => {
          const refNum = `P${String(i + 1).padStart(3, '0')}`
          const img = p.thumbnail || p.images?.[0]
          const isHov = hoveredIdx === i

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p, refNum)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 80px 72px',
                gap: '0 24px',
                width: '100%',
                padding: '18px 0',
                borderBottom: BORDER,
                background: isHov ? 'rgba(0,0,0,0.025)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                alignItems: 'center',
                transition: 'background 0.15s ease',
                fontFamily: F,
              }}
            >
              {/* Title */}
              <span style={{ fontSize: '13px', color: '#111', lineHeight: 1.3 }}>
                {p.label}
              </span>

              {/* Kind */}
              <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>
                {p.tag || '—'}
              </span>

              {/* Client */}
              <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>
                {p.client || '—'}
              </span>

              {/* Year */}
              <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)' }}>
                {p.year || '—'}
              </span>

              {/* Thumbnail */}
              <div style={{ width: 56, height: 56, flexShrink: 0, justifySelf: 'end', overflow: 'hidden', background: '#f0eeeb' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={p.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      transform: isHov ? 'scale(1.06)' : 'scale(1)',
                      transition: 'transform 0.4s ease',
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: p.color, opacity: 0.3 }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
