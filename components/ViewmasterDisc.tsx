'use client'

import { useMemo, useState, useRef } from 'react'
import { Project } from '@/lib/supabase'

const N = 14
const CX = 420
const CY = 420
const DISC_R = 412
const FRAME_R = 290
const NOTCH_R = 380
const NUM_R = 205
const FRAME_W = 84
const FRAME_H = 105
const STEP = 360 / N
const VIEWER_R = 118
const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
// White — background is now #fff so cutout triangles will show through
const DISC_COLOR = '#f6f5f1'

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
  const [flashKey, setFlashKey] = useState(0)
  const [shadowLifted, setShadowLifted] = useState(false)
  const rotRef = useRef(0)
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { windows, notches, numbers } = useMemo(() => {
    const windows: { idx: number; transform: string; clockDeg: number }[] = []
    const notches: { transform: string }[] = []
    const numbers: { n: number; transform: string }[] = []
    let numCounter = 0

    for (let idx = 0; idx < N; idx++) {
      const clockDeg = idx * STEP - STEP / 2
      const isPrimary = idx % 2 === 0
      const pos = clockToXY(clockDeg, FRAME_R)
      windows.push({ idx, clockDeg, transform: `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) rotate(${clockDeg.toFixed(1)})` })

      if (isPrimary) {
        numCounter += 1
        const gapDeg = clockDeg + STEP / 2
        const npos = clockToXY(gapDeg, NOTCH_R)
        notches.push({ transform: `translate(${npos.x.toFixed(1)},${npos.y.toFixed(1)}) rotate(${gapDeg.toFixed(1)})` })
        const nupos = clockToXY(gapDeg, NUM_R)
        numbers.push({ n: numCounter, transform: `translate(${nupos.x.toFixed(1)},${nupos.y.toFixed(1)}) rotate(${gapDeg.toFixed(1)})` })
      }
    }
    return { windows, notches, numbers }
  }, [])

  function selectFrame(idx: number) {
    if (idx % 2 !== 0) return
    if (!projects[idx / 2]) return

    const clockDeg = idx * STEP - STEP / 2
    const targetRot = -clockDeg
    const current = rotRef.current
    const delta = ((targetRot - current) % 360 + 540) % 360 - 180
    const next = current + delta
    rotRef.current = next
    setDiscRotation(next)
    setSelected(idx)

    // Light flash through the frame hole + shadow lift
    setFlashKey(k => k + 1)
    setShadowLifted(true)
    if (spinTimer.current) clearTimeout(spinTimer.current)
    spinTimer.current = setTimeout(() => setShadowLifted(false), 300)
  }

  const viewerProject = projects[selected / 2] ?? null
  const viewerImg = viewerProject ? (viewerProject.thumbnail || viewerProject.images?.[0]) : null

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
      <svg
        viewBox="0 0 840 920"
        style={{ width: 'min(88vw, 580px)', height: 'auto', display: 'block', overflow: 'visible', touchAction: 'manipulation' }}
      >
        <defs>
          {/*
            Paper grain — uses soft-light blend so the noise darkens/lightens the base
            colour naturally. feComposite clips back to the disc shape at the end.
            Works on iOS Safari, Android Chrome, and all desktop browsers.
          */}
          <filter id="vmGrain" x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.60 0.65" numOctaves="4" seed="5" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="soft-light" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>

          {/* Blur for cast shadow */}
          <filter id="shadowBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="20" />
          </filter>

          {/* Disc mask: punches transparent triangle holes at the top */}
          <mask id="discMask">
            <circle cx={CX} cy={CY} r={DISC_R} fill="white" />
            {/* Black = transparent hole — left V-cut */}
            <g transform="translate(363.2,16.0) rotate(-8)">
              <polygon points="0,18 34,-16 -34,-16" fill="black" />
            </g>
            {/* Black = transparent hole — right V-cut */}
            <g transform="translate(476.8,16.0) rotate(8)">
              <polygon points="0,18 34,-16 -34,-16" fill="black" />
            </g>
          </mask>

          <clipPath id="viewerClip">
            <circle cx="0" cy="0" r={VIEWER_R} />
          </clipPath>
          {windows.map(w => (
            <clipPath key={`clip-${w.idx}`} id={`frameClip-${w.idx}`}>
              <rect x={-FRAME_W / 2 + 3} y={-FRAME_H / 2 + 3} width={FRAME_W - 6} height={FRAME_H - 6} rx="18" />
            </clipPath>
          ))}
        </defs>

        {/*
          Split shadow — simulates Viewmaster frame-advance:
          at rest: one wide shadow centered below-right
          spinning: splits to left and right wings, then merges back
        */}
        <g style={{ transition: 'opacity 0.30s ease', opacity: shadowLifted ? 0 : 1 }}>
          {/* Resting shadow */}
          <ellipse cx={CX + 35} cy={CY + DISC_R - 8} rx={DISC_R * 0.74} ry={32}
            fill="black" filter="url(#shadowBlur)" opacity={0.20} />
        </g>
        <g style={{ transition: 'opacity 0.30s ease', opacity: shadowLifted ? 1 : 0 }}>
          {/* Left wing */}
          <ellipse
            cx={CX} cy={CY + DISC_R - 8}
            rx={DISC_R * 0.36} ry={20}
            fill="black" filter="url(#shadowBlur)" opacity={0.13}
            style={{ transform: `translateX(${shadowLifted ? '-200px' : '0'})`, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Right wing */}
          <ellipse
            cx={CX} cy={CY + DISC_R - 8}
            rx={DISC_R * 0.36} ry={20}
            fill="black" filter="url(#shadowBlur)" opacity={0.13}
            style={{ transform: `translateX(${shadowLifted ? '200px' : '0'})`, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </g>

        {/* ── Rotating disc ── */}
        <g
          style={{
            transform: `rotate(${discRotation}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Disc surface — base colour + grain filter applied together, no external image */}
          <circle cx={CX} cy={CY} r={DISC_R} fill={DISC_COLOR} filter="url(#vmGrain)" mask="url(#discMask)" />

          {/* Light flash — only rendered after first spin to avoid yellow-on-load */}
          {flashKey > 0 && (
            <circle
              key={flashKey}
              cx={CX} cy={CY} r={DISC_R}
              fill="#fffbe8"
              mask="url(#discMask)"
              style={{ animation: 'discFlash 0.28s ease-out forwards' }}
            />
          )}

          {/* Frames */}
          {windows.map((w) => {
            const isPrimary = w.idx % 2 === 0
            const project = isPrimary ? projects[w.idx / 2] : null
            const imgUrl = project ? (project.thumbnail || project.images?.[0]) : null
            const isSelected = w.idx === selected

            return (
              <g
                key={w.idx}
                style={{ cursor: isPrimary && project ? 'pointer' : 'default' }}
                transform={w.transform}
                onClick={() => selectFrame(w.idx)}
                onTouchEnd={(e) => { e.preventDefault(); selectFrame(w.idx) }}
              >
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="20"
                  transform="translate(1.5,2.5)" fill="rgba(0,0,0,0.14)" />
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="20"
                  fill={imgUrl ? '#111' : '#d8d5ce'} stroke="#c8c4bc" strokeWidth="0.8" />
                {imgUrl && (
                  <image
                    href={imgUrl}
                    x={-FRAME_W / 2 + 3} y={-FRAME_H / 2 + 3}
                    width={FRAME_W - 6} height={FRAME_H - 6}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#frameClip-${w.idx})`}
                  />
                )}
                {isSelected && (
                  <rect x={-FRAME_W / 2 - 6} y={-FRAME_H / 2 - 6}
                    width={FRAME_W + 12} height={FRAME_H + 12} rx="24"
                    fill="none" stroke="#ffd23f" strokeWidth="3.5" />
                )}
              </g>
            )
          })}

          {/* Notches — cut out (white = page background shows through) */}
          {notches.map((n, i) => (
            <g key={i} transform={n.transform}>
              {/* Depth shadow around the hole */}
              <rect x="-13" y="-28" width="26" height="56" rx="7"
                fill="rgba(0,0,0,0.18)" />
              {/* The hole itself — white matches page background */}
              <rect x="-12" y="-27" width="24" height="54" rx="6"
                fill="#ffffff" />
            </g>
          ))}

          {/* Numbers */}
          {numbers.map((nu, i) => (
            <g key={i} transform={nu.transform}>
              <text x="0" y="7" textAnchor="middle"
                fontFamily={F} fontWeight="600" fontSize="18" fill="#9a9690">
                {nu.n}
              </text>
            </g>
          ))}

          {/* Centre hole */}
          <circle cx={CX} cy={CY} r="9" fill="#d4d0c8" stroke="#bbb8b0" strokeWidth="1" />

          {/* "UP FOR VIEWER" */}
          <g transform={`translate(${CX},${CY - 178})`}>
            <text x="0" y="0" textAnchor="middle"
              fontFamily={F} fontWeight="500" fontSize="10" letterSpacing="1.5" fill="#9a9690">
              UP FOR VIEWER
            </text>
          </g>
        </g>

        {/* ── Fixed center viewer ── */}
        <g
          transform={`translate(${CX},${CY})`}
          style={{ cursor: viewerProject ? 'pointer' : 'default' }}
          onClick={() => { if (viewerProject) onSelect(viewerProject) }}
          onTouchEnd={(e) => { e.preventDefault(); if (viewerProject) onSelect(viewerProject) }}
        >
          {viewerImg ? (
            <image
              href={viewerImg}
              x={-VIEWER_R} y={-VIEWER_R}
              width={VIEWER_R * 2} height={VIEWER_R * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#viewerClip)"
            />
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
              {viewerProject.label}
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}
