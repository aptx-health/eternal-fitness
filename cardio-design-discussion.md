# Cardio Feature Design Discussion

## Date: 2026-01-13

## Design Decisions Made

### 1. Cardio Programs vs Ad-Hoc Sessions
**Decision**: Option A - Completely separate and flexible
- Cardio programs are optional
- Users can create structured multi-week programs OR log ad-hoc sessions
- Programs provide structure but users can deviate based on recovery, weather, etc.

### 2. Calendar Integration
**Decision**: Unified calendar (deferred for now - out of scope for initial design)
- Shows both strength and cardio
- Not tied to programs - separate scheduling layer
- Just labels + color coding + completion checkboxes

### 3. Cardio Session Granularity
**Decision**: Session-level metrics only (NO interval-level tracking)
- No need to track individual intervals within HIIT
- Duration + metrics tell the story (20min + peak HR 185 vs 45min avg HR 145)
- Keeps model simple

### 4. Cardio Types
**Decision**: Flexible/universal model - one table for all cardio types
- Steady cardio (Zone 2 bike)
- HIIT (sprint intervals)
- Free cardio (group run, MTB ride)
- All use same table with optional fields based on what's captured

### 5. Prescribed Cardio Philosophy
**Decision**: Descriptive and specific prescriptions, flexible execution
- Programs should be detailed and specific
- Users can deviate during execution (bike → elliptical due to weather)
- Balance between structure and flexibility

### 6. Hierarchical Structure
**Decision**: Option A - Session is atomic unit
```
CardioProgram → Week → PrescribedCardioSession

LoggedCardioSession (standalone, optionally references PrescribedCardioSession)
```
- No "Workout" container needed
- One day = one cardio session
- Simpler than strength hierarchy

---

## Proposed Schema (Draft)

### PrescribedCardioSession
```typescript
PrescribedCardioSession {
  id: string
  weekId: FK  // Links to Week table
  dayNumber: number  // 1, 2, 3... (position in week)
  name: string  // "Zone 2 Endurance", "HIIT Intervals"
  description?: string  // Freeform notes

  // Prescription details
  targetDuration: number  // minutes
  intensityZone?: string  // "zone2", "zone3", "threshold", "HIIT"
  equipment?: string  // "bike", "run", "elliptical", "airbike"

  // Optional guidance
  targetHRRange?: string  // "140-150" (text, flexible)
  targetPowerRange?: string  // "150-180W"
  intervalStructure?: string  // "8x30s/90s" for HIIT
  notes?: string  // "If weather bad, use elliptical"

  createdAt: DateTime
  updatedAt: DateTime
}
```

### LoggedCardioSession
```typescript
LoggedCardioSession {
  id: string
  prescribedSessionId?: FK  // Optional link to plan
  userId: string  // References auth.users
  completedAt: DateTime

  // What you actually did
  name: string  // Copy from prescribed or user enters
  equipment: string  // What you actually used
  duration: number  // Actual minutes

  // Metrics (all optional)
  avgHR?: number
  peakHR?: number
  avgPower?: number
  peakPower?: number
  calories?: number
  distance?: number  // For runs/bikes

  // Context
  intensityZone?: string  // What zone you aimed for
  intervalStructure?: string  // What you did for HIIT
  notes?: string  // Freeform

  createdAt: DateTime
}
```

---

## Decisions Made (Answered)

### Question 1: Prescribed Detail Level ✓
**Decision**: Prescribed fields look good
- targetDuration, intensityZone, equipment, targetHRRange, targetPowerRange, intervalStructure, notes
- Provides good detail for program creation

### Question 2: Logged Metrics Structure ✓
**Decision**: Keep it simple and flat
- All metrics as optional fields at top level
- No need for complex nested structures

### Question 3: Equipment Handling ✓
**Decision**: Predefined equipment list (exhaustive)
- Will create comprehensive list of common cardio equipment
- Keeps data consistent for analysis

### Question 4: Intensity Zones ✓
**Decision**: Define standard zones
- Use standard HR zones (Zone 1-5) as baseline
- Include HIIT as additional option

### Question 5: Active Program Constraint ✓
**Decision**: One active cardio program per user
- Mirrors strength program behavior
- Use `isActive` flag on CardioProgram

### Additional Decision: Completion Tracking ✓
**Decision**: Link LoggedCardioSession to PrescribedCardioSession (optional)
- Want to see if workout is checked off (like strength)
- LoggedCardioSession serves as both completion record AND logged data

---

## Comparison to Strength Architecture

### Strength (Current)
```
Program (isActive: one per user)
└── Week
    └── Workout (container for exercises)
        └── Exercise
            ├── PrescribedSet (template)
            └── LoggedSet (actual performance)
```

### Cardio (Proposed)
```
CardioProgram (isActive: TBD)
└── Week
    └── PrescribedCardioSession (template)

LoggedCardioSession (standalone, optional reference to prescribed)
```

**Key Differences**:
- No "Workout" container for cardio (session is atomic)
- No set-level granularity (session is the unit)
- More flexibility in logging (can log without program)

---

## Use Cases to Support

### Use Case 1: Structured Program
User creates 12-week cardio program:
- Week 1: 3x Zone 2 sessions (30min each)
- Week 2: 2x Zone 2 (35min) + 1x HIIT (20min)
- Follows program rigorously

### Use Case 2: Flexible Execution
User has program prescribing "Zone 2 bike 45min"
- Day of: Weather bad, uses elliptical instead
- Logs: Elliptical, 45min, Zone 2, avgHR 145

### Use Case 3: Ad-Hoc Logging
User has no cardio program
- Goes on group MTB ride
- Logs: "MTB ride, 90min, 1200 cals, avgHR 155, free cardio"

### Use Case 4: HIIT Session
Program prescribes: "HIIT airbike, 20min, 8x30s/90s intervals"
- Logs: 20min, 8 rounds completed, peakHR 185, avgPower 380W

---

## LLM Analysis Considerations

To support future LLM-assisted program development and analysis, schema should:

1. **Parallel strength structure** where possible (Program → Week pattern)
2. **Consistent naming** (prescribed vs logged)
3. **Structured data** over freeform where reasonable (enums for equipment/zones)
4. **Optional references** (logged can link to prescribed for plan vs actual analysis)
5. **Flexible metrics** (capture what matters for each session type)

---

## Next Steps

1. Answer open questions (1-5)
2. Finalize schema
3. Consider CardioProgram table structure
4. Plan migration strategy
5. Write complete design document with examples
