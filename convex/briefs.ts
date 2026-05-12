import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("briefs")
      .withIndex("by_date")
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const getToday = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Get AEST date
    const now = new Date();
    const aestOffset = 10 * 60 * 60 * 1000;
    const aestDate = new Date(now.getTime() + aestOffset);
    const dateStr = aestDate.toISOString().split("T")[0];
    return await ctx.db
      .query("briefs")
      .withIndex("by_date", (q) => q.eq("date", dateStr))
      .first();
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    title: v.string(),
    content: v.string(),
    sections: v.optional(v.any()),
    agentRunId: v.optional(v.id("agentRuns")),
  },
  returns: v.id("briefs"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("briefs", {
      ...args,
    });
    await ctx.db.insert("activityFeed", {
      agentName: "briefer",
      type: "brief_generated",
      title: "Morning brief generated",
      description: args.title,
    });
    return id;
  },
});
