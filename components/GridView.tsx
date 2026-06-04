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
    <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: '52px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 40px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '0.5px solid rgba(232,228,220,0.15)',
          borderLeft: '0.5px solid rgba(232,228,220,0.15)',
        }}
      >
        {projects.map((p, i) => {
          const refNum = `P${String(i + 1).padStart(3, '0')}`
          const img = p.thumbnail || p.images?.[0]
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p, refNum)}
              className="text-left group flex flex-col"
              style={{
                borderRight: '0.5px solid rgba(232,228,220,0.15)',
                borderBottom: '0.5px solid rgba(232,228,220,0.15)',
              }}
            >
              {/* Reference number */}
              <div className="px-4 pt-4 pb-2">
                <span
                  className="text-[9px] tracking-[0.18em]"
                  style={{ color: 'rgba(232,228,220,0.35)', fontFamily: "'DM Mono', monospace" }}
                >
                  {refNum}
                </span>
              </div>

              {/* Image — contained with padding, not full bleed */}
              <div
                className="w-full flex items-center justify-center overflow-hidden"
                style={{ aspectRatio: '1', padding: '12px' }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={p.label}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-sm"
                    style={{ background: p.color, opacity: 0.35 }}
                  />
                )}
              </div>

              {/* Details */}
              <div
                className="px-4 pt-3 pb-4 flex flex-col gap-1 mt-auto"
                style={{ borderTop: '0.5px solid rgba(232,228,220,0.08)' }}
              >
                <span
                  className="leading-snug"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 'clamp(12px, 1.2vw, 16px)',
                    color: 'rgba(232,228,220,0.85)',
                  }}
                >
                  {p.label}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {p.year && (
                    <span className="text-[9px] tracking-wider" style={{ color: 'rgba(232,228,220,0.3)' }}>
                      {p.year}
                    </span>
                  )}
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
      </div> {/* max-width wrapper */}
    </div>
  )
}
