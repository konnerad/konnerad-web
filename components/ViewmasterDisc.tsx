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
  const [selected, setSelected] = useState(0)       // idx of selected window
  const [discRotation, setDiscRotation] = useState(0)
  const rotRef = useRef(0)

  const { windows, notches, numbers } = useMemo(() => {
    const windows: { idx: number; transform: string; clockDeg: number }[] = []
    const notches: { transform: string }[] = []
    const numbers: { n: number; transform: string }[] = []
    let numCounter = 0

    for (let idx = 0; idx < N; idx++) {
      const clockDeg = idx * STEP - STEP / 2
      const isPrimary = idx % 2 === 0
      const pos = clockToXY(clockDeg, FRAME_R)

      windows.push({
        idx,
        clockDeg,
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

  function selectFrame(idx: number) {
    if (idx % 2 !== 0) return               // only primary frames
    const projectIdx = idx / 2
    if (!projects[projectIdx]) return        // no project in this slot

    const clockDeg = idx * STEP - STEP / 2
    const targetRot = -clockDeg
    const current = rotRef.current
    let delta = ((targetRot - current) % 360 + 540) % 360 - 180
    const next = current + delta
    rotRef.current = next
    setDiscRotation(next)
    setSelected(idx)
  }

  const viewerProject = projects[selected / 2] ?? null
  const viewerImg = viewerProject ? (viewerProject.thumbnail || viewerProject.images?.[0]) : null

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ filter: 'drop-shadow(0 28px 52px rgba(0,0,0,0.22))' }}>
        <svg viewBox="0 0 840 840" style={{ width: 'min(88vw, 580px)', height: 'auto', display: 'block' }}>
          <defs>
            {/* ── Cardboard texture ── */}
            <radialGradient id="vmBase" cx="44%" cy="38%" r="68%">
              <stop offset="0%"   stopColor="#f0e4c0" />
              <stop offset="55%"  stopColor="#dfd0a0" />
              <stop offset="100%" stopColor="#c9b882" />
            </radialGradient>

            {/* Horizontal fibre grain — the key to that cardboard feel */}
            <filter id="vmFibre" x="-5%" y="-5%" width="110%" height="110%">
              {/* coarse horizontal fibres */}
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.38" numOctaves="4" seed="3" result="fibre" />
              <feColorMatrix in="fibre" type="matrix"
                values="0 0 0 0 0.18
                        0 0 0 0 0.13
                        0 0 0 0 0.05
                        0 0 0 0.55 0"
                result="fibreColored" />
              <feComposite in="fibreColored" in2="SourceGraphic" operator="in" result="clipped" />
              {/* fine surface speckle */}
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="speckle" />
              <feColorMatrix in="speckle" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"
                result="speckleA" />
              <feComposite in="speckleA" in2="SourceGraphic" operator="in" result="clippedSpeckle" />
              <feMerge>
                <feMergeNode in="clipped" />
                <feMergeNode in="clippedSpeckle" />
              </feMerge>
            </filter>

            {/* Vignette — darker rim, like worn cardboard edges */}
            <radialGradient id="vmVignette" cx="50%" cy="50%" r="50%">
              <stop offset="60%"  stopColor="transparent" />
              <stop offset="100%" stopColor="#2a1e0a" stopOpacity="0.28" />
            </radialGradient>

            <linearGradient id="vmBezel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#332419" />
              <stop offset="100%" stopColor="#1c130c" />
            </linearGradient>

            <clipPath id="discClip">
              <circle cx={CX} cy={CY} r={DISC_R} />
            </clipPath>
            <clipPath id="viewerClip">
              <circle cx="0" cy="0" r={VIEWER_R} />
            </clipPath>
            {windows.map(w => (
              <clipPath key={`clip-${w.idx}`} id={`frameClip-${w.idx}`}>
                <rect x={-FRAME_W / 2 + 3} y={-FRAME_H / 2 + 3} width={FRAME_W - 6} height={FRAME_H - 6} rx="18" />
              </clipPath>
            ))}
          </defs>

          {/* ── Rotating disc group ── */}
          <g
            style={{
              transform: `rotate(${discRotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Cardboard body */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="url(#vmBase)" />
            {/* Fibre + speckle texture */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="#c8a96e" filter="url(#vmFibre)" />
            {/* Edge vignette */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="url(#vmVignette)" />

            {/* Printed lines (like real reels have faint offset lines) */}
            <line x1="404" y1="352" x2="428" y2="452" stroke="#9c8c62" strokeWidth="1.4" opacity="0.3" />
            <line x1="416" y1="358" x2="399" y2="440" stroke="#9c8c62" strokeWidth="1" opacity="0.2" />

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
                >
                  <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="22"
                    transform="translate(2,3)" fill="#00000022" />
                  <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="22"
                    fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
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
                    <rect x={-FRAME_W / 2 - 7} y={-FRAME_H / 2 - 7}
                      width={FRAME_W + 14} height={FRAME_H + 14} rx="25"
                      fill="none" stroke="#ffd23f" strokeWidth="4" />
                  )}
                </g>
              )
            })}

            {/* Notches */}
            {notches.map((n, i) => (
              <g key={i} transform={n.transform}>
                <rect x="-12" y="-27" width="24" height="54" rx="6"
                  transform="translate(1,2)" fill="#00000018" />
                <rect x="-12" y="-27" width="24" height="54" rx="6"
                  fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
              </g>
            ))}

            {/* Numbers */}
            {numbers.map((nu, i) => (
              <g key={i} transform={nu.transform}>
                <text x="0" y="7" textAnchor="middle"
                  fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                  fontWeight="700" fontSize="19" fill="#4a3a24">
                  {nu.n}
                </text>
              </g>
            ))}

            {/* Center hole */}
            <circle cx={CX} cy={CY} r="9" fill="#e9ddc0" stroke="#9c8c62" strokeWidth="1.5" />

            {/* Start marker V-cuts */}
            <g clipPath="url(#discClip)">
              <g transform="translate(363.2,16.0) rotate(-8)">
                <polygon points="0,14 28,-14 -28,-14" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
              </g>
              <g transform="translate(476.8,16.0) rotate(8)">
                <polygon points="0,14 28,-14 -28,-14" fill="#f8f3e4" stroke="#c9b98c" strokeWidth="1.5" />
              </g>
            </g>

            {/* "UP FOR PROJECTOR" stamp */}
            <g transform="translate(505,585) rotate(180)">
              <text x="0" y="0" textAnchor="middle"
                fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                fontWeight="600" fontSize="10.5" letterSpacing="0.5" fill="#4a3a24">
                UP FOR PROJECTOR
              </text>
            </g>
          </g>

          {/* ── Fixed center viewer (not rotating) ── */}
          <g
            transform={`translate(${CX},${CY})`}
            style={{ cursor: viewerProject ? 'pointer' : 'default' }}
            onClick={() => { if (viewerProject) onSelect(viewerProject) }}
          >
            {/* Circle viewer — no border/bezel */}
            {viewerImg ? (
              <image
                href={viewerImg}
                x={-VIEWER_R} y={-VIEWER_R}
                width={VIEWER_R * 2} height={VIEWER_R * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#viewerClip)"
              />
            ) : (
              <circle cx="0" cy="0" r={VIEWER_R} fill="#ddd" opacity="0.4" />
            )}

            {/* Project label — 3× bigger, below the circle */}
            {viewerProject && (
              <text
                x="0" y={VIEWER_R + 48}
                textAnchor="middle"
                fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
                fontSize="33"
                fontWeight="300"
                letterSpacing="0.04em"
                fill="#2a1e0a"
              >
                {viewerProject.label}
              </text>
            )}
          </g>
        </svg>
      </div>
    </div>
  )
}
