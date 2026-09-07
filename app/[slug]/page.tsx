import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { slugify } from '@/lib/slugify'
import ProjectPage from './ProjectPage'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('projects').select('label, description')
  const project = data?.find(p => slugify(p.label) === params.slug)
  if (!project) return {}
  return {
    title: `${project.label} — Konnerad`,
    description: project.description,
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const supabase = createServiceClient()
  const { data } = await supabase.from('projects').select('*').order('order', { ascending: true })
  const projects = data ?? []
  const project = projects.find(p => slugify(p.label) === params.slug)
  if (!project) notFound()

  const idx = projects.indexOf(project)
  const refNum = `P${String(idx + 1).padStart(3, '0')}`

  return <ProjectPage project={project} refNum={refNum} />
}
