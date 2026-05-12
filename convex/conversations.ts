import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("conversations")
        .withIndex("by_status", (q) => q.eq("status", args.status as "draft"))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("conversations")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getByListing = query({
  args: { listingId: v.id("listings") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .first();
  },
});

export const create = mutation({
  args: {
    listingId: v.optional(v.id("listings")),
    sellerName: v.optional(v.string()),
    sellerPhone: v.optional(v.string()),
    channel: v.union(v.literal("sms"), v.literal("email")),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("waiting"), v.literal("closed")),
    recommendedNextMessage: v.optional(v.string()),
    recommendedOffer: v.optional(v.number()),
  },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      ...args,
      lastMessageAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("conversations"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("waiting"), v.literal("closed")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});
