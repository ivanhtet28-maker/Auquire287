import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventoryAudits")
      .order("desc")
      .take(args.limit ?? 10);
  },
});

export const getLatest = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("inventoryAudits")
      .order("desc")
      .first();
  },
});

export const create = mutation({
  args: {
    totalListings: v.number(),
    recommendations: v.array(v.any()),
    carsalesUrl: v.optional(v.string()),
    agentRunId: v.optional(v.id("agentRuns")),
  },
  returns: v.id("inventoryAudits"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("inventoryAudits", {
      totalListings: args.totalListings,
      recommendations: args.recommendations,
      carsalesUrl: args.carsalesUrl,
      agentRunId: args.agentRunId,
    });
    await ctx.db.insert("activityFeed", {
      agentName: "lister",
      type: "audit_completed",
      title: "Inventory audit completed",
      description: `Audited ${args.totalListings} listings with ${args.recommendations.length} recommendations`,
    });
    return id;
  },
});
