import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityFeed")
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const create = mutation({
  args: {
    agentName: v.optional(v.string()),
    type: v.union(
      v.literal("agent_started"),
      v.literal("agent_completed"),
      v.literal("agent_failed"),
      v.literal("listing_found"),
      v.literal("message_sent"),
      v.literal("message_received"),
      v.literal("brief_generated"),
      v.literal("audit_completed"),
      v.literal("lead_received"),
      v.literal("system"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("activityFeed"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityFeed", args);
  },
});
