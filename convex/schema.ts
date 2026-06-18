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
});
