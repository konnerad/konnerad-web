'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const NAV_H = 56

export default function AboutPage() {
  const [about, setAbout] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/about')
      .then(r => r.json())
      .then(d => setAbout(d.about ?? ''))
      .catch(() => setAbout(''))
  }, [])

  return (
    <div style={{ height: '100dvh', background: '#fff', fontFamily: F, color: '#111', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{
        height: NAV_H,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '0 32px',
      }}>
        <Link href="/about" style={{ fontSize: 13, color: '#111', textDecoration: 'none' }}>
          about
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Konnerad" style={{ width: 28, height: 28, display: 'block', borderRadius: 4 }} />
        </Link>
        <div />
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '60px 32px', maxWidth: 720, width: '100%', margin: '0 auto' }}>
        {about && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
            {about}
          </p>
        )}
      </div>

    </div>
  )
}
