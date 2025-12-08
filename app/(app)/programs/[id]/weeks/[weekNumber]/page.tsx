import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export default async function WeekPage({
  params,
}: {
  params: Promise<{ id: string; weekNumber: string }>
}) {
  const { id: programId, weekNumber } = await params
  const weekNum = parseInt(weekNumber, 10)

  if (isNaN(weekNum) || weekNum < 1) {
    notFound()
  }

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch program with weeks
  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      userId: user.id,
    },
    include: {
      weeks: {
        orderBy: {
          weekNumber: 'asc',
        },
      },
    },
  })

  if (!program) {
    notFound()
  }

  // Find the current week
  const week = program.weeks.find((w) => w.weekNumber === weekNum)

  if (!week) {
    notFound()
  }

  // Fetch workouts for this week with completion status
  const workouts = await prisma.workout.findMany({
    where: {
      weekId: week.id,
    },
    orderBy: {
      dayNumber: 'asc',
    },
    include: {
      completions: {
        where: {
          userId: user.id,
          status: 'completed',
        },
        take: 1,
        orderBy: {
          completedAt: 'desc',
        },
      },
    },
  })

  // Calculate navigation
  const totalWeeks = program.weeks.length
  const hasPrevWeek = weekNum > 1
  const hasNextWeek = weekNum < totalWeeks

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed at top for mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/programs"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Programs
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
        </div>
      </div>

      {/* Week Navigation - Mobile optimized with large touch targets */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Previous Week Button */}
            {hasPrevWeek ? (
              <Link
                href={`/programs/${programId}/weeks/${weekNum - 1}`}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
            ) : (
              <div className="w-12 h-12" />
            )}

            {/* Week Indicator */}
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500 font-medium">Week</span>
              <span className="text-3xl font-bold text-gray-900">{weekNum}</span>
              <span className="text-xs text-gray-400">of {totalWeeks}</span>
            </div>

            {/* Next Week Button */}
            {hasNextWeek ? (
              <Link
                href={`/programs/${programId}/weeks/${weekNum + 1}`}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <div className="w-12 h-12" />
            )}
          </div>
        </div>
      </div>

      {/* Workouts List - Mobile optimized */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No workouts scheduled for this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => {
              const isCompleted = workout.completions.length > 0

              return (
                <Link
                  key={workout.id}
                  href={`/programs/${programId}/workouts/${workout.id}`}
                  className="block"
                >
                  <div
                    className={`
                      relative bg-white rounded-lg border-2 p-5
                      active:scale-[0.98] transition-all
                      ${
                        isCompleted
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            Day {workout.dayNumber}
                          </span>
                          {isCompleted && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500">
                              <svg
                                className="w-4 h-4 text-white"
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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workout.name}
                        </h3>
                        {isCompleted && (
                          <p className="text-sm text-green-700 mt-1">
                            Completed on{' '}
                            {new Date(
                              workout.completions[0].completedAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Arrow indicator */}
                      <svg
                        className="w-6 h-6 text-gray-400 flex-shrink-0 ml-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
