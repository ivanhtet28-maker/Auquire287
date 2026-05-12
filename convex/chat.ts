import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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

// ─── Session management ─────────────────────────────────────────────────

export const getOrCreateSession = mutation({
  args: {},
  returns: v.id("chatSessions"),
  handler: async (ctx) => {
    const existing = await ctx.db.query("chatSessions").order("desc").first();
    if (existing) return existing._id;
    return await ctx.db.insert("chatSessions", { title: "New Chat" });
  },
});

export const listSessions = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("chatSessions").order("desc").take(20);
  },
});

export const getMessages = query({
  args: { sessionId: v.id("chatSessions") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    agentCalls: v.optional(v.array(v.any())),
  },
  returns: v.id("chatMessages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", { ...args });
  },
});

// ─── Tool definitions for the orchestrator ──────────────────────────────

interface ToolCall {
  tool: string;
  args?: Record<string, unknown>;
  reasoning: string;
}

interface OrchestratorPlan {
  thought: string;
  toolCalls: ToolCall[];
  directAnswer?: string;
}

function parseOrchestratorResponse(text: string): OrchestratorPlan {
  const plan: OrchestratorPlan = { thought: "", toolCalls: [] };

  // Try to extract JSON plan from the response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*"tool(?:Calls|_calls)"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      if (parsed.toolCalls || parsed.tool_calls) {
        plan.toolCalls = (parsed.toolCalls ?? parsed.tool_calls).map((tc: any) => ({
          tool: tc.tool ?? tc.name,
          args: tc.args ?? tc.arguments ?? {},
          reasoning: tc.reasoning ?? "",
        }));
      }
      plan.thought = parsed.thought ?? parsed.reasoning ?? "";
      plan.directAnswer = parsed.answer ?? parsed.directAnswer;
      return plan;
    } catch { /* fall through */ }
  }

  // Keyword-based tool detection (fallback)
  const lower = text.toLowerCase();
  if (lower.includes("run hunter") || lower.includes("start hunter") || lower.includes("trigger hunter") || lower.includes("scan for")) {
    plan.toolCalls.push({ tool: "hunter", reasoning: "User wants to scan for listings" });
  }
  if (lower.includes("run briefer") || lower.includes("morning brief") || lower.includes("generate brief")) {
    plan.toolCalls.push({ tool: "briefer", reasoning: "User wants a morning brief" });
  }
  if (lower.includes("run lister") || lower.includes("audit") || lower.includes("reprice") || lower.includes("pricing check")) {
    plan.toolCalls.push({ tool: "lister", reasoning: "User wants an inventory audit" });
  }
  if (lower.includes("run responder") || lower.includes("draft repl") || lower.includes("reply to enquir")) {
    plan.toolCalls.push({ tool: "responder", reasoning: "User wants to draft replies" });
  }
  if (lower.includes("run scout") || lower.includes("market intel") || lower.includes("market data")) {
    plan.toolCalls.push({ tool: "scout", reasoning: "User wants market intelligence" });
  }
  if (lower.includes("run closer") || lower.includes("reach out") || lower.includes("contact seller")) {
    plan.toolCalls.push({ tool: "closer", reasoning: "User wants to contact a seller" });
  }

  plan.directAnswer = text;
  return plan;
}

// ─── AI Chat orchestrator action ────────────────────────────────────────

