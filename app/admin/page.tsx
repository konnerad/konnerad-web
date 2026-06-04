'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-sm" style={{ padding: '0 32px' }}>
        <h1
          className="text-3xl font-light tracking-widest uppercase mb-10 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,228,220,0.7)' }}
        >
          Admin
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-[12px] tracking-wider outline-none rounded-sm"
            style={{
              background: 'rgba(232,228,220,0.05)',
              border: '0.5px solid rgba(232,228,220,0.15)',
              color: '#e8e4dc',
              fontFamily: "'DM Mono', monospace",
            }}
          />
          {error && <p className="text-[11px] tracking-wider" style={{ color: '#D85A30' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-3 text-[11px] tracking-[0.15em] uppercase transition-colors rounded-sm"
            style={{
              background: 'rgba(232,228,220,0.08)',
              border: '0.5px solid rgba(232,228,220,0.2)',
              color: 'rgba(232,228,220,0.7)',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {loading ? 'Entering…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
