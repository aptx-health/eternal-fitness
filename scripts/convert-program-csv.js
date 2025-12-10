#!/usr/bin/env node

/**
 * Convert multi-week training program CSV to FitCSV format
 *
 * Input format:
 * Week,Workout,Exercise,Warm-up Sets,Working Sets,Reps,Early Set RPE,Last Set RPE,Rest,Last Set Technique,Notes
 *
 * Output format (CSV_SPEC.md):
 * week,day,workout_name,exercise,exercise_group,set,reps,weight,rpe,notes
 */

const fs = require('fs');
const path = require('path');

// Parse CSV line (simple parser, handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Map workouts to day numbers (same workout = same day across all weeks)
const workoutToDayMap = {};
let nextDayNum = 1;

function getOrAssignDay(workoutName) {
  if (!workoutToDayMap[workoutName]) {
    workoutToDayMap[workoutName] = nextDayNum++;
  }
  return workoutToDayMap[workoutName];
}

// Extract exercise group from exercise name (e.g., "Superset A1" -> "A")
function extractExerciseGroup(exerciseName) {
  const supersetMatch = exerciseName.match(/\(Superset ([AB])(\d+)\)/i);
  if (supersetMatch) {
    return supersetMatch[1]; // Return just "A" or "B"
  }
  return null;
}

// Clean exercise name (remove annotations)
function cleanExerciseName(exerciseName) {
  return exerciseName
    .replace(/\(Superset [AB]\d+\)/i, '')
    .replace(/\(NEW\)/i, '')
    .replace(/\(optional\)/i, '')
    .replace(/\(Mechanical Dropset\)/i, '')
    .trim();
}

// Parse RPE value (extract upper bound from ranges like "7-8")
function parseRPE(rpeStr) {
  if (!rpeStr || rpeStr === 'N/A') return null;
  rpeStr = rpeStr.replace('~', '').trim();
  const match = rpeStr.match(/(\d+)(?:-(\d+))?/);
  if (!match) return null;
  // Return upper bound if range, otherwise the single value
  return match[2] ? parseInt(match[2]) : parseInt(match[1]);
}

// Build notes field from rest, technique, and notes columns
function buildNotes(rest, technique, notes) {
  const parts = [];
  if (rest && rest !== 'N/A' && rest.trim()) {
    parts.push(`Rest: ${rest}`);
  }
  if (technique && technique !== 'None' && technique.trim()) {
    parts.push(`Technique: ${technique}`);
  }
  if (notes && notes.trim()) {
    parts.push(notes);
  }
  return parts.join('. ');
}

// Main conversion function
function convertProgram(inputFile, outputFile) {
  console.log(`Reading from: ${inputFile}`);

  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('Input file is empty');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log('Input headers:', headers);

  // Expected columns
  const expectedCols = [
    'Week', 'Workout', 'Exercise', 'Warm-up Sets', 'Working Sets',
    'Reps', 'Early Set RPE', 'Last Set RPE', 'Rest', 'Last Set Technique', 'Notes'
  ];

  // Validate headers (case-insensitive)
  const headerMap = {};
  headers.forEach((header, idx) => {
    const normalized = header.trim().toLowerCase();
    headerMap[normalized] = idx;
  });

  // Check required columns exist
  const requiredCols = ['week', 'workout', 'exercise', 'working sets', 'reps'];
  for (const col of requiredCols) {
    if (!(col in headerMap)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Output CSV rows
  const outputRows = [];
  outputRows.push('week,day,workout_name,exercise,exercise_group,set,reps,weight,rpe,notes');

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    if (values.length < headers.length) {
      console.warn(`Row ${i + 1}: Not enough columns, skipping`);
      continue;
    }

    // Extract values using header map
    const week = values[headerMap['week']];
    const workout = values[headerMap['workout']];
    const exercise = values[headerMap['exercise']];
    const workingSets = parseInt(values[headerMap['working sets']] || '0');
    const reps = values[headerMap['reps']];
    const earlyRPE = values[headerMap['early set rpe']];
    const lastRPE = values[headerMap['last set rpe']];
    const rest = values[headerMap['rest']];
    const technique = values[headerMap['last set technique']];
    const notes = values[headerMap['notes']];

    if (!week || !workout || !exercise || workingSets === 0 || !reps) {
      console.warn(`Row ${i + 1}: Missing required data, skipping`);
      continue;
    }

    // Get or assign day number
    const day = getOrAssignDay(workout);

    // Parse exercise metadata
    const cleanExercise = cleanExerciseName(exercise);
    const exerciseGroup = extractExerciseGroup(exercise);
    const earlyRPEValue = parseRPE(earlyRPE);
    const lastRPEValue = parseRPE(lastRPE);
    const combinedNotes = buildNotes(rest, technique, notes);

    // Handle special rep formats
    let repsPerSet = null;
    let cleanReps = reps;

    // Different reps per set (4/6/8)
    if (reps.includes('/')) {
      repsPerSet = reps.split('/');
    }
    // Mechanical dropset notation (5+4+3+) - use first number
    else if (reps.includes('+')) {
      cleanReps = reps.split('+')[0];
    }

    // Generate rows for each working set
    for (let setNum = 1; setNum <= workingSets; setNum++) {
      const isLastSet = setNum === workingSets;
      const rpe = isLastSet ? lastRPEValue : earlyRPEValue;
      const setReps = repsPerSet ? repsPerSet[setNum - 1] : cleanReps;

      const outputRow = [
        week,
        day,
        `"${workout}"`,
        `"${cleanExercise}"`,
        exerciseGroup ? `"${exerciseGroup}"` : '',
        setNum,
        `"${setReps}"`,
        '', // weight blank
        rpe || '',
        `"${combinedNotes}"`,
      ];

      outputRows.push(outputRow.join(','));
    }
  }

  // Write output
  console.log(`\nWorkout to Day mapping:`);
  Object.entries(workoutToDayMap).forEach(([workout, day]) => {
    console.log(`  ${workout} -> Day ${day}`);
  });

  const output = outputRows.join('\n');
  fs.writeFileSync(outputFile, output);

  console.log(`\nConversion complete!`);
  console.log(`Output written to: ${outputFile}`);
  console.log(`Total rows: ${outputRows.length - 1} (excluding header)`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node convert-program-csv.js <input.csv> [output.csv]');
    console.log('');
    console.log('Example: node convert-program-csv.js program-raw.csv program.csv');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.csv', '-converted.csv');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    convertProgram(inputFile, outputFile);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { convertProgram };
