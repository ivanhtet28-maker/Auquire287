import { useQuery } from "convex/react";
import {
  Inbox,
  MessageCircle,
  Mail,
  Phone,
  User,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function InboxPage() {
  const conversations = useQuery(api.conversations.list, {});
  const enquiries = useQuery(api.enquiries.list, {});
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | "sms" | "email">(
    "all"
  );

  const selectedMessages = useQuery(
    api.conversationMessages.listByConversation,
    selectedConvoId
      ? { conversationId: selectedConvoId as Id<"conversations"> }
      : "skip"
  );

  const filteredConversations = conversations?.filter(
    (c: { channel: string }) =>
      channelFilter === "all" || c.channel === channelFilter
  );

  const smsCount =
    conversations?.filter((c: { channel: string }) => c.channel === "sms")
      .length ?? 0;
  const emailCount =
    conversations?.filter((c: { channel: string }) => c.channel === "email")
      .length ?? 0;
  const enquiryCount = enquiries?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Inbox className="size-5 text-blue-600" />
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
          {
            label: "All",
            icon: Inbox,
            count: (conversations?.length ?? 0) + enquiryCount,
            value: "all" as const,
          },
          {
            label: "SMS",
            icon: Phone,
            count: smsCount,
            value: "sms" as const,
          },
          {
            label: "Email",
            icon: Mail,
            count: emailCount + enquiryCount,
            value: "email" as const,
          },
        ].map((ch) => (
          <button
            type="button"
            key={ch.label}
            onClick={() => setChannelFilter(ch.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              channelFilter === ch.value
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-border bg-card hover:bg-accent"
            }`}
          >
            <ch.icon className="size-3.5 text-muted-foreground" />
            {ch.label}
            <Badge variant="outline" className="text-[10px] border-border ml-1">
              {ch.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Conversations + Messages Split View */}
      {(filteredConversations && filteredConversations.length > 0) ||
      (enquiries && enquiries.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Thread List */}
          <div className="lg:col-span-1 space-y-2">
            {/* Closer conversations */}
            {filteredConversations?.map(
              (convo: {
                _id: string;
                _creationTime: number;
                sellerName?: string;
                sellerPhone?: string;
                channel: string;
                status: string;
                sentiment?: string;
                recommendedNextMessage?: string;
              }) => (
                <div
                  key={convo._id}
                  onClick={() => setSelectedConvoId(convo._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedConvoId === convo._id
                      ? "border-blue-300 bg-blue-50"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-pink-50 flex items-center justify-center">
                        <User className="size-3.5 text-pink-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {convo.sellerName || "Unknown Seller"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {convo.channel === "sms" ? (
                            <Phone className="size-2.5" />
                          ) : (
                            <Mail className="size-2.5" />
                          )}
                          {convo.sellerPhone || convo.channel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[8px] capitalize ${
                          convo.status === "draft"
                            ? "border-amber-300 text-amber-600"
                            : convo.status === "active"
                              ? "border-emerald-300 text-emerald-600"
                              : "border-border"
                        }`}
                      >
                        {convo.status}
                      </Badge>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </div>
                  </div>
                  {convo.recommendedNextMessage && (
                    <p className="text-xs text-muted-foreground mt-1 truncate ml-9">
                      {convo.recommendedNextMessage.slice(0, 60)}...
                    </p>
                  )}
                </div>
              )
            )}

            {/* Enquiry threads */}
            {(channelFilter === "all" || channelFilter === "email") &&
              enquiries?.map(
                (enq: {
                  _id: string;
                  _creationTime: number;
                  senderName?: string;
                  channel: string;
                  status: string;
                  body: string;
                }) => (
                  <div
                    key={enq._id}
                    className="p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-violet-50 flex items-center justify-center">
                        <MessageCircle className="size-3.5 text-violet-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {enq.senderName || "Enquiry"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Inbound {enq.channel}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[8px] ml-auto capitalize ${
                          enq.status === "drafted"
                            ? "border-amber-300 text-amber-600"
                            : enq.status === "pending"
                              ? "border-violet-300 text-violet-600"
                              : "border-border"
                        }`}
                      >
                        {enq.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate ml-9">
                      {enq.body.slice(0, 60)}...
                    </p>
                  </div>
                )
              )}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedConvoId && selectedMessages ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-xs text-muted-foreground uppercase mb-2">
                    Conversation Messages
                  </div>
                  {selectedMessages.length > 0 ? (
                    selectedMessages.map(
                      (msg: {
                        _id: string;
                        direction: string;
                        channel: string;
                        body: string;
                        sentAt: number;
                        status: string;
                      }) => (
                        <div
                          key={msg._id}
                          className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              msg.direction === "outbound"
                                ? "bg-pink-600 text-white"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-[8px] ${msg.direction === "outbound" ? "border-white/30 text-white/80" : "border-border"}`}
                              >
                                {msg.channel} · {msg.status}
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.body}
                            </p>
                            <div
                              className={`text-[10px] mt-1 ${msg.direction === "outbound" ? "text-white/60" : "text-muted-foreground"}`}
                            >
                              <Clock className="size-2.5 inline mr-0.5" />
                              {new Date(msg.sentAt).toLocaleString("en-AU")}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages in this conversation yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageCircle className="size-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Select a conversation from the left to view messages
                  </p>
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
              Messages from Closer SMS outreach and Responder email replies will
              appear here. Run Hunter to find listings, then use Closer to reach
              out to sellers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
