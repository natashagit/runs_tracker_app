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
  // A logged workout's detail. `date` is any ISO timestamp on the target day;
  // `title` (category) narrows to one workout, omit it to show the whole day.
  WorkoutDetail: { date: string; title?: string };
  Track: undefined;
  RunDetail: { run: Doc<'runs'> };
};
