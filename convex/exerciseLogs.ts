import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// All exercise logs for the signed-in user, newest first. [] when signed out.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("exerciseLogs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Log a completed exercise for the signed-in user.
export const add = mutation({
  args: {
    date: v.string(),
    workout: v.string(),
    exercise: v.string(),
    sets: v.number(),
    reps: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.db.insert("exerciseLogs", { userId, ...args });
  },
});
