'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/lib/supabase'

const COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#D4537E', '#378ADD', '#EF9F27', '#9B7FDD', '#2DAE85', '#E06840', '#DD5488']
const SHAPES = ['circle', 'square', 'diamond'] as const

type FormData = {
  label: string
  year: string
  tag: string
  description: string
  color: string
  shape: typeof SHAPES[number]
}

const emptyForm = (): FormData => ({
  label: '', year: new Date().getFullYear().toString(),
  tag: '', description: '', color: COLORS[0], shape: 'circle',
})

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<FormData>(emptyForm())
  const [editing, setEditing] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [panel, setPanel] = useState<'list' | 'edit'>('list')
  const fileRef = useRef<HTMLInputElement>(null)
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
    setPanel('edit')
  }

  function startEdit(p: Project) {
    setEditing(p.id)
    setForm({ label: p.label, year: p.year, tag: p.tag, description: p.description, color: p.color, shape: p.shape })
    setImages(p.images ?? [])
    setPanel('edit')
  }

  async function uploadImage(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url, error } = await res.json()
    if (error) alert(error)
    else setImages(prev => [...prev, url])
    setUploading(false)
  }

  async function save() {
    setSaving(true)
    const body = { ...form, images }
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
    background: 'rgba(232,228,220,0.05)',
    border: '0.5px solid rgba(232,228,220,0.12)',
    color: '#e8e4dc',
    fontFamily: "'DM Mono', monospace",
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#e8e4dc', fontFamily: "'DM Mono', monospace" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'rgba(232,228,220,0.08)' }}>
        <h1 className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(232,228,220,0.4)' }}>
          konnerad.com / admin
        </h1>
        <div className="flex gap-4">
          <a href="/" target="_blank" className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(232,228,220,0.3)' }}>
            View site ↗
          </a>
          <button onClick={logout} className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(232,228,220,0.3)' }}>
            Log out
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {panel === 'list' ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[13px] tracking-[0.15em] uppercase" style={{ color: 'rgba(232,228,220,0.5)' }}>
                Projects ({projects.length})
              </h2>
              <button
                onClick={startNew}
                className="px-4 py-2 text-[10px] tracking-[0.12em] uppercase rounded-sm"
                style={{ background: 'rgba(232,228,220,0.08)', border: '0.5px solid rgba(232,228,220,0.2)', color: 'rgba(232,228,220,0.7)' }}
              >
                + New project
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 rounded-sm"
                  style={{ background: 'rgba(232,228,220,0.03)', border: '0.5px solid rgba(232,228,220,0.07)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                    <div>
                      <p className="text-[12px]">{p.label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(232,228,220,0.3)' }}>{p.year} · {p.tag} · {p.images?.length ?? 0} images</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[10px] tracking-wider uppercase"
                      style={{ color: 'rgba(232,228,220,0.4)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="text-[10px] tracking-wider uppercase"
                      style={{ color: '#D85A30' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-[12px] py-8 text-center" style={{ color: 'rgba(232,228,220,0.2)' }}>
                  No projects yet — add your first one
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setPanel('list')} className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(232,228,220,0.3)' }}>
                ← Back
              </button>
              <h2 className="text-[13px] tracking-[0.15em] uppercase" style={{ color: 'rgba(232,228,220,0.5)' }}>
                {editing ? 'Edit project' : 'New project'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left: form */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Title</label>
                  <input className={inputClass} style={inputStyle} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Project name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Year</label>
                    <input className={inputClass} style={inputStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Tag</label>
                    <input className={inputClass} style={inputStyle} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. Branding" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Description</label>
                  <textarea
                    className={inputClass} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description of the project"
                  />
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Colour</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full transition-transform"
                        style={{
                          background: c,
                          outline: form.color === c ? `2px solid ${c}` : 'none',
                          outlineOffset: '2px',
                          transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Shape</label>
                  <div className="flex gap-2">
                    {SHAPES.map(s => (
                      <button
                        key={s}
                        onClick={() => setForm(f => ({ ...f, shape: s }))}
                        className="px-3 py-1.5 text-[10px] tracking-wider uppercase rounded-sm transition-colors"
                        style={{
                          background: form.shape === s ? 'rgba(232,228,220,0.15)' : 'rgba(232,228,220,0.05)',
                          border: `0.5px solid ${form.shape === s ? 'rgba(232,228,220,0.4)' : 'rgba(232,228,220,0.1)'}`,
                          color: form.shape === s ? '#e8e4dc' : 'rgba(232,228,220,0.4)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: images */}
              <div>
                <label className="block text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,228,220,0.3)' }}>Images</label>
                <div
                  className="p-4 rounded-sm mb-3 text-center cursor-pointer transition-colors"
                  style={{ border: '1px dashed rgba(232,228,220,0.15)', background: 'rgba(232,228,220,0.02)' }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      Array.from(e.target.files ?? []).forEach(f => uploadImage(f))
                      e.target.value = ''
                    }}
                  />
                  <p className="text-[11px]" style={{ color: uploading ? 'rgba(232,228,220,0.6)' : 'rgba(232,228,220,0.25)' }}>
                    {uploading ? 'Uploading…' : '+ Click to upload images'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {images.map((url, i) => (
                    <div key={url} className="relative group rounded-sm overflow-hidden aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(10,10,15,0.8)', color: '#e8e4dc' }}
                      >
                        ×
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] tracking-wider px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(10,10,15,0.7)', color: 'rgba(232,228,220,0.6)' }}>
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-8 border-t" style={{ borderColor: 'rgba(232,228,220,0.08)' }}>
              <button
                onClick={save}
                disabled={saving || !form.label}
                className="px-6 py-2.5 text-[11px] tracking-[0.12em] uppercase rounded-sm transition-colors"
                style={{ background: 'rgba(232,228,220,0.1)', border: '0.5px solid rgba(232,228,220,0.25)', color: saving ? 'rgba(232,228,220,0.3)' : 'rgba(232,228,220,0.8)' }}
              >
                {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add project')}
              </button>
              <button
                onClick={() => setPanel('list')}
                className="px-4 py-2.5 text-[11px] tracking-[0.12em] uppercase"
                style={{ color: 'rgba(232,228,220,0.3)' }}
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
