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
 * Responder Agent — Drafts personalised replies to every inbound enquiry.
 * Generates three response variants + a follow-up nudge.
 */
export const run = action({
  args: {
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"), v.literal("api")),
    enquiryId: v.optional(v.id("enquiries")),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; drafted: number }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "responder",
      trigger: args.trigger,
    });

    try {
      // Get pending enquiries
      const enquiries = await ctx.runQuery(api.enquiries.getPending, {});

      if (enquiries.length === 0) {
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: "No pending enquiries to respond to.",
        });
        await ctx.runMutation(api.agentRuns.complete, {
          id: runId,
          resultSummary: "No pending enquiries",
        });
        return { runId, drafted: 0 };
      }

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: `Drafting responses for ${enquiries.length} pending enquir${enquiries.length === 1 ? "y" : "ies"}...`,
        percent: 10,
      });

      let drafted = 0;

      for (let i = 0; i < enquiries.length; i++) {
        const enquiry = enquiries[i];

        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: `Drafting reply ${i + 1}/${enquiries.length}: ${enquiry.senderName || "Unknown sender"}...`,
          percent: 10 + Math.round((i / enquiries.length) * 80),
        });

        try {
          // Get listing context if available
          let listingContext = "";
          if (enquiry.listingId) {
            const listing = await ctx.runQuery(api.listings.getById, { id: enquiry.listingId });
            if (listing) {
              listingContext = ` about a ${listing.year} ${listing.make} ${listing.model} listed at $${listing.price.toLocaleString()}`;
            }
          }

          const draftResult = await callViktorTool<{ search_response: string }>(
            "quick_ai_search",
            {
              search_question: `I am an Australian car dealership. A customer named ${enquiry.senderName || "a buyer"} sent us this enquiry${listingContext} via ${enquiry.channel}: "${enquiry.body}". Write three distinct response variants (professional, friendly, and direct). Each should: acknowledge their interest, answer their question, suggest a test drive with 2 specific time slots, and include the dealership name placeholder [DEALERSHIP]. Also write a follow-up message to send if they don't reply in 48 hours. Format with clear headers for each variant.`,
            }
          );

          await ctx.runMutation(api.aiCalls.create, {
            agentName: "responder", model: "quick_ai_search", purpose: `Draft reply to ${enquiry.senderName || "enquiry"}`,
            inputTokens: 600, outputTokens: 800, costUsd: (600 * 3 + 800 * 15) / 1_000_000, durationMs: 0,
          });

          // Parse the AI response into variants
          const fullResponse = draftResult.search_response;
          const sections = fullResponse.split(/(?=variant|option|response\s*[123]|#{1,3}\s*(?:variant|option|response))/i);

          const draftPrimary = sections[1]?.trim() || fullResponse.slice(0, fullResponse.length / 3);
          const draftAlt1 = sections[2]?.trim() || "";
          const draftAlt2 = sections[3]?.trim() || "";

          // Extract follow-up if present
          const followUpMatch = fullResponse.match(/follow[- ]?up[:\s]*([\s\S]{50,500})/i);
          const followUpDraft = followUpMatch ? followUpMatch[1].trim() : "Hi [NAME], just following up on your enquiry. Are you still interested? Happy to arrange a time that works for you.";

          await ctx.runMutation(api.enquiries.updateDraft, {
            id: enquiry._id,
            draftPrimary,
            draftAlt1,
            draftAlt2,
            draftSubject: `Re: Your enquiry${listingContext}`,
            followUpDraft,
            testDriveTimes: [],
          });

          drafted++;
        } catch (err) {
          await ctx.runMutation(api.agentRuns.addProgress, {
            id: runId,
            message: `Error drafting reply for ${enquiry.senderName || "unknown"}: ${err instanceof Error ? err.message : "Unknown"}`,
          });
        }
      }

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Drafted ${drafted} response${drafted === 1 ? "" : "s"} (3 variants each + follow-up) for ${enquiries.length} enquir${enquiries.length === 1 ? "y" : "ies"}.`,
        inputTokens: drafted * 800,
        outputTokens: drafted * 2000,
        costUsd: Math.round(drafted * 0.005 * 10000) / 10000,
      });

      return { runId, drafted };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
