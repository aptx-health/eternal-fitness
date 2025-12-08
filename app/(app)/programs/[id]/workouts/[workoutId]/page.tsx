import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import WorkoutDetail from '@/components/WorkoutDetail'

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>
}) {
  const { id: programId, workoutId } = await params

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch workout with exercises, prescribed sets, and completion status
  const workout = await prisma.workout.findUnique({
    where: {
      id: workoutId,
    },
    include: {
      week: {
        include: {
          program: true,
        },
      },
      exercises: {
        orderBy: {
          order: 'asc',
        },
        include: {
          prescribedSets: {
            orderBy: {
              setNumber: 'asc',
            },
          },
        },
      },
      completions: {
        where: {
          userId: user.id,
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 1,
        include: {
          loggedSets: {
            orderBy: {
              setNumber: 'asc',
            },
          },
        },
      },
    },
  })

  if (!workout) {
    notFound()
  }

  // Verify user owns this program
  if (workout.week.program.userId !== user.id) {
    notFound()
  }

  const isCompleted = workout.completions.length > 0

  return <WorkoutDetail workout={workout} programId={programId} isCompleted={isCompleted} />
}
