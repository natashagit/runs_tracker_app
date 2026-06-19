import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// One-off seeding helper. Run with:
//   npx convex run seed:brooklyn '{"email":"natasha.sebastian@gmail.com"}'
// Generates a handful of realistic Brooklyn runs (Prospect Park, Brooklyn
// Bridge Park, etc.) for the given user. Internal so it can't be hit from
// the client.

type Pt = { latitude: number; longitude: number; mode: "walk" | "run" };

// Build a coordinate path from a list of waypoints, interpolating `steps`
// points between each pair. The first/last stretch is a "walk" warm-up /
// cool-down; the middle is the "run".
function buildPath(
  waypoints: Array<[number, number]>,
  steps: number
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      pts.push({
        latitude: lat1 + (lat2 - lat1) * t,
        longitude: lng1 + (lng2 - lng1) * t,
        mode: "run",
      });
    }
  }
  pts.push({
    latitude: waypoints[waypoints.length - 1][0],
    longitude: waypoints[waypoints.length - 1][1],
    mode: "run",
  });
  // Tag the first and last ~10% as walking warm-up / cool-down.
  const warm = Math.max(1, Math.floor(pts.length * 0.1));
  for (let i = 0; i < warm; i++) pts[i].mode = "walk";
  for (let i = pts.length - warm; i < pts.length; i++) pts[i].mode = "walk";
  return pts;
}

// Haversine distance in meters between two lat/lng points.
function distM(a: Pt, b: Pt): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Brooklyn routes, each a set of real-ish waypoints.
const ROUTES: Array<{
  name: string;
  waypoints: Array<[number, number]>;
  steps: number;
  // Approx pace in seconds per meter (~6 min/km run = 0.36 s/m).
  paceSecPerM: number;
}> = [
  {
    // Prospect Park loop (start near Grand Army Plaza, around the park drive).
    name: "Prospect Park loop",
    waypoints: [
      [40.6727, -73.9701],
      [40.6663, -73.9690],
      [40.6601, -73.9712],
      [40.6553, -73.9650],
      [40.6580, -73.9580],
      [40.6650, -73.9605],
      [40.6710, -73.9665],
      [40.6727, -73.9701],
    ],
    steps: 8,
    paceSecPerM: 0.36,
  },
  {
    // Brooklyn Bridge Park / DUMBO waterfront.
    name: "Brooklyn Bridge Park waterfront",
    waypoints: [
      [40.7026, -73.9966],
      [40.6995, -73.9979],
      [40.6963, -73.9998],
      [40.6930, -74.0012],
      [40.6961, -74.0001],
      [40.6998, -73.9982],
      [40.7026, -73.9966],
    ],
    steps: 7,
    paceSecPerM: 0.34,
  },
  {
    // Williamsburg waterfront up Kent Ave.
    name: "Williamsburg waterfront",
    waypoints: [
      [40.7220, -73.9636],
      [40.7185, -73.9655],
      [40.7150, -73.9672],
      [40.7118, -73.9685],
      [40.7150, -73.9672],
      [40.7185, -73.9655],
      [40.7220, -73.9636],
    ],
    steps: 7,
    paceSecPerM: 0.37,
  },
  {
    // Around Fort Greene Park.
    name: "Fort Greene Park",
    waypoints: [
      [40.6915, -73.9760],
      [40.6928, -73.9742],
      [40.6905, -73.9725],
      [40.6890, -73.9745],
      [40.6915, -73.9760],
    ],
    steps: 9,
    paceSecPerM: 0.35,
  },
  {
    // Coney Island boardwalk stretch.
    name: "Coney Island boardwalk",
    waypoints: [
      [40.5725, -73.9790],
      [40.5722, -73.9720],
      [40.5719, -73.9650],
      [40.5716, -73.9580],
      [40.5719, -73.9650],
      [40.5722, -73.9720],
      [40.5725, -73.9790],
    ],
    steps: 8,
    paceSecPerM: 0.33,
  },
];

export const brooklyn = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (!user) throw new Error(`No user with email ${email}`);

    // Space the runs out: most recent was 2 days ago, then every ~3 days back.
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const dayOffsets = [2, 5, 9, 13, 18];

    const inserted: string[] = [];
    for (let i = 0; i < ROUTES.length; i++) {
      const route = ROUTES[i];
      const coords = buildPath(route.waypoints, route.steps);

      let distanceM = 0;
      let runDistanceM = 0;
      for (let j = 1; j < coords.length; j++) {
        const d = distM(coords[j - 1], coords[j]);
        distanceM += d;
        if (coords[j].mode === "run") runDistanceM += d;
      }

      const durationSec = Math.round(distanceM * route.paceSecPerM);
      const date = new Date(now - dayOffsets[i] * DAY).toISOString();

      const id = await ctx.db.insert("runs", {
        userId: user._id,
        date,
        durationSec,
        distanceM: Math.round(distanceM),
        runDistanceM: Math.round(runDistanceM),
        coords,
      });
      inserted.push(`${route.name}: ${Math.round(distanceM)}m (${id})`);
    }

    return { user: user._id, count: inserted.length, runs: inserted };
  },
});
