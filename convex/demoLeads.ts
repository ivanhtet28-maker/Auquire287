import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("demoLeads").order("desc").collect();
  },
});

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    dealershipName: v.string(),
    rooftopCount: v.optional(v.number()),
    monthlyVolume: v.optional(v.string()),
    painPoints: v.optional(v.string()),
    source: v.union(v.literal("demo"), v.literal("founding_dealer")),
  },
  returns: v.id("demoLeads"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("demoLeads", {
      ...args,
      status: "new",
      notifiedAt: Date.now(),
    });
    await ctx.db.insert("activityFeed", {
      type: "lead_received",
      title: `New ${args.source === "founding_dealer" ? "founding dealer" : "demo"} request`,
      description: `${args.name} from ${args.dealershipName}`,
    });
    return id;
  },
});
