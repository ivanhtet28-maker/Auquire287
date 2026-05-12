import { useMutation, useQuery } from "convex/react";
import {
  Inbox,
  MessageCircle,
  Mail,
  Phone,
  User,
  Clock,
  ChevronRight,
  Send,
  Sparkles,
  Car,
  DollarSign,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

const TEMPLATES = [
  { id: "initial", label: "Initial Outreach", body: "Hi {{sellerName}}, I saw your listing for the {{title}} on {{source}}. Is it still available? I'm a licensed dealer and can offer a quick, hassle-free sale. Happy to chat when suits you." },
  { id: "followup", label: "Follow-up (No Reply)", body: "Hi {{sellerName}}, just following up on the {{title}}. I'm still interested if it's available. Would you be open to a quick chat or inspection this week?" },
  { id: "offer", label: "Make an Offer", body: "Hi {{sellerName}}, thanks for the info on the {{title}}. Based on current market conditions, I'd like to offer ${{offer}} — paid same day, I handle all the paperwork. Let me know your thoughts." },
  { id: "inspection", label: "Book Inspection", body: "Hi {{sellerName}}, great to hear! I'd love to arrange an inspection of the {{title}}. Would {{day}} at {{time}} work for you? I can come to you." },
  { id: "closing", label: "Closing / Confirm Purchase", body: "Hi {{sellerName}}, just confirming we're all set for the {{title}} at ${{offer}}. I'll bring the bank cheque and transfer paperwork. See you {{day}} at {{time}}." },
];

export function InboxPage() {
  const conversations = useQuery(api.conversations.list, {});
  const enquiries = useQuery(api.enquiries.list, {});
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | "sms" | "email">("all");
  const [composerText, setComposerText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const createMessage = useMutation(api.conversationMessages.create);

  const selectedMessages = useQuery(
    api.conversationMessages.listByConversation,
    selectedConvoId ? { conversationId: selectedConvoId as Id<"conversations"> } : "skip"
  );

  // Find selected conversation details
  const selectedConvo = conversations?.find((c: { _id: string }) => c._id === selectedConvoId) as {
    _id: string; sellerName?: string; sellerPhone?: string; channel: string;
    status: string; sentiment?: string; recommendedNextMessage?: string;
    recommendedOffer?: number; listingId?: string; confidence?: number;
    negotiationPosition?: string;
  } | undefined;

  // Get listing details if conversation is linked
  const linkedListing = useQuery(
    api.listings.getById,
    selectedConvo?.listingId ? { id: selectedConvo.listingId as Id<"listings"> } : "skip"
  ) as {
    _id: string; title: string; year: number; make: string; model: string;
    price: number; km?: number; state?: string; suburb?: string; source: string;
    sourceUrl: string; dealScore?: number; sellerPhone?: string; sellerName?: string;
    photos: string[];
  } | null | undefined;

  const filteredConversations = conversations?.filter(
    (c: { channel: string }) => channelFilter === "all" || c.channel === channelFilter
  );

  const smsCount = conversations?.filter((c: { channel: string }) => c.channel === "sms").length ?? 0;
  const emailCount = conversations?.filter((c: { channel: string }) => c.channel === "email").length ?? 0;
  const enquiryCount = enquiries?.length ?? 0;

  // Apply template
  const applyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    let body = tpl.body;
    if (selectedConvo) {
      body = body.replace(/\{\{sellerName\}\}/g, selectedConvo.sellerName || "there");
    }
    if (linkedListing) {
      body = body.replace(/\{\{title\}\}/g, linkedListing.title);
      body = body.replace(/\{\{source\}\}/g, linkedListing.source);
      body = body.replace(/\{\{offer\}\}/g, linkedListing.price ? Math.round(linkedListing.price * 0.9).toLocaleString() : "___");
    }
    body = body.replace(/\{\{[^}]+\}\}/g, "___");
    setComposerText(body);
    setSelectedTemplate(templateId);
  };

  // AI suggest
  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    try {
      // Build contextual suggestion
      const _convoContext = selectedConvo
        ? `Seller: ${selectedConvo.sellerName ?? "Unknown"}, Channel: ${selectedConvo.channel}, Status: ${selectedConvo.status}, Sentiment: ${selectedConvo.sentiment ?? "unknown"}`
        : "";
      const _listingContext = linkedListing
        ? `Vehicle: ${linkedListing.title}, Price: $${linkedListing.price?.toLocaleString()}, Location: ${linkedListing.suburb ?? ""} ${linkedListing.state ?? ""}`
        : "";
      const _lastMessages = selectedMessages?.slice(-3).map((m: { direction: string; body: string }) =>
        `${m.direction === "outbound" ? "You" : "Seller"}: ${m.body}`
      ).join("\n") ?? "";
      // Context vars available for future AI integration
      void _convoContext; void _listingContext; void _lastMessages;

      // Use the recommended next message if available, otherwise generate based on context
      if (selectedConvo?.recommendedNextMessage) {
        setComposerText(selectedConvo.recommendedNextMessage);
      } else {
        // Fallback to a contextual template
        const suggestion = selectedMessages && selectedMessages.length > 0
          ? `Hi ${selectedConvo?.sellerName || "there"}, just following up on our conversation about the ${linkedListing?.title || "vehicle"}. Are you still interested in selling? I'm ready to move quickly if we can agree on price.`
          : `Hi ${selectedConvo?.sellerName || "there"}, I noticed your ${linkedListing?.title || "listing"} and I'm very interested. I'm a licensed dealer in ${linkedListing?.state || "your area"} and can offer a fast, fair deal. Would you be open to chatting?`;
        setComposerText(suggestion);
      }
      toast.success("AI suggestion applied!");
    } catch {
      toast.error("Failed to generate suggestion");
    }
    setAiSuggesting(false);
  };

  // Send message
  const handleSend = async () => {
    if (!selectedConvoId || !composerText.trim()) return;
    setSendingMsg(true);
    try {
      // Enforce 320 char limit for SMS
      const channel = selectedConvo?.channel ?? "sms";
      if (channel === "sms" && composerText.length > 320) {
        toast.error("SMS messages must be 320 characters or less");
        setSendingMsg(false);
        return;
      }

      await createMessage({
        conversationId: selectedConvoId as Id<"conversations">,
        direction: "outbound",
        channel: channel as "sms" | "email",
        body: composerText,
        status: "draft",
      });
      toast.success("Message saved as draft. Approve in conversation to send via Twilio/Resend.");
      setComposerText("");
      setSelectedTemplate("");
    } catch {
      toast.error("Failed to send message");
    }
    setSendingMsg(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Inbox className="size-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-sm text-muted-foreground">Unified messaging across all listings and channels</p>
        </div>
      </div>

      {/* Channel filter */}
      <div className="flex gap-2">
        {[
          { label: "All", icon: Inbox, count: (conversations?.length ?? 0) + enquiryCount, value: "all" as const },
          { label: "SMS", icon: Phone, count: smsCount, value: "sms" as const },
          { label: "Email", icon: Mail, count: emailCount + enquiryCount, value: "email" as const },
        ].map((ch) => (
          <button type="button" key={ch.label} onClick={() => setChannelFilter(ch.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              channelFilter === ch.value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border bg-card hover:bg-accent"
            }`}>
            <ch.icon className="size-3.5 text-muted-foreground" />
            {ch.label}
            <Badge variant="outline" className="text-[10px] border-border ml-1">{ch.count}</Badge>
          </button>
        ))}
      </div>

      {/* Main layout */}
      {(filteredConversations && filteredConversations.length > 0) || (enquiries && enquiries.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Thread List */}
          <div className="lg:col-span-3 space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
            {filteredConversations?.map((convo: {
              _id: string; _creationTime: number; sellerName?: string;
              sellerPhone?: string; channel: string; status: string;
              sentiment?: string; recommendedNextMessage?: string; lastMessageAt?: number;
            }) => (
              <div key={convo._id} onClick={() => { setSelectedConvoId(convo._id); setComposerText(""); setSelectedTemplate(""); }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedConvoId === convo._id ? "border-blue-300 bg-blue-50" : "border-border hover:bg-accent"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-pink-50 flex items-center justify-center">
                      <User className="size-3.5 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{convo.sellerName || "Unknown Seller"}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {convo.channel === "sms" ? <Phone className="size-2.5" /> : <Mail className="size-2.5" />}
                        {convo.sellerPhone || convo.channel}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {convo.sentiment && (
                      <span className="text-[10px]">
                        {convo.sentiment === "motivated" ? "🟢" : convo.sentiment === "neutral" ? "🟡" : convo.sentiment === "hesitant" ? "🟠" : "🔴"}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[8px] capitalize ${
                      convo.status === "draft" ? "border-amber-300 text-amber-600"
                      : convo.status === "active" ? "border-emerald-300 text-emerald-600"
                      : convo.status === "waiting" ? "border-blue-300 text-blue-600"
                      : "border-border"
                    }`}>{convo.status}</Badge>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </div>
                </div>
                {convo.lastMessageAt && (
                  <p className="text-[10px] text-muted-foreground mt-1 ml-9">
                    {new Date(convo.lastMessageAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            ))}

            {/* Enquiry threads */}
            {(channelFilter === "all" || channelFilter === "email") && enquiries?.map((enq: {
              _id: string; _creationTime: number; senderName?: string;
              channel: string; status: string; body: string;
            }) => (
              <div key={enq._id} className="p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-violet-50 flex items-center justify-center">
                    <MessageCircle className="size-3.5 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{enq.senderName || "Enquiry"}</div>
                    <div className="text-[10px] text-muted-foreground">Inbound {enq.channel}</div>
                  </div>
                  <Badge variant="outline" className={`text-[8px] ml-auto capitalize ${
                    enq.status === "drafted" ? "border-amber-300 text-amber-600"
                    : enq.status === "pending" ? "border-violet-300 text-violet-600"
                    : "border-border"
                  }`}>{enq.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate ml-9">{enq.body.slice(0, 60)}...</p>
              </div>
            ))}
          </div>

          {/* Message Detail + Composer */}
          <div className="lg:col-span-6">
            {selectedConvoId && selectedMessages ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    <div className="text-xs text-muted-foreground uppercase mb-2">Messages</div>
                    {selectedMessages.length > 0 ? (
                      selectedMessages.map((msg: {
                        _id: string; direction: string; channel: string;
                        body: string; sentAt: number; status: string;
                      }) => (
                        <div key={msg._id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            msg.direction === "outbound" ? "bg-blue-600 text-white" : "bg-muted"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-[8px] ${msg.direction === "outbound" ? "border-white/30 text-white/80" : "border-border"}`}>
                                {msg.channel} · {msg.status}
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                            <div className={`text-[10px] mt-1 ${msg.direction === "outbound" ? "text-white/60" : "text-muted-foreground"}`}>
                              <Clock className="size-2.5 inline mr-0.5" />
                              {new Date(msg.sentAt).toLocaleString("en-AU")}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Use the composer below to start the conversation.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Composer */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {/* Template + AI bar */}
                    <div className="flex items-center gap-2">
                      <Select value={selectedTemplate} onValueChange={applyTemplate}>
                        <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                          <SelectValue placeholder="Choose template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATES.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={aiSuggesting}
                        className="h-8 text-xs bg-gradient-to-r from-violet-50 to-blue-50 border-violet-200 text-violet-700 hover:from-violet-100 hover:to-blue-100">
                        <Sparkles className="size-3" />
                        {aiSuggesting ? "Thinking..." : "AI Suggests"}
                      </Button>
                      {selectedConvo?.channel === "sms" && (
                        <span className={`text-[10px] ml-auto ${composerText.length > 320 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {composerText.length}/320
                        </span>
                      )}
                    </div>
                    <Textarea
                      placeholder={`Type your ${selectedConvo?.channel ?? "sms"} message...`}
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      rows={3}
                      className="bg-background resize-none text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Messages save as drafts. Approve to send via {selectedConvo?.channel === "email" ? "Resend" : "Twilio"}.
                      </span>
                      <Button onClick={handleSend} disabled={sendingMsg || !composerText.trim()} size="sm"
                        className="bg-blue-600 hover:bg-blue-700">
                        <Send className="size-3.5" />
                        {sendingMsg ? "Saving..." : "Save Draft"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a conversation to view messages and compose replies</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contextual Right Panel */}
          <div className="lg:col-span-3 space-y-4">
            {selectedConvo && (
              <>
                {/* Seller info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <User className="size-3.5" /> Seller Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{selectedConvo.sellerName || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedConvo.sellerPhone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel</span>
                      <span className="font-medium capitalize">{selectedConvo.channel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sentiment</span>
                      <Badge variant="outline" className={`text-[8px] capitalize ${
                        selectedConvo.sentiment === "motivated" ? "border-emerald-300 text-emerald-600"
                        : selectedConvo.sentiment === "neutral" ? "border-amber-300 text-amber-600"
                        : selectedConvo.sentiment === "hesitant" ? "border-orange-300 text-orange-600"
                        : "border-border"
                      }`}>{selectedConvo.sentiment ?? "unknown"}</Badge>
                    </div>
                    {selectedConvo.negotiationPosition && (
                      <div className="pt-1 border-t border-border">
                        <span className="text-muted-foreground">Negotiation</span>
                        <p className="text-xs mt-0.5">{selectedConvo.negotiationPosition}</p>
                      </div>
                    )}
                    {selectedConvo.recommendedOffer && (
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-muted-foreground">Rec. Offer</span>
                        <span className="font-medium text-emerald-600">${selectedConvo.recommendedOffer.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedConvo.confidence != null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium">{Math.round(selectedConvo.confidence * 100)}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Linked listing */}
                {linkedListing && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Car className="size-3.5" /> Linked Vehicle
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1.5">
                      <div className="font-medium text-sm">{linkedListing.title}</div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="size-3" /> Price</span>
                        <span className="font-medium">${linkedListing.price.toLocaleString()}</span>
                      </div>
                      {linkedListing.km && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Odometer</span>
                          <span className="font-medium">{linkedListing.km.toLocaleString()} km</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Location</span>
                        <span className="font-medium">{linkedListing.suburb ?? ""} {linkedListing.state ?? ""}</span>
                      </div>
                      {linkedListing.dealScore && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deal Score</span>
                          <Badge variant="outline" className={`text-[10px] ${
                            linkedListing.dealScore >= 7 ? "border-emerald-300 text-emerald-600"
                            : linkedListing.dealScore >= 4 ? "border-amber-300 text-amber-600"
                            : "border-red-300 text-red-600"
                          }`}>{linkedListing.dealScore}/10</Badge>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source</span>
                        <a href={linkedListing.sourceUrl} target="_blank" rel="noopener"
                          className="text-blue-600 hover:underline flex items-center gap-0.5">
                          {linkedListing.source} <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!selectedConvo && (
              <Card>
                <CardContent className="py-8 text-center">
                  <User className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Select a conversation to see seller and vehicle details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageCircle className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold mb-1">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Messages from Closer SMS outreach and Responder email replies will appear here. Run Hunter to find listings, then use Closer to reach out to sellers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
