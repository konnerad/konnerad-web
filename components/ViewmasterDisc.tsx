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
    if (idx % 2 !== 0) return
    const projectIdx = idx / 2
    if (!projects[projectIdx]) return

    const clockDeg = idx * STEP - STEP / 2
    const targetRot = -clockDeg
    const current = rotRef.current
    const delta = ((targetRot - current) % 360 + 540) % 360 - 180
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
      {/* Outer drop-shadow on the disc */}
      <div style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.28)) drop-shadow(0 4px 8px rgba(0,0,0,0.14))' }}>
        <svg viewBox="0 0 840 900" style={{ width: 'min(88vw, 580px)', height: 'auto', display: 'block' }}>
          <defs>
            {/* Off-white base — slightly warm, like matte paper */}
            <radialGradient id="vmBase" cx="42%" cy="36%" r="72%">
              <stop offset="0%"   stopColor="#faf8f3" />
              <stop offset="60%"  stopColor="#f4f1ea" />
              <stop offset="100%" stopColor="#ece7dc" />
            </radialGradient>

            {/* Very subtle paper grain — barely perceptible */}
            <filter id="vmGrain" x="-2%" y="-2%" width="104%" height="104%">
              <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="12" result="noise" />
              <feColorMatrix in="noise" type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0"
                result="noiseA" />
              <feComposite in="noiseA" in2="SourceGraphic" operator="in" />
            </filter>

            {/* Soft edge shadow to give the disc physical depth */}
            <radialGradient id="vmEdge" cx="50%" cy="50%" r="50%">
              <stop offset="72%"  stopColor="transparent" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.10" />
            </radialGradient>

            <clipPath id="discClip">
              <circle cx={CX} cy={CY} r={DISC_R} />
            </clipPath>
            <clipPath id="viewerClip">
              <circle cx="0" cy="0" r={VIEWER_R} />
            </clipPath>
            {windows.map(w => (
              <clipPath key={`clip-${w.idx}`} id={`frameClip-${w.idx}`}>
                <rect x={-FRAME_W / 2 + 3} y={-FRAME_H / 2 + 3}
                  width={FRAME_W - 6} height={FRAME_H - 6} rx="18" />
              </clipPath>
            ))}
          </defs>

          {/* ── Rotating disc ── */}
          <g
            style={{
              transform: `rotate(${discRotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            {/* Base colour */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="url(#vmBase)" />
            {/* Paper grain overlay */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="#888" filter="url(#vmGrain)" opacity={1} />
            {/* Edge darkening for physical feel */}
            <circle cx={CX} cy={CY} r={DISC_R} fill="url(#vmEdge)" />

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
                  {/* Subtle frame shadow */}
                  <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="20"
                    transform="translate(1.5,2.5)" fill="rgba(0,0,0,0.14)" />
                  {/* Frame body — slightly darker than disc so it reads as a cutout */}
                  <rect x={-FRAME_W / 2} y={-FRAME_H / 2} width={FRAME_W} height={FRAME_H} rx="20"
                    fill={imgUrl ? '#111' : '#e8e4da'} stroke="#d0cbc0" strokeWidth="1" />
                  {imgUrl && (
                    <image
                      href={imgUrl}
                      x={-FRAME_W / 2 + 3} y={-FRAME_H / 2 + 3}
                      width={FRAME_W - 6} height={FRAME_H - 6}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#frameClip-${w.idx})`}
                    />
                  )}
                  {/* Selection ring */}
                  {isSelected && (
                    <rect x={-FRAME_W / 2 - 6} y={-FRAME_H / 2 - 6}
                      width={FRAME_W + 12} height={FRAME_H + 12} rx="24"
                      fill="none" stroke="#ffd23f" strokeWidth="3.5" />
                  )}
                </g>
              )
            })}

            {/* Notches */}
            {notches.map((n, i) => (
              <g key={i} transform={n.transform}>
                <rect x="-12" y="-27" width="24" height="54" rx="6"
                  transform="translate(1,2)" fill="rgba(0,0,0,0.12)" />
                <rect x="-12" y="-27" width="24" height="54" rx="6"
                  fill="#e8e4da" stroke="#d0cbc0" strokeWidth="1" />
              </g>
            ))}

            {/* Numbers */}
            {numbers.map((nu, i) => (
              <g key={i} transform={nu.transform}>
                <text x="0" y="7" textAnchor="middle"
                  fontFamily={F} fontWeight="600" fontSize="18" fill="#888880">
                  {nu.n}
                </text>
              </g>
            ))}

            {/* Centre hole */}
            <circle cx={CX} cy={CY} r="8" fill="#ddd9d0" stroke="#c8c4bc" strokeWidth="1" />

            {/* Start marker — triangle at 12 o'clock */}
            <g clipPath="url(#discClip)">
              <g transform={`translate(${CX},${CY - DISC_R + 10})`}>
                <polygon points="0,-10 10,8 -10,8" fill="#b0aba0" />
              </g>
            </g>

            {/* "UP FOR VIEWER" text */}
            <g transform={`translate(${CX},${CY - 178})`}>
              <text x="0" y="0" textAnchor="middle"
                fontFamily={F} fontWeight="500" fontSize="10" letterSpacing="1.2" fill="#999890">
                UP FOR VIEWER
              </text>
            </g>
          </g>

          {/* ── Fixed center viewer ── */}
          <g
            transform={`translate(${CX},${CY})`}
            style={{ cursor: viewerProject ? 'pointer' : 'default' }}
            onClick={() => { if (viewerProject) onSelect(viewerProject) }}
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
              <circle cx="0" cy="0" r={VIEWER_R} fill="#e0ddd6" />
            )}

            {/* Project name below viewer */}
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
    </div>
  )
}
