'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Project } from '@/lib/supabase'

const CX = 420
const CY = 420
const DISC_R = 412
const FRAME_R = 290
const NOTCH_R = 382
const VIEWER_R = 118
const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const DISC_COLOR = '#f6f5f1'

const MIN_N = 14
const MAX_N = 20
// Base frame dimensions at N=14
const BASE_W = 84
const BASE_H = 105

function clockToXY(clockDeg: number, r: number) {
  const rad = (clockDeg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) }
}

export default function ViewmasterDisc({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  const [selected, setSelected] = useState(0)
  const [discRotation, setDiscRotation] = useState(0)
  const [shadowLifted, setShadowLifted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [discColor, setDiscColor] = useState(DISC_COLOR)
  const rotRef = useRef(0)
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function extractDominantColor(imgUrl: string) {
    console.log('[disc] extractDominantColor called with', imgUrl)
    if (!imgUrl || imgUrl.includes('youtube')) return
    const img = new Image()
    img.onload = () => {
      console.log('[disc] image loaded, sampling canvas')
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 16
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 16, 16)
      const { data } = ctx.getImageData(0, 0, 16, 16)
      let r = 0, g = 0, b = 0, n = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ }
      }
      if (!n) { console.log('[disc] no opaque pixels'); return }
      const base = { r: 246, g: 245, b: 241 }
      const w = 0.28
      const mix = (c: number, bv: number) => Math.round((c / n) * w + bv * (1 - w))
      const color = `rgb(${mix(r, base.r)},${mix(g, base.g)},${mix(b, base.b)})`
      console.log('[disc] setting discColor to', color)
      setDiscColor(color)
    }
    img.onerror = (e) => console.error('[disc] image load error', e)
    img.src = `/api/dominant-color?url=${encodeURIComponent(imgUrl)}`
    console.log('[disc] loading via proxy:', img.src)
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const p = projects[selected]
    if (p) extractDominantColor(p.thumbnail || p.images?.[0] || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, projects])

  // N scales from 14 up to 20 as projects are added
  const N = Math.min(MAX_N, Math.max(MIN_N, projects.length))
  const STEP = 360 / N
  const scale = MIN_N / N
  const FRAME_W = BASE_W * scale
  const FRAME_H = BASE_H * scale
  const rx = 16 * scale

  const { frames, notches } = useMemo(() => {
    const frames: { idx: number; transform: string; clockDeg: number }[] = []
    const notches: { transform: string }[] = []

    for (let idx = 0; idx < N; idx++) {
      const clockDeg = idx * STEP
      const pos = clockToXY(clockDeg, FRAME_R)
      frames.push({
        idx,
        clockDeg,
        transform: `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) rotate(${clockDeg.toFixed(1)})`,
      })
      // Small notch between frames
      const notchDeg = clockDeg + STEP / 2
      const npos = clockToXY(notchDeg, NOTCH_R)
      notches.push({ transform: `translate(${npos.x.toFixed(1)},${npos.y.toFixed(1)}) rotate(${notchDeg.toFixed(1)})` })
    }
    return { frames, notches }
  }, [N, STEP])

  function selectFrame(idx: number) {
    if (!projects[idx]) return
    const clockDeg = idx * STEP
    const targetRot = -clockDeg
    const current = rotRef.current
    const delta = ((targetRot - current) % 360 + 540) % 360 - 180
    const next = current + delta
    rotRef.current = next
    setDiscRotation(next)
    setSelected(idx)
    setShadowLifted(true)
    if (spinTimer.current) clearTimeout(spinTimer.current)
    spinTimer.current = setTimeout(() => setShadowLifted(false), 300)
  }

  const viewerProject = projects[selected] ?? null
  const viewerImg = viewerProject ? (viewerProject.thumbnail || viewerProject.images?.[0]) : null

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
      <svg
        viewBox="0 0 840 920"
        style={{ width: 'min(88vw, 580px)', height: 'auto', display: 'block', overflow: 'visible', touchAction: 'manipulation' }}
      >
        <defs>
          <filter id="vmGrain" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.60 0.65" numOctaves="4" seed="5" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="soft-light" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="shadowBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="20" />
          </filter>
          <mask id="discMask">
            <circle cx={CX} cy={CY} r={DISC_R} fill="white" />
            <g transform="translate(363.2,16.0) rotate(-8)">
              <polygon points="0,18 34,-16 -34,-16" fill="black" />
            </g>
            <g transform="translate(476.8,16.0) rotate(8)">
              <polygon points="0,18 34,-16 -34,-16" fill="black" />
            </g>
          </mask>
          <clipPath id="viewerClip">
            <circle cx="0" cy="0" r={VIEWER_R} />
          </clipPath>
          {frames.map(f => (
            <clipPath key={`clip-${f.idx}`} id={`frameClip-${f.idx}`}>
              <rect x={-FRAME_W / 2 + 2} y={-FRAME_H / 2 + 2} width={FRAME_W - 4} height={FRAME_H - 4} rx={rx - 2} />
            </clipPath>
          ))}
        </defs>

        {/* Shadow */}
        <g style={{ transition: 'opacity 0.30s ease', opacity: shadowLifted ? 0 : 1 }}>
          <ellipse cx={CX + 28} cy={CY + DISC_R - 55} rx={DISC_R * 0.58} ry={52}
            fill="black" filter="url(#shadowBlur)" opacity={0.18} />
        </g>
        <g style={{ transition: 'opacity 0.30s ease', opacity: shadowLifted ? 1 : 0 }}>
          <ellipse cx={CX} cy={CY + DISC_R - 55} rx={DISC_R * 0.28} ry={36}
            fill="black" filter="url(#shadowBlur)" opacity={0.12}
            style={{ transform: `translateX(${shadowLifted ? '-180px' : '0'})`, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' }} />
          <ellipse cx={CX} cy={CY + DISC_R - 55} rx={DISC_R * 0.28} ry={36}
            fill="black" filter="url(#shadowBlur)" opacity={0.12}
            style={{ transform: `translateX(${shadowLifted ? '180px' : '0'})`, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' }} />
        </g>

        {/* Rotating disc */}
        <g style={{
          transform: `rotate(${discRotation}deg) translateZ(0)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}>
          <circle cx={CX} cy={CY} r={DISC_R} fill={discColor} filter={isMobile ? undefined : 'url(#vmGrain)'} mask="url(#discMask)"
            style={{ transition: 'fill 0.65s ease' }} />

          {/* Frames */}
          {frames.map((f) => {
            const project = projects[f.idx] ?? null
            const imgUrl = project ? (project.thumbnail || project.images?.[0]) : null
            const isSelected = f.idx === selected

            return (
              <g
                key={f.idx}
                style={{ cursor: project ? 'pointer' : 'default' }}
                transform={f.transform}
                onClick={() => selectFrame(f.idx)}
                onTouchEnd={(e) => { e.preventDefault(); selectFrame(f.idx) }}
              >
                {/* Drop shadow */}
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx={rx}
                  transform="translate(1.5,2.5)" fill="rgba(0,0,0,0.14)" />
                {/* Frame body */}
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx={rx}
                  fill={imgUrl ? '#111' : '#d8d5ce'} stroke="#c8c4bc" strokeWidth="0.8" />
                {imgUrl && (
                  <>
                    {project?.disc_contain && (
                      <rect x={-FRAME_W / 2 + 2} y={-FRAME_H / 2 + 2} width={FRAME_W - 4} height={FRAME_H - 4}
                        fill="#ffffff" clipPath={`url(#frameClip-${f.idx})`} />
                    )}
                    <image
                      href={imgUrl}
                      x={-FRAME_W / 2 + 2} y={-FRAME_H / 2 + 2}
                      width={FRAME_W - 4} height={FRAME_H - 4}
                      preserveAspectRatio={project?.disc_contain ? 'xMidYMid meet' : 'xMidYMid slice'}
                      clipPath={`url(#frameClip-${f.idx})`}
                    />
                  </>
                )}
                {isSelected && (
                  <rect x={-FRAME_W / 2 - 5} y={-FRAME_H / 2 - 5}
                    width={FRAME_W + 10} height={FRAME_H + 10} rx={rx + 4}
                    fill="none" stroke="#ffd23f" strokeWidth="3" />
                )}
              </g>
            )
          })}

          {/* Notches between frames */}
          {notches.map((n, i) => (
            <g key={i} transform={n.transform}>
              <rect x="-9" y="-20" width="18" height="40" rx="5" fill="rgba(0,0,0,0.18)" />
              <rect x="-8" y="-19" width="16" height="38" rx="4" fill="#ffffff" />
            </g>
          ))}

          {/* Centre hole */}
          <circle cx={CX} cy={CY} r="9" fill="#d4d0c8" stroke="#bbb8b0" strokeWidth="1" />

          {/* Label */}
          <g transform={`translate(${CX},${CY - 178})`}>
            <text x="0" y="0" textAnchor="middle"
              fontFamily={F} fontWeight="500" fontSize="10" letterSpacing="1.5" fill="#9a9690">
              PROJECTS
            </text>
          </g>
        </g>

        {/* Fixed center viewer */}
        <g
          transform={`translate(${CX},${CY})`}
          style={{ cursor: viewerProject ? 'pointer' : 'default' }}
          onClick={() => { if (viewerProject) onSelect(viewerProject) }}
          onTouchEnd={(e) => { e.preventDefault(); if (viewerProject) onSelect(viewerProject) }}
        >
          {viewerImg ? (
            <>
              {viewerProject?.disc_contain && (
                <circle cx="0" cy="0" r={VIEWER_R} fill="#ffffff" clipPath="url(#viewerClip)" />
              )}
              <image
                href={viewerImg}
                x={-VIEWER_R} y={-VIEWER_R}
                width={VIEWER_R * 2} height={VIEWER_R * 2}
                preserveAspectRatio={viewerProject?.disc_contain ? 'xMidYMid meet' : 'xMidYMid slice'}
                clipPath="url(#viewerClip)"
              />
            </>
          ) : (
            <circle cx="0" cy="0" r={VIEWER_R} fill="#d8d4cc" />
          )}

          {viewerProject && (
            <text
              x="0" y={VIEWER_R + 36}
              textAnchor="middle"
              fontFamily={F}
              fontSize="20"
              fontWeight="300"
              letterSpacing="0.06em"
              fill="#333"
            >
              {viewerProject.disc_label || viewerProject.label}
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}
