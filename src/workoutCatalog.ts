// The fixed catalog of gym workout categories and the exercises in each.
// Order here is the order shown in the New Workout picker.
// 4-day split: quads / pull / posterior chain / push, plus Core Daily done
// every gym visit.
export const WORKOUT_CATEGORIES = [
  'Legs (Quads)',
  'Back & Biceps',
  'Glutes & Hamstrings',
  'Chest, Shoulders & Triceps',
  'Core Daily',
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export const EXERCISES: Record<WorkoutCategory, string[]> = {
  'Legs (Quads)': [
    'Goblet Squat',
    'Leg Press',
    'Leg Extension',
    'Bulgarian Split Squat',
    'Walking Lunges',
    'Step-ups',
    'Calf Raises',
  ],
  'Back & Biceps': [
    'Lat Pull Down',
    'Seated Cable Row',
    'One-Arm Dumbbell Row',
    'Face Pull',
    'Reverse Fly',
    'Back Extension',
    'Bicep Curl',
    'Hammer Curl',
    'Concentration Curl',
  ],
  'Glutes & Hamstrings': [
    'Hip Thrust',
    'Glute Bridge',
    'Romanian Deadlift',
    'Leg Curl',
    'Sumo Squat',
    'Cable Kickback',
    'Hip Abduction',
  ],
  'Chest, Shoulders & Triceps': [
    'Push-ups',
    'Dumbbell Chest Press',
    'Incline Dumbbell Press',
    'Chest Fly',
    'Dumbbell Shoulder Press',
    'Lateral Raise',
    'Rear Delt Fly',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
    'Bench Dips',
  ],
  'Core Daily': [
    '5 lb dumbbell swing',
    '20 lb weight top of head',
    '10 lb weight left and right',
    '10 lb weight twist on top',
    '10 lb weight turn left right',
    '2.5 lb weight swing diagonal top',
  ],
};

// Defaults for a fresh exercise row.
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 15;

// Per-category overrides for the default sets/reps. Categories not listed
// here fall back to DEFAULT_SETS / DEFAULT_REPS. The four strength days use
// 3x10 — a strength-building range for the compound lifts that anchor them.
export const CATEGORY_DEFAULTS: Partial<
  Record<WorkoutCategory, { sets: number; reps: number }>
> = {
  'Legs (Quads)': { sets: 3, reps: 10 },
  'Back & Biceps': { sets: 3, reps: 10 },
  'Glutes & Hamstrings': { sets: 3, reps: 10 },
  'Chest, Shoulders & Triceps': { sets: 3, reps: 10 },
  'Core Daily': { sets: 2, reps: 10 },
};
