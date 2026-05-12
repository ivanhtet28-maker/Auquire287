import { useAction, useQuery } from "convex/react";
import {
  Send,
  MessageCircle,
  Loader2,
  Phone,
  Mail,
  Clock,
  User,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Target,
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

type ConvoStatus = "all" | "draft" | "active" | "waiting" | "closed";

export function CloserPage() {
  const conversations = useQuery(api.conversations.list, {});
  const listings = useQuery(api.listings.list, { status: "new", limit: 20 });
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName: "closer" });
  const runCloser = useAction(api.agents.closer.run);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ConvoStatus>("all");

  const handleContact = async (listingId: string) => {
    setContactingId(listingId);
    toast.info("Closer is drafting outreach messages...");
    try {
      await runCloser({ trigger: "manual", listingId: listingId as Id<"listings"> });
      toast.success("Outreach drafted! Check conversations below.");
    } catch (err) {
      toast.error(`Closer failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setContactingId(null);
    }
  };

  const activeCount = conversations?.filter((c: { status: string }) => c.status === "active" || c.status === "draft").length ?? 0;
  const waitingCount = conversations?.filter((c: { status: string }) => c.status === "waiting").length ?? 0;
  const closedCount = conversations?.filter((c: { status: string }) => c.status === "closed").length ?? 0;
  const motivatedCount = conversations?.filter((c: { sentiment?: string }) => c.sentiment === "motivated").length ?? 0;

  const filteredConvos = conversations?.filter((c: { status: string }) =>
    statusFilter === "all" || c.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-pink-50 flex items-center justify-center">
          <Send className="size-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Closer</h1>
          <p className="text-sm text-muted-foreground">
            Outreach & negotiation agent — SMS sellers, track sentiment, close deals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Active Threads</div>
            <div className="text-xl font-bold text-pink-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Waiting Reply</div>
            <div className="text-xl font-bold text-amber-600">{waitingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Closed</div>
            <div className="text-xl font-bold text-muted-foreground">{closedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Motivated Sellers</div>
            <div className="text-xl font-bold text-emerald-600">{motivatedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Convos</div>
            <div className="text-xl font-bold text-blue-600">{conversations?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-pink-200 bg-pink-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-pink-600" /> Drafting Outreach...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-pink-600/60">›</span>{msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Listings to Contact */}
      {listings && listings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4" /> Contact a Seller
            </CardTitle>
            <CardDescription>
              Select a listing to draft personalised SMS + email outreach. SMS limited to 320 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listings.slice(0, 8).map((listing: {
                _id: string; title: string; price: number; source: string;
                state?: string; sellerName?: string; sellerPhone?: string;
                dealScore?: number;
              }) => (
                <div key={listing._id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{listing.title}</span>
                      {listing.dealScore && listing.dealScore >= 7 && (
                        <Badge variant="outline" className="text-[8px] border-emerald-300 text-emerald-600 shrink-0">
                          Score {listing.dealScore}/10
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>${listing.price.toLocaleString()}</span>
                      <span>·</span>
                      <span className="capitalize">{listing.source}</span>
                      {listing.state && <><span>·</span><span>{listing.state}</span></>}
                      {listing.sellerName && <><span>·</span><User className="size-3 inline" /> {listing.sellerName}</>}
                      {listing.sellerPhone && <><span>·</span><Phone className="size-3 inline" /> {listing.sellerPhone}</>}
                    </div>
                    {!listing.sellerPhone && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1">
                        <AlertTriangle className="size-2.5" /> No phone — will draft email only
                      </div>
                    )}
                  </div>
                  <Button size="sm" className="bg-pink-600 hover:bg-pink-700 shrink-0 ml-3"
                    disabled={contactingId === listing._id} onClick={() => handleContact(listing._id)}>
                    {contactingId === listing._id ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    Contact
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversations with status filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>SMS/email threads with sellers. Messages save as drafts for your approval.</CardDescription>
            </div>
          </div>
          {/* Status filter tabs */}
          <div className="flex gap-1.5 mt-2">
            {(["all", "draft", "active", "waiting", "closed"] as ConvoStatus[]).map((st) => (
              <button key={st} type="button" onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  statusFilter === st ? "bg-pink-600 text-white" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}>
                {st === "all" ? `All (${conversations?.length ?? 0})` : `${st} (${conversations?.filter((c: { status: string }) => c.status === st).length ?? 0})`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredConvos && filteredConvos.length > 0 ? (
            <div className="space-y-3">
              {filteredConvos.map((convo: {
                _id: string; _creationTime: number; sellerName?: string;
                sellerPhone?: string; channel: string; status: string;
                sentiment?: string; recommendedNextMessage?: string;
                recommendedOffer?: number; negotiationPosition?: string;
                confidence?: number; lastMessageAt?: number;
              }) => (
                <div key={convo._id} className="p-4 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-pink-50 flex items-center justify-center">
                        <User className="size-4 text-pink-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{convo.sellerName || "Unknown Seller"}</div>
                        {convo.sellerPhone && <div className="text-xs text-muted-foreground">{convo.sellerPhone}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        convo.status === "active" || convo.status === "draft" ? "border-pink-300 text-pink-600"
                        : convo.status === "waiting" ? "border-amber-300 text-amber-600"
                        : convo.status === "closed" ? "border-muted-foreground" : "border-border"
                      }`}>{convo.status}</Badge>
                      {convo.sentiment && (
                        <Badge variant="outline" className={`text-[10px] capitalize ${
                          convo.sentiment === "motivated" ? "border-emerald-300 text-emerald-600"
                          : convo.sentiment === "hesitant" ? "border-orange-300 text-orange-600"
                          : convo.sentiment === "unresponsive" ? "border-red-300 text-red-600"
                          : "border-border"
                        }`}>{convo.sentiment === "motivated" ? "🟢" : convo.sentiment === "neutral" ? "🟡" : convo.sentiment === "hesitant" ? "🟠" : "🔴"} {convo.sentiment}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] border-border">
                        {convo.channel === "sms" ? <Phone className="size-2.5 mr-0.5" /> : <Mail className="size-2.5 mr-0.5" />}
                        {convo.channel}
                      </Badge>
                    </div>
                  </div>

                  {/* Negotiation info row */}
                  {(convo.recommendedOffer || convo.negotiationPosition || convo.confidence != null) && (
                    <div className="flex items-center gap-3 mt-2 p-2 rounded-md bg-blue-50 border border-blue-100">
                      {convo.recommendedOffer && (
                        <div className="flex items-center gap-1 text-xs">
                          <DollarSign className="size-3 text-blue-600" />
                          <span className="text-muted-foreground">Offer:</span>
                          <span className="font-medium text-blue-700">${convo.recommendedOffer.toLocaleString()}</span>
                        </div>
                      )}
                      {convo.negotiationPosition && (
                        <div className="flex items-center gap-1 text-xs">
                          <TrendingUp className="size-3 text-blue-600" />
                          <span className="text-muted-foreground">Position:</span>
                          <span className="font-medium">{convo.negotiationPosition}</span>
                        </div>
                      )}
                      {convo.confidence != null && (
                        <div className="flex items-center gap-1 text-xs">
                          <Target className="size-3 text-blue-600" />
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-medium">{Math.round(convo.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning flags */}
                  {convo.sentiment === "unresponsive" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                      <AlertTriangle className="size-3" />
                      Seller unresponsive — consider moving to next opportunity
                    </div>
                  )}
                  {convo.status === "waiting" && convo.lastMessageAt && (Date.now() - convo.lastMessageAt > 48 * 60 * 60 * 1000) && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
                      <AlertTriangle className="size-3" />
                      No reply in 48+ hours — follow-up recommended
                    </div>
                  )}

                  {convo.recommendedNextMessage && (
                    <div className="bg-muted rounded-lg p-3 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground uppercase">Draft Message</span>
                        {convo.channel === "sms" && (
                          <span className={`text-[10px] ${convo.recommendedNextMessage.length > 320 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            {convo.recommendedNextMessage.length}/320
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{convo.recommendedNextMessage}</p>
                    </div>
                  )}
                  {convo.lastMessageAt && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2">
                      <Clock className="size-2.5" /> Last: {new Date(convo.lastMessageAt).toLocaleString("en-AU")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {statusFilter === "all" ? "No conversations yet. Select a listing above to start outreach." : `No ${statusFilter} conversations.`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Twilio integration required for live SMS. Configure in Settings → Integrations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
