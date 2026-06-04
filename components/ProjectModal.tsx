'use client'

import { useState, useEffect, useCallback } from 'react'
import { Project } from '@/lib/supabase'

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
}

function shiftColor(hex: string, amount: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  const r = clamp((n >> 16) + amount)
  const g = clamp(((n >> 8) & 0xff) + amount)
  const b = clamp((n & 0xff) + amount)
  return `rgb(${r},${g},${b})`
}

function Placeholder({ color, seed }: { color: string; seed: number }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: color }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at ${30 + (seed * 17) % 40}% ${20 + (seed * 13) % 50}%, ${shiftColor(color, 40)}55 0%, transparent 70%)`,
        }}
      />
    </div>
  )
}

export type ModalState =
  | { open: false }
  | { open: true; project: Project; originX: number; originY: number }

export default function ProjectModal({
  state,
  onClose,
}: {
  state: ModalState
  onClose: () => void
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  const project = state.open ? state.project : null

  useEffect(() => {
    setImgIndex(0)
    if (state.open) {
      // slight delay so CSS transition fires
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [state.open])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 520)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!state.open) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') setImgIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight' && project) {
        setImgIndex(i => Math.min((project.images?.length || 1) - 1, i + 1))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.open, project, close])

  if (!state.open && !visible) return null

  const images = project?.images ?? []
  const imgCount = images.length || 1

  return (
    <div
      className="fixed inset-0 z-[200] grid"
      style={{
        background: '#0a0a0f',
        gridTemplateColumns: '1fr 1fr',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s cubic-bezier(0.77,0,0.18,1)',
      }}
    >
      {/* Text side */}
      <div
        className="overflow-y-auto border-r"
        style={{
          padding: '100px 60px 60px',
          borderColor: 'rgba(232,228,220,0.07)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        <span className="text-[9px] tracking-[0.22em] uppercase mb-5" style={{ color: 'rgba(232,228,220,0.3)' }}>
          {project?.tag}
        </span>
        <h2
          className="font-light leading-[1.1] mb-2.5"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(36px, 4.5vw, 64px)',
            color: '#e8e4dc',
          }}
        >
          {project?.label}
        </h2>
        <span className="text-[10px] tracking-[0.18em] mb-12" style={{ color: 'rgba(232,228,220,0.25)' }}>
          {project?.year}
        </span>
        <div className="w-8 mb-8" style={{ height: '0.5px', background: 'rgba(232,228,220,0.2)' }} />
        <p className="text-[12.5px] leading-[1.9] mb-12" style={{ color: 'rgba(232,228,220,0.55)', maxWidth: '42ch' }}>
          {project?.description}
        </p>
        <div className="mt-auto flex flex-col gap-3.5">
          {[{ label: 'Year', value: project?.year }, { label: 'Type', value: project?.tag }].map(({ label, value }) => (
            <div key={label} className="flex gap-4">
              <span className="text-[9px] tracking-[0.16em] uppercase w-16 shrink-0 pt-px" style={{ color: 'rgba(232,228,220,0.22)' }}>
                {label}
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(232,228,220,0.5)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery side */}
      <div className="relative flex items-center justify-center overflow-hidden" style={{ background: '#060609' }}>
        {images.length > 0 ? (
          isVideo(images[imgIndex]) ? (
            <video
              key={imgIndex}
              src={images[imgIndex]}
              controls
              className="max-w-full max-h-full"
              style={{ animation: 'fadeIn 0.45s ease' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imgIndex}
              src={images[imgIndex]}
              alt=""
              className="max-w-full max-h-full object-contain"
              style={{ animation: 'fadeIn 0.45s ease' }}
            />
          )
        ) : (
          <Placeholder color={project?.color ?? '#444'} seed={imgIndex} />
        )}

        {imgCount > 1 && (
          <>
            <button
              onClick={() => setImgIndex(i => Math.max(0, i - 1))}
              disabled={imgIndex === 0}
              className="gallery-arrow absolute left-5 top-1/2 -translate-y-1/2 z-10"
            >
              ←
            </button>
            <button
              onClick={() => setImgIndex(i => Math.min(imgCount - 1, i + 1))}
              disabled={imgIndex === imgCount - 1}
              className="gallery-arrow absolute right-5 top-1/2 -translate-y-1/2 z-10"
            >
              →
            </button>
          </>
        )}

        <span
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-[9px] tracking-[0.2em]"
          style={{ color: 'rgba(232,228,220,0.3)' }}
        >
          {imgIndex + 1} / {imgCount}
        </span>
      </div>

      {/* Back button */}
      <button
        onClick={close}
        className="fixed top-7 left-8 z-[210] text-[10px] tracking-[0.14em] uppercase flex items-center gap-2 transition-colors"
        style={{ color: 'rgba(232,228,220,0.35)', fontFamily: "'DM Mono', monospace" }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e8e4dc')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,228,220,0.35)')}
      >
        ← Back
      </button>
    </div>
  )
}
