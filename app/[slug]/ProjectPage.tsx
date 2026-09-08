'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const NAV_H = 56 // px — must match the nav element height

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
}

export default function ProjectPage({ slug }: { slug: string }) {
  const [project, setProject] = useState<Project | null>(null)
  const [refNum, setRefNum] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((projects: Project[]) => {
        const idx = projects.findIndex(p => slugify(p.label) === slug)
        if (idx === -1) { setNotFound(true); return }
        setProject(projects[idx])
        setRefNum(`P${String(idx + 1).padStart(3, '0')}`)
      })
      .catch(() => setNotFound(true))
  }, [slug])

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F, gap: 16 }}>
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>Project not found</span>
        <Link href="/" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', textDecoration: 'none' }}>← Back</Link>
      </div>
    )
  }

  if (!project) return <div style={{ minHeight: '100vh', background: '#fff' }} />

  return <ProjectDetail project={project} refNum={refNum} />
}

function ProjectDetail({ project, refNum }: { project: Project; refNum: string }) {
  const [imgIndex, setImgIndex] = useState(0)
  const images = project.images ?? []
  const imgCount = Math.max(images.length, 1)

  const prev = useCallback(() => setImgIndex(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setImgIndex(i => Math.min(imgCount - 1, i + 1)), [imgCount])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  const metaFields = [
    { label: 'Year',   value: project.year         },
    { label: 'Client', value: project.client || '—' },
    { label: 'Type',   value: project.tag    || '—' },
  ].filter(f => f.value && f.value !== '—')

  const SIDE = 'clamp(40px, 10vw, 150px)'
  const COUNTER_H = 36

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: F, color: '#111' }}>

      {/* Nav */}
      <nav style={{
        height: NAV_H,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `0 32px`,
        borderBottom: '0.5px solid rgba(0,0,0,0.1)',
      }}>
        <Link href="/" style={{ fontSize: 13, color: '#111', textDecoration: 'none', letterSpacing: '-0.01em' }}>
          Konnerad
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#111', textDecoration: 'none' }}>
          ← Projects
        </Link>
      </nav>

      {/* Gallery — fills exactly the remaining viewport height */}
      <div style={{
        height: `calc(100vh - ${NAV_H}px)`,
        display: 'flex', flexDirection: 'column',
        padding: `0 ${SIDE}`,
      }}>
        {/* Image area — takes all space above the counter */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          {images.length > 0 ? (
            isVideo(images[imgIndex]) ? (
              <video
                key={imgIndex}
                src={images[imgIndex]}
                controls
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={imgIndex}
                src={images[imgIndex]}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', animation: 'fadeIn 0.2s ease' }}
              />
            )
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: project.color ?? '#eee', opacity: 0.25 }} />
          )}

          {/* Click zones for prev/next */}
          {imgCount > 1 && (
            <>
              <button onClick={prev} disabled={imgIndex === 0}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: 'none', border: 'none', cursor: imgIndex === 0 ? 'default' : 'w-resize', zIndex: 2 }} />
              <button onClick={next} disabled={imgIndex === imgCount - 1}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: 'none', border: 'none', cursor: imgIndex === imgCount - 1 ? 'default' : 'e-resize', zIndex: 2 }} />
            </>
          )}
        </div>

        {/* Counter — always visible at bottom of viewport */}
        <div style={{ height: COUNTER_H, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.04em' }}>
            {imgIndex + 1}/{imgCount}
          </span>
        </div>
      </div>

      {/* Metadata — revealed by scrolling */}
      <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.12)', padding: `40px ${SIDE} 80px` }}>

        {/* Desktop: two columns */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0 80px' }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 16 }}>
              {refNum}
            </p>
            <h1 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 300, lineHeight: 1.15, marginBottom: 32, letterSpacing: '-0.01em' }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 13, lineHeight: 1.85, color: 'rgba(0,0,0,0.6)', maxWidth: '52ch' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ paddingTop: 4 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', lineHeight: 1.6 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: single column */}
        <div className="flex flex-col md:hidden" style={{ gap: 28 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 12 }}>
              {refNum}
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 300, lineHeight: 1.2, marginBottom: 20 }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 13, lineHeight: 1.85, color: 'rgba(0,0,0,0.6)' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.1)', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
