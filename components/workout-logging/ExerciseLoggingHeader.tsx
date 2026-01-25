'use client'

import SyncStatusIcon from '../SyncStatusIcon'

interface ExerciseLoggingHeaderProps {
  currentExerciseIndex: number
  totalExercises: number
  totalLoggedSets: number
  totalPrescribedSets: number
  syncStatus: 'idle' | 'syncing' | 'error'
  pendingSetsCount: number
  onSyncClick: () => void
  onClose: () => void
}

export default function ExerciseLoggingHeader({
  currentExerciseIndex,
  totalExercises,
  totalLoggedSets,
  totalPrescribedSets,
  syncStatus,
  pendingSetsCount,
  onSyncClick,
  onClose,
}: ExerciseLoggingHeaderProps) {
  return (
    <>
      {/* Sync Status Icon */}
      <SyncStatusIcon
        status={syncStatus}
        pendingCount={pendingSetsCount}
        onClick={onSyncClick}
      />

      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 border-b-2 border-primary-muted-dark flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-primary-foreground opacity-80">
            Exercise {currentExerciseIndex + 1} of {totalExercises} • {totalLoggedSets}/
            {totalPrescribedSets} sets logged
          </div>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
