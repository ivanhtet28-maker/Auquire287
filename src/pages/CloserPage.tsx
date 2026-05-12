import { Send, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CloserPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-pink-400/10 flex items-center justify-center">
          <Send className="size-5 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Closer</h1>
          <p className="text-sm text-muted-foreground">
            Outreach & negotiation agent — SMS sellers, track sentiment
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Active Threads</div>
            <div className="text-xl font-bold text-pink-400">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Messages Sent</div>
            <div className="text-xl font-bold text-blue-400">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Replies</div>
            <div className="text-xl font-bold text-emerald-400">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Avg Sentiment</div>
            <div className="text-xl font-bold text-amber-400">—</div>
          </CardContent>
        </Card>
      </div>

      {/* Active threads */}
      <Card>
        <CardHeader>
          <CardTitle>Active Conversations</CardTitle>
          <CardDescription>
            SMS threads with sellers. Closer drafts messages, you approve them.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No active conversations. Start by selecting a listing from Hunter
            and clicking "Contact Seller."
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Twilio integration required for live SMS. Configure in Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
