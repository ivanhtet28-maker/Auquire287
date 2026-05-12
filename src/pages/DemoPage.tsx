import { useMutation } from "convex/react";
import { ArrowLeft, Calendar, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";

export function DemoPage() {
  const submitLead = useMutation(api.demoLeads.submit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dealershipName: "",
    rooftopCount: "",
    monthlyVolume: "",
    painPoints: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.dealershipName) return;
    setIsSubmitting(true);
    try {
      await submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        dealershipName: form.dealershipName,
        rooftopCount: form.rooftopCount ? Number(form.rooftopCount) : undefined,
        monthlyVolume: form.monthlyVolume || undefined,
        painPoints: form.painPoints || undefined,
        source: "demo",
      });
      setSubmitted(true);
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <div className="size-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-6">
            <Check className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Demo request received!</h1>
          <p className="text-muted-foreground mb-6">
            Thanks {form.name}! We'll be in touch within 24 hours to schedule your
            personalised demo. Check your email for a confirmation.
          </p>
          <Button variant="outline" className="border-white/10" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-xs font-medium text-blue-400 mb-4">
            <Calendar className="size-3" />
            15-minute personalised demo
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Book a Demo
          </h1>
          <p className="text-muted-foreground">
            See how Auquire's 6 AI agents can transform your used car acquisition.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input
                    required
                    placeholder="John Smith"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="john@dealer.com.au"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="04xx xxx xxx"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dealership Name *</Label>
                  <Input
                    required
                    placeholder="Your dealer name"
                    value={form.dealershipName}
                    onChange={(e) => setForm((f) => ({ ...f, dealershipName: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Rooftops</Label>
                  <Select
                    value={form.rooftopCount}
                    onValueChange={(v) => setForm((f) => ({ ...f, rooftopCount: v }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2-3</SelectItem>
                      <SelectItem value="5">4-5</SelectItem>
                      <SelectItem value="10">6-10</SelectItem>
                      <SelectItem value="20">10+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Volume</Label>
                  <Select
                    value={form.monthlyVolume}
                    onValueChange={(v) => setForm((f) => ({ ...f, monthlyVolume: v }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 cars</SelectItem>
                      <SelectItem value="10-30">10-30 cars</SelectItem>
                      <SelectItem value="30-50">30-50 cars</SelectItem>
                      <SelectItem value="50+">50+ cars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Biggest Pain Point (optional)</Label>
                <Textarea
                  placeholder="e.g. 'We're spending too much at auction' or 'Can't respond to leads fast enough'"
                  value={form.painPoints}
                  onChange={(e) => setForm((f) => ({ ...f, painPoints: e.target.value }))}
                  rows={3}
                  className="bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Book My Demo"
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                No credit card required. We'll email you to confirm a time.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
