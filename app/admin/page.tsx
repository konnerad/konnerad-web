'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Wrong password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F4F4', fontFamily: F }}>
      <div className="w-full max-w-sm" style={{ padding: '0 32px' }}>
        <h1 className="text-3xl font-light tracking-widest uppercase mb-10 text-center" style={{ color: 'rgba(0,0,0,0.6)' }}>
          Admin
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-[12px] tracking-wider outline-none"
            style={{
              background: '#fff',
              border: '0.5px solid rgba(0,0,0,0.15)',
              color: '#111111',
              fontFamily: F,
            }}
          />
          {error && <p className="text-[11px] tracking-wider" style={{ color: '#c0392b' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 text-[11px] tracking-[0.15em] uppercase transition-colors"
            style={{
              background: '#111111',
              border: 'none',
              color: '#F4F4F4',
              fontFamily: F,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Entering…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
