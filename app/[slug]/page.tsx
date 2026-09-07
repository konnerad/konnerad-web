import ProjectPage from './ProjectPage'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ProjectPage slug={slug} />
}
