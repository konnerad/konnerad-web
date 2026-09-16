'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const NAV_H = 56 // px — must match the nav element height

function isVideo(url: string) {
  return /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
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
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F, gap: 16 }}>
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>Project not found</span>
        <Link href="/" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', textDecoration: 'none' }}>← Back</Link>
      </div>
    )
  }

  if (!project) return <div style={{ minHeight: '100dvh', background: '#fff' }} />

  return <ProjectDetail project={project} refNum={refNum} />
}

function extractDominantColor(imgUrl: string, cb: (color: string) => void) {
  if (!imgUrl || imgUrl.includes('youtube')) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, 64, 64)
    const { data } = ctx.getImageData(0, 0, 64, 64)
    const buckets: Record<string, { count: number; r: number; g: number; b: number; vibrant: boolean }> = {}
    let total = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      total++
      const pr = data[i], pg = data[i + 1], pb = data[i + 2]
      const vibrant = Math.max(pr, pg, pb) - Math.min(pr, pg, pb) > 60
      const key = `${Math.floor(pr / 32)},${Math.floor(pg / 32)},${Math.floor(pb / 32)}`
      if (!buckets[key]) buckets[key] = { count: 0, r: 0, g: 0, b: 0, vibrant }
      buckets[key].count++; buckets[key].r += pr; buckets[key].g += pg; buckets[key].b += pb
    }
    if (!total) return
    const all = Object.values(buckets)
    const vibrant = all.filter(b => b.vibrant).sort((a, b) => b.count - a.count)
    const pick = (vibrant[0]?.count / total >= 0.30) ? vibrant[0] : all.sort((a, b) => b.count - a.count)[0]
    if (!pick) return
    const r = Math.round(pick.r / pick.count)
    const g = Math.round(pick.g / pick.count)
    const b = Math.round(pick.b / pick.count)
    // Blend 14% into white so the page stays light and readable
    const mix = (c: number) => Math.round(c * 0.14 + 255 * 0.86)
    cb(`rgb(${mix(r)},${mix(g)},${mix(b)})`)
  }
  img.onerror = () => {}
  img.src = `/api/dominant-color?url=${encodeURIComponent(imgUrl)}`
}

function ProjectDetail({ project, refNum }: { project: Project; refNum: string }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [bgColor, setBgColor] = useState('#ffffff')
  const images = project.images ?? []
  const imgCount = Math.max(images.length, 1)

  useEffect(() => {
    const thumb = project.thumbnail || images[0]
    if (thumb) extractDominantColor(thumb, setBgColor)
  }, [project.thumbnail, images])

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

  // Preload all images so flipping through them is instant
  useEffect(() => {
    images.forEach(url => {
      if (!isVideo(url) && !youtubeId(url)) { const img = new Image(); img.src = url }
    })
  }, [images])

  const metaRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const onScroll = () => setAtBottom(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToMeta = () => metaRef.current?.scrollIntoView({ behavior: 'smooth' })
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const metaFields = [
    { label: 'Year',   value: project.year         },
    { label: 'Client', value: project.client || '—' },
    { label: 'Type',   value: project.tag    || '—' },
  ].filter(f => f.value && f.value !== '—')

  const SIDE = 'clamp(40px, 10vw, 150px)'
  const COUNTER_H = 36

  return (
    <div style={{ minHeight: '100dvh', background: bgColor, fontFamily: F, color: '#111', transition: 'background 0.65s ease' }}>

      {/* Nav — About left, favicon center */}
      <nav style={{
        height: NAV_H,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: `0 32px`,
      }}>
        <Link href="/about" style={{ fontSize: 13, color: '#111', textDecoration: 'none', transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget.style.opacity='0.4')} onMouseLeave={e => (e.currentTarget.style.opacity='1')}>
          about
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Konnerad" style={{ width: 28, height: 28, display: 'block', borderRadius: 4 }} />
        </Link>
        <div />
      </nav>

      {/* Gallery — fills exactly the remaining viewport height */}
      <div style={{
        height: `calc(100dvh - ${NAV_H}px)`,
        display: 'flex', flexDirection: 'column',
        padding: `0 ${SIDE}`,
      }}>
        {/* Image area — takes all space above the counter */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          {images.length > 0 ? (() => {
            const url = images[imgIndex]
            const ytId = youtubeId(url)
            if (ytId) return (
              <iframe
                key={imgIndex}
                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            )
            if (isVideo(url)) return (
              <video
                key={imgIndex}
                src={url}
                controls
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={imgIndex}
                src={url}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', animation: 'fadeIn 0.2s ease' }}
              />
            )
          })() : (
            <div style={{ position: 'absolute', inset: 0, background: project.color ?? '#eee', opacity: 0.25 }} />
          )}

          {/* Click zones for prev/next — hidden for video/YouTube so controls are interactive */}
          {imgCount > 1 && !youtubeId(images[imgIndex]) && !isVideo(images[imgIndex]) && (
            <>
              <button onClick={prev} disabled={imgIndex === 0}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', background: 'none', border: 'none', cursor: imgIndex === 0 ? 'default' : 'w-resize', zIndex: 2 }} />
              <button onClick={next} disabled={imgIndex === imgCount - 1}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', background: 'none', border: 'none', cursor: imgIndex === imgCount - 1 ? 'default' : 'e-resize', zIndex: 2 }} />
            </>
          )}
        </div>

        {/* Counter row — counter centered, scroll-down button at right */}
        <div style={{ height: COUNTER_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0, position: 'relative' }}>
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

      {/* Fixed scroll toggle — bottom right */}
      <button
        onClick={atBottom ? scrollToTop : scrollToMeta}
        style={{
          position: 'fixed', bottom: 24, right: 28, zIndex: 50,
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.3)',
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.75)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.75)'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'; (e.currentTarget.querySelector('svg') as SVGElement).style.stroke = 'rgba(0,0,0,0.5)' }}
      >
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none"
          style={{ stroke: 'rgba(0,0,0,0.5)', transition: 'stroke 0.15s', display: 'block', overflow: 'visible' }}>
          {atBottom ? (
            /* Up arrow — tip at top */
            <>
              <line x1="7" y1="17" x2="7" y2="3" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="1,9 7,3 13,9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          ) : (
            /* Down arrow — tip at bottom */
            <>
              <line x1="7" y1="1" x2="7" y2="15" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="1,9 7,15 13,9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          )}
        </svg>
      </button>

      {/* Metadata — revealed by scrolling */}
      <div ref={metaRef} style={{ padding: `48px ${SIDE} 100px` }}>

        {/* Desktop: 3-col grid — columns flank the same gap as the counter display above */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: '1fr 90px 1fr' }}>
          <div style={{ paddingRight: 5 }}>
            <h1 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
                {project.description}
              </p>
            )}
          </div>
          <div />{/* center gap matching ← 1/n → width */}
          <div style={{ paddingLeft: 5 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)', lineHeight: 1.5 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: single column */}
        <div className="flex flex-col md:hidden" style={{ gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 }}>
              {project.label}
            </h1>
            {project.description && (
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {metaFields.map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.55)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
