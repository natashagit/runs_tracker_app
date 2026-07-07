// Demo GIFs for catalog exercises, bundled from the ExerciseDB Kaggle
// dataset (assets/exercise-gifs/). Exercises without an entry (all of
// Core Daily, which are custom movements) simply render without a GIF.
//
// Metro can only bundle static require() calls, so this map is regenerated
// by `node scripts/extract-gifs.mjs <dataset-dir>` once the dataset has
// been downloaded — don't hand-edit the entries.
export const EXERCISE_GIFS: Record<string, number> = {
  'Goblet Squat': require('../assets/exercise-gifs/goblet-squat.gif'),
  'Leg Press': require('../assets/exercise-gifs/leg-press.gif'),
  'Leg Extension': require('../assets/exercise-gifs/leg-extension.gif'),
  'Bulgarian Split Squat': require('../assets/exercise-gifs/bulgarian-split-squat.gif'),
  'Walking Lunges': require('../assets/exercise-gifs/walking-lunges.gif'),
  'Step-ups': require('../assets/exercise-gifs/step-ups.gif'),
  'Calf Raises': require('../assets/exercise-gifs/calf-raises.gif'),
  'Lat Pull Down': require('../assets/exercise-gifs/lat-pull-down.gif'),
  'Seated Cable Row': require('../assets/exercise-gifs/seated-cable-row.gif'),
  'One-Arm Dumbbell Row': require('../assets/exercise-gifs/one-arm-dumbbell-row.gif'),
  'Face Pull': require('../assets/exercise-gifs/face-pull.gif'),
  'Reverse Fly': require('../assets/exercise-gifs/reverse-fly.gif'),
  'Back Extension': require('../assets/exercise-gifs/back-extension.gif'),
  'Bicep Curl': require('../assets/exercise-gifs/bicep-curl.gif'),
  'Hammer Curl': require('../assets/exercise-gifs/hammer-curl.gif'),
  'Concentration Curl': require('../assets/exercise-gifs/concentration-curl.gif'),
  'Hip Thrust': require('../assets/exercise-gifs/hip-thrust.gif'),
  'Glute Bridge': require('../assets/exercise-gifs/glute-bridge.gif'),
  'Romanian Deadlift': require('../assets/exercise-gifs/romanian-deadlift.gif'),
  'Leg Curl': require('../assets/exercise-gifs/leg-curl.gif'),
  'Sumo Squat': require('../assets/exercise-gifs/sumo-squat.gif'),
  'Cable Kickback': require('../assets/exercise-gifs/cable-kickback.gif'),
  'Hip Abduction': require('../assets/exercise-gifs/hip-abduction.gif'),
  'Push-ups': require('../assets/exercise-gifs/push-ups.gif'),
  'Dumbbell Chest Press': require('../assets/exercise-gifs/dumbbell-chest-press.gif'),
  'Incline Dumbbell Press': require('../assets/exercise-gifs/incline-dumbbell-press.gif'),
  'Chest Fly': require('../assets/exercise-gifs/chest-fly.gif'),
  'Dumbbell Shoulder Press': require('../assets/exercise-gifs/dumbbell-shoulder-press.gif'),
  'Lateral Raise': require('../assets/exercise-gifs/lateral-raise.gif'),
  'Rear Delt Fly': require('../assets/exercise-gifs/rear-delt-fly.gif'),
  'Triceps Pushdown': require('../assets/exercise-gifs/triceps-pushdown.gif'),
  'Overhead Triceps Extension': require('../assets/exercise-gifs/overhead-triceps-extension.gif'),
  'Bench Dips': require('../assets/exercise-gifs/bench-dips.gif'),
};

export function exerciseGif(name: string): number | undefined {
  return EXERCISE_GIFS[name];
}
