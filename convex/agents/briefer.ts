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
 * Briefer Agent — Generates the 6 AM morning brief.
 * Includes overnight market moves, new high-score listings,
 * follow-up reminders, and a daily focus list.
 */
export const run = action({
  args: {
    trigger: v.union(v.literal("manual"), v.literal("schedule"), v.literal("event"), v.literal("api")),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ runId: Id<"agentRuns">; briefId?: Id<"briefs"> }> => {
    const runId = await ctx.runMutation(api.agentRuns.create, {
      agentName: "briefer",
      trigger: args.trigger,
    });

    try {
      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Gathering overnight data...",
        percent: 10,
      });

      // Gather data for the brief
      const [listings, agentRuns, listingStats] = await Promise.all([
        ctx.runQuery(api.listings.list, { status: "new", limit: 20 }),
        ctx.runQuery(api.agentRuns.list, { limit: 20 }),
        ctx.runQuery(api.listings.getStats, {}),
      ]);

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Checking market trends...",
        percent: 30,
      });

      // Get market trend data
      const trendResult = await callViktorTool<{ search_response: string }>(
        "quick_ai_search",
        {
          search_question: "What are the latest Australian used car market trends today? Include price movements, supply changes, and any significant market news affecting dealers. Focus on the last 24 hours.",
        }
      );

      await ctx.runMutation(api.aiCalls.create, {
        agentName: "briefer", model: "quick_ai_search", purpose: "Morning brief market trends",
        inputTokens: 400, outputTokens: 600, costUsd: (400 * 3 + 600 * 15) / 1_000_000, durationMs: 0,
      });

      await ctx.runMutation(api.agentRuns.addProgress, {
        id: runId,
        message: "Compiling morning brief...",
        percent: 60,
      });

      // Build the brief content
      const now = new Date();
      const aestOffset = 10 * 60 * 60 * 1000;
      const aestDate = new Date(now.getTime() + aestOffset);
      const dateStr = aestDate.toISOString().split("T")[0];
      const dayName = aestDate.toLocaleDateString("en-AU", { weekday: "long" });

      // Top listings by deal score
      const topListings = [...listings]
        .filter((l: { dealScore?: number }) => l.dealScore !== undefined)
        .sort((a: { dealScore?: number }, b: { dealScore?: number }) => (b.dealScore ?? 0) - (a.dealScore ?? 0))
        .slice(0, 5);

      // Recent agent activity
      const recentRuns = agentRuns
        .filter((r: { status: string }) => r.status === "completed")
        .slice(0, 5);

      let briefContent = `# 🌅 Morning Brief — ${dayName}, ${dateStr}\n\n`;

      // Pipeline summary
      briefContent += `## 📊 Pipeline Summary\n`;
      briefContent += `- **Total Listings:** ${listingStats.total}\n`;
      briefContent += `- **New (Unreviewed):** ${listingStats.newCount}\n`;
      briefContent += `- **Contacted:** ${listingStats.contactedCount}\n`;
      briefContent += `- **In Negotiation:** ${listingStats.negotiatingCount}\n`;
      briefContent += `- **Purchased:** ${listingStats.purchasedCount}\n`;
      briefContent += `- **Avg Deal Score:** ${listingStats.avgDealScore}/10\n\n`;

      // Top opportunities
      if (topListings.length > 0) {
        briefContent += `## 🎯 Top Opportunities\n`;
        for (const listing of topListings) {
          const l = listing as { title: string; price: number; dealScore?: number; state?: string };
          briefContent += `- **${l.title}** — $${l.price.toLocaleString()} (Score: ${l.dealScore}/10)${l.state ? ` · ${l.state}` : ""}\n`;
        }
        briefContent += `\n`;
      }

      // New listings overnight
      briefContent += `## 🆕 New Listings\n`;
      briefContent += `${listings.length} new listing${listings.length === 1 ? "" : "s"} found overnight.\n\n`;

      // Market trends
      briefContent += `## 📈 Market Intel\n`;
      briefContent += `${trendResult.search_response.slice(0, 600)}\n\n`;

      // Agent activity
      if (recentRuns.length > 0) {
        briefContent += `## 🤖 Agent Activity (Last 24h)\n`;
        for (const run of recentRuns) {
          const r = run as { agentName: string; resultSummary?: string };
          briefContent += `- **${r.agentName.charAt(0).toUpperCase() + r.agentName.slice(1)}:** ${r.resultSummary || "Completed"}\n`;
        }
        briefContent += `\n`;
      }

      // Focus list
      briefContent += `## 🎯 Today's Focus\n`;
      briefContent += `1. Review ${listingStats.newCount} new listings and score top candidates\n`;
      briefContent += `2. Follow up on ${listingStats.contactedCount} contacted leads\n`;
      briefContent += `3. Close on ${listingStats.negotiatingCount} active negotiations\n`;

      const briefTitle = `Morning Brief — ${dayName}, ${dateStr}`;

      const briefId = await ctx.runMutation(api.briefs.create, {
        date: dateStr,
        title: briefTitle,
        content: briefContent,
        sections: {
          pipelineSummary: listingStats,
          topListings: topListings.length,
          newListings: listings.length,
          marketTrend: trendResult.search_response.slice(0, 300),
        },
        agentRunId: runId,
      });

      await ctx.runMutation(api.agentRuns.complete, {
        id: runId,
        resultSummary: `Generated ${dayName} brief: ${listings.length} new listings, ${listingStats.negotiatingCount} in negotiation, avg score ${listingStats.avgDealScore}/10`,
        inputTokens: 800,
        outputTokens: 2000,
        costUsd: 0.005,
      });

      return { runId, briefId };
    } catch (err) {
      await ctx.runMutation(api.agentRuns.fail, {
        id: runId,
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  },
});
