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

// Record that the signed-in user did a workout category on a given day.
// There is at most one row per day: if a workout already exists for `day`,
// the new category is appended to its title ("Back" -> "Back + Arms") rather
// than creating a second row. Re-logging the same category is a no-op.
export const logForDay = mutation({
  args: {
    date: v.string(),
    day: v.string(), // local day key from the client ("YYYY-M-D")
    title: v.string(), // the category just completed, e.g. "Arms"
  },
  handler: async (ctx, { date, day, title }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user_and_day", (q) =>
        q.eq("userId", userId).eq("day", day)
      )
      .first();

    if (existing) {
      const parts = existing.title ? existing.title.split(" + ") : [];
      if (!parts.includes(title)) {
        await ctx.db.patch(existing._id, {
          title: [...parts, title].join(" + "),
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("workouts", {
      userId,
      date,
      day,
      title,
      completed: false, // in progress until the user presses STOP
    });
  },
});

// Begin (or re-open) today's workout session. Ensures a row exists for the day
// and marks it not-yet-completed, so the STOP button and calendar reflect an
// active session immediately — before any exercise is logged.
export const startDay = mutation({
  args: { date: v.string(), day: v.string() },
  handler: async (ctx, { date, day }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user_and_day", (q) =>
        q.eq("userId", userId).eq("day", day)
      )
      .first();

    if (existing) {
      if (existing.completed !== false) {
        await ctx.db.patch(existing._id, { completed: false });
      }
      return existing._id;
    }

    return await ctx.db.insert("workouts", {
      userId,
      date,
      day,
      title: "",
      completed: false,
    });
  },
});

// End today's session: mark the day's workout completed. This is what turns
// the calendar bubble teal. No-op if there's no row for the day.
export const stopDay = mutation({
  args: { day: v.string() },
  handler: async (ctx, { day }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user_and_day", (q) =>
        q.eq("userId", userId).eq("day", day)
      )
      .first();

    if (!existing) return null;
    await ctx.db.patch(existing._id, { completed: true });
    return existing._id;
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
