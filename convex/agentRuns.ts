import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    agentName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.agentName) {
      return await ctx.db
        .query("agentRuns")
        .withIndex("by_agent", (q) => q.eq("agentName", args.agentName as "hunter"))
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db.query("agentRuns").order("desc").take(args.limit ?? 20);
  },
});

export const getLatestByAgent = query({
  args: { agentName: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName as "hunter"))
      .order("desc")
      .first();
  },
});

export const getRunning = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
  },
});

export const create = mutation({
  args: {
    agentName: v.union(
      v.literal("hunter"),
      v.literal("lister"),
      v.literal("responder"),
      v.literal("scout"),
      v.literal("briefer"),
      v.literal("closer"),
      v.literal("orchestrator"),
    ),
    trigger: v.union(
      v.literal("manual"),
      v.literal("schedule"),
      v.literal("event"),
      v.literal("api"),
    ),
    metadata: v.optional(v.any()),
  },
  returns: v.id("agentRuns"),
  handler: async (ctx, args) => {
    const runId = await ctx.db.insert("agentRuns", {
      agentName: args.agentName,
      trigger: args.trigger,
      status: "running",
      startedAt: Date.now(),
      progressMessages: [],
      metadata: args.metadata,
    });
    // Add to activity feed
    await ctx.db.insert("activityFeed", {
      agentName: args.agentName,
      type: "agent_started",
      title: `${args.agentName.charAt(0).toUpperCase() + args.agentName.slice(1)} started`,
      description: `Triggered ${args.trigger}ly`,
    });
    return runId;
  },
});

export const complete = mutation({
  args: {
    id: v.id("agentRuns"),
    resultSummary: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    costUsd: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: now,
      durationMs: now - run.startedAt,
      resultSummary: args.resultSummary,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      costUsd: args.costUsd,
    });
    await ctx.db.insert("activityFeed", {
      agentName: run.agentName,
      type: "agent_completed",
      title: `${run.agentName.charAt(0).toUpperCase() + run.agentName.slice(1)} completed`,
      description: args.resultSummary,
    });
    return null;
  },
});

export const fail = mutation({
  args: {
    id: v.id("agentRuns"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "failed",
      completedAt: now,
      durationMs: now - run.startedAt,
      errorMessage: args.errorMessage,
    });
    await ctx.db.insert("activityFeed", {
      agentName: run.agentName,
      type: "agent_failed",
      title: `${run.agentName.charAt(0).toUpperCase() + run.agentName.slice(1)} failed`,
      description: args.errorMessage,
    });
    return null;
  },
});

export const addProgress = mutation({
  args: {
    id: v.id("agentRuns"),
    message: v.string(),
    percent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;
    const msgs = run.progressMessages ?? [];
    msgs.push(args.message);
    await ctx.db.patch(args.id, {
      progressMessages: msgs,
      progressPercent: args.percent,
    });
    return null;
  },
});

export const getTodayStats = query({
  args: {},
  returns: v.object({
    totalRuns: v.number(),
    completedRuns: v.number(),
    failedRuns: v.number(),
    totalCostUsd: v.number(),
    totalTokens: v.number(),
  }),
  handler: async (ctx) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_startedAt")
      .order("desc")
      .collect();
    const todayRuns = runs.filter((r) => r.startedAt >= todayStart.getTime());
    return {
      totalRuns: todayRuns.length,
      completedRuns: todayRuns.filter((r) => r.status === "completed").length,
      failedRuns: todayRuns.filter((r) => r.status === "failed").length,
      totalCostUsd:
        Math.round(
          todayRuns.reduce((sum, r) => sum + (r.costUsd ?? 0), 0) * 1000
        ) / 1000,
      totalTokens: todayRuns.reduce(
        (sum, r) => sum + (r.inputTokens ?? 0) + (r.outputTokens ?? 0),
        0
      ),
    };
  },
});