export const sendMessage = action({
  args: {
    sessionId: v.id("chatSessions"),
    message: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ messageId: string; response: string; agentCalls: Array<{ agent: string; action: string; status: string }> }> => {
    // Save user message
    await ctx.runMutation(api.chat.addMessage, {
      sessionId: args.sessionId,
      role: "user" as const,
      content: args.message,
    });

    // Get conversation context
    const messages: Array<{ role: string; content: string }> = await ctx.runQuery(api.chat.getMessages, {
      sessionId: args.sessionId,
    });

    const recentMessages: string = messages.slice(-10).map((m) =>
      `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
    ).join("\n");

    // Get current system state
    const listingStats: { total: number; newCount: number; contactedCount: number; negotiatingCount: number; purchasedCount: number; avgDealScore: number } = await ctx.runQuery(api.listings.getStats, {});
    const buyBoxes: unknown[] = await ctx.runQuery(api.buyBoxes.list, {});
    const todayStats: { totalRuns: number; completedRuns: number; failedRuns: number; totalCostUsd: number } = await ctx.runQuery(api.agentRuns.getTodayStats, {});

    const systemPrompt = `You are the Auquire AI orchestrator for an Australian car dealership's acquisition platform. You manage 6 AI agents and help the dealer find, evaluate, and acquire used vehicles.

CURRENT STATE:
- ${listingStats.total} total listings (${listingStats.newCount} new, ${listingStats.contactedCount} contacted, ${listingStats.negotiatingCount} negotiating, ${listingStats.purchasedCount} purchased)
- ${buyBoxes.length} buy box(es) configured
- Today: ${todayStats.totalRuns} agent runs, ${todayStats.completedRuns} completed, ${todayStats.failedRuns} failed, $${todayStats.totalCostUsd.toFixed(4)} AI cost

AVAILABLE TOOLS:
- hunter: Scan Carsales/Gumtree/Facebook for listings matching buy boxes
- scout: Get market intelligence on a specific make/model (args: make, model, year, state)
- lister: Audit current inventory pricing against market
- responder: Draft replies to pending seller enquiries
- briefer: Generate a morning brief with pipeline overview
- closer: Draft SMS/email outreach for a specific listing (args: listingId)

If the user wants to trigger one or more agents, respond with a JSON block:
\`\`\`json
{"thought": "reason", "toolCalls": [{"tool": "hunter", "reasoning": "why"}], "answer": "response to user"}
\`\`\`

Otherwise just answer directly. Use Australian English. Be specific, concise, and action-oriented.`;

    // Call AI for the response
    const result: { search_response: string } = await callViktorTool<{ search_response: string }>(
      "quick_ai_search",
      {
        search_question: `${systemPrompt}\n\nConversation:\n${recentMessages}\n\nUser: "${args.message}"\n\nRespond:`,
      }
    );

    // Log AI call
    await ctx.runMutation(api.aiCalls.create, {
      agentName: "orchestrator",
      model: "quick_ai_search",
      purpose: "Chat orchestrator response",
      inputTokens: 800,
      outputTokens: 400,
      costUsd: (800 * 3 + 400 * 15) / 1_000_000,
      durationMs: 0,
    });

    // Parse for tool calls
    const plan = parseOrchestratorResponse(result.search_response);
    const agentCalls: Array<{ agent: string; action: string; status: string }> = [];
    let assistantResponse = plan.directAnswer ?? result.search_response;

    // Clean JSON blocks from the display response
    assistantResponse = assistantResponse.replace(/```json[\s\S]*?```/g, "").trim();

    // Execute tool calls
    for (const tc of plan.toolCalls) {
      try {
        const status = { agent: tc.tool, action: "run", status: "running" };
        agentCalls.push(status);

        if (tc.tool === "hunter") {
          await ctx.runAction(api.agents.hunter.run, { trigger: "manual" });
          status.status = "completed";
          assistantResponse += `\n\n✅ *Hunter* agent triggered — scanning all buy boxes across Carsales, Gumtree & Facebook.`;
        } else if (tc.tool === "briefer") {
          await ctx.runAction(api.agents.briefer.run, { trigger: "manual" });
          status.status = "completed";
          assistantResponse += `\n\n✅ *Briefer* agent triggered — generating your morning brief now.`;
        } else if (tc.tool === "lister") {
          await ctx.runAction(api.agents.lister.run, { trigger: "manual" });
          status.status = "completed";
          assistantResponse += `\n\n✅ *Lister* agent triggered — auditing inventory pricing.`;
        } else if (tc.tool === "responder") {
          await ctx.runAction(api.agents.responder.run, { trigger: "manual" });
          status.status = "completed";
          assistantResponse += `\n\n✅ *Responder* agent triggered — drafting replies to pending enquiries.`;
        } else if (tc.tool === "scout") {
          const make = (tc.args?.make ?? "Toyota") as string;
          const model = (tc.args?.model ?? "Hilux") as string;
          const year = (tc.args?.year ?? 2022) as number;
          const state = (tc.args?.state ?? "NSW") as string;
          await ctx.runAction(api.agents.scout.run, { trigger: "manual", make, model, year, state });
          status.status = "completed";
          assistantResponse += `\n\n✅ *Scout* agent triggered — researching ${year} ${make} ${model} market data.`;
        } else if (tc.tool === "closer") {
          // Closer requires a listingId — skip if not provided
          if (tc.args?.listingId) {
            await ctx.runAction(api.agents.closer.run, { trigger: "manual", listingId: tc.args.listingId as any });
            status.status = "completed";
            assistantResponse += `\n\n✅ *Closer* agent triggered — drafting outreach for the listing.`;
          } else {
            status.status = "skipped";
            assistantResponse += `\n\n⚠️ Closer needs a specific listing to target. Try "reach out to listing [ID]" or select one from the pipeline.`;
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        agentCalls[agentCalls.length - 1].status = "failed";
        assistantResponse += `\n\n⚠️ ${tc.tool} error: ${errMsg}`;
      }
    }

    // Save assistant response
    const msgId: string = await ctx.runMutation(api.chat.addMessage, {
      sessionId: args.sessionId,
      role: "assistant",
      content: assistantResponse,
      agentCalls: agentCalls.length > 0 ? agentCalls : undefined,
    });

    return { messageId: msgId, response: assistantResponse, agentCalls };
  },
});
