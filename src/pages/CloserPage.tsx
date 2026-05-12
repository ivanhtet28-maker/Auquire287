import { useAction, useQuery } from "convex/react";
import {
  Send,
  MessageCircle,
  Loader2,
  Phone,
  Mail,
  Clock,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export function CloserPage() {
  const conversations = useQuery(api.conversations.list, {});
  const listings = useQuery(api.listings.list, { status: "new", limit: 20 });
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, {
    agentName: "closer",
  });
  const runCloser = useAction(api.agents.closer.run);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const handleContact = async (listingId: string) => {
    setContactingId(listingId);
    toast.info("Closer is drafting outreach messages...");
    try {
      await runCloser({
        trigger: "manual",
        listingId: listingId as Id<"listings">,
      });
      toast.success("Outreach drafted! Check Active Conversations below.");
    } catch (err) {
      toast.error(
        `Closer failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setContactingId(null);
    }
  };

  const activeCount =
    conversations?.filter(
      (c: { status: string }) =>
        c.status === "active" || c.status === "draft"
    ).length ?? 0;
  const waitingCount =
    conversations?.filter(
      (c: { status: string }) => c.status === "waiting"
    ).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <Send className="size-5 text-pink-600" />
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
            <div className="text-xl font-bold text-pink-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Waiting Reply</div>
            <div className="text-xl font-bold text-amber-600">
              {waitingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Convos</div>
            <div className="text-xl font-bold text-blue-600">
              {conversations?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Avg Sentiment</div>
            <div className="text-xl font-bold text-emerald-600">—</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-pink-200 bg-pink-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-pink-600" />
              Drafting Outreach...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map(
                (msg: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-pink-600/60">›</span>
                    {msg}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Listings to Contact */}
      {listings && listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact a Seller</CardTitle>
            <CardDescription>
              Select a listing to draft personalised SMS + email outreach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listings
                .slice(0, 8)
                .map(
                  (listing: {
                    _id: string;
                    title: string;
                    price: number;
                    source: string;
                    state?: string;
                    sellerName?: string;
                  }) => (
                    <div
                      key={listing._id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {listing.title}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>${listing.price.toLocaleString()}</span>
                          <span>·</span>
                          <span className="capitalize">{listing.source}</span>
                          {listing.state && (
                            <>
                              <span>·</span>
                              <span>{listing.state}</span>
                            </>
                          )}
                          {listing.sellerName && (
                            <>
                              <span>·</span>
                              <User className="size-3 inline" />{" "}
                              {listing.sellerName}
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-pink-600 hover:bg-pink-700"
                        disabled={contactingId === listing._id}
                        onClick={() => handleContact(listing._id)}
                      >
                        {contactingId === listing._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        Contact
                      </Button>
                    </div>
                  )
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Conversations</CardTitle>
          <CardDescription>
            SMS threads with sellers. Closer drafts messages, you approve them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations && conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map(
                (convo: {
                  _id: string;
                  _creationTime: number;
                  sellerName?: string;
                  sellerPhone?: string;
                  channel: string;
                  status: string;
                  sentiment?: string;
                  recommendedNextMessage?: string;
                  lastMessageAt?: number;
                }) => (
                  <div
                    key={convo._id}
                    className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-pink-50 flex items-center justify-center">
                          <User className="size-4 text-pink-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {convo.sellerName || "Unknown Seller"}
                          </div>
                          {convo.sellerPhone && (
                            <div className="text-xs text-muted-foreground">
                              {convo.sellerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            convo.status === "active" || convo.status === "draft"
                              ? "border-pink-300 text-pink-600"
                              : convo.status === "waiting"
                                ? "border-amber-300 text-amber-600"
                                : "border-border"
                          }`}
                        >
                          {convo.status}
                        </Badge>
                        {convo.sentiment && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              convo.sentiment === "motivated"
                                ? "border-emerald-300 text-emerald-600"
                                : convo.sentiment === "hesitant"
                                  ? "border-amber-300 text-amber-600"
                                  : "border-border"
                            }`}
                          >
                            {convo.sentiment}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border"
                        >
                          {convo.channel === "sms" ? (
                            <Phone className="size-2.5 mr-0.5" />
                          ) : (
                            <Mail className="size-2.5 mr-0.5" />
                          )}
                          {convo.channel}
                        </Badge>
                      </div>
                    </div>
                    {convo.recommendedNextMessage && (
                      <div className="bg-muted rounded-lg p-3 mt-2">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">
                          Draft Message
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {convo.recommendedNextMessage.slice(0, 300)}
                          {convo.recommendedNextMessage.length > 300 && "..."}
                        </p>
                      </div>
                    )}
                    {convo.lastMessageAt && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                        <Clock className="size-2.5" />
                        Last:{" "}
                        {new Date(convo.lastMessageAt).toLocaleString("en-AU")}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No active conversations. Select a listing above to start
                outreach.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Twilio integration required for live SMS. Configure in Settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
