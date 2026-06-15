import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'runs:v1';

// A run looks like:
// { id, date (ISO), durationSec, distanceM, coords: [{latitude, longitude}] }

export async function getRuns() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const runs = JSON.parse(raw);
    // newest first
    return runs.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    console.warn('Failed to load runs', e);
    return [];
  }
}

export async function saveRun(run) {
  const runs = await getRuns();
  runs.push(run);
  await AsyncStorage.setItem(KEY, JSON.stringify(runs));
  return run;
}

export async function deleteRun(id) {
  const runs = await getRuns();
  const filtered = runs.filter((r) => r.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}

// Simple unique id without extra deps.
export function makeId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
