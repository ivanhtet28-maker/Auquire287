import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

declare const process: { env: Record<string, string | undefined> };

/**
 * Send an SMS via Twilio.
 * Reads credentials from dealershipSettings.
 */
export const sendSms = action({
  args: {
    to: v.string(),
    body: v.string(),
    conversationId: v.optional(v.id("conversations")),
    messageId: v.optional(v.id("messages")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.dealershipSettings.get, {}) as Record<string, string | undefined> | null;
    if (!settings?.twilioAccountSid || !settings?.twilioAuthToken || !settings?.twilioPhoneNumber) {
      throw new Error("Twilio not configured. Go to Settings → Integrations to add your Twilio credentials.");
    }

    const sid: string = settings.twilioAccountSid!;
    const token: string = settings.twilioAuthToken!;
    const fromPhone: string = settings.twilioPhoneNumber!;

    const response: Response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        },
        body: new URLSearchParams({
          To: args.to,
          From: fromPhone,
          Body: args.body.slice(0, 1600), // Twilio max
        }),
      }
    );

    const data: Record<string, unknown> = await response.json();

    if (!response.ok) {
      throw new Error(`Twilio error: ${data.message ?? JSON.stringify(data)}`);
    }

    // Update message status if we have a messageId
    if (args.messageId) {
      // We'd patch the message status to 'sent' here
      // but messages table patch needs a mutation
    }

    return {
      sid: data.sid,
      status: data.status,
      to: data.to,
    };
  },
});

/**
 * Webhook handler for Twilio inbound SMS.
 * Register this URL in your Twilio console: POST /twilio-inbound
 */
// Twilio inbound is handled in convex/http.ts
