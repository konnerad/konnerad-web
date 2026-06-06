'use client'

import { useState, useEffect, useCallback } from 'react'
import Galaxy from '@/components/Galaxy'
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

  const openProject = useCallback((project: Project, screenX: number, screenY: number) => {
    const idx = projects.findIndex(p => p.id === project.id)
    const refNum = `P${String(idx + 1).padStart(3, '0')}`
    setModal({ open: true, project, refNum, originX: screenX, originY: screenY })
  }, [projects])

  const closeProject = useCallback(() => {
    setModal({ open: false })
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: '#F4F4F4' }}>
      {/* Galaxy */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isGrid ? 0 : 1, pointerEvents: isGrid ? 'none' : 'auto' }}
      >
        <Galaxy projects={projects} onSelect={openProject} />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isGrid ? 1 : 0, pointerEvents: isGrid ? 'auto' : 'none' }}
      >
        <GridView
          projects={projects}
          onSelect={(p, refNum) => {
            setModal({ open: true, project: p, refNum, originX: window.innerWidth / 2, originY: window.innerHeight / 2 })
          }}
        />
      </div>

      {/* Toggle */}
      <button
        onClick={() => setIsGrid(v => !v)}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] tracking-[0.12em] uppercase px-5 py-2 transition-colors"
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          background: 'rgba(0,0,0,0.06)',
          border: '0.5px solid rgba(0,0,0,0.2)',
          color: 'rgba(0,0,0,0.6)',
        }}
      >
        {isGrid ? 'Orbit View' : 'Grid View'}
      </button>

      {/* Project modal */}
      <ProjectModal state={modal} onClose={closeProject} />
    </main>
  )
}
