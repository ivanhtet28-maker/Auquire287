import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // ─── Dealership / Tenant ──────────────────────────────────────────────
  dealerships: defineTable({
    name: v.string(),
    tradingName: v.optional(v.string()),
    contactName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    postcode: v.optional(v.string()),
    carsalesDealerUrl: v.optional(v.string()),
    monthlyVolume: v.optional(v.string()),
    isFoundingDealer: v.boolean(),
    foundingDealerSlot: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("trial"),
      v.literal("churned"),
      v.literal("prospect"),
    ),
    settings: v.optional(v.any()),
  }).index("by_status", ["status"]),

  // ─── Buy Boxes (acquisition criteria) ─────────────────────────────────
  buyBoxes: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
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
    isActive: v.boolean(),
  }).index("by_dealership", ["dealershipId"]),

  // ─── Listings (found by Hunter) ───────────────────────────────────────
  listings: defineTable({
    buyBoxId: v.optional(v.id("buyBoxes")),
    dealershipId: v.optional(v.id("dealerships")),
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
    isDealerPost: v.boolean(),
    dealerPostReason: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("contacted"),
      v.literal("negotiating"),
      v.literal("purchased"),
      v.literal("passed"),
      v.literal("archived"),
    ),
    // Deal scoring fields
    dealScore: v.optional(v.number()),
    marketMedian: v.optional(v.number()),
    marketP25: v.optional(v.number()),
    marketP75: v.optional(v.number()),
    recommendedOffer: v.optional(v.number()),
    scoringReasoning: v.optional(v.string()),
    scoringSignals: v.optional(v.array(v.string())),
    compsCount: v.optional(v.number()),
    // Photo analysis fields
    photoCondition: v.optional(v.string()),
    photoDamageItems: v.optional(v.array(v.any())),
    photoReconEstimate: v.optional(v.number()),
    photoConcerns: v.optional(v.array(v.string())),
    photoPositives: v.optional(v.array(v.string())),
    photoQuality: v.optional(v.string()),
    // Timestamps
    foundAt: v.number(),
    scoredAt: v.optional(v.number()),
    photoAnalysedAt: v.optional(v.number()),
  })
    .index("by_source_id", ["source", "sourceId"])
    .index("by_status", ["status"])
    .index("by_make_model", ["make", "model"])
    .index("by_dealership", ["dealershipId"])
    .index("by_buyBox", ["buyBoxId"])
    .index("by_dealScore", ["dealScore"])
    .index("by_foundAt", ["foundAt"]),

  // ─── Agent Runs (execution log for every agent) ───────────────────────
  agentRuns: defineTable({
    agentName: v.union(
      v.literal("hunter"),
      v.literal("lister"),
      v.literal("responder"),
      v.literal("scout"),
      v.literal("briefer"),
      v.literal("closer"),
      v.literal("orchestrator"),
    ),
    dealershipId: v.optional(v.id("dealerships")),
    trigger: v.union(
      v.literal("manual"),
      v.literal("schedule"),
      v.literal("event"),
      v.literal("api"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    costUsd: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    // For streaming progress
    progressMessages: v.optional(v.array(v.string())),
    progressPercent: v.optional(v.number()),
  })
    .index("by_agent", ["agentName"])
    .index("by_status", ["status"])
    .index("by_agent_status", ["agentName", "status"])
    .index("by_startedAt", ["startedAt"]),

  // ─── Briefs (generated by Briefer) ────────────────────────────────────
  briefs: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
    agentRunId: v.optional(v.id("agentRuns")),
    date: v.string(), // YYYY-MM-DD
    title: v.string(),
    content: v.string(), // Markdown
    sections: v.optional(v.any()), // Structured sections
    sentAt: v.optional(v.number()),
    sentTo: v.optional(v.array(v.string())),
  })
    .index("by_date", ["date"])
    .index("by_dealership", ["dealershipId"]),

  // ─── Inventory Audits (generated by Lister) ───────────────────────────
  inventoryAudits: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
    agentRunId: v.optional(v.id("agentRuns")),
    carsalesUrl: v.optional(v.string()),
    totalListings: v.number(),
    recommendations: v.array(
      v.object({
        stockNumber: v.optional(v.string()),
        title: v.string(),
        currentPrice: v.number(),
        daysOnMarket: v.optional(v.number()),
        marketMedian: v.optional(v.number()),
        action: v.union(
          v.literal("HOLD"),
          v.literal("REPRICE_DOWN"),
          v.literal("REPRICE_UP"),
          v.literal("REFRESH_PHOTOS"),
          v.literal("UPDATE_DESCRIPTION"),
        ),
        suggestedPrice: v.optional(v.number()),
        reasoning: v.string(),
      }),
    ),
  })
    .index("by_dealership", ["dealershipId"]),

  // ─── Enquiries & Responses (Responder) ────────────────────────────────
  enquiries: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
    listingId: v.optional(v.id("listings")),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("web")),
    senderName: v.optional(v.string()),
    senderEmail: v.optional(v.string()),
    senderPhone: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.string(),
    receivedAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("drafted"),
      v.literal("sent"),
      v.literal("replied"),
    ),
    // AI-generated response
    draftPrimary: v.optional(v.string()),
    draftAlt1: v.optional(v.string()),
    draftAlt2: v.optional(v.string()),
    draftSubject: v.optional(v.string()),
    followUpDraft: v.optional(v.string()),
    testDriveTimes: v.optional(v.array(v.string())),
    testDriveSlots: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_dealership", ["dealershipId"])
    .index("by_receivedAt", ["receivedAt"]),

  // ─── Market Snapshots (Scout) ─────────────────────────────────────────
  marketSnapshots: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
    agentRunId: v.optional(v.id("agentRuns")),
    make: v.string(),
    model: v.string(),
    state: v.optional(v.string()),
    yearRange: v.optional(v.string()),
    activeListings: v.number(),
    priceMedian: v.number(),
    priceP25: v.number(),
    priceP75: v.number(),
    priceMin: v.number(),
    priceMax: v.number(),
    avgDaysOnMarket: v.optional(v.number()),
    trendAnalysis: v.optional(v.string()),
    recommendedBuyBand: v.optional(v.string()),
    insights: v.optional(v.array(v.string())),
    chartData: v.optional(v.any()),
  })
    .index("by_make_model", ["make", "model"]),

  // ─── Conversations / SMS threads (Closer) ─────────────────────────────
  conversations: defineTable({
    listingId: v.optional(v.id("listings")),
    dealershipId: v.optional(v.id("dealerships")),
    sellerName: v.optional(v.string()),
    sellerPhone: v.optional(v.string()),
    channel: v.union(v.literal("sms"), v.literal("email")),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("waiting"),
      v.literal("closed"),
    ),
    sentiment: v.optional(
      v.union(
        v.literal("motivated"),
        v.literal("neutral"),
        v.literal("hesitant"),
        v.literal("unresponsive"),
      ),
    ),
    negotiationPosition: v.optional(v.string()),
    recommendedNextMessage: v.optional(v.string()),
    recommendedOffer: v.optional(v.number()),
    confidence: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_listing", ["listingId"])
    .index("by_status", ["status"])
    .index("by_dealership", ["dealershipId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    channel: v.union(v.literal("sms"), v.literal("email")),
    body: v.string(),
    sentAt: v.number(),
    externalId: v.optional(v.string()), // Twilio SID etc
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sentAt", ["sentAt"]),

  // ─── Demo Leads ───────────────────────────────────────────────────────
  demoLeads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    dealershipName: v.string(),
    rooftopCount: v.optional(v.number()),
    monthlyVolume: v.optional(v.string()),
    painPoints: v.optional(v.string()),
    source: v.union(v.literal("demo"), v.literal("founding_dealer")),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("demo_booked"),
      v.literal("closed"),
    ),
    notifiedAt: v.optional(v.number()),
  })
    .index("by_source", ["source"])
    .index("by_status", ["status"]),

  // ─── AI Chat (orchestrator) ───────────────────────────────────────────
  chatSessions: defineTable({
    dealershipId: v.optional(v.id("dealerships")),
    userId: v.optional(v.id("users")),
    title: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  chatMessages: defineTable({
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    agentCalls: v.optional(v.array(v.any())),
    tokenCount: v.optional(v.number()),
  }).index("by_session", ["sessionId"]),

  // ─── AI Calls Log ──────────────────────────────────────────────────────
  aiCalls: defineTable({
    agentRunId: v.optional(v.id("agentRuns")),
    agentName: v.string(),
    model: v.string(),
    purpose: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    durationMs: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_agentRun", ["agentRunId"])
    .index("by_agentName", ["agentName"]),

  // ─── Dealership Settings (singleton per dealership) ───────────────────
  dealershipSettings: defineTable({
    dealershipName: v.optional(v.string()),
    tradingName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    abn: v.optional(v.string()),
    suburb: v.optional(v.string()),
    state: v.optional(v.string()),
    postcode: v.optional(v.string()),
    carsalesDealerUrl: v.optional(v.string()),
    // Integration keys (encrypted in production)
    twilioAccountSid: v.optional(v.string()),
    twilioAuthToken: v.optional(v.string()),
    twilioPhoneNumber: v.optional(v.string()),
    resendApiKey: v.optional(v.string()),
    resendFromEmail: v.optional(v.string()),
    // Agent schedule toggles
    hunterScheduleEnabled: v.optional(v.boolean()),
    brieferScheduleEnabled: v.optional(v.boolean()),
    listerScheduleEnabled: v.optional(v.boolean()),
    closerFollowUpEnabled: v.optional(v.boolean()),
  }),

  // ─── Platform Settings ────────────────────────────────────────────────
  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  // ─── Activity Feed ────────────────────────────────────────────────────
  activityFeed: defineTable({
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
  }).index("by_type", ["type"]),
});

export default schema;
