'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ViewmasterDisc from '@/components/ViewmasterDisc'
import GridView from '@/components/GridView'
import { Project } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'

const NAV_H = 56

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isGrid, setIsGrid] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only restore view when returning from a project page, not on fresh load
    const returnView = sessionStorage.getItem('returnView')
    if (returnView) {
      sessionStorage.removeItem('returnView')
      setIsGrid(returnView === 'list')
    }
  }, [])

  const setView = (grid: boolean) => {
    setIsGrid(grid)
  }

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
  }, [])

  const openProject = (project: Project) => {
    sessionStorage.setItem('returnView', isGrid ? 'list' : 'disc')
    router.push('/' + slugify(project.label))
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#ffffff', overflow: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        height: NAV_H, flexShrink: 0,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '0 32px',
      }}>
        <Link href="/about" style={{ fontSize: 13, color: '#111', textDecoration: 'none' }}>
          about
        </Link>
        <button onClick={() => setView(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apple-touch-icon.png" alt="Konnerad" style={{ width: 28, height: 28, display: 'block', borderRadius: 4 }} />
        </button>
        <div />
      </nav>

      {/* Content area */}
      <main className="relative overflow-hidden" style={{ flex: 1 }}>
        {/* Disc */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isGrid ? 0 : 1, pointerEvents: isGrid ? 'none' : 'auto' }}
        >
          <ViewmasterDisc projects={projects} onSelect={openProject} />
        </div>

        {/* List */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isGrid ? 1 : 0, pointerEvents: isGrid ? 'auto' : 'none' }}
        >
          <GridView projects={projects} onSelect={openProject} />
        </div>

        {/* Toggle — icon pill */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 999, padding: 4 }}
        >
          <div style={{
            position: 'absolute', top: 4, left: 4,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.13)',
            transform: `translateX(${isGrid ? 40 : 0}px)`,
            transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'none',
          }} />
          <button onClick={() => setView(false)} title="disc view"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke={isGrid ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.75)'} strokeWidth="1.5" />
              <circle cx="8" cy="8" r="1.5" fill={isGrid ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.75)'} />
            </svg>
          </button>
          <button onClick={() => setView(true)} title="list view"
            style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {[4, 8, 12].map(y => (
                <line key={y} x1="2" y1={y} x2="14" y2={y} stroke={isGrid ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
              ))}
            </svg>
          </button>
        </div>
      </main>
    </div>
  )
}
