import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let q = ctx.db.query("listings").order("desc");
    if (args.status) {
      q = ctx.db.query("listings").withIndex("by_status", (q2) => q2.eq("status", args.status as "new")).order("desc");
    }
    const results = await q.take(args.limit ?? 50);
    return results;
  },
});

export const getById = query({
  args: { id: v.id("listings") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    newCount: v.number(),
    contactedCount: v.number(),
    negotiatingCount: v.number(),
    purchasedCount: v.number(),
    avgDealScore: v.number(),
  }),
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").collect();
    const newOnes = all.filter((l) => l.status === "new");
    const contacted = all.filter((l) => l.status === "contacted");
    const negotiating = all.filter((l) => l.status === "negotiating");
    const purchased = all.filter((l) => l.status === "purchased");
    const scored = all.filter((l) => l.dealScore !== undefined);
    const avgScore = scored.length > 0
      ? scored.reduce((sum, l) => sum + (l.dealScore ?? 0), 0) / scored.length
      : 0;
    return {
      total: all.length,
      newCount: newOnes.length,
      contactedCount: contacted.length,
      negotiatingCount: negotiating.length,
      purchasedCount: purchased.length,
      avgDealScore: Math.round(avgScore * 10) / 10,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("listings"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("contacted"),
      v.literal("negotiating"),
      v.literal("purchased"),
      v.literal("passed"),
      v.literal("archived"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

export const updateScoring = mutation({
  args: {
    id: v.id("listings"),
    marketMedian: v.optional(v.number()),
    marketP25: v.optional(v.number()),
    marketP75: v.optional(v.number()),
    compsCount: v.optional(v.number()),
    scoringReasoning: v.optional(v.string()),
    dealScore: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.scoredAt = Date.now();
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const create = mutation({
  args: {
    source: v.union(
      v.literal("carsales"),
      v.literal("gumtree"),
      v.literal("facebook"),
      v.literal("manual"),
    ),
    sourceUrl: v.string(),
    sourceId: v.string(),
    title: v.string(),
    year: v.number(),
    make: v.string(),
    model: v.string(),
    variant: v.optional(v.string()),
    price: v.number(),
    km: v.optional(v.number()),
    transmission: v.optional(v.string()),
    fuel: v.optional(v.string()),
    bodyType: v.optional(v.string()),
    colour: v.optional(v.string()),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    postcode: v.optional(v.string()),
    daysListed: v.optional(v.number()),
    photos: v.array(v.string()),
    description: v.optional(v.string()),
    sellerName: v.optional(v.string()),
    sellerPhone: v.optional(v.string()),
    rego: v.optional(v.string()),
  },
  returns: v.id("listings"),
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("listings")
      .withIndex("by_source_id", (q) => q.eq("source", args.source).eq("sourceId", args.sourceId))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("listings", {
      ...args,
      isDealerPost: false,
      status: "new",
      foundAt: Date.now(),
    });
  },
});
