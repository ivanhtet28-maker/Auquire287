import { Inbox, MessageCircle, Mail, Phone } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
          <Inbox className="size-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Unified messaging across all listings and channels
          </p>
        </div>
      </div>

      {/* Channel filter */}
      <div className="flex gap-2">
        {[
          { label: "All", icon: Inbox, count: 0 },
          { label: "SMS", icon: Phone, count: 0 },
          { label: "Email", icon: Mail, count: 0 },
        ].map((ch) => (
          <button
            type="button"
            key={ch.label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-white/[0.06] bg-card hover:bg-white/[0.03] transition-colors"
          >
            <ch.icon className="size-3.5 text-muted-foreground" />
            {ch.label}
            <Badge variant="outline" className="text-[10px] border-white/10 ml-1">
              {ch.count}
            </Badge>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <MessageCircle className="size-12 mx-auto mb-3 text-muted-foreground/20" />
          <h3 className="font-semibold mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Messages from Closer SMS outreach and Responder email replies will appear here.
            Configure Twilio and Resend in Settings to enable messaging.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
