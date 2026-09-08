import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import sharp from 'sharp'

const MAX_PX = 1800   // max dimension for gallery images
const QUALITY = 82    // webp quality

function isImage(type: string) {
  return type.startsWith('image/')
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const supabase = createServiceClient()
  const baseName = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}`

  let buffer: Buffer
  let contentType: string
  let ext: string

  if (isImage(file.type)) {
    const raw = Buffer.from(await file.arrayBuffer())
    buffer = await sharp(raw)
      .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer()
    contentType = 'image/webp'
    ext = 'webp'
  } else {
    // Video — upload as-is
    buffer = Buffer.from(await file.arrayBuffer())
    contentType = file.type
    ext = file.name.split('.').pop() ?? 'mp4'
  }

  const path = `${baseName}.${ext}`
  const { error } = await supabase.storage
    .from('project-images')
    .upload(path, buffer, { contentType, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('project-images')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
