import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    // Singleton — get the first (and only) settings doc
    return await ctx.db.query("dealershipSettings").first();
  },
});

export const save = mutation({
  args: {
    dealershipName: v.optional(v.string()),
    tradingName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    abn: v.optional(v.string()),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    postcode: v.optional(v.string()),
    carsalesDealerUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("dealershipSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("dealershipSettings", args);
    }
    return null;
  },
});

export const saveIntegrations = mutation({
  args: {
    twilioAccountSid: v.optional(v.string()),
    twilioAuthToken: v.optional(v.string()),
    twilioPhoneNumber: v.optional(v.string()),
    resendApiKey: v.optional(v.string()),
    resendFromEmail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("dealershipSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("dealershipSettings", args);
    }
    return null;
  },
});

export const saveOAuth = mutation({
  args: {
    gmailAccessToken: v.optional(v.string()),
    gmailRefreshToken: v.optional(v.string()),
    gmailEmail: v.optional(v.string()),
    gmailConnectedAt: v.optional(v.number()),
    fbAccessToken: v.optional(v.string()),
    fbPageId: v.optional(v.string()),
    fbPageName: v.optional(v.string()),
    fbConnectedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("dealershipSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("dealershipSettings", args);
    }
    return null;
  },
});

export const completeOnboarding = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("dealershipSettings").first();
    const data = { onboardingCompleted: true, onboardingCompletedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("dealershipSettings", data);
    }
    return null;
  },
});

export const saveSchedules = mutation({
  args: {
    hunterScheduleEnabled: v.optional(v.boolean()),
    brieferScheduleEnabled: v.optional(v.boolean()),
    listerScheduleEnabled: v.optional(v.boolean()),
    closerFollowUpEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("dealershipSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("dealershipSettings", args);
    }
    return null;
  },
});
