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
 * Lister Agent — Audits your Carsales listings against live market comps.
 * Identifies mispriced stock, stale listings, and pricing recommendations.
 */
export const run = action({
  args: {
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"), v.literal("api")),
    carsalesUrl: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; auditId?: Id<"inventoryAudits"> }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "lister",
      trigger: args.trigger,
    });

    try {
      // Get current listings that are in "purchased" or all listings to audit
      const listings = await ctx.runQuery(api.listings.list, { limit: 100 });

      if (listings.length === 0 && !args.carsalesUrl) {
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: "No listings to audit. Add inventory or provide your Carsales dealer URL.",
        });
        await ctx.runMutation(api.agentRuns.complete, {
          id: runId,
          resultSummary: "No inventory to audit",
        });
        return { runId };
      }

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: `Auditing ${listings.length} listing(s) against live market data...`,
        percent: 10,
      });

      const recommendations: Array<{
        title: string;
        currentPrice: number;
        action: "HOLD" | "REPRICE_DOWN" | "REPRICE_UP" | "REFRESH_PHOTOS" | "UPDATE_DESCRIPTION";
        suggestedPrice?: number;
        reasoning: string;
        daysOnMarket?: number;
        marketMedian?: number;
      }> = [];

      // Audit each listing against market
      for (let i = 0; i < Math.min(listings.length, 10); i++) {
        const listing = listings[i];
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: `Checking ${listing.title} ($${listing.price.toLocaleString()})...`,
          percent: 10 + Math.round((i / Math.min(listings.length, 10)) * 70),
        });

        try {
          const marketResult = await callViktorTool<{ search_response: string }>(
            "quick_ai_search",
            {
              search_question: `What is the current market price for a ${listing.year} ${listing.make} ${listing.model}${listing.variant ? ` ${listing.variant}` : ""} with approximately ${listing.km ? listing.km.toLocaleString() + "km" : "unknown kms"} in ${listing.state || "Australia"} on carsales.com.au? Give median price, price range, and number of competing listings.`,
            }
          );

          await ctx.runMutation(api.aiCalls.create, {
            agentName: "lister", model: "quick_ai_search", purpose: `Market price check: ${listing.title}`,
            inputTokens: 400, outputTokens: 400, costUsd: (400 * 3 + 400 * 15) / 1_000_000, durationMs: 0,
          });

          // Parse market median from response
          const priceMatches = marketResult.search_response.match(/\$[\d,]+/g) || [];
          const parsedPrices = priceMatches.map((p: string) => parseInt(p.replace(/[$,]/g, ""))).filter((n: number) => !isNaN(n) && n > 1000);
          const marketMedian = parsedPrices.length > 0 ? parsedPrices[Math.floor(parsedPrices.length / 2)] : undefined;

          // Determine action
          let action: "HOLD" | "REPRICE_DOWN" | "REPRICE_UP" | "REFRESH_PHOTOS" | "UPDATE_DESCRIPTION" = "HOLD";
          let suggestedPrice: number | undefined;

          if (marketMedian) {
            const priceDiff = (listing.price - marketMedian) / marketMedian;
            if (priceDiff > 0.1) {
              action = "REPRICE_DOWN";
              suggestedPrice = Math.round(marketMedian * 1.02); // Slightly above median
            } else if (priceDiff < -0.1) {
              action = "REPRICE_UP";
              suggestedPrice = Math.round(marketMedian * 0.98); // Slightly below median
            } else if (listing.daysListed && listing.daysListed > 45) {
              action = "REFRESH_PHOTOS";
            }
          }

          recommendations.push({
            title: listing.title,
            currentPrice: listing.price,
            action,
            suggestedPrice,
            reasoning: marketResult.search_response.slice(0, 300),
            daysOnMarket: listing.daysListed,
            marketMedian,
          });
        } catch {
          recommendations.push({
            title: listing.title,
            currentPrice: listing.price,
            action: "HOLD",
            reasoning: "Could not retrieve market data for this listing.",
          });
        }
      }

      // Save audit
      const auditId = await ctx.runMutation(api.inventoryAudits.create, {
        totalListings: listings.length,
        recommendations,
        carsalesUrl: args.carsalesUrl,
        agentRunId: runId,
      });

      const repriceCount = recommendations.filter(r => r.action === "REPRICE_DOWN" || r.action === "REPRICE_UP").length;

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Audited ${recommendations.length} listings. ${repriceCount} need repricing. ${recommendations.filter(r => r.action === "HOLD").length} are correctly priced.`,
        inputTokens: recommendations.length * 600,
        outputTokens: recommendations.length * 1500,
        costUsd: Math.round(recommendations.length * 0.003 * 10000) / 10000,
      });

      return { runId, auditId };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
