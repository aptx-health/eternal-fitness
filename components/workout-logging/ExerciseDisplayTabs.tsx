'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/radix/tabs'
import SetList from './SetList'
import type { LoggedSet } from '@/hooks/useWorkoutStorage'

interface PrescribedSet {
  id: string
  setNumber: number
  reps: string
  weight: string | null
  rpe: number | null
  rir: number | null
}

interface Exercise {
  id: string
  name: string
  notes: string | null
  exerciseDefinition?: {
    primaryFAUs: string[]
    secondaryFAUs: string[]
    equipment: string[]
    instructions?: string
  }
}

interface ExerciseHistorySet {
  setNumber: number
  reps: number
  weight: number
  weightUnit: string
  rpe: number | null
  rir: number | null
}

interface ExerciseHistory {
  completedAt: Date
  workoutName: string
  sets: ExerciseHistorySet[]
}

interface ExerciseDisplayTabsProps {
  exercise: Exercise
  prescribedSets: PrescribedSet[]
  loggedSets: LoggedSet[]
  exerciseHistory: ExerciseHistory | null
  onDeleteSet: (setNumber: number) => void
  loggingForm: React.ReactNode
}

const FAU_DISPLAY_NAMES: Record<string, string> = {
  chest: 'Chest',
  'mid-back': 'Mid Back',
  'lower-back': 'Lower Back',
  'front-delts': 'Front Delts',
  'side-delts': 'Side Delts',
  'rear-delts': 'Rear Delts',
  lats: 'Lats',
  traps: 'Traps',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  adductors: 'Adductors',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  obliques: 'Obliques',
}

export default function ExerciseDisplayTabs({
  exercise,
  prescribedSets,
  loggedSets,
  exerciseHistory,
  onDeleteSet,
  loggingForm,
}: ExerciseDisplayTabsProps) {
  const loggedCount = loggedSets.length
  const totalCount = prescribedSets.length

  return (
    <Tabs defaultValue="log-sets" className="w-full h-full flex flex-col">
      <TabsList className="flex-shrink-0">
        <TabsTrigger value="log-sets">
          <span>Log Sets</span>
          {loggedCount > 0 && (
            <span className="ml-2 text-xs sm:text-sm px-2 py-0.5 rounded-full bg-success/20 text-success font-semibold">
              {loggedCount}/{totalCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        {exerciseHistory && <TabsTrigger value="history">History</TabsTrigger>}
      </TabsList>

      <TabsContent value="log-sets" className="flex-1 overflow-y-auto px-1 flex flex-col gap-3">
        <SetList
          prescribedSets={prescribedSets}
          loggedSets={loggedSets}
          exerciseHistory={null}
          onDeleteSet={onDeleteSet}
        />
        {loggingForm}
      </TabsContent>

      <TabsContent value="notes" className="flex-1 overflow-y-auto px-1">
        <div className="space-y-6">
          {exercise.exerciseDefinition?.instructions && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Instructions</h4>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {exercise.exerciseDefinition.instructions}
              </p>
            </div>
          )}

          {exercise.exerciseDefinition?.primaryFAUs && exercise.exerciseDefinition.primaryFAUs.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Primary Muscles</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.exerciseDefinition.primaryFAUs.map((fau) => (
                  <span
                    key={fau}
                    className="px-3 py-1.5 text-sm sm:text-base font-medium bg-primary/20 text-primary rounded-full"
                  >
                    {FAU_DISPLAY_NAMES[fau] || fau}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exercise.exerciseDefinition?.secondaryFAUs && exercise.exerciseDefinition.secondaryFAUs.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Secondary Muscles</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.exerciseDefinition.secondaryFAUs.map((fau) => (
                  <span
                    key={fau}
                    className="px-3 py-1.5 text-sm sm:text-base font-medium bg-muted text-foreground rounded-full"
                  >
                    {FAU_DISPLAY_NAMES[fau] || fau}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exercise.exerciseDefinition?.equipment && exercise.exerciseDefinition.equipment.length > 0 && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Equipment</h4>
              <div className="flex flex-wrap gap-2">
                {exercise.exerciseDefinition.equipment.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 text-sm sm:text-base font-medium bg-muted text-foreground rounded-full border border-border"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exercise.notes && (
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Notes</h4>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {exercise.notes}
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {exerciseHistory && (
        <TabsContent value="history" className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6">
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-2">Last Performed</h4>
              <p className="text-base sm:text-lg text-muted-foreground">
                {new Date(exerciseHistory.completedAt).toLocaleDateString()} -{' '}
                {exerciseHistory.workoutName}
              </p>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold text-foreground mb-3">Sets Completed</h4>
              <div className="space-y-3">
                {exerciseHistory.sets.map((set) => (
                  <div
                    key={set.setNumber}
                    className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border"
                  >
                    <div className="w-14 text-center font-semibold text-base sm:text-lg text-muted-foreground">
                      Set {set.setNumber}
                    </div>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-base">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Reps</div>
                        <div className="font-semibold text-lg text-foreground">{set.reps}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Weight</div>
                        <div className="font-semibold text-lg text-foreground">
                          {set.weight} {set.weightUnit}
                        </div>
                      </div>
                      {set.rpe !== null && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">RPE</div>
                          <div className="font-semibold text-lg text-foreground">{set.rpe}</div>
                        </div>
                      )}
                      {set.rir !== null && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">RIR</div>
                          <div className="font-semibold text-lg text-foreground">{set.rir}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  )
}
