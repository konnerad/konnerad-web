import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Proxy the image through our origin so the client can draw it to canvas
// without a cross-origin taint (Supabase CORS sometimes conflicts with cache).
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse(null, { status: 400 })

  try {
    const res = await fetch(url, { headers: { Accept: 'image/*' } })
    if (!res.ok) return new NextResponse(null, { status: 502 })

    const buf = await res.arrayBuffer()
    const ct = res.headers.get('content-type') ?? 'image/jpeg'

    return new NextResponse(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
