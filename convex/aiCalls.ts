import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    agentRunId: v.optional(v.id("agentRuns")),
    agentName: v.string(),
    model: v.string(),
    purpose: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    durationMs: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.id("aiCalls"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiCalls", args);
  },
});

export const list = query({
  args: {
    agentName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.agentName) {
      return await ctx.db
        .query("aiCalls")
        .withIndex("by_agentName", (q) => q.eq("agentName", args.agentName as string))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db.query("aiCalls").order("desc").take(args.limit ?? 50);
  },
});

export const getTodayStats = query({
  args: {},
  returns: v.object({
    totalCalls: v.number(),
    totalInputTokens: v.number(),
    totalOutputTokens: v.number(),
    totalCostUsd: v.number(),
    byAgent: v.any(),
  }),
  handler: async (ctx) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const all = await ctx.db.query("aiCalls").order("desc").collect();
    const today = all.filter((c) => c._creationTime >= todayStart.getTime());
    const byAgent: Record<string, { calls: number; cost: number; tokens: number }> = {};
    for (const call of today) {
      if (!byAgent[call.agentName]) {
        byAgent[call.agentName] = { calls: 0, cost: 0, tokens: 0 };
      }
      byAgent[call.agentName].calls++;
      byAgent[call.agentName].cost += call.costUsd;
      byAgent[call.agentName].tokens += call.inputTokens + call.outputTokens;
    }
    return {
      totalCalls: today.length,
      totalInputTokens: today.reduce((s, c) => s + c.inputTokens, 0),
      totalOutputTokens: today.reduce((s, c) => s + c.outputTokens, 0),
      totalCostUsd: Math.round(today.reduce((s, c) => s + c.costUsd, 0) * 10000) / 10000,
      byAgent,
    };
  },
});

export const getMonthStats = query({
  args: {},
  returns: v.object({
    totalCalls: v.number(),
    totalCostUsd: v.number(),
    totalTokens: v.number(),
  }),
  handler: async (ctx) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const all = await ctx.db.query("aiCalls").order("desc").collect();
    const thisMonth = all.filter((c) => c._creationTime >= monthStart.getTime());
    return {
      totalCalls: thisMonth.length,
      totalCostUsd: Math.round(thisMonth.reduce((s, c) => s + c.costUsd, 0) * 10000) / 10000,
      totalTokens: thisMonth.reduce((s, c) => s + c.inputTokens + c.outputTokens, 0),
    };
  },
});
