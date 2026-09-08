import Link from 'next/link'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const NAV_H = 56

export const metadata = {
  title: 'About — Konnerad',
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: F, color: '#111' }}>

      {/* Nav */}
      <nav style={{
        height: NAV_H,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '0 32px',
      }}>
        <Link href="/about" style={{ fontSize: 13, color: '#111', textDecoration: 'none' }}>
          About
        </Link>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Konnerad" style={{ width: 28, height: 28, display: 'block', borderRadius: 4 }} />
        </Link>
        <div />
      </nav>

      {/* Content */}
      <div style={{ padding: '60px 32px 100px', maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>About</h1>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)' }}>
          Konnerad is the portfolio of selected works by Konrad.
        </p>
      </div>

    </div>
  )
}
