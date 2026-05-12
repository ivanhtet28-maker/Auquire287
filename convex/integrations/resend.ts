import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

declare const process: { env: Record<string, string | undefined> };

/**
 * Send an email via Resend.
 * Reads credentials from dealershipSettings.
 */
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    replyTo: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const settings = await ctx.runQuery(api.dealershipSettings.get, {}) as Record<string, string | undefined> | null;
    if (!settings?.resendApiKey || !settings?.resendFromEmail) {
      throw new Error("Resend not configured. Go to Settings → Integrations to add your Resend credentials.");
    }

    const apiKey: string = settings.resendApiKey!;
    const fromEmail: string = settings.resendFromEmail!;

    const response: Response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: args.replyTo ?? fromEmail,
      }),
    });

    const data: Record<string, unknown> = await response.json();

    if (!response.ok) {
      throw new Error(`Resend error: ${data.message ?? JSON.stringify(data)}`);
    }

    return { id: data.id };
  },
});
