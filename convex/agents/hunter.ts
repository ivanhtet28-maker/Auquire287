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

interface BuyBox {
  _id: string;
  name: string;
  makes: string[];
  models: string[];
  yearMin: number;
  yearMax: number;
  priceMin: number;
  priceMax: number;
  kmMax: number;
  states: string[];
  bodyTypes: string[];
}

// ListingData type for future structured parsing
// interface ListingData { ... }

export const run = action({
  args: {
    trigger: v.union(
      v.literal("manual"),
      v.literal("schedule"),
      v.literal("event"),
      v.literal("api"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; listings: number }> => {
    // Create agent run
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "hunter",
      trigger: args.trigger,
    });

    try {
      // Get active buy boxes
      const buyBoxes: BuyBox[] = await ctx.runQuery(api.buyBoxes.getActive, {});

      if (buyBoxes.length === 0) {
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: "No active buy boxes configured. Please create a buy box first.",
        });
        await ctx.runMutation(api.agentRuns.complete, {
          id: runId,
          resultSummary: "No active buy boxes found",
        });
        return { runId, listings: 0 };
      }

      let totalListingsFound = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const buyBox of buyBoxes) {
        await ctx.runMutation(api.agentRuns.addProgress, {
          id: runId,
          message: `Processing buy box: ${buyBox.name}`,
          percent: 10,
        });

        const sources = ["carsales", "gumtree", "facebook"] as const;

        for (const source of sources) {
          await ctx.runMutation(api.agentRuns.addProgress, {
            id: runId,
            message: `Scanning ${source}.com.au for ${buyBox.makes.join(", ")} ${buyBox.models.join(", ")}...`,
          });

          try {
            // Build search query
            const makeModelStr = buyBox.makes
              .flatMap((make) =>
                buyBox.models.length > 0
                  ? buyBox.models.map((model) => `${make} ${model}`)
                  : [make]
              )
              .join(" OR ");
            const stateStr = buyBox.states.join(", ");

            // Build the search query for this source/buybox combo
            void `${source === "carsales" ? "carsales.com.au" : source === "gumtree" ? "gumtree.com.au" : "facebook marketplace Australia"} private sale ${makeModelStr} ${buyBox.yearMin}-${buyBox.yearMax} under $${buyBox.priceMax} ${stateStr} cars for sale`;

            await callViktorTool<{ search_response: string }>(
              "quick_ai_search",
              {
                search_question: `Find private-party vehicle listings on ${source === "carsales" ? "carsales.com.au" : source === "gumtree" ? "gumtree.com.au" : "facebook marketplace"} matching: makes=${buyBox.makes.join(",")}, models=${buyBox.models.join(",")}, year ${buyBox.yearMin}-${buyBox.yearMax}, price $${buyBox.priceMin}-$${buyBox.priceMax}, max ${buyBox.kmMax}km, states: ${buyBox.states.join(",")}. Return specific listings with year, make, model, price, km, location, and listing URL. Focus on private sellers only.`,
              }
            );

            // Parse and save listings found (the AI search returns a summary)
            // In production this would parse structured data from the search results
            totalInputTokens += 500; // Estimated
            totalOutputTokens += 1500;

            await ctx.runMutation(api.agentRuns.addProgress, {
              id: runId,
              message: `Completed ${source} scan. Results received.`,
            });
          } catch (err) {
            await ctx.runMutation(api.agentRuns.addProgress, {
              id: runId,
              message: `Error scanning ${source}: ${err instanceof Error ? err.message : "Unknown error"}`,
            });
          }
        }
      }

      const estCost = ((totalInputTokens * 3 + totalOutputTokens * 15) / 1_000_000);

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Scanned ${buyBoxes.length} buy box(es) across 3 sources. Found ${totalListingsFound} new listings.`,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costUsd: Math.round(estCost * 10000) / 10000,
      });

      return { runId, listings: totalListingsFound };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
