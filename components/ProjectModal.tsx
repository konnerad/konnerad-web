'use client'

import { useState, useEffect, useCallback } from 'react'
import { Project } from '@/lib/supabase'

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
}

export type ModalState =
  | { open: false }
  | { open: true; project: Project; refNum: string; originX: number; originY: number }

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
  const refNum  = state.open ? state.refNum  : ''

  useEffect(() => {
    setImgIndex(0)
    if (state.open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
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
      if (e.key === 'ArrowRight' && project)
        setImgIndex(i => Math.min((project.images?.length || 1) - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.open, project, close])

  if (!state.open && !visible) return null

  const images   = project?.images ?? []
  const imgCount = images.length || 1
  const metaRows = [
    { label: 'Year',   value: project?.year         },
    { label: 'Client', value: project?.client || '—' },
    { label: 'Type',   value: project?.tag    || '—' },
  ]

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{
        background: '#0a0a0f',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s cubic-bezier(0.77,0,0.18,1)',
        overflowY: 'auto',
      }}
    >
      {/* Back */}
      <button
        onClick={close}
        className="fixed top-7 left-8 z-[210] text-[10px] tracking-[0.14em] uppercase flex items-center gap-2 transition-colors"
        style={{ color: 'rgba(232,228,220,0.35)', fontFamily: "'DM Mono', monospace" }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e8e4dc')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,228,220,0.35)')}
      >
        ← Back
      </button>

      {/* ── Desktop ── */}
      <div className="hidden md:grid h-screen" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Text */}
        <div
          className="overflow-y-auto flex flex-col"
          style={{ padding: '100px 60px 60px', borderRight: '0.5px solid rgba(232,228,220,0.07)' }}
        >
          <span className="text-[9px] tracking-[0.22em] uppercase mb-5" style={{ color: 'rgba(232,228,220,0.3)' }}>
            {refNum} — {project?.tag}
          </span>
          <h2
            className="font-light leading-[1.1] mb-2.5"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,4.5vw,64px)', color: '#e8e4dc' }}
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
          <div className="mt-auto flex flex-col">
            {metaRows.map(({ label, value }) => (
              <div key={label} className="flex gap-4 py-3" style={{ borderTop: '0.5px solid rgba(232,228,220,0.07)' }}>
                <span className="text-[9px] tracking-[0.16em] uppercase w-16 shrink-0" style={{ color: 'rgba(232,228,220,0.22)' }}>
                  {label}
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(232,228,220,0.5)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="relative flex items-center justify-center overflow-hidden" style={{ background: '#060609' }}>
          <GalleryMedia images={images} imgIndex={imgIndex} setImgIndex={setImgIndex} imgCount={imgCount} project={project} />
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="flex flex-col md:hidden" style={{ paddingTop: '72px', paddingBottom: '72px' }}>

        {/* Name + ref */}
        <div style={{ padding: '0 24px 24px' }}>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(232,228,220,0.3)' }}>
            {refNum}
          </p>
          <h2
            className="font-light leading-[1.2]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#e8e4dc' }}
          >
            {project?.label}
          </h2>
        </div>

        {/* Gallery — full width but with side margins */}
        <div style={{ margin: '0 24px' }}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3', background: '#060609', borderRadius: '2px' }}>
            <GalleryMedia images={images} imgIndex={imgIndex} setImgIndex={setImgIndex} imgCount={imgCount} project={project} />
          </div>
        </div>

        {/* Meta rows */}
        <div style={{ margin: '32px 24px 0', borderTop: '0.5px solid rgba(232,228,220,0.12)' }}>
          {metaRows.map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-baseline"
              style={{ padding: '14px 0', borderBottom: '0.5px solid rgba(232,228,220,0.12)' }}
            >
              <span className="text-[9px] tracking-[0.18em] uppercase" style={{ color: 'rgba(232,228,220,0.3)' }}>
                {label}
              </span>
              <span className="text-[12px]" style={{ color: 'rgba(232,228,220,0.65)', fontFamily: "'DM Mono', monospace" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ margin: '32px 24px 0', fontSize: '13px', lineHeight: '1.9', color: 'rgba(232,228,220,0.5)' }}>
          {project?.description}
        </p>

      </div>
    </div>
  )
}

function GalleryMedia({
  images, imgIndex, setImgIndex, imgCount, project,
}: {
  images: string[]
  imgIndex: number
  setImgIndex: React.Dispatch<React.SetStateAction<number>>
  imgCount: number
  project: Project | null
}) {
  return (
    <>
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
        <div className="w-full h-full" style={{ background: project?.color ?? '#111', opacity: 0.4 }} />
      )}

      {imgCount > 1 && (
        <>
          <button
            onClick={() => setImgIndex(i => Math.max(0, i - 1))}
            disabled={imgIndex === 0}
            className="gallery-arrow absolute left-5 top-1/2 -translate-y-1/2 z-10"
          >←</button>
          <button
            onClick={() => setImgIndex(i => Math.min(imgCount - 1, i + 1))}
            disabled={imgIndex === imgCount - 1}
            className="gallery-arrow absolute right-5 top-1/2 -translate-y-1/2 z-10"
          >→</button>
        </>
      )}

      <span
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 text-[9px] tracking-[0.2em]"
        style={{ color: 'rgba(232,228,220,0.3)' }}
      >
        {imgIndex + 1} / {imgCount}
      </span>
    </>
  )
}
