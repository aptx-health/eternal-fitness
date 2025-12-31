FitCSV Program Editing Implementation Plan

 Overview

 Add comprehensive editing capabilities to FitCSV programs, allowing users to add/remove
 exercises and sets, edit prescribed values, and manage exercise notes. Edits only affect
  unlogged workouts to preserve historical data integrity.

 User Requirements (Confirmed)

 1. Notes location: Exercise-level only (one notes field per exercise)
 2. Edit scope: Full editing - add/remove exercises, add/remove sets, edit prescribed
 values and notes
 3. Edit impact: Future only - edits only affect unlogged workouts, preserve historical
 data

 Architecture Decision: Separate Edit Page

 Route: /programs/[id]/workouts/[workoutId]/edit

 Rationale:
 - Clearer intent with dedicated URL
 - Simpler state management (no mode toggling)
 - More screen space for editing controls (mobile-friendly)
 - Easy undo/cancel (browser back)
 - Prevents accidental edits on read-only view

 Implementation Phases

 Phase 1: Foundation & Validation

 1.1 Database Schema Updates

 File: prisma/schema.prisma

 Add audit fields to Exercise and PrescribedSet models:
 model Exercise {
   // ... existing fields
   createdAt   DateTime @default(now())
   updatedAt   DateTime @updatedAt
 }

 model PrescribedSet {
   // ... existing fields
   createdAt   DateTime @default(now())
   updatedAt   DateTime @updatedAt
 }

 Migration: doppler run -- npx prisma migrate dev --name add_exercise_audit_fields

 1.2 Validation Utility

 File: lib/queries/workout-validation.ts (NEW)

 /**
  * Check if workout is editable (not completed)
  * Returns { editable: boolean, reason?: string }
  */
 export async function isWorkoutEditable(
   workoutId: string,
   userId: string
 ): Promise<{ editable: boolean; reason?: string }>

 1.3 Exercise Definition Matcher

 File: lib/exercise-definition-matcher.ts (NEW)

 Extract matching logic from lib/csv/import-to-db.ts:
 /**
  * Match or create exercise definition
  * Handles exact match, alias match, or creates new custom exercise
  */
 export async function matchOrCreateExerciseDefinition(
   exerciseName: string,
   userId: string
 ): Promise<string>

 Phase 2: Prescribed Set CRUD APIs

 2.1 Update Single Set

 File: app/api/sets/[setId]/route.ts (NEW)

 - PATCH: Update reps, weight, rpe, rir, setNumber
 - DELETE: Remove prescribed set
 - Validation: Check workout not completed via isWorkoutEditable()
 - Auth: Verify user owns workout via RLS-friendly query

 2.2 Add Set to Exercise

 File: app/api/exercises/[exerciseId]/sets/route.ts (NEW)

 - POST: Create new prescribed set
 - Input: { setNumber, reps, weight?, rpe?, rir? }
 - Auto-increment setNumber if not provided
 - Validation: Check workout not completed

 Phase 3: Exercise CRUD APIs

 3.1 Update/Delete Exercise

 File: app/api/exercises/[exerciseId]/route.ts (NEW)

 - PATCH: Update name, notes, exerciseGroup
   - If name changed: Use matchOrCreateExerciseDefinition() to update
 exerciseDefinitionId
 - DELETE: Hard delete exercise (cascades to PrescribedSets)
 - Validation: Check workout not completed

 3.2 Add Exercise & Reorder

 File: app/api/workouts/[workoutId]/exercises/route.ts (NEW)

 - POST: Add new exercise to workout
   - Input: { name, exerciseGroup?, notes?, order, prescribedSets[] }
   - Use matchOrCreateExerciseDefinition() for exercise matching
   - Create exercise and all prescribed sets in transaction
 - PUT: Reorder exercises
   - Input: { exerciseOrders: [{ exerciseId, order }] }
   - Batch update order values in transaction

 Phase 4: Edit UI Components

 4.1 Set Editor Row

 File: components/PrescribedSetRow.tsx (NEW, ~80 lines)

 - Display: Set number, reps input, weight input, RPE input (conditional), RIR input
 (conditional)
 - Actions: Delete button
 - Props: { set, onUpdate, onDelete, showRpe, showRir }

 4.2 Exercise Editor Card

 File: components/ExerciseEditCard.tsx (NEW, ~150 lines)

 - Exercise name input
 - Notes textarea
 - Exercise group input
 - List of PrescribedSetRow components
 - Add set button
 - Move up/down buttons (reorder within workout)
 - Delete exercise button
 - Props: { exercise, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }

 4.3 Add Exercise Modal

 File: components/AddExerciseButton.tsx (NEW, ~100 lines)

 - Button to open modal
 - Form: exercise name, notes, exercise group, initial sets
 - Create via POST API
 - Callback with new exercise
 - Props: { workoutId, onExerciseAdded }

 4.4 Main Edit Form

 File: components/WorkoutEditForm.tsx (NEW, ~180 lines)

 - Local state: exercises array, dirty check
 - Render list of ExerciseEditCard components
 - Add exercise button
 - Save changes handler (batch API calls)
 - Cancel handler (navigate back)
 - Loading states during save
 - Props: { workout: WorkoutWithExercises, programId: string }

 Phase 5: Edit Page & Integration

 5.1 Edit Page

 File: app/(app)/programs/[id]/workouts/[workoutId]/edit/page.tsx (NEW)

 Server component:
 - Await params (Next.js 15 pattern)
 - Check auth
 - Fetch workout with exercises, prescribed sets, exercise definitions
 - Check if completed - if so, show error + link back
 - Render <WorkoutEditForm /> with data

 5.2 Add Edit Button to Workout Detail

 File: components/WorkoutDetail.tsx (MODIFY)

 Add edit button in header (after completion indicator):
 {!isCompleted && (
   <Link
     href={`/programs/${programId}/workouts/${workout.id}/edit`}
     className="px-4 py-2 bg-gray-700 text-white rounded-lg"
   >
     Edit Workout
   </Link>
 )}

 Phase 6: Polish & Edge Cases

 - Error handling and user-friendly messages
 - Loading states (disable form during save)
 - Empty state handling (exercise with no sets)
 - Validation messages (client and server)
 - Mobile responsiveness testing
 - Exercise reordering with up/down buttons

 Data Flow: Save Changes

 WorkoutEditForm (client state)
   ↓ User clicks "Save"
   ↓ Batch API calls:
     1. DELETE /api/exercises/[id] (deleted exercises)
     2. POST /api/workouts/[id]/exercises (new exercises)
     3. PATCH /api/exercises/[id] (updated exercises)
     4. PUT /api/workouts/[id]/exercises (reorder)
     5. POST /api/exercises/[id]/sets (new sets)
     6. PATCH /api/sets/[id] (updated sets)
     7. DELETE /api/sets/[id] (deleted sets)
   ↓ Success
   ↓ router.push() to workout detail page

 Security Enforcement

 All API routes must:
 1. Verify user authentication via Supabase
 2. Check user owns workout via RLS-friendly query:
 const workout = await prisma.workout.findUnique({
   where: { id: workoutId },
   include: { week: { include: { program: true } } }
 });
 if (workout.week.program.userId !== user.id) {
   return 403 Unauthorized
 }
 3. Validate workout not completed via isWorkoutEditable()
 4. Sanitize and validate inputs

 Edge Cases Handled

 1. Completed workouts: Edit button hidden, API blocks edits, show error message
 2. Empty exercises: Allow exercises with 0 sets, show warning in UI
 3. Exercise name changes: Use matchOrCreateExerciseDefinition() to link to existing or
 create new definition
 4. Reordering: Up/down buttons swap order values with adjacent exercise
 5. Concurrent edits: Last save wins (acceptable for single-user MVP)
 6. Exercise history: Links via exerciseDefinitionId, preserved if same definition
 matched

 Critical Files

 New Files

 1. lib/queries/workout-validation.ts - Validation helper
 2. lib/exercise-definition-matcher.ts - Exercise matching utility
 3. app/api/sets/[setId]/route.ts - Set CRUD
 4. app/api/exercises/[exerciseId]/sets/route.ts - Add sets
 5. app/api/exercises/[exerciseId]/route.ts - Exercise CRUD
 6. app/api/workouts/[workoutId]/exercises/route.ts - Add/reorder exercises
 7. components/PrescribedSetRow.tsx - Set editor row
 8. components/ExerciseEditCard.tsx - Exercise editor
 9. components/AddExerciseButton.tsx - Add exercise modal
 10. components/WorkoutEditForm.tsx - Main edit form
 11. app/(app)/programs/[id]/workouts/[workoutId]/edit/page.tsx - Edit page

 Modified Files

 1. prisma/schema.prisma - Add audit fields
 2. components/WorkoutDetail.tsx - Add edit button

 Testing Strategy

 1. API Testing: Manual via browser fetch() or Postman
   - Test all CRUD endpoints
   - Verify auth and completion checks
   - Test edge cases (empty sets, invalid inputs)
 2. UI Testing: Manual browser testing
   - Chrome DevTools mobile emulation
   - Test on iPhone SE, Pixel 5, Desktop
   - Flows: Add exercise, edit sets, reorder, save, cancel
 3. Integration Testing: Full flow
   - Import CSV → Edit workout → Log workout → Verify history preserved

 Success Criteria

 - User can edit any unlogged workout
 - Can add/remove exercises and sets
 - Can edit prescribed values (reps, weight, RPE, RIR) and notes
 - Edits save successfully without data loss
 - Historical logged data remains intact
 - Edit button hidden for completed workouts
 - Mobile UI usable on small screens
 - Exercise definition matching works correctly

 Estimated Effort

 - Phase 1 (Foundation): ~3 hours
 - Phase 2 (Set APIs): ~2 hours
 - Phase 3 (Exercise APIs): ~3 hours
 - Phase 4 (UI Components): ~8 hours
 - Phase 5 (Integration): ~4 hours
 - Phase 6 (Polish): ~4 hours
 - Total: ~24 hours (3 full days)

 Next Steps

 1. Review and approve this plan
 2. Execute Phase 1 (schema migration + utilities)
 3. Execute Phases 2-3 (APIs) and test with API client
 4. Execute Phases 4-5 (UI) and test in browser
 5. Execute Phase 6 (polish) and full integration testing
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
