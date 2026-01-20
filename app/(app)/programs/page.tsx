import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import ConsolidatedProgramsView from '@/components/programs/ConsolidatedProgramsView'

export default async function ProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch active programs and archived counts in parallel for faster load times
  const [strengthPrograms, archivedStrengthCount, cardioPrograms, archivedCardioCount] = await Promise.all([
    prisma.program.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.program.count({
      where: {
        userId: user.id,
        isArchived: true,
      },
    }),
    prisma.cardioProgram.findMany({
      where: {
        userId: user.id,
        isArchived: false,
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            sessions: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    }),
    prisma.cardioProgram.count({
      where: {
        userId: user.id,
        isArchived: true,
      },
    })
  ])

  return (
    <ConsolidatedProgramsView
      strengthPrograms={strengthPrograms}
      archivedStrengthCount={archivedStrengthCount}
      cardioPrograms={cardioPrograms}
      archivedCardioCount={archivedCardioCount}
    />
  )
}
