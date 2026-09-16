import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const NAV_H = 56

export const metadata = {
  title: 'About — Konnerad',
}

export const revalidate = 60

async function getAbout(): Promise<string> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.from('settings').select('value').eq('key', 'about').single()
    return data?.value ?? ''
  } catch {
    return ''
  }
}

export default async function AboutPage() {
  const about = await getAbout()

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', fontFamily: F, color: '#111' }}>

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
      <div style={{ padding: '60px 32px 100px', maxWidth: 560, margin: '0 auto' }}>
        {about && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(0,0,0,0.65)', whiteSpace: 'pre-wrap' }}>
            {about}
          </p>
        )}
      </div>

    </div>
  )
}
