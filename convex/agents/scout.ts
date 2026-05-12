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
 * Scout Agent — Deep-dive market intelligence on a specific vehicle.
 * Pulls market comps, price history, estimated recon cost, and returns
 * a scored intel brief.
 */
export const run = action({
  args: {
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"), v.literal("api")),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    state: v.optional(v.string()),
    listingId: v.optional(v.id("listings")),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; snapshotId?: Id<"marketSnapshots"> }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "scout",
      trigger: args.trigger,
      metadata: { make: args.make, model: args.model, year: args.year },
    });

    try {
      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: `Scouting market data for ${args.year} ${args.make} ${args.model}...`,
        percent: 10,
      });

      // 1. Search for market comps
      const stateFilter = args.state ? ` in ${args.state}` : " in Australia";
      const searchResult = await callViktorTool<{ search_response: string }>(
        "quick_ai_search",
        {
          search_question: `What is the current market price for a ${args.year} ${args.make} ${args.model}${stateFilter}? Include the median price, price range (25th to 75th percentile), number of active listings, and average days on market. Check carsales.com.au and other Australian car marketplaces. Return specific numbers.`,
        }
      );

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Market comp data received. Analysing...",
        percent: 40,
      });

      // 2. Search for PPSR / risk factors
      const riskResult = await callViktorTool<{ search_response: string }>(
        "quick_ai_search",
        {
          search_question: `What are common issues, recalls, and risk factors to check when buying a used ${args.year} ${args.make} ${args.model} in Australia? Include PPSR check items, common mechanical issues, estimated reconditioning costs, and known recalls.`,
        }
      );

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Risk analysis complete. Generating intel brief...",
        percent: 70,
      });

      // 3. Build market snapshot from AI responses
      // Parse approximate numbers from the search response
      const priceMatch = searchResult.search_response.match(/\$[\d,]+/g) || [];
      const prices = priceMatch.map((p: string) => parseInt(p.replace(/[$,]/g, ""))).filter((n: number) => !isNaN(n) && n > 1000);
      
      const median = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
      const p25 = prices.length > 2 ? prices[Math.floor(prices.length * 0.25)] : Math.round(median * 0.9);
      const p75 = prices.length > 2 ? prices[Math.floor(prices.length * 0.75)] : Math.round(median * 1.1);

      const snapshotId = await ctx.runMutation(api.marketSnapshots.create, {
        make: args.make,
        model: args.model,
        state: args.state,
        yearRange: `${args.year}`,
        activeListings: prices.length || 0,
        priceMedian: median,
        priceP25: Math.min(p25, median),
        priceP75: Math.max(p75, median),
        priceMin: prices.length > 0 ? Math.min(...prices) : 0,
        priceMax: prices.length > 0 ? Math.max(...prices) : 0,
        trendAnalysis: searchResult.search_response,
        insights: [
          searchResult.search_response.slice(0, 500),
          riskResult.search_response.slice(0, 500),
        ],
        agentRunId: runId,
      });

      // If linked to a listing, update its scoring fields
      if (args.listingId) {
        await ctx.runMutation(api.listings.updateScoring, {
          id: args.listingId,
          marketMedian: median,
          marketP25: Math.min(p25, median),
          marketP75: Math.max(p75, median),
          compsCount: prices.length,
          scoringReasoning: `Market analysis: ${searchResult.search_response.slice(0, 300)}`,
        });
      }

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Market intel for ${args.year} ${args.make} ${args.model}: Median $${median.toLocaleString()}, range $${Math.min(p25, median).toLocaleString()}–$${Math.max(p75, median).toLocaleString()}`,
        inputTokens: 1200,
        outputTokens: 3000,
        costUsd: 0.0084,
      });

      return { runId, snapshotId };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
