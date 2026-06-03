'use client'

import { Project } from '@/lib/supabase'

export default function GridView({
  projects,
  onSelect,
}: {
  projects: Project[]
  onSelect: (project: Project) => void
}) {
  return (
    <div
      className="absolute inset-0 overflow-y-auto overflow-x-hidden"
      style={{ padding: '60px 16px 80px' }}
    >
      <div
        className="grid gap-[10px]"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: 'calc((100vw - 32px - 20px) / 3)',
        }}
      >
        {projects.map((p, i) => (
          <GridItem
            key={p.id}
            project={p}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function GridItem({
  project,
  index,
  onSelect,
}: {
  project: Project
  index: number
  onSelect: (p: Project) => void
}) {
  const img = project.images?.[0]

  return (
    <button
      onClick={() => onSelect(project)}
      className="relative overflow-hidden rounded-sm cursor-pointer group"
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={project.label}
          className="w-full h-full object-cover block"
        />
      ) : (
        <div className="w-full h-full" style={{ background: project.color }} />
      )}
      <div
        className="absolute inset-x-0 bottom-0 pt-8 pb-2 px-2.5"
        style={{ background: 'linear-gradient(transparent, rgba(10,10,15,0.9))' }}
      >
        <p className="text-[10px] tracking-widest uppercase text-[rgba(232,228,220,0.9)]">
          {project.label}
        </p>
        <p className="text-[9px] text-[rgba(232,228,220,0.4)] mt-0.5">{project.year}</p>
      </div>
    </button>
  )
}
