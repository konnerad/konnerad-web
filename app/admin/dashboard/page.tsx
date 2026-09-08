'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/lib/supabase'

type FormData = {
  label: string
  disc_label: string
  disc_contain: boolean
  year: string
  tag: string
  client: string
  description: string
}

const emptyForm = (): FormData => ({
  label: '', disc_label: '', disc_contain: false,
  year: new Date().getFullYear().toString(),
  tag: '', client: '', description: '',
})

const MAX_PX = 1800
const QUALITY = 0.82

function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file)
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }) : file)
      }, 'image/webp', QUALITY)
    }
    img.src = url
  })
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<FormData>(emptyForm())
  const [editing, setEditing] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [thumbnail, setThumbnail] = useState<string>('')
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState<'list' | 'edit'>('list')
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [projDragIdx, setProjDragIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function load() {
    const res = await fetch('/api/projects')
    if (res.status === 401) { router.push('/admin'); return }
    setProjects(await res.json())
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  function startNew() {
    setEditing(null)
    setForm(emptyForm())
    setImages([])
    setThumbnail('')
    setPanel('edit')
  }

  function startEdit(p: Project) {
    setEditing(p.id)
    setForm({ label: p.label, disc_label: p.disc_label ?? '', disc_contain: p.disc_contain ?? false, year: p.year, tag: p.tag, client: p.client ?? '', description: p.description })
    setImages(p.images ?? [])
    setThumbnail(p.thumbnail ?? '')
    setPanel('edit')
  }

  async function uploadImage(file: File) {
    setUploading(true)
    const resized = await resizeImage(file)
    const fd = new FormData()
    fd.append('file', resized)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url, error } = await res.json()
    if (error) alert(error)
    else setImages(prev => [...prev, url])
    setUploading(false)
  }

  async function uploadThumbnail(file: File) {
    setUploadingThumb(true)
    const resized = await resizeImage(file)
    const fd = new FormData()
    fd.append('file', resized)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url, error } = await res.json()
    if (error) alert(error)
    else setThumbnail(url)
    setUploadingThumb(false)
  }

  async function save() {
    setSaving(true)
    const body = { ...form, images, thumbnail }
    const method = editing ? 'PUT' : 'POST'
    const payload = editing ? { ...body, id: editing } : body
    const res = await fetch('/api/admin/projects', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { await load(); setPanel('list') }
    else { const { error } = await res.json(); alert(error) }
    setSaving(false)
  }

  async function reorderProjects(from: number, to: number) {
    const next = [...projects]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setProjects(next)
    await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((p, i) => ({ id: p.id, order_index: i })) }),
    })
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return
    await fetch('/api/admin/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  async function logout() {
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    router.push('/admin')
  }

  const inputClass = "w-full px-3 py-2.5 text-[12px] outline-none rounded-sm"
  const inputStyle = {
    background: '#ffffff',
    border: '0.5px solid rgba(0,0,0,0.12)',
    color: '#111111',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  }

  return (
    <div className="min-h-screen" style={{ background: '#F4F4F4', color: '#111111', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b" style={{ borderColor: 'rgba(0,0,0,0.08)', padding: '20px 40px' }}>
        <h1 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(0,0,0,0.45)' }}>
          konnerad.com / admin
        </h1>
        <div className="flex gap-4">
          <a href="/" target="_blank" className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(0,0,0,0.35)' }}>
            View site ↗
          </a>
          <button onClick={logout} className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(0,0,0,0.35)' }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 40px 80px' }}>
        {panel === 'list' ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[13px] tracking-[0.15em] uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>
                Projects ({projects.length})
              </h2>
              <button
                onClick={startNew}
                className="px-4 py-2 text-[10px] tracking-[0.12em] uppercase rounded-sm"
                style={{ background: 'rgba(0,0,0,0.08)', border: '0.5px solid rgba(0,0,0,0.2)', color: 'rgba(0,0,0,0.7)' }}
              >
                + New project
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => setProjDragIdx(i)}
                  onDragEnd={() => setProjDragIdx(null)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (projDragIdx !== null && projDragIdx !== i) reorderProjects(projDragIdx, i); setProjDragIdx(null) }}
                  className="flex items-center justify-between px-4 py-3 rounded-sm"
                  style={{
                    background: 'rgba(0,0,0,0.03)',
                    border: '0.5px solid rgba(232,228,220,0.07)',
                    opacity: projDragIdx === i ? 0.4 : 1,
                    cursor: 'grab',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: 14, lineHeight: 1, userSelect: 'none' }}>⠿</span>
                    <div>
                      <p className="text-[12px]">{p.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(0,0,0,0.35)' }}>{p.year} · {p.tag} · {p.images?.length ?? 0} images</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[10px] tracking-wider uppercase"
                      style={{ color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="text-[10px] tracking-wider uppercase"
                      style={{ color: '#D85A30', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-[12px] py-8 text-center" style={{ color: 'rgba(0,0,0,0.2)' }}>
                  No projects yet — add your first one
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setPanel('list')} className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(0,0,0,0.35)' }}>
                ← Back
              </button>
              <h2 className="text-[13px] tracking-[0.15em] uppercase" style={{ color: 'rgba(0,0,0,0.5)' }}>
                {editing ? 'Edit project' : 'New project'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left: form */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Title</label>
                  <input className={inputClass} style={inputStyle} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Project name" />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: 'rgba(0,0,0,0.35)' }}>
                    Disc title <span style={{ color: 'rgba(0,0,0,0.2)', textTransform: 'none', letterSpacing: 0 }}>— max 35 chars, shown on the disc</span>
                  </label>
                  <input
                    className={inputClass} style={inputStyle}
                    value={form.disc_label}
                    onChange={e => setForm(f => ({ ...f, disc_label: e.target.value.slice(0, 35) }))}
                    placeholder={form.label.slice(0, 35) || 'Short disc title'}
                    maxLength={35}
                  />
                  <p className="text-[9px] mt-1" style={{ color: 'rgba(0,0,0,0.2)' }}>
                    {form.disc_label.length}/35 — falls back to Title if left empty
                  </p>
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Disc frame style</label>
                  <div className="flex gap-2">
                    {([false, true] as const).map(val => (
                      <button
                        key={String(val)}
                        onClick={() => setForm(f => ({ ...f, disc_contain: val }))}
                        className="px-3 py-1.5 text-[10px] tracking-wider uppercase rounded-sm transition-colors"
                        style={{
                          background: form.disc_contain === val ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
                          border: `0.5px solid ${form.disc_contain === val ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.1)'}`,
                          color: form.disc_contain === val ? '#111' : 'rgba(0,0,0,0.45)',
                        }}
                      >
                        {val ? 'Logo / graphic (fit)' : 'Photo (fill frame)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Year</label>
                    <input className={inputClass} style={inputStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Type / Tag</label>
                    <input className={inputClass} style={inputStyle} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. Branding" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Client</label>
                  <input className={inputClass} style={inputStyle} value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client name" />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Description</label>
                  <textarea
                    className={inputClass} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description of the project"
                  />
                </div>
              </div>

              {/* Right: thumbnail + images & videos */}
              <div className="flex flex-col min-h-0 gap-6">

                {/* Project thumbnail */}
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Project Thumbnail</label>
                  <div className="flex gap-3 items-start">
                    <div
                      className="rounded-sm overflow-hidden shrink-0"
                      style={{ width: 72, height: 72, background: thumbnail ? 'transparent' : 'rgba(0,0,0,0.04)', border: '0.5px solid rgba(0,0,0,0.15)' }}
                    >
                      {thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f); e.target.value = '' }}
                      />
                      <button
                        onClick={() => thumbRef.current?.click()}
                        className="px-3 py-2 text-[10px] tracking-wider uppercase rounded-sm text-left"
                        style={{ background: '#ffffff', border: '0.5px solid rgba(0,0,0,0.12)', color: uploadingThumb ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.6)' }}
                      >
                        {uploadingThumb ? 'Uploading…' : thumbnail ? 'Replace thumbnail' : 'Upload thumbnail'}
                      </button>
                      {thumbnail && (
                        <button onClick={() => setThumbnail('')} className="text-[9px] tracking-wider uppercase text-left" style={{ color: '#D85A30' }}>
                          Remove
                        </button>
                      )}
                      <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(0,0,0,0.2)' }}>
                        Shown on the disc and in the list view. If left empty, the first image is used.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery images & videos */}
                <div className="flex flex-col min-h-0">
                <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(0,0,0,0.35)' }}>Images &amp; Videos</label>
                <div
                  className="p-4 rounded-sm mb-3 text-center cursor-pointer transition-colors shrink-0"
                  style={{ border: '1px dashed rgba(0,0,0,0.15)', background: 'rgba(0,0,0,0.02)' }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      Array.from(e.target.files ?? []).forEach(f => uploadImage(f))
                      e.target.value = ''
                    }}
                  />
                  <p className="text-[11px]" style={{ color: uploading ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)' }}>
                    {uploading ? 'Uploading…' : '+ Click to upload images or videos'}
                  </p>
                </div>

                {images.length > 0 && (
                  <p className="text-[9px] tracking-wider mb-2 shrink-0" style={{ color: 'rgba(0,0,0,0.25)' }}>
                    Drag to reorder — first image is the cover
                  </p>
                )}

                {/* Scrollable media grid */}
                <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((url, i) => {
                      const video = /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(url)
                      const isCover = i === 0
                      const isDragging = dragIdx === i
                      return (
                        <div
                          key={url}
                          draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragEnd={() => setDragIdx(null)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault()
                            if (dragIdx === null || dragIdx === i) return
                            setImages(prev => {
                              const next = [...prev]
                              const [moved] = next.splice(dragIdx, 1)
                              next.splice(i, 0, moved)
                              return next
                            })
                            setDragIdx(null)
                          }}
                          className="relative group rounded-sm overflow-hidden aspect-square bg-black"
                          style={{
                            outline: isCover ? '2px solid rgba(0,0,0,0.5)' : 'none',
                            outlineOffset: '2px',
                            cursor: 'grab',
                            opacity: isDragging ? 0.4 : 1,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {video ? (
                            <video src={url} className="w-full h-full object-contain" muted />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          )}

                          {/* Delete button */}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setImages(prev => prev.filter((_, j) => j !== i))
                            }}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(244,244,244,0.9)', color: '#111111' }}
                          >
                            ×
                          </button>

                          {/* Badge */}
                          <span
                            className="absolute bottom-1 left-1 text-[8px] tracking-wider px-1.5 py-0.5 rounded-sm"
                            style={{
                              background: isCover ? 'rgba(0,0,0,0.25)' : 'rgba(244,244,244,0.85)',
                              color: isCover ? '#111111' : 'rgba(0,0,0,0.5)',
                            }}
                          >
                            {isCover ? '★ Cover' : video ? 'Video' : `${i + 1}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                </div> {/* end gallery section */}
              </div> {/* end right column */}
            </div>

            <div className="flex gap-3 mt-8 pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <button
                onClick={save}
                disabled={saving || !form.label}
                className="px-6 py-2.5 text-[11px] tracking-[0.12em] uppercase rounded-sm transition-colors"
                style={{ background: 'rgba(0,0,0,0.1)', border: '0.5px solid rgba(0,0,0,0.25)', color: saving ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.8)' }}
              >
                {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add project')}
              </button>
              <button
                onClick={() => setPanel('list')}
                className="px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase"
                style={{ color: 'rgba(0,0,0,0.35)' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
