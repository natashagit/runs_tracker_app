// Extract demo GIFs for the workout catalog from the ExerciseDB Kaggle
// dataset (https://www.kaggle.com/datasets/exercisedb/fitness-exercises-dataset).
//
// Usage:
//   node scripts/extract-gifs.mjs <path-to-unzipped-dataset>
//
// For each catalog exercise it picks the best-matching dataset exercise
// (guided by the CANDIDATES list below), copies its GIF into
// assets/exercise-gifs/<slug>.gif, and regenerates src/exerciseGifs.ts
// with static require() entries so Metro can bundle them.
//
// Always prints a match report — review it and adjust CANDIDATES if a
// match looks wrong, then re-run. Core Daily exercises are intentionally
// absent: they're custom movements with no dataset equivalent.

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const GIF_DIR = path.join(ROOT, 'assets', 'exercise-gifs');
const MAP_FILE = path.join(ROOT, 'src', 'exerciseGifs.ts');

// Catalog exercise -> ExerciseDB names to try, in order of preference.
// ExerciseDB names are lowercase and usually equipment-prefixed.
const CANDIDATES = {
  // Legs (Quads)
  'Goblet Squat': ['dumbbell goblet squat', 'kettlebell goblet squat'],
  'Leg Press': ['sled 45° leg press', 'sled 45 leg press', 'lever seated leg press'],
  'Leg Extension': ['lever leg extension', 'lever seated leg extension'],
  'Bulgarian Split Squat': ['dumbbell single leg split squat', 'bulgarian split squat', 'dumbbell bulgarian split squat'],
  'Walking Lunges': ['walking lunge', 'dumbbell walking lunge', 'bodyweight walking lunge'],
  'Step-ups': ['dumbbell step-up', 'step-up', 'bench step-up'],
  'Calf Raises': ['dumbbell standing calf raise', 'standing calf raise', 'bodyweight standing calf raise'],
  // Back & Biceps
  'Lat Pull Down': ['cable pulldown', 'cable lat pulldown', 'cable pulldown (pro lat bar)'],
  'Seated Cable Row': ['cable seated row', 'cable straight back seated row'],
  'One-Arm Dumbbell Row': ['dumbbell one arm row', 'dumbbell one arm bent-over row'],
  // No true face pull in ExerciseDB; this is the closest visual (rope
  // pulled toward the face, rear delts).
  'Face Pull': ['cable kneeling rear delt row (with rope) (male)', 'cable face pull', 'face pull'],
  'Reverse Fly': ['dumbbell reverse fly', 'dumbbell rear lateral raise'],
  'Back Extension': ['hyperextension', '45° hyperextension', 'back extension on exercise ball'],
  'Bicep Curl': ['dumbbell biceps curl', 'dumbbell standing biceps curl'],
  'Hammer Curl': ['dumbbell hammer curl', 'dumbbell standing hammer curl'],
  'Concentration Curl': ['dumbbell concentration curl'],
  // Glutes & Hamstrings
  'Hip Thrust': ['barbell hip thrust', 'hip thrust', 'barbell glute bridge'],
  'Glute Bridge': ['glute bridge', 'bodyweight glute bridge', 'pelvic tilt into bridge'],
  'Romanian Deadlift': ['barbell romanian deadlift', 'dumbbell romanian deadlift'],
  'Leg Curl': ['lever lying leg curl', 'lever seated leg curl'],
  'Sumo Squat': ['smith sumo squat', 'dumbbell sumo squat', 'sumo squat'],
  'Cable Kickback': ['cable kickback', 'cable donkey kickback', 'cable standing hip extension'],
  'Hip Abduction': ['lever seated hip abduction', 'cable hip abduction'],
  // Chest, Shoulders & Triceps
  'Push-ups': ['push-up', 'push up'],
  'Dumbbell Chest Press': ['dumbbell bench press', 'dumbbell press'],
  'Incline Dumbbell Press': ['dumbbell incline bench press', 'dumbbell incline press'],
  'Chest Fly': ['dumbbell fly', 'lever seated fly', 'cable middle fly'],
  'Dumbbell Shoulder Press': ['dumbbell seated shoulder press', 'dumbbell standing overhead press', 'dumbbell shoulder press'],
  'Lateral Raise': ['dumbbell lateral raise', 'dumbbell standing lateral raise'],
  'Rear Delt Fly': ['dumbbell rear delt fly', 'dumbbell rear lateral raise', 'dumbbell rear delt row'],
  'Triceps Pushdown': ['cable pushdown', 'cable triceps pushdown', 'cable pushdown (with rope attachment)'],
  'Overhead Triceps Extension': ['dumbbell standing overhead triceps extension', 'cable overhead triceps extension (rope attachment)', 'dumbbell seated triceps extension'],
  'Bench Dips': ['bench dip (knees bent)', 'bench dip', 'triceps dip'],
};

const norm = (s) =>
  s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s) => new Set(norm(s).split(' '));
const slug = (s) => norm(s).replace(/ /g, '-');

// Token-overlap score: shared / max(len) — crude but plenty at this scale.
function score(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.max(ta.size, tb.size);
}

