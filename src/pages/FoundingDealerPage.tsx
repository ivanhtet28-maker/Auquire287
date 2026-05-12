import { useMutation } from "convex/react";
import { ArrowLeft, Check, Loader2, Rocket, Shield, Star, Zap } from "lucide-react";
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
import { api } from "../../convex/_generated/api";

export function FoundingDealerPage() {
  const submitLead = useMutation(api.demoLeads.submit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dealershipName: "",
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
        painPoints: form.painPoints || undefined,
        source: "founding_dealer",
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
          <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Check className="size-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application received!</h1>
          <p className="text-muted-foreground mb-6">
            Thanks {form.name}! We'll review your application and be in touch
            within 24 hours. Founding dealer spots are filling fast.
          </p>
          <Button variant="outline" className="border-border" asChild>
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
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs font-medium text-amber-600 mb-4">
            <Rocket className="size-3" />
            Only 7 spots remaining
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Founding Dealer Program
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be one of the first 10 dealerships on Auquire. Lock in $1,997/month
            for life — including every future module.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, label: "Price locked for life", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Star, label: "All future modules", color: "text-amber-600", bg: "bg-amber-50" },
            { icon: Zap, label: "Direct founder access", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((b) => (
            <div key={b.label} className="text-center p-3 rounded-xl border border-border bg-card">
              <div className={`size-8 rounded-lg ${b.bg} flex items-center justify-center mx-auto mb-2`}>
                <b.icon className={`size-4 ${b.color}`} />
              </div>
              <div className="text-xs font-medium">{b.label}</div>
            </div>
          ))}
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
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="04xx xxx xxx"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Why Auquire? (optional)</Label>
                <Textarea
                  placeholder="Tell us about your dealership and what excites you about Auquire..."
                  value={form.painPoints}
                  onChange={(e) => setForm((f) => ({ ...f, painPoints: e.target.value }))}
                  rows={3}
                  className="bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-11"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Apply for Founding Dealer
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-[11px] text-muted-foreground">
                  $1,997/month · No lock-in contract · Cancel anytime · Price locked for life
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
