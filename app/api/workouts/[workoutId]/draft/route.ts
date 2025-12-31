import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

type LoggedSetInput = {
  exerciseId: string
  setNumber: number
  reps: number
  weight: number
  weightUnit: string
  rpe: number | null
  rir: number | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
    const { workoutId } = await params

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { loggedSets } = body as { loggedSets: LoggedSetInput[] }

    if (!loggedSets || !Array.isArray(loggedSets)) {
      return NextResponse.json(
        { error: 'loggedSets array is required' },
        { status: 400 }
      )
    }

    // Allow empty arrays for draft saves - but still need to process deletions

    // Verify workout exists and user owns it
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.week.program.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if workout is already completed
    const existingCompletion = await prisma.workoutCompletion.findFirst({
      where: {
        workoutId,
        userId: user.id,
        status: 'completed',
      },
    })

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'Workout already completed. Cannot save draft.' },
        { status: 400 }
      )
    }

    // Find or create draft completion
    const result = await prisma.$transaction(async (tx) => {
      // Look for existing draft
      let draftCompletion = await tx.workoutCompletion.findFirst({
        where: {
          workoutId,
          userId: user.id,
          status: 'draft',
        },
      })

      // Create draft completion if it doesn't exist
      if (!draftCompletion) {
        draftCompletion = await tx.workoutCompletion.create({
          data: {
            workoutId,
            userId: user.id,
            status: 'draft',
            completedAt: new Date(),
          },
        })
      } else {
        // Update timestamp of existing draft
        draftCompletion = await tx.workoutCompletion.update({
          where: { id: draftCompletion.id },
          data: { completedAt: new Date() }
        })
      }

      // Remove existing logged sets for this draft (we'll replace them)
      const deletedSets = await tx.loggedSet.deleteMany({
        where: {
          completionId: draftCompletion.id,
        },
      })
      
      console.log(`Draft sync: Deleted ${deletedSets.count} existing sets, creating ${loggedSets.length} new sets`)
      
      if (loggedSets.length === 0 && deletedSets.count > 0) {
        console.log('🗑️ All sets deleted - this was a deletion-only sync')
      }

      // Create all logged sets for the draft
      if (loggedSets.length > 0) {
        await tx.loggedSet.createMany({
          data: loggedSets.map((set) => ({
            exerciseId: set.exerciseId,
            completionId: draftCompletion.id,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            weightUnit: set.weightUnit,
            rpe: set.rpe,
            rir: set.rir,
          })),
        })
      }

      return draftCompletion
    })

    return NextResponse.json({
      success: true,
      draft: {
        id: result.id,
        lastUpdated: result.completedAt,
        status: result.status,
        setsCount: loggedSets.length,
      },
    })
  } catch (error) {
    console.error('Error saving workout draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
    const { workoutId } = await params

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify workout exists and user owns it
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        week: {
          include: {
            program: true,
          },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.week.program.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find draft completion with logged sets
    const draftCompletion = await prisma.workoutCompletion.findFirst({
      where: {
        workoutId,
        userId: user.id,
        status: 'draft',
      },
      include: {
        loggedSets: {
          orderBy: [
            { exerciseId: 'asc' },
            { setNumber: 'asc' }
          ]
        }
      }
    })

    if (!draftCompletion) {
      return NextResponse.json({
        success: true,
        draft: null,
        message: 'No draft found'
      })
    }

    // Transform logged sets to match expected format
    const loggedSets = draftCompletion.loggedSets.map(set => ({
      exerciseId: set.exerciseId,
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight,
      weightUnit: set.weightUnit,
      rpe: set.rpe,
      rir: set.rir,
    }))

    return NextResponse.json({
      success: true,
      draft: {
        id: draftCompletion.id,
        lastUpdated: draftCompletion.completedAt,
        status: draftCompletion.status,
        loggedSets,
        setsCount: loggedSets.length,
      },
    })
  } catch (error) {
    console.error('Error retrieving workout draft:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}