// The fixed catalog of gym workout categories and the exercises in each.
// Order here is the order shown in the New Workout picker.
export const WORKOUT_CATEGORIES = ['Arms', 'Legs', 'Back', 'Abs'] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export const EXERCISES: Record<WorkoutCategory, string[]> = {
  Arms: ['Bicep Curl', 'Triceps', 'Dumbbell'],
  Legs: ['Leg Curl', 'Calf Raises', 'Leg Press'],
  Back: ['Back Extension', 'Lat Pull Down'],
  Abs: ['Crunches', 'Plank', 'Mountain Climbers'],
};

// Defaults for a fresh exercise row.
export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 15;
