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
    // Get latest session
    const existing = await ctx.db
      .query("chatSessions")
      .order("desc")
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("chatSessions", {
      title: "New Chat",
    });
  },
});

export const listSessions = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("chatSessions")
      .order("desc")
      .take(20);
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
    return await ctx.db.insert("chatMessages", {
      ...args,
    });
  },
});

// ─── AI Chat orchestrator action ────────────────────────────────────────

export const sendMessage = action({
  args: {
    sessionId: v.id("chatSessions"),
    message: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<{ messageId: string; response: string; agentCalls: Array<{ agent: string; action: string }> }> => {
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

    // Build context from recent messages
    const recentMessages: string = messages.slice(-10).map((m) => 
      `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
    ).join("\n");

    // Get current system state
    const listingStats: { total: number; newCount: number; contactedCount: number; negotiatingCount: number; purchasedCount: number; avgDealScore: number } = await ctx.runQuery(api.listings.getStats, {});
    const buyBoxes: unknown[] = await ctx.runQuery(api.buyBoxes.list, {});

    const systemContext: string = `You are the Auquire AI assistant for an Australian car dealership. Current state: ${listingStats.total} total listings, ${listingStats.newCount} new, ${listingStats.contactedCount} contacted, ${listingStats.negotiatingCount} negotiating, ${listingStats.purchasedCount} purchased. ${buyBoxes.length} buy boxes configured. Available agents: Hunter (find listings), Lister (audit pricing), Responder (draft replies), Scout (market intel), Briefer (morning brief), Closer (outreach to sellers).`;

    // Determine if user wants to trigger an agent
    const lowerMsg = args.message.toLowerCase();
    const agentCalls: Array<{ agent: string; action: string }> = [];

    if (lowerMsg.includes("hunt") || lowerMsg.includes("scan") || lowerMsg.includes("find") || lowerMsg.includes("search")) {
      agentCalls.push({ agent: "hunter", action: "scan" });
    }
    if (lowerMsg.includes("brief") || lowerMsg.includes("morning")) {
      agentCalls.push({ agent: "briefer", action: "generate" });
    }
    if (lowerMsg.includes("audit") || lowerMsg.includes("reprice") || lowerMsg.includes("pricing")) {
      agentCalls.push({ agent: "lister", action: "audit" });
    }
    if (lowerMsg.includes("respond") || lowerMsg.includes("reply") || lowerMsg.includes("enquir")) {
      agentCalls.push({ agent: "responder", action: "draft" });
    }

    // Call AI for the response
    const result: { search_response: string } = await callViktorTool<{ search_response: string }>(
      "quick_ai_search",
      {
        search_question: `${systemContext}\n\nConversation:\n${recentMessages}\n\nUser's latest message: "${args.message}"\n\nProvide a helpful, concise response. If the user wants to run an agent, confirm you're triggering it. Use Australian English. Be specific about numbers and data when available.`,
      }
    );

    let assistantResponse: string = result.search_response;

    // Trigger agents if requested
    for (const call of agentCalls) {
      try {
        if (call.agent === "hunter") {
          await ctx.runAction(api.agents.hunter.run, { trigger: "manual" });
          assistantResponse += "\n\n✅ Hunter agent has been triggered and is scanning now.";
        } else if (call.agent === "briefer") {
          await ctx.runAction(api.agents.briefer.run, { trigger: "manual" });
          assistantResponse += "\n\n✅ Briefer agent has been triggered — your morning brief is being generated.";
        } else if (call.agent === "lister") {
          await ctx.runAction(api.agents.lister.run, { trigger: "manual" });
          assistantResponse += "\n\n✅ Lister agent has been triggered — auditing your inventory now.";
        } else if (call.agent === "responder") {
          await ctx.runAction(api.agents.responder.run, { trigger: "manual" });
          assistantResponse += "\n\n✅ Responder agent has been triggered — drafting replies to pending enquiries.";
        }
      } catch (err) {
        assistantResponse += `\n\n⚠️ ${call.agent} agent encountered an error: ${err instanceof Error ? err.message : "Unknown error"}`;
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
