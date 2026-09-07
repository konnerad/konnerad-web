'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
}

export default function ProjectPage({ project, refNum }: { project: Project; refNum: string }) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = project.images ?? []
  const imgCount = images.length || 1
  const border = '0.5px solid rgba(0,0,0,0.1)'

  const metaRows = [
    { label: 'Year',   value: project.year         },
    { label: 'Client', value: project.client || '—' },
    { label: 'Type',   value: project.tag    || '—' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F4F4', fontFamily: F }}>
      {/* Back */}
      <Link
        href="/"
        style={{
          position: 'fixed', top: 28, left: 32, zIndex: 10,
          fontFamily: F, fontSize: '10px', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#111111')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.4)')}
      >
        ← Back
      </Link>

      {/* Desktop two-column */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>
        {/* Text column */}
        <div style={{ padding: '100px 60px 60px', borderRight: border, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 20 }}>
            {refNum} — {project.tag}
          </span>
          <h1 style={{ fontSize: 'clamp(32px,4vw,56px)', fontWeight: 300, lineHeight: 1.1, color: '#111111', marginBottom: 10 }}>
            {project.label}
          </h1>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(0,0,0,0.3)', marginBottom: 48 }}>
            {project.year}
          </span>
          <div style={{ width: 32, height: '0.5px', background: 'rgba(0,0,0,0.15)', marginBottom: 32 }} />
          <p style={{ fontSize: '13px', lineHeight: 1.9, color: 'rgba(0,0,0,0.55)', maxWidth: '42ch', marginBottom: 48 }}>
            {project.description}
          </p>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>
            {metaRows.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 16, padding: '12px 0', borderTop: border }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', width: 64, flexShrink: 0, color: 'rgba(0,0,0,0.3)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.6)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery column */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#ebebeb' }}>
          <Gallery images={images} imgIndex={imgIndex} setImgIndex={setImgIndex} imgCount={imgCount} project={project} />
        </div>
      </div>

      {/* Mobile single column */}
      <div className="flex flex-col md:hidden" style={{ paddingTop: '72px', paddingBottom: '72px' }}>
        <div style={{ padding: '0 24px 24px' }}>
          <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>
            {refNum}
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 300, lineHeight: 1.2, color: '#111111' }}>
            {project.label}
          </h1>
        </div>

        <div style={{ margin: '0 24px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#ebebeb', borderRadius: 2, overflow: 'hidden' }}>
            <Gallery images={images} imgIndex={imgIndex} setImgIndex={setImgIndex} imgCount={imgCount} project={project} />
          </div>
        </div>

        <div style={{ margin: '32px 24px 0', borderTop: border }}>
          {metaRows.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderBottom: border }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>{label}</span>
              <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.65)' }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '32px 24px 0', fontSize: '13px', lineHeight: 1.9, color: 'rgba(0,0,0,0.55)' }}>
          {project.description}
        </p>
      </div>
    </div>
  )
}

function Gallery({ images, imgIndex, setImgIndex, imgCount, project }: {
  images: string[]
  imgIndex: number
  setImgIndex: React.Dispatch<React.SetStateAction<number>>
  imgCount: number
  project: Project
}) {
  return (
    <>
      {images.length > 0 ? (
        isVideo(images[imgIndex]) ? (
          <video key={imgIndex} src={images[imgIndex]} controls className="max-w-full max-h-full" style={{ animation: 'fadeIn 0.35s ease' }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={imgIndex} src={images[imgIndex]} alt="" className="max-w-full max-h-full object-contain" style={{ animation: 'fadeIn 0.35s ease' }} />
        )
      ) : (
        <div className="w-full h-full" style={{ background: project.color ?? '#ddd', opacity: 0.3 }} />
      )}
      {imgCount > 1 && (
        <>
          <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0} className="gallery-arrow absolute left-5 top-1/2 -translate-y-1/2 z-10">←</button>
          <button onClick={() => setImgIndex(i => Math.min(imgCount - 1, i + 1))} disabled={imgIndex === imgCount - 1} className="gallery-arrow absolute right-5 top-1/2 -translate-y-1/2 z-10">→</button>
        </>
      )}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10" style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(0,0,0,0.35)' }}>
        {imgIndex + 1} / {imgCount}
      </span>
    </>
  )
}
