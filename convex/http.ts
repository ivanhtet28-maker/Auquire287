import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

// ─── Twilio Inbound SMS Webhook ─────────────────────────────────────────
http.route({
  path: "/twilio-inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;

    if (!from || !body) {
      return new Response("Missing From or Body", { status: 400 });
    }

    // Find conversation by seller phone
    const conversations: Array<{
      _id: string;
      sellerPhone?: string;
      listingId?: string;
    }> = await ctx.runQuery(api.conversations.list, { limit: 200 });

    const conversation = conversations.find(
      (c) => c.sellerPhone && from.includes(c.sellerPhone.replace(/\D/g, "").slice(-9))
    );

    if (conversation) {
      // Add inbound message to conversation
      await ctx.runMutation(api.conversationMessages.create, {
        conversationId: conversation._id as any,
        direction: "inbound",
        channel: "sms",
        body: body,
        externalId: messageSid,
      });

      // Update conversation status
      await ctx.runMutation(api.conversations.updateStatus, {
        id: conversation._id as any,
        status: "active",
      });

      // Add to activity feed
      await ctx.runMutation(api.activityFeed.create, {
        type: "message_received",
        title: `SMS received from ${from}`,
        description: body.slice(0, 100),
        agentName: "closer",
      });
    }

    // Respond with TwiML (empty response = no auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  }),
});

// ─── External API trigger for agents ────────────────────────────────────
http.route({
  path: "/api/trigger",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { agent } = body;
    // Auth can be added later via dealershipSettings API key check

    if (!agent) {
      return new Response(JSON.stringify({ error: "agent field required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      if (agent === "hunter") {
        await ctx.runAction(api.agents.hunter.run, { trigger: "api" });
      } else if (agent === "briefer") {
        await ctx.runAction(api.agents.briefer.run, { trigger: "api" });
      } else if (agent === "lister") {
        await ctx.runAction(api.agents.lister.run, { trigger: "api" });
      } else {
        return new Response(JSON.stringify({ error: `Unknown agent: ${agent}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, agent }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
