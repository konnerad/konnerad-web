'use client'

import { useMemo, useState } from 'react'
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

function clockToXY(clockDeg: number, r: number) {
  const rad = (clockDeg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) }
}

const PLACEHOLDER_BG = ['#f2c230', '#1f3a93', '#c1272d', '#2f7a4d', '#161616', '#f4efe3']
const PLACEHOLDER_ICON = ['#161616', '#f4efe3', '#f4efe3', '#f4efe3', '#f4efe3', '#161616']

export default function ViewmasterDisc({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  const [selected, setSelected] = useState(0)

  const { windows, notches, numbers } = useMemo(() => {
    const windows: { idx: number; transform: string }[] = []
    const notches: { transform: string }[] = []
    const numbers: { n: number; transform: string }[] = []
    let numCounter = 0

    for (let idx = 0; idx < N; idx++) {
      const clockDeg = idx * STEP - STEP / 2
      const isPrimary = idx % 2 === 0
      const pos = clockToXY(clockDeg, FRAME_R)

      windows.push({
        idx,
        transform: `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)}) rotate(${clockDeg.toFixed(1)})`,
      })

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

  // Map primary windows (even idx) to projects
  const primaryWindows = windows.filter(w => w.idx % 2 === 0)

  const selectedProject = primaryWindows[selected] !== undefined
    ? projects[primaryWindows.findIndex(w => w.idx === selected)] ?? null
    : null

  const bgIdx = selected % PLACEHOLDER_BG.length
  const viewerProject = projects[Math.floor(selected / 2)] ?? null

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <div style={{ filter: 'drop-shadow(0 24px 46px rgba(0,0,0,0.18))' }}>
        <svg viewBox="0 0 840 840" style={{ width: 'min(86vw, 560px)', height: 'auto', display: 'block' }}>
          <defs>
            <radialGradient id="vmCardboard" cx="46%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#f2e9d0" />
              <stop offset="70%" stopColor="#e5d8b4" />
              <stop offset="100%" stopColor="#d3c298" />
            </radialGradient>
            <linearGradient id="vmBezel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#332419" />
              <stop offset="100%" stopColor="#1c130c" />
            </linearGradient>
            <filter id="vmGrain" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0 0 0 0" result="noiseAlpha" />
              <feComposite in="noiseAlpha" in2="SourceGraphic" operator="in" />
            </filter>
            <clipPath id="discClip">
              <circle cx={CX} cy={CY} r={DISC_R} />
            </clipPath>
            {/* Clip each frame window to a rounded rect for image clipping */}
            {windows.map(w => (
              <clipPath key={`clip-${w.idx}`} id={`frameClip-${w.idx}`}>
                <rect
                  x={-FRAME_W / 2 + 2}
                  y={-FRAME_H / 2 + 2}
                  width={FRAME_W - 4}
                  height={FRAME_H - 4}
                  rx="20"
                />
              </clipPath>
            ))}
            <clipPath id="viewerClip">
              <rect x="-150" y="-92" width="300" height="184" rx="92" />
            </clipPath>
          </defs>

          <circle cx={CX} cy={CY} r={DISC_R} fill="url(#vmCardboard)" />
          <circle cx={CX} cy={CY} r={DISC_R} fill="#3a2f1c" filter="url(#vmGrain)" opacity={0.06} />

          <line x1="404" y1="352" x2="428" y2="452" stroke="#9c8c62" strokeWidth="1.4" opacity="0.35" />
          <line x1="416" y1="358" x2="399" y2="440" stroke="#9c8c62" strokeWidth="1" opacity="0.25" />

          {windows.map((w) => {
            const isPrimary = w.idx % 2 === 0
            const projectIdx = w.idx / 2
            const project = isPrimary ? projects[projectIdx] : null
            const imgUrl = project ? (project.thumbnail || project.images?.[0]) : null
            const isSelected = w.idx === selected

            return (
              <g
                key={w.idx}
                style={{ cursor: isPrimary && project ? 'pointer' : 'default' }}
                transform={w.transform}
                onClick={() => {
                  if (!isPrimary || !project) return
                  setSelected(w.idx)
                }}
              >
                {/* Shadow */}
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="22" transform="translate(2,3)" fill="#00000020" />
                {/* Frame background */}
                <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="22" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
                {/* Project thumbnail inside frame */}
                {imgUrl && (
                  <image
                    href={imgUrl}
                    x={-FRAME_W / 2 + 2}
                    y={-FRAME_H / 2 + 2}
                    width={FRAME_W - 4}
                    height={FRAME_H - 4}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#frameClip-${w.idx})`}
                  />
                )}
                {/* Selection ring */}
                {isSelected && (
                  <rect x={-FRAME_W / 2 - 7} y={-FRAME_H / 2 - 7} width={FRAME_W + 14} height={FRAME_H + 14} rx="25" fill="none" stroke="#ffd23f" strokeWidth="4" />
                )}
              </g>
            )
          })}

          {notches.map((n, i) => (
            <g key={i} transform={n.transform}>
              <rect x="-12" y="-27" width="24" height="54" rx="6" transform="translate(1,2)" fill="#00000018" />
              <rect x="-12" y="-27" width="24" height="54" rx="6" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
            </g>
          ))}

          {numbers.map((nu, i) => (
            <g key={i} transform={nu.transform}>
              <text x="0" y="7" textAnchor="middle" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="700" fontSize="19" fill="#4a3a24">
                {nu.n}
              </text>
            </g>
          ))}

          <circle cx={CX} cy={CY} r="9" fill="#e9ddc0" stroke="#9c8c62" strokeWidth="1.5" />

          <g clipPath="url(#discClip)">
            <g transform="translate(363.2,16.0) rotate(-8)">
              <polygon points="0,14 28,-14 -28,-14" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
            </g>
            <g transform="translate(476.8,16.0) rotate(8)">
              <polygon points="0,14 28,-14 -28,-14" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
            </g>
          </g>

          <g transform="translate(505,585) rotate(180)">
            <text x="0" y="0" textAnchor="middle" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontWeight="600" fontSize="10.5" letterSpacing="0.5" fill="#4a3a24">
              UP FOR PROJECTOR
            </text>
          </g>

          {/* Center eyepiece viewer */}
          <g
            transform={`translate(${CX},${CY})`}
            style={{ cursor: viewerProject ? 'pointer' : 'default' }}
            onClick={() => {
              if (viewerProject) onSelect(viewerProject)
            }}
          >
            <rect x="-175" y="-110" width="350" height="220" rx="110" fill="url(#vmBezel)" />
            <rect x="-172" y="-107" width="344" height="214" rx="107" fill="none" stroke="#4a3626" strokeWidth="2" />
            {/* Viewer content */}
            {viewerProject && (viewerProject.thumbnail || viewerProject.images?.[0]) ? (
              <image
                href={viewerProject.thumbnail || viewerProject.images[0]}
                x="-150"
                y="-92"
                width="300"
                height="184"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#viewerClip)"
              />
            ) : (
              <rect x="-150" y="-92" width="300" height="184" rx="92" fill={PLACEHOLDER_BG[bgIdx]} />
            )}
            {/* Lens highlight */}
            <ellipse cx="-64" cy="-42" rx="34" ry="16" fill="#ffffff" opacity="0.16" transform="rotate(-18)" />
            <ellipse cx="64" cy="-42" rx="34" ry="16" fill="#ffffff" opacity="0.16" transform="rotate(-18)" />
            {/* Project label */}
            {viewerProject && (
              <text x="0" y="118" textAnchor="middle" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" fontSize="11" letterSpacing="0.08em" fill="#4a3a24" opacity="0.7">
                {viewerProject.label.toUpperCase()}
              </text>
            )}
          </g>
        </svg>
      </div>
    </div>
  )
}
