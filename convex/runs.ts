import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Shape of a coordinate point, reused by the `add` mutation args.
const coord = v.object({
  latitude: v.number(),
  longitude: v.number(),
  mode: v.optional(v.string()),
});

// All runs for the signed-in user, newest first. Returns [] when signed out.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Save a freshly tracked run for the signed-in user.
export const add = mutation({
  args: {
    date: v.string(),
    durationSec: v.number(),
    distanceM: v.number(),
    runDistanceM: v.number(),
    coords: v.array(coord),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.db.insert("runs", { userId, ...args });
  },
});

// Delete one of the signed-in user's runs.
export const remove = mutation({
  args: { id: v.id("runs") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const run = await ctx.db.get(id);
    if (!run || run.userId !== userId) throw new Error("Run not found");
    await ctx.db.delete(id);
  },
});
