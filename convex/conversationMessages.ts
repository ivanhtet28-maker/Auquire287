import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByConversation = query({
  args: { conversationId: v.id("conversations") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    channel: v.union(v.literal("sms"), v.literal("email")),
    body: v.string(),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    )),
    externalId: v.optional(v.string()),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      direction: args.direction,
      channel: args.channel,
      body: args.body,
      status: args.status ?? (args.direction === "inbound" ? "delivered" : "draft"),
      sentAt: Date.now(),
      externalId: args.externalId,
    });

    // Update conversation lastMessageAt
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return id;
  },
});

export const approve = mutation({
  args: { id: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "approved" });
    return null;
  },
});
