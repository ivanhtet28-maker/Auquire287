import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketSnapshots")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getByMakeModel = query({
  args: { make: v.string(), model: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketSnapshots")
      .withIndex("by_make_model", (q) => q.eq("make", args.make).eq("model", args.model))
      .order("desc")
      .first();
  },
});

export const create = mutation({
  args: {
    make: v.string(),
    model: v.string(),
    state: v.optional(v.string()),
    yearRange: v.optional(v.string()),
    activeListings: v.number(),
    priceMedian: v.number(),
    priceP25: v.number(),
    priceP75: v.number(),
    priceMin: v.number(),
    priceMax: v.number(),
    avgDaysOnMarket: v.optional(v.number()),
    trendAnalysis: v.optional(v.string()),
    recommendedBuyBand: v.optional(v.string()),
    insights: v.optional(v.array(v.string())),
    chartData: v.optional(v.any()),
    agentRunId: v.optional(v.id("agentRuns")),
  },
  returns: v.id("marketSnapshots"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("marketSnapshots", args);
  },
});
