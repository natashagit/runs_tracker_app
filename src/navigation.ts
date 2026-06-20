import type { Doc } from '../convex/_generated/dataModel';
import type { WorkoutCategory } from './workoutCatalog';

// The screens in the main stack and the params each one receives.
// `undefined` means the screen takes no params.
export type RootStackParamList = {
  Home: undefined;
  Runs: undefined;
  Workouts: undefined;
  WorkoutCalendar: undefined;
  NewWorkout: undefined;
  WorkoutExercises: { category: WorkoutCategory };
  Track: undefined;
  RunDetail: { run: Doc<'runs'> };
};
