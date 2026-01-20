import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import WorkoutDetail from '@/components/WorkoutDetail'
import { getBatchExercisePerformance } from '@/lib/queries/exercise-history'

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
          exerciseDefinition: true, // NEW: Include exercise definition
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

  // Fetch exercise history for all exercises in a single batch query
  const exerciseDefinitionIds = workout.exercises.map(ex => ex.exerciseDefinitionId)
  const historyByDefinition = await getBatchExercisePerformance(
    exerciseDefinitionIds,
    user.id,
    new Date() // Get history before now
  )

  // Convert to map by exercise ID (not definition ID) for component lookup
  const historyMap = Object.fromEntries(
    workout.exercises.map((exercise) => [
      exercise.id,
      historyByDefinition.get(exercise.exerciseDefinitionId) || null
    ])
  )

  return (
    <WorkoutDetail
      workout={workout}
      programId={programId}
      exerciseHistory={historyMap} // NEW: Pass history to component
    />
  )
}
