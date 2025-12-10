// Database Import Logic for CSV Programs

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type {
  ParsedCsvRow,
  StructuredProgram,
  StructuredWeek,
  StructuredWorkout,
  StructuredExercise,
  DetectedColumns,
} from './types';

/**
 * Structure parsed CSV rows into program hierarchy
 */
export function structureProgram(
  rows: ParsedCsvRow[],
  programName: string,
  detectedColumns: DetectedColumns
): StructuredProgram {
  // Group by week
  const weekMap = new Map<number, ParsedCsvRow[]>();
  rows.forEach((row) => {
    if (!weekMap.has(row.week)) {
      weekMap.set(row.week, []);
    }
    weekMap.get(row.week)!.push(row);
  });

  // Build structured weeks
  const weeks: StructuredWeek[] = [];

  weekMap.forEach((weekRows, weekNumber) => {
    // Group by workout (day)
    const workoutMap = new Map<string, ParsedCsvRow[]>();
    weekRows.forEach((row) => {
      const key = `${row.day}-${row.workoutName}`;
      if (!workoutMap.has(key)) {
        workoutMap.set(key, []);
      }
      workoutMap.get(key)!.push(row);
    });

    // Build structured workouts
    const workouts: StructuredWorkout[] = [];

    workoutMap.forEach((workoutRows) => {
      const firstRow = workoutRows[0];

      // Group by exercise
      const exerciseMap = new Map<string, ParsedCsvRow[]>();
      workoutRows.forEach((row) => {
        const exerciseKey = `${row.exercise}-${row.exerciseGroup || ''}`;
        if (!exerciseMap.has(exerciseKey)) {
          exerciseMap.set(exerciseKey, []);
        }
        exerciseMap.get(exerciseKey)!.push(row);
      });

      // Build structured exercises
      const exercises: StructuredExercise[] = [];
      let exerciseOrder = 0;

      exerciseMap.forEach((exerciseRows) => {
        const firstExerciseRow = exerciseRows[0];

        exercises.push({
          name: firstExerciseRow.exercise,
          order: exerciseOrder++,
          exerciseGroup: firstExerciseRow.exerciseGroup,
          notes: firstExerciseRow.notes,
          prescribedSets: exerciseRows.map((row) => ({
            setNumber: row.set,
            reps: row.reps,
            weight: row.weight,
            rpe: row.rpe,
            rir: row.rir,
          })),
        });
      });

      workouts.push({
        name: firstRow.workoutName,
        dayNumber: firstRow.day,
        exercises,
      });
    });

    // Sort workouts by day number
    workouts.sort((a, b) => a.dayNumber - b.dayNumber);

    weeks.push({
      weekNumber,
      workouts,
    });
  });

  // Sort weeks by week number
  weeks.sort((a, b) => a.weekNumber - b.weekNumber);

  return {
    metadata: {
      name: programName,
      totalWeeks: weeks.length,
      detectedColumns,
    },
    weeks,
  };
}

/**
 * Import structured program into database
 */
export async function importProgramToDatabase(
  structuredProgram: StructuredProgram,
  userId: string
): Promise<{ programId: string }> {
  // Pre-match all unique exercises BEFORE the transaction to avoid timeout
  const uniqueExerciseNames = new Set<string>();
  structuredProgram.weeks.forEach((week) => {
    week.workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        uniqueExerciseNames.add(exercise.name.trim().toLowerCase());
      });
    });
  });

  // Build exercise definition map outside transaction
  const exerciseDefinitionMap = new Map<string, string>();

  for (const exerciseName of uniqueExerciseNames) {
    const normalized = exerciseName.toLowerCase();

    // Stage 1: Exact name match
    let definition = await prisma.exerciseDefinition.findFirst({
      where: { normalizedName: normalized },
    });

    // Stage 2: Alias match
    if (!definition) {
      definition = await prisma.exerciseDefinition.findFirst({
        where: { aliases: { has: normalized } },
      });
    }

    // Stage 3: Create custom exercise
    if (!definition) {
      definition = await prisma.exerciseDefinition.create({
        data: {
          name: exerciseName,
          normalizedName: normalized,
          isSystem: false,
          createdBy: userId,
        },
      });
    }

    exerciseDefinitionMap.set(normalized, definition.id);
  }

  // Now do the transaction with cached exercise definitions
  const result = await prisma.$transaction(async (tx) => {
    // Deactivate any existing active programs
    await tx.program.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Create program
    const program = await tx.program.create({
      data: {
        name: structuredProgram.metadata.name,
        userId,
        isActive: true,
      },
    });

    // Create weeks with workouts, exercises, and prescribed sets
    for (const week of structuredProgram.weeks) {
      const weekRecord = await tx.week.create({
        data: {
          weekNumber: week.weekNumber,
          programId: program.id,
        },
      });

      for (const workout of week.workouts) {
        const workoutRecord = await tx.workout.create({
          data: {
            name: workout.name,
            dayNumber: workout.dayNumber,
            weekId: weekRecord.id,
          },
        });

        for (const exercise of workout.exercises) {
          // Get cached exercise definition ID
          const exerciseDefinitionId = exerciseDefinitionMap.get(
            exercise.name.trim().toLowerCase()
          );

          if (!exerciseDefinitionId) {
            throw new Error(`Exercise definition not found for: ${exercise.name}`);
          }

          const exerciseRecord = await tx.exercise.create({
            data: {
              name: exercise.name,
              exerciseDefinitionId,
              order: exercise.order,
              exerciseGroup: exercise.exerciseGroup,
              notes: exercise.notes,
              workoutId: workoutRecord.id,
            },
          });

          // Create prescribed sets (reps now string)
          await tx.prescribedSet.createMany({
            data: exercise.prescribedSets.map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps, // Already string from validator
              weight: set.weight,
              rpe: set.rpe,
              rir: set.rir,
              exerciseId: exerciseRecord.id,
            })),
          });
        }
      }
    }

    return { programId: program.id };
  }, {
    timeout: 30000, // Increase timeout to 30 seconds
  });

  return result;
}
