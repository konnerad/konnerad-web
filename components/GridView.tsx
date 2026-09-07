'use client'

import { Project } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project, refNum: string) => void
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: '52px', paddingBottom: '80px', background: '#ffffff' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 40px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderTop: '0.5px solid rgba(0,0,0,0.15)',
            borderLeft: '0.5px solid rgba(0,0,0,0.15)',
          }}
        >
          {projects.map((p, i) => {
            const refNum = `P${String(i + 1).padStart(3, '0')}`
            const img = p.thumbnail || p.images?.[0]
            const PAD = 16
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p, refNum)}
                className="text-left group flex flex-col"
                style={{
                  borderRight: '0.5px solid rgba(0,0,0,0.15)',
                  borderBottom: '0.5px solid rgba(0,0,0,0.15)',
                  background: '#ffffff',
                }}
              >
                {/* Reference number — same horizontal padding as image */}
                <div style={{ padding: `${PAD}px ${PAD}px 8px` }}>
                  <span style={{ fontFamily: F, fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(0,0,0,0.35)' }}>
                    {refNum}
                  </span>
                </div>

                {/* Image — contained with equal padding */}
                <div
                  className="w-full flex items-center justify-center overflow-hidden"
                  style={{ aspectRatio: '1', padding: `0 ${PAD}px` }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={p.label}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: p.color, opacity: 0.3 }} />
                  )}
                </div>

                {/* Details */}
                <div
                  style={{
                    padding: `10px ${PAD}px ${PAD}px`,
                    borderTop: '0.5px solid rgba(0,0,0,0.08)',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontFamily: F, fontSize: 'clamp(11px,1.1vw,14px)', color: '#111111', lineHeight: 1.3 }}>
                    {p.label}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {p.year && (
                      <span style={{ fontFamily: F, fontSize: '9px', letterSpacing: '0.05em', color: 'rgba(0,0,0,0.4)' }}>
                        {p.year}
                      </span>
                    )}
                    {p.tag && (
                      <span style={{ fontFamily: F, fontSize: '9px', letterSpacing: '0.05em', color: 'rgba(0,0,0,0.28)' }}>
                        · {p.tag}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
