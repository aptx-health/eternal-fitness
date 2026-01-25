'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  exerciseGroup: string | null
  notes: string | null
}

interface ExerciseNavigationProps {
  currentExercise: Exercise
  currentExerciseIndex: number
  totalExercises: number
  onPrevious: () => void
  onNext: () => void
}

export default function ExerciseNavigation({
  currentExercise,
  currentExerciseIndex,
  totalExercises,
  onPrevious,
  onNext,
}: ExerciseNavigationProps) {
  // Determine if this is part of a superset
  const isSuperset = currentExercise.exerciseGroup !== null
  const supersetLabel = currentExercise.exerciseGroup

  return (
    <div className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted flex-shrink-0">
      <button
        onClick={onPrevious}
        disabled={currentExerciseIndex === 0}
        className={`p-3  transition-all duration-200 border-2 border-transparent ${
          currentExerciseIndex === 0
            ? 'bg-muted opacity-30 cursor-not-allowed'
            : 'bg-primary-muted hover:bg-primary hover:border-primary hover:text-white'
        }`}
        aria-label="Previous exercise"
      >
        <ChevronLeft size={24} strokeWidth={2.5} />
      </button>

      <div className="text-center flex-1 px-2">
        <div className="flex items-center justify-center gap-2">
          {isSuperset && (
            <span className="px-2 py-1 bg-accent-muted text-accent-text text-xs font-bold rounded">
              Superset {supersetLabel}
            </span>
          )}
          <h3 className="text-lg font-semibold text-foreground">{currentExercise.name}</h3>
        </div>
        {currentExercise.notes && (
          <p className="text-sm text-muted-foreground mt-1">{currentExercise.notes}</p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={currentExerciseIndex === totalExercises - 1}
        className={`p-3  transition-all duration-200 border-2 border-transparent ${
          currentExerciseIndex === totalExercises - 1
            ? 'bg-muted opacity-30 cursor-not-allowed'
            : 'bg-primary-muted hover:bg-primary hover:border-primary hover:text-white'
        }`}
        aria-label="Next exercise"
      >
        <ChevronRight size={24} strokeWidth={2.5} />
      </button>
    </div>
  )
}
