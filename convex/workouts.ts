import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// All workouts for the signed-in user, newest first. Returns [] when signed out.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Log a workout for the signed-in user.
export const add = mutation({
  args: {
    date: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.db.insert("workouts", { userId, ...args });
  },
});

// Delete one of the signed-in user's workouts.
export const remove = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const workout = await ctx.db.get(id);
    if (!workout || workout.userId !== userId) throw new Error("Workout not found");
    await ctx.db.delete(id);
  },
});
