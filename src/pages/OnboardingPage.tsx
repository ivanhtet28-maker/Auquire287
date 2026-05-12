import { useMutation } from "convex/react";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Settings,
  Zap,
  Target,
  Rocket,
  Car,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const AUS_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const BODY_TYPES = ["Sedan", "SUV", "Ute", "Hatchback", "Wagon", "Coupe", "Van"];
const POPULAR_MAKES = [
  "Toyota", "Mazda", "Hyundai", "Kia", "Ford", "Holden",
  "Mitsubishi", "Subaru", "Nissan", "Honda", "Volkswagen", "BMW",
  "Mercedes-Benz", "Audi", "Isuzu", "Suzuki",
];

const STEPS = [
  { id: 1, label: "Dealership", icon: Building2 },
  { id: 2, label: "Buy Box", icon: Target },
  { id: 3, label: "Connect", icon: Link2 },
  { id: 4, label: "Agents", icon: Zap },
  { id: 5, label: "First Hunt", icon: Rocket },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const saveSettings = useMutation(api.dealershipSettings.save);
  const saveIntegrations = useMutation(api.dealershipSettings.saveIntegrations);
  const saveSchedules = useMutation(api.dealershipSettings.saveSchedules);
  const createBuyBox = useMutation(api.buyBoxes.create);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Dealership Info
  const [dealership, setDealership] = useState({
    dealershipName: "",
    tradingName: "",
    contactEmail: "",
    contactPhone: "",
    abn: "",
    suburb: "",
    state: "",
    postcode: "",
    carsalesDealerUrl: "",
  });

  // Step 2: Buy Box
  const [buyBox, setBuyBox] = useState({
    name: "My First Buy Box",
    makes: [] as string[],
    yearMin: "2016",
    yearMax: "2025",
    priceMin: "8000",
    priceMax: "45000",
    kmMax: "150000",
    states: [] as string[],
    bodyTypes: [] as string[],
  });

  // Step 3: Integrations
  const [integrations, setIntegrations] = useState({
    twilioSid: "",
    twilioToken: "",
    twilioPhone: "",
    resendKey: "",
    resendFrom: "",
    gmailConnected: false,
    fbConnected: false,
  });

  // Step 4: Agent toggles
  const [agents, setAgents] = useState({
    hunterEnabled: true,
    brieferEnabled: true,
    listerEnabled: false,
    closerEnabled: false,
  });

  // Step 5: Hunt status
  const [huntStarted, setHuntStarted] = useState(false);
  const [huntComplete, setHuntComplete] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        if (!dealership.dealershipName || !dealership.contactEmail) {
          toast.error("Dealership name and email are required");
          setSaving(false);
          return;
        }
        await saveSettings(dealership);
        toast.success("Dealership info saved!");
      }
      if (step === 2) {
        if (buyBox.makes.length === 0) {
          toast.error("Select at least one make");
          setSaving(false);
          return;
        }
        await createBuyBox({
          name: buyBox.name,
          makes: buyBox.makes,
          models: [],
          yearMin: Number(buyBox.yearMin),
          yearMax: Number(buyBox.yearMax),
          priceMin: Number(buyBox.priceMin),
          priceMax: Number(buyBox.priceMax),
          kmMax: Number(buyBox.kmMax),
          states: buyBox.states.length > 0 ? buyBox.states : AUS_STATES,
          bodyTypes: buyBox.bodyTypes.length > 0 ? buyBox.bodyTypes : BODY_TYPES,
          transmissions: [],
          fuelTypes: [],
          excludeKeywords: [],
        });
        toast.success("Buy box created!");
      }
      if (step === 3) {
        if (integrations.twilioSid || integrations.resendKey) {
          await saveIntegrations({
            twilioAccountSid: integrations.twilioSid || undefined,
            twilioAuthToken: integrations.twilioToken || undefined,
            twilioPhoneNumber: integrations.twilioPhone || undefined,
            resendApiKey: integrations.resendKey || undefined,
            resendFromEmail: integrations.resendFrom || undefined,
          });
          toast.success("Integration keys saved!");
        }
      }
      if (step === 4) {
        await saveSchedules({
          hunterScheduleEnabled: agents.hunterEnabled,
          brieferScheduleEnabled: agents.brieferEnabled,
          listerScheduleEnabled: agents.listerEnabled,
          closerFollowUpEnabled: agents.closerEnabled,
        });
        toast.success("Agent preferences saved!");
      }
      setStep(step + 1);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleStartHunt = async () => {
    setHuntStarted(true);
    // Simulate hunt progress
    setTimeout(() => setHuntComplete(true), 3000);
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-sky-500" />
          <span className="text-xl font-bold text-slate-900">Auquire</span>
          <Badge variant="outline" className="text-sky-600 border-sky-300 bg-sky-50 ml-2">
            Setup Wizard
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          Skip for now
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-8 pt-8">
        <div className="flex items-center justify-between mb-12">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isDone
                        ? "bg-sky-500 border-sky-500 text-white"
                        : isActive
                          ? "bg-white border-sky-500 text-sky-600"
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs font-medium mt-2 ${
                      isActive ? "text-sky-600" : isDone ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-24 h-0.5 mx-2 mt-[-18px] ${
                      step > s.id ? "bg-sky-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-8 pb-24">
        {/* STEP 1: Dealership Info */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tell us about your dealership</h2>
            <p className="text-slate-500 mb-8">
              This helps us personalise your experience and configure outreach.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label>Dealership Name *</Label>
                <Input
                  value={dealership.dealershipName}
                  onChange={(e) =>
                    setDealership({ ...dealership, dealershipName: e.target.value })
                  }
                  placeholder="e.g. Sydney Auto Centre"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Trading Name</Label>
                <Input
                  value={dealership.tradingName}
                  onChange={(e) =>
                    setDealership({ ...dealership, tradingName: e.target.value })
                  }
                  placeholder="If different from above"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ABN</Label>
                <Input
                  value={dealership.abn}
                  onChange={(e) =>
                    setDealership({ ...dealership, abn: e.target.value })
                  }
                  placeholder="XX XXX XXX XXX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  value={dealership.contactEmail}
                  onChange={(e) =>
                    setDealership({ ...dealership, contactEmail: e.target.value })
                  }
                  placeholder="you@dealership.com.au"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={dealership.contactPhone}
                  onChange={(e) =>
                    setDealership({ ...dealership, contactPhone: e.target.value })
                  }
                  placeholder="04XX XXX XXX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Suburb</Label>
                <Input
                  value={dealership.suburb}
                  onChange={(e) =>
                    setDealership({ ...dealership, suburb: e.target.value })
                  }
                  placeholder="e.g. Parramatta"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>State</Label>
                <Select
                  value={dealership.state}
                  onValueChange={(v) => setDealership({ ...dealership, state: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUS_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Postcode</Label>
                <Input
                  value={dealership.postcode}
                  onChange={(e) =>
                    setDealership({ ...dealership, postcode: e.target.value })
                  }
                  placeholder="2000"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Carsales Dealer URL</Label>
                <Input
                  value={dealership.carsalesDealerUrl}
                  onChange={(e) =>
                    setDealership({ ...dealership, carsalesDealerUrl: e.target.value })
                  }
                  placeholder="https://www.carsales.com.au/dealer/..."
                  className="mt-1"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Used by the Lister agent to audit your current inventory
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: First Buy Box */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Create your first Buy Box
            </h2>
            <p className="text-slate-500 mb-8">
              Tell Hunter what cars to look for. Most dealers start with SUVs under $40k — adjust
              to your&nbsp;sweet&nbsp;spot.
            </p>

            <div className="space-y-6">
              <div>
                <Label>Buy Box Name</Label>
                <Input
                  value={buyBox.name}
                  onChange={(e) => setBuyBox({ ...buyBox, name: e.target.value })}
                  placeholder="e.g. SUVs Under $40k"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="mb-3 block">Makes (select one or more) *</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_MAKES.map((make) => (
                    <button
                      key={make}
                      onClick={() => {
                        const arr = buyBox.makes.includes(make)
                          ? buyBox.makes.filter((m) => m !== make)
                          : [...buyBox.makes, make];
                        setBuyBox({ ...buyBox, makes: arr });
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        buyBox.makes.includes(make)
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-white text-slate-600 border-slate-300 hover:border-sky-300"
                      }`}
                    >
                      {make}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Year Min</Label>
                  <Input
                    type="number"
                    value={buyBox.yearMin}
                    onChange={(e) => setBuyBox({ ...buyBox, yearMin: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Year Max</Label>
                  <Input
                    type="number"
                    value={buyBox.yearMax}
                    onChange={(e) => setBuyBox({ ...buyBox, yearMax: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price Min ($)</Label>
                  <Input
                    type="number"
                    value={buyBox.priceMin}
                    onChange={(e) => setBuyBox({ ...buyBox, priceMin: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price Max ($)</Label>
                  <Input
                    type="number"
                    value={buyBox.priceMax}
                    onChange={(e) => setBuyBox({ ...buyBox, priceMax: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Max KMs</Label>
                  <Input
                    type="number"
                    value={buyBox.kmMax}
                    onChange={(e) => setBuyBox({ ...buyBox, kmMax: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">States (leave empty for all)</Label>
                <div className="flex flex-wrap gap-2">
                  {AUS_STATES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const arr = buyBox.states.includes(s)
                          ? buyBox.states.filter((x) => x !== s)
                          : [...buyBox.states, s];
                        setBuyBox({ ...buyBox, states: arr });
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        buyBox.states.includes(s)
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-white text-slate-600 border-slate-300 hover:border-sky-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Body Types (leave empty for all)</Label>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPES.map((bt) => (
                    <button
                      key={bt}
                      onClick={() => {
                        const arr = buyBox.bodyTypes.includes(bt)
                          ? buyBox.bodyTypes.filter((x) => x !== bt)
                          : [...buyBox.bodyTypes, bt];
                        setBuyBox({ ...buyBox, bodyTypes: arr });
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        buyBox.bodyTypes.includes(bt)
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-white text-slate-600 border-slate-300 hover:border-sky-300"
                      }`}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Connect Channels */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect your channels</h2>
            <p className="text-slate-500 mb-8">
              Link your communication channels so agents can send messages on your behalf. You can
              skip this and set up later in Settings.
            </p>

            <div className="space-y-4">
              {/* Gmail OAuth */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gmail</CardTitle>
                        <CardDescription>
                          Pull enquiry emails into Inbox, send replies from your address
                        </CardDescription>
                      </div>
                    </div>
                    {integrations.gmailConnected ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIntegrations({ ...integrations, gmailConnected: true });
                          toast.success("Gmail connected! (Demo mode)");
                        }}
                      >
                        Connect Gmail
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Facebook / Meta OAuth */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Facebook Marketplace</CardTitle>
                        <CardDescription>
                          Capture leads from FB Marketplace, post listings automatically
                        </CardDescription>
                      </div>
                    </div>
                    {integrations.fbConnected ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIntegrations({ ...integrations, fbConnected: true });
                          toast.success("Facebook connected! (Demo mode)");
                        }}
                      >
                        Connect Facebook
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Twilio SMS */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Phone / SMS (Twilio)</CardTitle>
                      <CardDescription>
                        Send and receive SMS from your dealership number
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Account SID</Label>
                      <Input
                        value={integrations.twilioSid}
                        onChange={(e) =>
                          setIntegrations({ ...integrations, twilioSid: e.target.value })
                        }
                        placeholder="ACxxxxxxx"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Auth Token</Label>
                      <Input
                        type="password"
                        value={integrations.twilioToken}
                        onChange={(e) =>
                          setIntegrations({ ...integrations, twilioToken: e.target.value })
                        }
                        placeholder="••••••••"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      value={integrations.twilioPhone}
                      onChange={(e) =>
                        setIntegrations({ ...integrations, twilioPhone: e.target.value })
                      }
                      placeholder="+61400000000"
                      className="mt-1 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Resend Email */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Resend (Transactional Email)</CardTitle>
                      <CardDescription>
                        For automated emails when Gmail isn't connected
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">API Key</Label>
                      <Input
                        value={integrations.resendKey}
                        onChange={(e) =>
                          setIntegrations({ ...integrations, resendKey: e.target.value })
                        }
                        placeholder="re_xxxxxxx"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">From Email</Label>
                      <Input
                        type="email"
                        value={integrations.resendFrom}
                        onChange={(e) =>
                          setIntegrations({ ...integrations, resendFrom: e.target.value })
                        }
                        placeholder="noreply@yourdomain.com.au"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* STEP 4: Agent Preferences */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Choose your AI agents
            </h2>
            <p className="text-slate-500 mb-8">
              Enable the agents you want running automatically. You can always trigger any agent
              manually from the dashboard.
            </p>

            <div className="space-y-4">
              {[
                {
                  key: "hunterEnabled" as const,
                  name: "Hunter",
                  desc: "Scans Carsales, Gumtree & Facebook every 4 hours for cars matching your buy box",
                  schedule: "Every 4 hours (6am, 10am, 2pm, 6pm, 10pm AEST)",
                  recommended: true,
                },
                {
                  key: "brieferEnabled" as const,
                  name: "Briefer",
                  desc: "Sends you a morning briefing with pipeline stats, top opportunities & market trends",
                  schedule: "Daily at 6:00am AEST",
                  recommended: true,
                },
                {
                  key: "listerEnabled" as const,
                  name: "Lister",
                  desc: "Audits your Carsales inventory against live market data, suggests repricing",
                  schedule: "Weekly — Monday 7:00am AEST",
                  recommended: false,
                },
                {
                  key: "closerEnabled" as const,
                  name: "Closer",
                  desc: "Auto-follows up with sellers you've contacted if no reply after 48 hours",
                  schedule: "Checks daily at 9:00am AEST",
                  recommended: false,
                },
              ].map((agent) => (
                <Card
                  key={agent.key}
                  className={`cursor-pointer transition-colors ${
                    agents[agent.key] ? "border-sky-300 bg-sky-50/50" : ""
                  }`}
                  onClick={() => setAgents({ ...agents, [agent.key]: !agents[agent.key] })}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            agents[agent.key]
                              ? "bg-sky-500 border-sky-500"
                              : "border-slate-300"
                          }`}
                        >
                          {agents[agent.key] && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        {agent.recommended && (
                          <Badge variant="outline" className="text-sky-600 border-sky-300 bg-sky-50 text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-1">{agent.desc}</p>
                    <p className="text-xs text-slate-400">
                      <Settings className="h-3 w-3 inline mr-1" />
                      {agent.schedule}
                    </p>
                  </CardContent>
                </Card>
              ))}

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-slate-600">
                  <strong>Scout, Responder & Closer</strong> are always available on-demand from the
                  dashboard. The toggles above control <em>automatic scheduled</em> runs only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: First Hunt */}
        {step === 5 && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Ready to find your first deals?
            </h2>
            <p className="text-slate-500 mb-12 max-w-lg mx-auto">
              Hunter will scan Carsales, Gumtree, and Facebook Marketplace using your buy box
              criteria. Results appear in your dashboard within minutes.
            </p>

            {!huntStarted && (
              <Button
                size="lg"
                className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-6 text-lg"
                onClick={handleStartHunt}
              >
                <Search className="h-5 w-5 mr-2" />
                Start First Hunt
              </Button>
            )}

            {huntStarted && !huntComplete && (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-sky-100 flex items-center justify-center animate-pulse">
                  <Search className="h-10 w-10 text-sky-500" />
                </div>
                <div className="space-y-3 max-w-md mx-auto">
                  {[
                    "Scanning Carsales.com.au...",
                    "Scanning Gumtree Autos...",
                    "Scanning Facebook Marketplace...",
                  ].map((msg, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-sky-500 animate-ping" />
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {huntComplete && (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Hunt complete!</p>
                  <p className="text-slate-500 mt-1">
                    Hunter has been triggered and is scanning now. Results will appear on your
                    dashboard shortly.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-sky-500 hover:bg-sky-600 text-white px-8"
                  onClick={handleFinish}
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              {step === 3 && (
                <Button variant="ghost" onClick={() => setStep(step + 1)}>
                  Skip for now
                </Button>
              )}
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white px-6"
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? "Saving..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
