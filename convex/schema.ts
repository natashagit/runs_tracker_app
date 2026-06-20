import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

// `authTables` provides the `users`, `authAccounts`, `authSessions`, etc.
// tables that Convex Auth manages. We add our own `runs` table on top.
export default defineSchema({
  ...authTables,

  // One row per saved run, owned by the user who tracked it.
  runs: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO timestamp — kept for display + sort parity
    durationSec: v.number(),
    distanceM: v.number(), // total: walk + run
    runDistanceM: v.number(), // run portion only
    coords: v.array(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
        // 'walk' | 'run'. Optional so legacy/untagged points still validate.
        mode: v.optional(v.string()),
      })
    ),
  }).index("by_user", ["userId"]),

  // One row per DAY the user logged a workout. Multiple categories done on the
  // same day are merged into this single row (title becomes "Back + Arms").
  workouts: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO timestamp of the first log that day (display + sort)
    // Local day key ("YYYY-M-D"). Optional only so any pre-existing rows still
    // validate; every new row sets it. Enforces one workout row per day.
    day: v.optional(v.string()),
    title: v.string(), // categories joined with " + ", e.g. "Back + Arms"
  })
    .index("by_user", ["userId"])
    .index("by_user_and_day", ["userId", "day"]),

  // One row per completed exercise, logged when swiped done in a workout.
  exerciseLogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO timestamp of when it was completed
    workout: v.string(), // category, e.g. "Arms", "Legs"
    exercise: v.string(), // e.g. "Bicep Curl"
    sets: v.number(),
    reps: v.number(),
  }).index("by_user", ["userId"]),
});
