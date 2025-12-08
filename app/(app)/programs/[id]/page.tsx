import { redirect } from 'next/navigation'

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Redirect to week 1 by default
  // TODO: In the future, redirect to current week based on completion status
  redirect(`/programs/${id}/weeks/1`)
}
