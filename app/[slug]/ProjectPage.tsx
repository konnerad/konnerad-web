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

      {/* Nav — favicon centered, no borders */}
      <nav style={{
        height: NAV_H,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: `0 32px`,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon-32x32.png" alt="Konnerad" style={{ width: 24, height: 24, display: 'block' }} />
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
        <div style={{ height: COUNTER_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0 }}>
          <button onClick={prev} disabled={imgIndex === 0}
            style={{ background: 'none', border: 'none', cursor: imgIndex === 0 ? 'default' : 'pointer', fontSize: 14, color: imgIndex === 0 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.5)', padding: 0, lineHeight: 1 }}>
            ←
          </button>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.04em' }}>
            {imgIndex + 1}/{imgCount}
          </span>
          <button onClick={next} disabled={imgIndex === imgCount - 1}
            style={{ background: 'none', border: 'none', cursor: imgIndex === imgCount - 1 ? 'default' : 'pointer', fontSize: 14, color: imgIndex === imgCount - 1 ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.5)', padding: 0, lineHeight: 1 }}>
            →
          </button>
        </div>
      </div>

      {/* Metadata — revealed by scrolling */}
      <div style={{ padding: `48px ${SIDE} 100px` }}>

        {/* Desktop: two equal columns filling the padded container */}
        <div className="hidden md:flex" style={{ gap: 80 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.55)', lineHeight: 1.5 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: single column */}
        <div className="flex flex-col md:hidden" style={{ gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.55)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