// --- load the dataset ------------------------------------------------------

const datasetDir = process.argv[2];
if (!datasetDir || !fs.existsSync(datasetDir)) {
  console.error('Usage: node scripts/extract-gifs.mjs <path-to-unzipped-dataset>');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(datasetDir);
// The Kaggle sample ships each GIF at four resolutions; 360p is the best
// fit for the 84pt thumbnail on a 3x display (1080p just bloats the bundle).
const gifFiles = allFiles
  .filter((f) => f.toLowerCase().endsWith('.gif'))
  .sort((a, b) => Number(a.includes('360x360')) - Number(b.includes('360x360')));
const gifByBase = new Map(gifFiles.map((f) => [path.basename(f).toLowerCase(), f]));

// Any JSON that holds objects with a `name` looks like exercise metadata.
// Dedupe by name; keep whichever record we saw first.
const exercises = new Map();
for (const f of allFiles.filter((f) => f.endsWith('.json'))) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    continue;
  }
  const arr = Array.isArray(data) ? data : Array.isArray(data.exercises) ? data.exercises : [];
  for (const ex of arr) {
    if (ex && typeof ex.name === 'string' && !exercises.has(norm(ex.name))) {
      exercises.set(norm(ex.name), ex);
    }
  }
}
if (exercises.size === 0) {
  console.error(`No exercise metadata JSON found under ${datasetDir}`);
  process.exit(1);
}
console.log(`Dataset: ${exercises.size} exercises, ${gifFiles.length} GIFs\n`);

// The GIF for a record: a local file (try the gifUrl/media basename, then
// <id>.gif), else download from the ExerciseDB CDN (180p — only the paid
// dataset tiers ship higher resolutions for the full catalog).
async function findGif(ex, dest) {
  const candidates = [];
  for (const k of ['gifUrl', 'gif_url', 'gif', 'media', 'mediaId', 'media_id']) {
    if (typeof ex[k] === 'string') candidates.push(ex[k]);
  }
  for (const k of ['exerciseId', 'id', 'uuid']) {
    if (ex[k] != null) candidates.push(`${ex[k]}.gif`);
  }
  for (const c of candidates) {
    let base = c.split('/').pop().split('?')[0].toLowerCase();
    if (!base.endsWith('.gif')) base += '.gif';
    const hit = gifByBase.get(base);
    if (hit) {
      fs.copyFileSync(hit, dest);
      return `local ${path.basename(path.dirname(hit))}`;
    }
  }
  const remote = candidates.find((c) => c.startsWith('http'));
  if (remote) {
    const res = await fetch(remote);
    if (res.ok) {
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return 'cdn 180p';
    }
  }
  return null;
}

// --- match, copy, generate -------------------------------------------------

fs.mkdirSync(GIF_DIR, { recursive: true });
const entries = [];
const report = [];

for (const [catalogName, prefs] of Object.entries(CANDIDATES)) {
  // Preferred names first, otherwise best fuzzy match across the dataset.
  let match = prefs.map((p) => exercises.get(norm(p))).find(Boolean);
  let how = 'candidate';
  if (!match) {
    let best = 0;
    for (const ex of exercises.values()) {
      const s = Math.max(...prefs.map((p) => score(p, ex.name)), score(catalogName, ex.name));
      if (s > best) [best, match] = [s, ex];
    }
    how = `fuzzy ${(best * 100).toFixed(0)}%`;
    if (best < 0.5) {
      report.push([catalogName, `NO MATCH (closest: "${match?.name}" ${how})`]);
      continue;
    }
  }
  const dest = `${slug(catalogName)}.gif`;
  const source = await findGif(match, path.join(GIF_DIR, dest));
  if (!source) {
    report.push([catalogName, `matched "${match.name}" but no GIF found locally or on the CDN`]);
    continue;
  }
  entries.push([catalogName, dest]);
  report.push([catalogName, `"${match.name}" (${how}, ${source}) -> ${dest}`]);
}

const mapBody = entries
  .map(([name, file]) => `  '${name}': require('../assets/exercise-gifs/${file}'),`)
  .join('\n');

fs.writeFileSync(
  MAP_FILE,
  `// Demo GIFs for catalog exercises, bundled from the ExerciseDB Kaggle
// dataset (assets/exercise-gifs/). Exercises without an entry (all of
// Core Daily, which are custom movements) simply render without a GIF.
//
// Metro can only bundle static require() calls, so this map is regenerated
// by \`node scripts/extract-gifs.mjs <dataset-dir>\` once the dataset has
// been downloaded — don't hand-edit the entries.
export const EXERCISE_GIFS: Record<string, number> = {
${mapBody}
};

export function exerciseGif(name: string): number | undefined {
  return EXERCISE_GIFS[name];
}
`
);

const pad = Math.max(...report.map(([n]) => n.length));
for (const [name, msg] of report) console.log(`${name.padEnd(pad)}  ${msg}`);
console.log(`\n${entries.length}/${Object.keys(CANDIDATES).length} GIFs copied to assets/exercise-gifs/`);
console.log(`Regenerated ${path.relative(ROOT, MAP_FILE)}`);
