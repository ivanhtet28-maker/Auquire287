import { useAction, useMutation, useQuery } from "convex/react";
import {
  MessageSquare,
  Send,
  Loader2,
  Play,
  Copy,
  Check,
  Car,
  Calendar,
  Clock,
  Link,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

// Pre-defined test-drive time slots (AEST business hours)
const TIME_SLOTS = [
  { value: "today-10am", label: "Today 10:00am" },
  { value: "today-2pm", label: "Today 2:00pm" },
  { value: "today-4pm", label: "Today 4:00pm" },
  { value: "tomorrow-10am", label: "Tomorrow 10:00am" },
  { value: "tomorrow-2pm", label: "Tomorrow 2:00pm" },
  { value: "tomorrow-4pm", label: "Tomorrow 4:00pm" },
  { value: "saturday-10am", label: "Saturday 10:00am" },
  { value: "saturday-1pm", label: "Saturday 1:00pm" },
];

export function ResponderPage() {
  const enquiries = useQuery(api.enquiries.list, {});
  const listings = useQuery(api.listings.list, { limit: 50 });
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName: "responder" });
  const createEnquiry = useMutation(api.enquiries.create);
  const runResponder = useAction(api.agents.responder.run);
  const [enquiryText, setEnquiryText] = useState("");
  const [senderName, setSenderName] = useState("");
  const [vehicleRef, setVehicleRef] = useState("");
  const [linkedListingId, setLinkedListingId] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleDraftReply = async () => {
    if (!enquiryText) { toast.error("Please paste an enquiry to draft a reply"); return; }
    setIsProcessing(true);
    toast.info("Creating enquiry and drafting replies...");
    try {
      // Build test-drive slots string
      const slotsStr = selectedSlots.length > 0
        ? selectedSlots.map((s) => TIME_SLOTS.find((t) => t.value === s)?.label ?? s).join(", ")
        : undefined;

      await createEnquiry({
        channel: "email",
        senderName: senderName || undefined,
        body: enquiryText,
        subject: vehicleRef || undefined,
        listingId: linkedListingId || undefined,
        testDriveSlots: slotsStr,
      });

      await runResponder({ trigger: "manual" });
      toast.success("Drafts ready! Check below.");
      setEnquiryText(""); setSenderName(""); setVehicleRef("");
      setLinkedListingId(""); setSelectedSlots([]);
    } catch (err) {
      toast.error(`Responder failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setIsProcessing(false); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = enquiries?.filter((e: { status: string }) => e.status === "pending").length ?? 0;
  const draftedCount = enquiries?.filter((e: { status: string }) => e.status === "drafted").length ?? 0;
  const sentCount = enquiries?.filter((e: { status: string }) => e.status === "sent").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <MessageSquare className="size-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Responder</h1>
          <p className="text-sm text-muted-foreground">Lead response agent — reply to enquiries in 60 seconds</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-xl font-bold text-violet-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Drafted</div>
            <div className="text-xl font-bold text-amber-600">{draftedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Sent</div>
            <div className="text-xl font-bold text-emerald-600">{sentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stream */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-violet-200 bg-violet-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-violet-600" /> Drafting...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-2"><span className="text-violet-600/60">›</span>{msg}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual enquiry input */}
      <Card>
        <CardHeader>
          <CardTitle>Draft a Reply</CardTitle>
          <CardDescription>
            Paste an inbound enquiry. Responder generates 3 personalised reply variants with test-drive slots and a follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name (optional)</Label>
              <Input placeholder="e.g. John Smith" value={senderName}
                onChange={(e) => setSenderName(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Reference (optional)</Label>
              <Input placeholder="e.g. 2021 Toyota Hilux SR5" value={vehicleRef}
                onChange={(e) => setVehicleRef(e.target.value)} className="bg-background" />
            </div>
          </div>

          {/* Link to inventory listing */}
          {listings && listings.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link className="size-3" /> Link Vehicle from Inventory
              </Label>
              <Select value={linkedListingId} onValueChange={setLinkedListingId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a listing (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {listings.slice(0, 20).map((l: { _id: string; title: string; price: number }) => (
                    <SelectItem key={l._id} value={l._id}>
                      {l.title} — ${l.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Customer Enquiry</Label>
            <Textarea placeholder="Paste the customer's message here..." value={enquiryText}
              onChange={(e) => setEnquiryText(e.target.value)} rows={5} className="bg-background" />
          </div>

          {/* Test-drive time slot selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Calendar className="size-3" /> Available Test-Drive Slots
            </Label>
            <p className="text-xs text-muted-foreground">Select times to offer the customer. These will be included in the reply drafts.</p>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((slot) => (
                <button type="button" key={slot.value} onClick={() => toggleSlot(slot.value)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                    selectedSlots.includes(slot.value)
                      ? "bg-violet-600 text-white"
                      : "bg-card border border-border text-muted-foreground hover:bg-accent"
                  }`}>
                  <Clock className="size-3" />{slot.label}
                </button>
              ))}
            </div>
            {selectedSlots.length > 0 && (
              <div className="text-xs text-violet-600 font-medium">
                {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          <Button onClick={handleDraftReply} disabled={isProcessing} className="bg-violet-600 hover:bg-violet-700">
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Draft Reply
          </Button>
        </CardContent>
      </Card>

      {/* Drafted Enquiries */}
      {enquiries && enquiries.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Enquiries & Drafts</h2>
          {enquiries.map((enquiry: {
            _id: string; _creationTime: number; senderName?: string;
            body: string; channel: string; status: string; subject?: string;
            draftPrimary?: string; draftAlt1?: string; draftAlt2?: string;
            followUpDraft?: string; testDriveSlots?: string; listingId?: string;
          }) => (
            <Card key={enquiry._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{enquiry.senderName || "Unknown sender"}</CardTitle>
                    <Badge variant="outline" className={`text-[10px] capitalize ${
                      enquiry.status === "drafted" ? "border-amber-300 text-amber-600"
                      : enquiry.status === "sent" ? "border-emerald-300 text-emerald-600"
                      : "border-violet-300 text-violet-600"
                    }`}>{enquiry.status}</Badge>
                    <Badge variant="outline" className="text-[10px] border-border">{enquiry.channel}</Badge>
                    {enquiry.subject && (
                      <Badge variant="outline" className="text-[10px] border-border flex items-center gap-0.5">
                        <Car className="size-2.5" /> {enquiry.subject}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(enquiry._creationTime).toLocaleString("en-AU")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Original enquiry */}
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">Original Enquiry</div>
                  <p className="text-sm">{enquiry.body}</p>
                </div>

                {/* Test-drive slots */}
                {enquiry.testDriveSlots && (
                  <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-violet-50 border border-violet-100">
                    <Calendar className="size-3 text-violet-600" />
                    <span className="text-muted-foreground">Test-drive slots offered:</span>
                    <span className="font-medium text-violet-700">{enquiry.testDriveSlots}</span>
                  </div>
                )}

                {/* Draft variants */}
                {enquiry.draftPrimary && (
                  <div className="space-y-2">
                    {[
                      { label: "Professional", text: enquiry.draftPrimary, id: "p" },
                      { label: "Friendly", text: enquiry.draftAlt1, id: "a1" },
                      { label: "Direct", text: enquiry.draftAlt2, id: "a2" },
                    ].filter((v) => v.text).map((variant) => (
                      <div key={variant.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-violet-600 uppercase">{variant.label}</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2"
                            onClick={() => handleCopy(variant.text!, `${enquiry._id}-${variant.id}`)}>
                            {copiedId === `${enquiry._id}-${variant.id}` ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{variant.text}</p>
                      </div>
                    ))}

                    {enquiry.followUpDraft && (
                      <div className="border border-dashed border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-amber-600 uppercase">48h Follow-up</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2"
                            onClick={() => handleCopy(enquiry.followUpDraft!, `${enquiry._id}-fu`)}>
                            {copiedId === `${enquiry._id}-fu` ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{enquiry.followUpDraft}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Send buttons */}
                {enquiry.status === "drafted" && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="border-border" disabled>
                      <Send className="size-3" /> Send via Email (Resend)
                    </Button>
                    <Button size="sm" variant="outline" className="border-border" disabled>
                      <MessageSquare className="size-3" /> Send via SMS (Twilio)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No pending enquiries. Paste one above or connect your enquiry inbox.</p>
            <p className="text-xs text-muted-foreground mt-1">Auto-replies trigger when you forward emails to your Auquire inbox.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
