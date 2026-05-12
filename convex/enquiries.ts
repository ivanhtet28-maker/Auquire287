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
        .query("enquiries")
        .withIndex("by_status", (q) => q.eq("status", args.status as "pending"))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("enquiries")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPending = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("enquiries")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const create = mutation({
  args: {
    listingId: v.optional(v.id("listings")),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("web")),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    senderPhone: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.string(),
  },
  returns: v.id("enquiries"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("enquiries", {
      ...args,
      status: "pending",
      receivedAt: Date.now(),
    });
    await ctx.db.insert("activityFeed", {
      type: "message_received",
      title: `New ${args.channel} enquiry from ${args.senderName || "Unknown"}`,
      description: args.body.slice(0, 100),
    });
    return id;
  },
});

export const updateDraft = mutation({
  args: {
    id: v.id("enquiries"),
    draftPrimary: v.string(),
    draftAlt1: v.optional(v.string()),
    draftAlt2: v.optional(v.string()),
    draftSubject: v.optional(v.string()),
    followUpDraft: v.optional(v.string()),
    testDriveTimes: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      status: "drafted",
    });
    return null;
  },
});

export const markSent = mutation({
  args: { id: v.id("enquiries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "sent" });
    return null;
  },
});
