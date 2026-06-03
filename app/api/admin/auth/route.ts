import { NextRequest, NextResponse } from 'next/server'
import { setSession, clearSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password, action } = await req.json()

  if (action === 'logout') {
    await clearSession()
    return NextResponse.json({ ok: true })
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  await setSession()
  return NextResponse.json({ ok: true })
}
