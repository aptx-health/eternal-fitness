import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

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
          loggedSets: {
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
  const completion = workout.completions[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Fixed at top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href={`/programs/${programId}/weeks/${workout.week.weekNumber}`}
            className="text-blue-600 hover:text-blue-700 font-medium inline-block mb-2"
          >
            ← Week {workout.week.weekNumber}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 font-medium">
                Day {workout.dayNumber}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {workout.name}
              </h1>
            </div>
            {isCompleted && (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {isCompleted && (
            <p className="text-sm text-green-700 mt-1">
              Completed on{' '}
              {new Date(completion.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Exercises List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {workout.exercises.map((exercise, index) => {
            // Get logged sets for this exercise from the completion
            const exerciseLoggedSets = isCompleted
              ? completion.loggedSets.filter(
                  (ls) => ls.exerciseId === exercise.id
                )
              : []

            return (
              <div
                key={exercise.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exercise.name}
                    </h3>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-gray-600 mt-1 ml-8">
                      {exercise.notes}
                    </p>
                  )}
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Set
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Reps
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Weight
                        </th>
                        {(exercise.prescribedSets.some((s) => s.rir !== null) ||
                          exerciseLoggedSets.some((s) => s.rir !== null)) && (
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            RIR
                          </th>
                        )}
                        {(exercise.prescribedSets.some((s) => s.rpe !== null) ||
                          exerciseLoggedSets.some((s) => s.rpe !== null)) && (
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            RPE
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isCompleted ? (
                        // Show logged sets
                        exerciseLoggedSets.map((loggedSet) => (
                          <tr key={loggedSet.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {loggedSet.setNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {loggedSet.reps}
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {loggedSet.weight}
                              {loggedSet.weightUnit}
                            </td>
                            {exerciseLoggedSets.some((s) => s.rir !== null) && (
                              <td className="px-4 py-3 text-gray-900">
                                {loggedSet.rir ?? '-'}
                              </td>
                            )}
                            {exerciseLoggedSets.some((s) => s.rpe !== null) && (
                              <td className="px-4 py-3 text-gray-900">
                                {loggedSet.rpe ?? '-'}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        // Show prescribed sets
                        exercise.prescribedSets.map((set) => (
                          <tr key={set.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {set.setNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {set.reps}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {set.weight || '-'}
                            </td>
                            {exercise.prescribedSets.some(
                              (s) => s.rir !== null
                            ) && (
                              <td className="px-4 py-3 text-gray-700">
                                {set.rir ?? '-'}
                              </td>
                            )}
                            {exercise.prescribedSets.some(
                              (s) => s.rpe !== null
                            ) && (
                              <td className="px-4 py-3 text-gray-700">
                                {set.rpe ?? '-'}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Action Bar - Fixed at bottom for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {isCompleted ? (
            <div className="space-y-2">
              <button className="w-full py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors">
                Clear & Redo Workout
              </button>
              <p className="text-xs text-center text-gray-500">
                This will delete your logged data for this workout
              </p>
            </div>
          ) : (
            <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm">
              Start Logging
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
