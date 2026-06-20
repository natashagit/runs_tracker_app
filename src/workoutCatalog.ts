// The fixed catalog of gym workout categories and the exercises in each.
// Order here is the order shown in the New Workout picker.
export const WORKOUT_CATEGORIES = [
  'Arms',
  'Legs',
  'Back',
  'Abs',
  'Core Daily',
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export const EXERCISES: Record<WorkoutCategory, string[]> = {
  Arms: ['Bicep Curl', 'Triceps', 'Dumbbell'],
  Legs: ['Leg Curl', 'Calf Raises', 'Leg Press'],
  Back: ['Back Extension', 'Lat Pull Down'],
  Abs: [
    'Crunches',
    'Plank',
    'Mountain Climbers',
    'Hollow Body Hold',
    'Bicycle Crunch',
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
// here fall back to DEFAULT_SETS / DEFAULT_REPS.
export const CATEGORY_DEFAULTS: Partial<
  Record<WorkoutCategory, { sets: number; reps: number }>
> = {
  'Core Daily': { sets: 2, reps: 10 },
};
