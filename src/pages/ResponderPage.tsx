import { MessageSquare, Send } from "lucide-react";
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
import { toast } from "sonner";

export function ResponderPage() {
  const [enquiryText, setEnquiryText] = useState("");
  const [vehicleRef, setVehicleRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDraftReply = async () => {
    if (!enquiryText) {
      toast.error("Please paste an enquiry to draft a reply");
      return;
    }
    setIsProcessing(true);
    toast.info("Responder is drafting replies...");
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Drafts ready!");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-violet-400/10 flex items-center justify-center">
          <MessageSquare className="size-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Responder</h1>
          <p className="text-sm text-muted-foreground">
            Lead response agent — reply to enquiries in 60 seconds
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-xl font-bold text-violet-400">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Drafted</div>
            <div className="text-xl font-bold text-amber-400">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Sent</div>
            <div className="text-xl font-bold text-emerald-400">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Manual enquiry input */}
      <Card>
        <CardHeader>
          <CardTitle>Draft a Reply</CardTitle>
          <CardDescription>
            Paste an inbound enquiry. Responder will generate 3 personalised reply
            variants, suggest test-drive times, and draft a 24h follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Vehicle Reference (optional)</Label>
            <Input
              placeholder="e.g. 2021 Toyota Hilux SR5"
              value={vehicleRef}
              onChange={(e) => setVehicleRef(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label>Customer Enquiry</Label>
            <Textarea
              placeholder="Paste the customer's message here..."
              value={enquiryText}
              onChange={(e) => setEnquiryText(e.target.value)}
              rows={5}
              className="bg-background"
            />
          </div>
          <Button
            onClick={handleDraftReply}
            disabled={isProcessing}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Send className="size-4" />
            Draft Reply
          </Button>
        </CardContent>
      </Card>

      {/* Pending drafts */}
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No pending enquiries. Paste one above or connect your enquiry inbox.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-replies trigger when you forward emails to your Auquire inbox.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
