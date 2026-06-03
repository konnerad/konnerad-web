import { cookies } from 'next/headers'

const SESSION_COOKIE = 'admin_session'
const SESSION_VALUE  = 'authenticated'

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value === SESSION_VALUE
}

export async function setSession() {
  const store = await cookies()
  store.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
