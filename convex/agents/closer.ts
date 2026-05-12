import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

declare const process: { env: Record<string, string | undefined> };

const VIKTOR_API_URL = process.env.VIKTOR_SPACES_API_URL!;
const PROJECT_NAME = process.env.VIKTOR_SPACES_PROJECT_NAME!;
const PROJECT_SECRET = process.env.VIKTOR_SPACES_PROJECT_SECRET!;

async function callViktorTool<T>(role: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${VIKTOR_API_URL}/api/viktor-spaces/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: PROJECT_NAME,
      project_secret: PROJECT_SECRET,
      role,
      arguments: args,
    }),
  });
  if (!response.ok) {
    throw new Error(`Viktor tool call failed: HTTP ${response.status}`);
  }
  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error ?? "Viktor tool call failed");
  }
  return json.result as T;
}

/**
 * Closer Agent — Drafts first-contact SMS/email to private sellers.
 * Personalised, non-pushy messages that convert private sellers into appointments.
 */
export const run = action({
  args: {
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"), v.literal("api")),
    listingId: v.id("listings"),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; conversationId?: Id<"conversations"> }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "closer",
      trigger: args.trigger,
      metadata: { listingId: args.listingId },
    });

    try {
      // Get listing details
      const listing = await ctx.runQuery(api.listings.getById, { id: args.listingId });
      if (!listing) {
        await ctx.runMutation(api.agentRuns.fail, {
          id: runId,
          errorMessage: "Listing not found",
        });
        throw new Error("Listing not found");
      }

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: `Drafting outreach for ${listing.title} ($${listing.price.toLocaleString()})...`,
        percent: 10,
      });

      // Build context about the listing and seller
      const sellerContext = listing.sellerName ? `The seller's name is ${listing.sellerName}.` : "The seller's name is unknown.";
      const locationContext = listing.suburb ? `located in ${listing.suburb}, ${listing.state}` : listing.state ? `in ${listing.state}` : "";
      const priceContext = listing.marketMedian
        ? `The market median is $${listing.marketMedian.toLocaleString()}, and this is listed at $${listing.price.toLocaleString()}.`
        : `Listed at $${listing.price.toLocaleString()}.`;

      // Generate personalised outreach messages
      const draftResult = await callViktorTool<{ search_response: string }>(
        "quick_ai_search",
        {
          search_question: `I am a used car dealer in Australia. I want to contact a private seller about their ${listing.year} ${listing.make} ${listing.model}${listing.variant ? ` ${listing.variant}` : ""} ${locationContext}. ${priceContext} ${sellerContext} Write: 1) A short SMS (under 160 chars) that's friendly and non-pushy, expressing genuine interest. 2) A longer email (3-4 paragraphs) that introduces ourselves professionally, explains we're interested in purchasing, and proposes a viewing time. 3) A follow-up SMS if no reply in 24 hours. Make all messages feel personal, not like a template. Use Australian English.`,
        }
      );

      await ctx.runMutation(api.aiCalls.create, {
        agentName: "closer", model: "quick_ai_search", purpose: `Draft outreach for ${listing.title}`,
        inputTokens: 500, outputTokens: 700, costUsd: (500 * 3 + 700 * 15) / 1_000_000, durationMs: 0,
      });

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Messages drafted. Creating conversation...",
        percent: 70,
      });

      // Parse the response into SMS and email
      const fullResponse = draftResult.search_response;

      // Create conversation
      const conversationId = await ctx.runMutation(api.conversations.create, {
        listingId: args.listingId,
        sellerName: listing.sellerName,
        sellerPhone: listing.sellerPhone,
        channel: "sms",
        status: "draft",
        recommendedNextMessage: fullResponse.slice(0, 500),
      });

      // Create draft messages in the conversation
      await ctx.runMutation(api.conversationMessages.create, {
        conversationId,
        direction: "outbound",
        channel: "sms",
        body: extractSection(fullResponse, "sms") || `Hi${listing.sellerName ? ` ${listing.sellerName}` : ""}, I saw your ${listing.year} ${listing.make} ${listing.model} on ${listing.source}. I'm a local dealer and genuinely interested. Would you be open to a chat?`,
        status: "draft",
      });

      await ctx.runMutation(api.conversationMessages.create, {
        conversationId,
        direction: "outbound",
        channel: "email",
        body: extractSection(fullResponse, "email") || fullResponse.slice(0, 800),
        status: "draft",
      });

      // Update listing status to contacted
      await ctx.runMutation(api.listings.updateStatus, {
        id: args.listingId,
        status: "contacted",
      });

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Drafted SMS + email outreach for ${listing.title}. Conversation created.`,
        inputTokens: 800,
        outputTokens: 1500,
        costUsd: 0.004,
      });

      return { runId, conversationId };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});

/** Helper to extract a section (SMS, email) from the AI response */
function extractSection(text: string, type: "sms" | "email"): string {
  const patterns = type === "sms"
    ? [/(?:sms|text|message)[:\s]*\n?([\s\S]{20,200}?)(?=\n\n|email|follow|$)/i]
    : [/(?:email)[:\s]*\n?([\s\S]{100,1000}?)(?=\n\n(?:follow|sms|text)|$)/i];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
}
