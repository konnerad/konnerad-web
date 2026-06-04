'use client'

import { useState, useEffect, useCallback } from 'react'
import Galaxy from '@/components/Galaxy'
import GridView from '@/components/GridView'
import ProjectModal, { ModalState } from '@/components/ProjectModal'
import ZoomOverlay from '@/components/ZoomOverlay'
import { Project } from '@/lib/supabase'

type Zoom = { color: string; x: number; y: number; dir: 'in' | 'out'; onDone: () => void } | null

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isGrid, setIsGrid] = useState(false)
  const [modal, setModal] = useState<ModalState>({ open: false })
  const [zoom, setZoom] = useState<Zoom>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(console.error)
  }, [])

  // Compute ref number for a project based on its position in the array
  const getRefNum = useCallback((project: Project) => {
    const idx = projects.findIndex(p => p.id === project.id)
    return `P${String(idx + 1).padStart(3, '0')}`
  }, [projects])

  const openProject = useCallback((project: Project, screenX: number, screenY: number) => {
    const refNum = projects.findIndex(p => p.id === project.id)
    setZoom({
      color: project.color,
      x: screenX,
      y: screenY,
      dir: 'in',
      onDone: () => {
        setModal({
          open: true,
          project,
          refNum: `P${String(refNum + 1).padStart(3, '0')}`,
          originX: screenX,
          originY: screenY,
        })
        setZoom(null)
      },
    })
  }, [projects])

  const closeProject = useCallback(() => {
    if (!modal.open) return
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    setZoom({
      color: modal.project.color,
      x: cx,
      y: cy,
      dir: 'out',
      onDone: () => {
        setModal({ open: false })
        setZoom(null)
      },
    })
  }, [modal])

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* Title */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-[13px] font-light tracking-[0.3em] uppercase whitespace-nowrap pointer-events-none"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: 'rgba(232,228,220,0.3)' }}
      >
        Selected Works
      </div>

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
            const idx = projects.findIndex(pr => pr.id === p.id)
            setZoom({
              color: p.color,
              x: window.innerWidth / 2,
              y: window.innerHeight / 2,
              dir: 'in',
              onDone: () => {
                setModal({ open: true, project: p, refNum, originX: window.innerWidth / 2, originY: window.innerHeight / 2 })
                setZoom(null)
              },
            })
          }}
        />
      </div>

      {/* Toggle */}
      <button
        onClick={() => setIsGrid(v => !v)}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[11px] tracking-[0.12em] uppercase px-5 py-2 rounded-sm transition-colors"
        style={{
          fontFamily: "'DM Mono', monospace",
          background: 'rgba(232,228,220,0.08)',
          border: '0.5px solid rgba(232,228,220,0.2)',
          color: 'rgba(232,228,220,0.7)',
        }}
      >
        {isGrid ? 'Orbit View' : 'Grid View'}
      </button>

      {/* Zoom overlay */}
      {zoom && (
        <ZoomOverlay
          key={`${zoom.x}-${zoom.y}-${zoom.dir}`}
          color={zoom.color}
          originX={zoom.x}
          originY={zoom.y}
          direction={zoom.dir}
          onDone={zoom.onDone}
        />
      )}

      {/* Project modal */}
      <ProjectModal state={modal} onClose={closeProject} />
    </main>
  )
}
