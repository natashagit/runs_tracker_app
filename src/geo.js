// Geospatial + formatting helpers

const R = 6371000; // Earth radius in meters

// Great-circle distance between two {latitude, longitude} points, in meters.
export function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Total path length (meters) for an array of coordinates.
export function pathDistance(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

// meters -> "3.42 km"
export function formatDistance(m) {
  return `${(m / 1000).toFixed(2)} km`;
}

// seconds -> "32:10" or "1:05:09"
export function formatDuration(totalSec) {
  const sec = Math.floor(totalSec % 60);
  const min = Math.floor((totalSec / 60) % 60);
  const hr = Math.floor(totalSec / 3600);
  const pad = (n) => String(n).padStart(2, '0');
  return hr > 0 ? `${hr}:${pad(min)}:${pad(sec)}` : `${min}:${pad(sec)}`;
}

// pace in min/km -> "5:30 /km", returns "--" when not enough data
export function formatPace(durationSec, distanceM) {
  if (distanceM < 10) return '--';
  const paceSecPerKm = durationSec / (distanceM / 1000);
  const min = Math.floor(paceSecPerKm / 60);
  const sec = Math.floor(paceSecPerKm % 60);
  return `${min}:${String(sec).padStart(2, '0')} /km`;
}

// ISO date -> "Mon, Jun 8 · 4:32 PM"
export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' · ' + d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Compute a map region that fits all coordinates with padding.
export function regionForCoords(coords) {
  if (!coords || coords.length === 0) return null;
  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLon = coords[0].longitude;
  let maxLon = coords[0].longitude;
  for (const c of coords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLon = Math.min(minLon, c.longitude);
    maxLon = Math.max(maxLon, c.longitude);
  }
  const latDelta = Math.max((maxLat - minLat) * 1.4, 0.005);
  const lonDelta = Math.max((maxLon - minLon) * 1.4, 0.005);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}
