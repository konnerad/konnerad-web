import ProjectPage from './ProjectPage'

export default function Page({ params }: { params: { slug: string } }) {
  return <ProjectPage slug={params.slug} />
}
