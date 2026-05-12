import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("buyBoxes").collect();
  },
});

export const getActive = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const all = await ctx.db.query("buyBoxes").collect();
    return all.filter((b) => b.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    makes: v.array(v.string()),
    models: v.array(v.string()),
    yearMin: v.number(),
    yearMax: v.number(),
    priceMin: v.number(),
    priceMax: v.number(),
    kmMax: v.number(),
    states: v.array(v.string()),
    bodyTypes: v.array(v.string()),
    transmissions: v.array(v.string()),
    fuelTypes: v.array(v.string()),
    excludeKeywords: v.array(v.string()),
  },
  returns: v.id("buyBoxes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("buyBoxes", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("buyBoxes"),
    name: v.optional(v.string()),
    makes: v.optional(v.array(v.string())),
    models: v.optional(v.array(v.string())),
    yearMin: v.optional(v.number()),
    yearMax: v.optional(v.number()),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    kmMax: v.optional(v.number()),
    states: v.optional(v.array(v.string())),
    bodyTypes: v.optional(v.array(v.string())),
    transmissions: v.optional(v.array(v.string())),
    fuelTypes: v.optional(v.array(v.string())),
    excludeKeywords: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("buyBoxes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});
