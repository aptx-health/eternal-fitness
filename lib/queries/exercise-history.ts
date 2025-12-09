// Exercise History Queries

import { prisma } from '@/lib/db';

export interface ExerciseHistorySet {
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: string;
  rpe: number | null;
  rir: number | null;
}

export interface ExerciseHistory {
  completedAt: Date;
  workoutName: string;
  sets: ExerciseHistorySet[];
}

/**
 * Get last performance for an exercise definition
 * Returns most recent completed workout's sets for this exercise
 *
 * @param exerciseDefinitionId - The exercise definition ID to look up
 * @param userId - The user ID to filter by
 * @param beforeDate - Optional date to get history before (useful for "last time" before current workout)
 * @returns Exercise history or null if no previous performance found
 */
export async function getLastExercisePerformance(
  exerciseDefinitionId: string,
  userId: string,
  beforeDate?: Date
): Promise<ExerciseHistory | null> {
  // Find most recent completion with this exercise
  const lastCompletion = await prisma.workoutCompletion.findFirst({
    where: {
      userId,
      status: 'completed',
      completedAt: beforeDate ? { lt: beforeDate } : undefined,
      loggedSets: {
        some: {
          exercise: { exerciseDefinitionId }
        }
      }
    },
    orderBy: { completedAt: 'desc' },
    include: {
      workout: { select: { name: true } },
      loggedSets: {
        where: {
          exercise: { exerciseDefinitionId }
        },
        orderBy: { setNumber: 'asc' }
      }
    }
  });

  if (!lastCompletion || lastCompletion.loggedSets.length === 0) {
    return null;
  }

  return {
    completedAt: lastCompletion.completedAt,
    workoutName: lastCompletion.workout.name,
    sets: lastCompletion.loggedSets.map(set => ({
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight,
      weightUnit: set.weightUnit,
      rpe: set.rpe,
      rir: set.rir
    }))
  };
}
