-- Seed Script for FitCSV
-- Run this in Supabase SQL Editor to create a sample program

-- This will create a program for the first user in your auth.users table
-- If you have multiple users, replace (SELECT id FROM auth.users LIMIT 1)
-- with your specific user ID: 'your-user-id-here'

DO $$
DECLARE
  v_user_id uuid;
  v_program_id text;
  v_week_id text;
  v_workout1_id text;
  v_workout2_id text;
  v_workout3_id text;
  v_exercise1_id text;
  v_exercise2_id text;
  v_exercise3_id text;
  v_exercise4_id text;
  v_exercise5_id text;
  v_exercise6_id text;
BEGIN
  -- Get the first user ID (or replace with your specific user ID)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user account first.';
  END IF;

  RAISE NOTICE 'Seeding for user: %', v_user_id;

  -- Create Program
  INSERT INTO "Program" (id, name, description, "userId", "isActive", "createdAt", "updatedAt")
  VALUES (
    'clseed001programid',
    'Sample 3-Day Strength Program',
    'A simple 3-day per week strength training program',
    v_user_id::text,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_program_id;

  RAISE NOTICE 'Created program: %', v_program_id;

  -- Create Week 1
  INSERT INTO "Week" (id, "weekNumber", "programId")
  VALUES (
    'clseed001week00001',
    1,
    v_program_id
  )
  RETURNING id INTO v_week_id;

  RAISE NOTICE 'Created week 1';

  -- Create Workout 1: Upper Body
  INSERT INTO "Workout" (id, name, "dayNumber", "weekId")
  VALUES (
    'clseed001workout01',
    'Upper Body',
    1,
    v_week_id
  )
  RETURNING id INTO v_workout1_id;

  -- Create Workout 2: Lower Body
  INSERT INTO "Workout" (id, name, "dayNumber", "weekId")
  VALUES (
    'clseed001workout02',
    'Lower Body',
    2,
    v_week_id
  )
  RETURNING id INTO v_workout2_id;

  -- Create Workout 3: Full Body
  INSERT INTO "Workout" (id, name, "dayNumber", "weekId")
  VALUES (
    'clseed001workout03',
    'Full Body',
    3,
    v_week_id
  )
  RETURNING id INTO v_workout3_id;

  RAISE NOTICE 'Created 3 workouts';

  -- Day 1: Exercise 1 - Bench Press
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000001', 'Bench Press', 1, v_workout1_id)
  RETURNING id INTO v_exercise1_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000001', 1, 5, '135lbs', 3, v_exercise1_id),
    ('clseed001ps000002', 2, 5, '135lbs', 2, v_exercise1_id),
    ('clseed001ps000003', 3, 5, '135lbs', 1, v_exercise1_id);

  -- Day 1: Exercise 2 - Barbell Rows
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000002', 'Barbell Rows', 2, v_workout1_id)
  RETURNING id INTO v_exercise2_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000004', 1, 8, '95lbs', 2, v_exercise2_id),
    ('clseed001ps000005', 2, 8, '95lbs', 2, v_exercise2_id),
    ('clseed001ps000006', 3, 8, '95lbs', 1, v_exercise2_id);

  RAISE NOTICE 'Created Upper Body workout with 2 exercises';

  -- Day 2: Exercise 1 - Squat
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000003', 'Squat', 1, v_workout2_id)
  RETURNING id INTO v_exercise3_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000007', 1, 5, '185lbs', 3, v_exercise3_id),
    ('clseed001ps000008', 2, 5, '185lbs', 2, v_exercise3_id),
    ('clseed001ps000009', 3, 5, '185lbs', 1, v_exercise3_id);

  -- Day 2: Exercise 2 - Romanian Deadlift
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000004', 'Romanian Deadlift', 2, v_workout2_id)
  RETURNING id INTO v_exercise4_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000010', 1, 8, '135lbs', 2, v_exercise4_id),
    ('clseed001ps000011', 2, 8, '135lbs', 2, v_exercise4_id),
    ('clseed001ps000012', 3, 8, '135lbs', 1, v_exercise4_id);

  RAISE NOTICE 'Created Lower Body workout with 2 exercises';

  -- Day 3: Exercise 1 - Deadlift
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000005', 'Deadlift', 1, v_workout3_id)
  RETURNING id INTO v_exercise5_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000013', 1, 5, '225lbs', 3, v_exercise5_id),
    ('clseed001ps000014', 2, 5, '225lbs', 2, v_exercise5_id),
    ('clseed001ps000015', 3, 5, '225lbs', 1, v_exercise5_id);

  -- Day 3: Exercise 2 - Overhead Press
  INSERT INTO "Exercise" (id, name, "order", "workoutId")
  VALUES ('clseed001ex000006', 'Overhead Press', 2, v_workout3_id)
  RETURNING id INTO v_exercise6_id;

  INSERT INTO "PrescribedSet" (id, "setNumber", reps, weight, rir, "exerciseId")
  VALUES
    ('clseed001ps000016', 1, 8, '75lbs', 2, v_exercise6_id),
    ('clseed001ps000017', 2, 8, '75lbs', 2, v_exercise6_id),
    ('clseed001ps000018', 3, 8, '75lbs', 1, v_exercise6_id);

  RAISE NOTICE 'Created Full Body workout with 2 exercises';
  RAISE NOTICE 'Seeding completed successfully!';
  RAISE NOTICE 'Program "Sample 3-Day Strength Program" created with 1 week and 3 workouts';
END $$;
