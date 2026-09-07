'use client'

import { useState, useEffect, useCallback } from 'react'
import ViewmasterDisc from '@/components/ViewmasterDisc'
import GridView from '@/components/GridView'
import ProjectModal, { ModalState } from '@/components/ProjectModal'
import { Project } from '@/lib/supabase'

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isGrid, setIsGrid] = useState(false)
  const [modal, setModal] = useState<ModalState>({ open: false })

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
  }, [])

  const openProject = useCallback((project: Project) => {
    const idx = projects.findIndex(p => p.id === project.id)
    const refNum = `P${String(idx + 1).padStart(3, '0')}`
    setModal({ open: true, project, refNum, originX: window.innerWidth / 2, originY: window.innerHeight / 2 })
  }, [projects])

  const closeProject = useCallback(() => {
    setModal({ open: false })
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Galaxy */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isGrid ? 0 : 1, pointerEvents: isGrid ? 'none' : 'auto' }}
      >
        <ViewmasterDisc projects={projects} onSelect={openProject} />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isGrid ? 1 : 0, pointerEvents: isGrid ? 'auto' : 'none' }}
      >
        <GridView
          projects={projects}
          onSelect={(p, refNum) => {
            setModal({ open: true, project: p, refNum, originX: 0, originY: 0 })
          }}
        />
      </div>

      {/* Toggle — icon pill */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 999,
          padding: 4,
          gap: 0,
        }}
      >
        {/* Sliding indicator */}
        <div style={{
          position: 'absolute',
          top: 4, left: 4,
          width: 36, height: 36,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.13)',
          transform: `translateX(${isGrid ? 40 : 0}px)`,
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          pointerEvents: 'none',
        }} />

        {/* Disc icon */}
        <button
          onClick={() => setIsGrid(false)}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
          title="Disc view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke={isGrid ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.75)'} strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.5" fill={isGrid ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.75)'} />
          </svg>
        </button>

        {/* List icon */}
        <button
          onClick={() => setIsGrid(true)}
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="List view"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            {[4, 8, 12].map(y => (
              <line key={y} x1="2" y1={y} x2="14" y2={y} stroke={isGrid ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
            ))}
          </svg>
        </button>
      </div>

      {/* Project modal */}
      <ProjectModal state={modal} onClose={closeProject} />
    </main>
  )
}
