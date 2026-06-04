'use client'

import { Project } from '@/lib/supabase'

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project, refNum: string) => void
}) {
  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ padding: '52px 0 80px' }}>
      {/* Column headers */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '0.5px solid rgba(232,228,220,0.12)',
        }}
      >
        {['Project', 'Year / Type'].map((h, i) => (
          <div
            key={h}
            className="px-5 pb-2 text-[9px] tracking-[0.2em] uppercase"
            style={{
              color: 'rgba(232,228,220,0.2)',
              gridColumn: i === 0 ? '1' : '2 / 4',
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {projects.map((p, i) => {
          const refNum = `P${String(i + 1).padStart(3, '0')}`
          const img = p.thumbnail || p.images?.[0]
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p, refNum)}
              className="text-left group flex flex-col"
              style={{
                borderRight: (i + 1) % 3 !== 0 ? '0.5px solid rgba(232,228,220,0.1)' : 'none',
                borderBottom: '0.5px solid rgba(232,228,220,0.1)',
              }}
            >
              {/* Image */}
              <div className="w-full overflow-hidden" style={{ aspectRatio: '1', background: '#0d0d14' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={p.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: p.color, opacity: 0.4 }} />
                )}
              </div>

              {/* Text */}
              <div className="px-5 py-4 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="leading-tight"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 'clamp(13px, 1.3vw, 18px)',
                      color: 'rgba(232,228,220,0.85)',
                    }}
                  >
                    {p.label}
                  </span>
                  <span className="text-[8px] tracking-[0.15em] shrink-0 mt-0.5" style={{ color: 'rgba(232,228,220,0.22)' }}>
                    {refNum}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[9px] tracking-wider" style={{ color: 'rgba(232,228,220,0.3)' }}>{p.year}</span>
                  {p.tag && (
                    <span className="text-[9px] tracking-wider" style={{ color: 'rgba(232,228,220,0.2)' }}>
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
  )
}
