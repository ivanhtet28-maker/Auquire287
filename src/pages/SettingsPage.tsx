import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Calendar,
  Check,
  CreditCard,
  Key,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
  Activity,
  Clock,
  Zap,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const AUS_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
const BODY_TYPES = ["Sedan", "SUV", "Ute", "Hatchback", "Wagon", "Coupe", "Van"];

// ─── Buy Box Editor ──────────────────────────────────────────────────────

function BuyBoxEditor() {
  const buyBoxes = useQuery(api.buyBoxes.list, {});
  const createBuyBox = useMutation(api.buyBoxes.create);
  const removeBuyBox = useMutation(api.buyBoxes.remove);
  const [isAdding, setIsAdding] = useState(false);
  const [newBox, setNewBox] = useState({
    name: "",
    makes: "",
    models: "",
    yearMin: "2015",
    yearMax: "2025",
    priceMin: "5000",
    priceMax: "60000",
    kmMax: "150000",
    states: [] as string[],
    bodyTypes: [] as string[],
    transmissions: [] as string[],
    fuelTypes: [] as string[],
  });

  const handleCreate = async () => {
    if (!newBox.name || !newBox.makes) {
      toast.error("Name and makes are required");
      return;
    }
    try {
      await createBuyBox({
        name: newBox.name,
        makes: newBox.makes.split(",").map((m) => m.trim()),
        models: newBox.models ? newBox.models.split(",").map((m) => m.trim()) : [],
        yearMin: Number(newBox.yearMin),
        yearMax: Number(newBox.yearMax),
        priceMin: Number(newBox.priceMin),
        priceMax: Number(newBox.priceMax),
        kmMax: Number(newBox.kmMax),
        states: newBox.states,
        bodyTypes: newBox.bodyTypes,
        transmissions: newBox.transmissions,
        fuelTypes: newBox.fuelTypes,
        excludeKeywords: [],
      });
      toast.success("Buy box created!");
      setIsAdding(false);
      setNewBox({
        name: "", makes: "", models: "",
        yearMin: "2015", yearMax: "2025",
        priceMin: "5000", priceMax: "60000",
        kmMax: "150000",
        states: [], bodyTypes: [], transmissions: [], fuelTypes: [],
      });
    } catch {
      toast.error("Failed to create buy box");
    }
  };

  const toggleArrayItem = (
    field: "states" | "bodyTypes" | "transmissions" | "fuelTypes",
    item: string,
  ) => {
    setNewBox((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  return (
    <div className="space-y-4">
      {buyBoxes && buyBoxes.length > 0 && (
        <div className="space-y-2">
          {buyBoxes.map((box: {
            _id: string; name: string; makes: string[]; models: string[];
            yearMin: number; yearMax: number; priceMin: number; priceMax: number;
            kmMax: number; states: string[]; isActive: boolean;
          }) => (
            <Card key={box._id}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{box.name}</span>
                    <Badge variant="outline" className={box.isActive ? "border-emerald-300 text-emerald-600 text-[10px]" : "border-border text-[10px]"}>
                      {box.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {box.makes.join(", ")} · {box.models.join(", ")} · {box.yearMin}–{box.yearMax} · ${box.priceMin.toLocaleString()}–${box.priceMax.toLocaleString()} · &lt;{(box.kmMax / 1000).toFixed(0)}k km · {box.states.join(", ") || "All states"}
                  </div>
                </div>
                <Button variant="ghost" size="sm"
                  onClick={async () => { await removeBuyBox({ id: box._id as any }); toast.success("Buy box removed"); }}
                  className="text-muted-foreground hover:text-red-600">
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdding ? (
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Buy Box</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="e.g. Premium SUVs" value={newBox.name}
                  onChange={(e) => setNewBox((f) => ({ ...f, name: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Makes * (comma-separated)</Label>
                <Input placeholder="e.g. Toyota, Mazda, Hyundai" value={newBox.makes}
                  onChange={(e) => setNewBox((f) => ({ ...f, makes: e.target.value }))} className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Models (comma-separated, optional)</Label>
              <Input placeholder="e.g. RAV4, CX-5, Tucson" value={newBox.models}
                onChange={(e) => setNewBox((f) => ({ ...f, models: e.target.value }))} className="bg-background" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Year Min", key: "yearMin" },
                { label: "Year Max", key: "yearMax" },
                { label: "Price Min ($)", key: "priceMin" },
                { label: "Price Max ($)", key: "priceMax" },
                { label: "KM Max", key: "kmMax" },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input type="number" value={(newBox as any)[key]}
                    onChange={(e) => setNewBox((f) => ({ ...f, [key]: e.target.value }))} className="bg-background" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>States</Label>
              <div className="flex flex-wrap gap-1.5">
                {AUS_STATES.map((s) => (
                  <button type="button" key={s} onClick={() => toggleArrayItem("states", s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      newBox.states.includes(s) ? "bg-blue-600 text-white" : "bg-card border border-border text-muted-foreground hover:bg-accent"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Body Types</Label>
              <div className="flex flex-wrap gap-1.5">
                {BODY_TYPES.map((b) => (
                  <button type="button" key={b} onClick={() => toggleArrayItem("bodyTypes", b)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      newBox.bodyTypes.includes(b) ? "bg-blue-600 text-white" : "bg-card border border-border text-muted-foreground hover:bg-accent"
                    }`}>{b}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Check className="size-4" /> Create Buy Box
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="size-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="border-dashed border-border hover:bg-accent">
          <Plus className="size-4" /> Add Buy Box
        </Button>
      )}
    </div>
  );
}

// ─── Dealership Info Tab ─────────────────────────────────────────────────

function DealershipTab() {
  const settings = useQuery(api.dealershipSettings.get, {});
  const saveDealership = useMutation(api.dealershipSettings.save);
  const [form, setForm] = useState({
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
  const [saving, setSaving] = useState(false);

  // Hydrate form from DB
  useEffect(() => {
    if (settings) {
      setForm({
        dealershipName: settings.dealershipName ?? "",
        tradingName: settings.tradingName ?? "",
        contactEmail: settings.contactEmail ?? "",
        contactPhone: settings.contactPhone ?? "",
        abn: settings.abn ?? "",
        suburb: settings.suburb ?? "",
        state: settings.state ?? "",
        postcode: settings.postcode ?? "",
        carsalesDealerUrl: settings.carsalesDealerUrl ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDealership(form);
      toast.success("Dealership info saved!");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-blue-600" />
          <CardTitle>Dealership Information</CardTitle>
        </div>
        <CardDescription>Your dealership details used across the platform for outreach, briefs, and reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Dealership Name</Label>
            <Input placeholder="Your Dealer Pty Ltd" value={form.dealershipName} onChange={(e) => setField("dealershipName", e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Trading Name</Label>
            <Input placeholder="YD Motors" value={form.tradingName} onChange={(e) => setField("tradingName", e.target.value)} className="bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Contact Email</Label>
            <Input type="email" placeholder="sales@yourdealer.com.au" value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input placeholder="(02) 1234 5678" value={form.contactPhone} onChange={(e) => setField("contactPhone", e.target.value)} className="bg-background" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>ABN</Label>
          <Input placeholder="12 345 678 901" value={form.abn} onChange={(e) => setField("abn", e.target.value)} className="bg-background" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Suburb</Label>
            <Input placeholder="Parramatta" value={form.suburb} onChange={(e) => setField("suburb", e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Select value={form.state} onValueChange={(val) => setField("state", val)}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {AUS_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Postcode</Label>
            <Input placeholder="2150" value={form.postcode} onChange={(e) => setField("postcode", e.target.value)} className="bg-background" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Carsales Dealer Page URL</Label>
          <Input placeholder="https://www.carsales.com.au/dealer/..." value={form.carsalesDealerUrl} onChange={(e) => setField("carsalesDealerUrl", e.target.value)} className="bg-background" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="size-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Integrations Tab ────────────────────────────────────────────────────

function IntegrationsTab() {
  const settings = useQuery(api.dealershipSettings.get, {});
  const saveIntegrations = useMutation(api.dealershipSettings.saveIntegrations);
  const [twilio, setTwilio] = useState({ twilioAccountSid: "", twilioAuthToken: "", twilioPhoneNumber: "" });
  const [resend, setResend] = useState({ resendApiKey: "", resendFromEmail: "" });
  const [savingTwilio, setSavingTwilio] = useState(false);
  const [savingResend, setSavingResend] = useState(false);

  useEffect(() => {
    if (settings) {
      setTwilio({
        twilioAccountSid: settings.twilioAccountSid ?? "",
        twilioAuthToken: settings.twilioAuthToken ?? "",
        twilioPhoneNumber: settings.twilioPhoneNumber ?? "",
      });
      setResend({
        resendApiKey: settings.resendApiKey ?? "",
        resendFromEmail: settings.resendFromEmail ?? "",
      });
    }
  }, [settings]);

  const handleSaveTwilio = async () => {
    setSavingTwilio(true);
    try { await saveIntegrations(twilio); toast.success("Twilio settings saved!"); }
    catch { toast.error("Failed to save Twilio settings"); }
    setSavingTwilio(false);
  };

  const handleSaveResend = async () => {
    setSavingResend(true);
    try { await saveIntegrations(resend); toast.success("Resend settings saved!"); }
    catch { toast.error("Failed to save Resend settings"); }
    setSavingResend(false);
  };

  const twilioConnected = Boolean(settings?.twilioAccountSid && settings?.twilioAuthToken);
  const resendConnected = Boolean(settings?.resendApiKey);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Twilio SMS</CardTitle>
            </div>
            <Badge variant="outline" className={twilioConnected ? "border-emerald-300 text-emerald-600" : "border-orange-300 text-orange-600"}>
              {twilioConnected ? "Connected" : "Not configured"}
            </Badge>
          </div>
          <CardDescription>Required for Closer's SMS outreach and receiving inbound seller replies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Account SID</Label>
            <Input type="password" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilio.twilioAccountSid}
              onChange={(e) => setTwilio((f) => ({ ...f, twilioAccountSid: e.target.value }))} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Auth Token</Label>
            <Input type="password" placeholder="••••••••" value={twilio.twilioAuthToken}
              onChange={(e) => setTwilio((f) => ({ ...f, twilioAuthToken: e.target.value }))} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number (+61...)</Label>
            <Input placeholder="+61400000000" value={twilio.twilioPhoneNumber}
              onChange={(e) => setTwilio((f) => ({ ...f, twilioPhoneNumber: e.target.value }))} className="bg-background" />
          </div>
          <Button onClick={handleSaveTwilio} disabled={savingTwilio} variant="outline" className="border-border">
            <Save className="size-4" /> {savingTwilio ? "Saving..." : "Save Twilio"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Resend Email</CardTitle>
            </div>
            <Badge variant="outline" className={resendConnected ? "border-emerald-300 text-emerald-600" : "border-orange-300 text-orange-600"}>
              {resendConnected ? "Connected" : "Not configured"}
            </Badge>
          </div>
          <CardDescription>Required for Responder's email replies and Briefer delivery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={resend.resendApiKey}
              onChange={(e) => setResend((f) => ({ ...f, resendApiKey: e.target.value }))} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>From Email</Label>
            <Input placeholder="noreply@yourdomain.com.au" value={resend.resendFromEmail}
              onChange={(e) => setResend((f) => ({ ...f, resendFromEmail: e.target.value }))} className="bg-background" />
          </div>
          <Button onClick={handleSaveResend} disabled={savingResend} variant="outline" className="border-border">
            <Save className="size-4" /> {savingResend ? "Saving..." : "Save Resend"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Schedules Tab ───────────────────────────────────────────────────────

function SchedulesTab() {
  const settings = useQuery(api.dealershipSettings.get, {});
  const saveSchedules = useMutation(api.dealershipSettings.saveSchedules);

  const schedules = [
    { key: "hunterScheduleEnabled", agent: "Hunter", schedule: "Every 4 hours (6am, 10am, 2pm, 6pm, 10pm AEST)", color: "text-emerald-600", icon: "🔍" },
    { key: "brieferScheduleEnabled", agent: "Briefer", schedule: "Daily at 6:00am AEST", color: "text-rose-600", icon: "📋" },
    { key: "listerScheduleEnabled", agent: "Lister", schedule: "Weekly on Monday at 7:00am AEST", color: "text-amber-600", icon: "📊" },
    { key: "closerFollowUpEnabled", agent: "Closer", schedule: "Daily follow-up at 9:00am AEST", color: "text-pink-600", icon: "🤝" },
  ];

  const staticSchedules = [
    { agent: "Responder", schedule: "Event-driven (on enquiry receipt)", color: "text-violet-600", icon: "💬" },
    { agent: "Scout", schedule: "On-demand only", color: "text-cyan-600", icon: "📡" },
  ];

  const handleToggle = async (key: string, current: boolean) => {
    try {
      await saveSchedules({ [key]: !current });
      toast.success(`Schedule ${!current ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update schedule");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-blue-600" />
          <CardTitle>Agent Schedules</CardTitle>
        </div>
        <CardDescription>Configure when each agent runs automatically. Toggle schedules on/off.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {schedules.map((item) => {
            const enabled = settings?.[item.key as keyof typeof settings] as boolean | undefined ?? true;
            return (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <span className={`font-medium text-sm ${item.color}`}>{item.agent}</span>
                    <p className="text-xs text-muted-foreground">{item.schedule}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(item.key, enabled)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {enabled ? <ToggleRight className="size-8 text-emerald-600" /> : <ToggleLeft className="size-8 text-muted-foreground" />}
                </button>
              </div>
            );
          })}
          {staticSchedules.map((item) => (
            <div key={item.agent} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <span className={`font-medium text-sm ${item.color}`}>{item.agent}</span>
                  <p className="text-xs text-muted-foreground">{item.schedule}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Always on</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Activity / AI Calls Tab ─────────────────────────────────────────────

function ActivityTab() {
  const aiCallsToday = useQuery(api.aiCalls.getTodayStats, {});
  const aiCallsMonth = useQuery(api.aiCalls.getMonthStats, {});
  const agentRuns = useQuery(api.agentRuns.list, { limit: 20 });
  const todayStats = useQuery(api.agentRuns.getTodayStats, {});

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="size-3" /> Today's Runs</div>
            <div className="text-2xl font-bold mt-1">{todayStats?.totalRuns ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">{todayStats?.completedRuns ?? 0} completed · {todayStats?.failedRuns ?? 0} failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="size-3" /> AI Calls Today</div>
            <div className="text-2xl font-bold mt-1">{aiCallsToday?.totalCalls ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">{((aiCallsToday?.totalInputTokens ?? 0) + (aiCallsToday?.totalOutputTokens ?? 0)).toLocaleString()} tokens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="size-3" /> Cost Today</div>
            <div className="text-2xl font-bold mt-1">${(aiCallsToday?.totalCostUsd ?? 0).toFixed(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="size-3" /> Cost This Month</div>
            <div className="text-2xl font-bold mt-1">${(aiCallsMonth?.totalCostUsd ?? 0).toFixed(4)}</div>
            <div className="text-[10px] text-muted-foreground">{aiCallsMonth?.totalCalls ?? 0} calls · {(aiCallsMonth?.totalTokens ?? 0).toLocaleString()} tokens</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent agent runs table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-blue-600" />
            <CardTitle>Recent Agent Runs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Agent</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Trigger</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Duration</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Cost</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {agentRuns?.map((run: {
                  _id: string; agentName: string; status: string; trigger: string;
                  durationMs?: number; costUsd?: number; startedAt: number; resultSummary?: string;
                }) => (
                  <tr key={run._id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="py-2 px-3">
                      <span className="font-medium capitalize">{run.agentName}</span>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className={
                        run.status === "completed" ? "border-emerald-300 text-emerald-600 text-[10px]"
                        : run.status === "failed" ? "border-red-300 text-red-600 text-[10px]"
                        : run.status === "running" ? "border-blue-300 text-blue-600 text-[10px]"
                        : "text-[10px]"
                      }>{run.status}</Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{run.trigger}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">
                      {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">
                      {run.costUsd ? `$${run.costUsd.toFixed(4)}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">
                      {new Date(run.startedAt).toLocaleString("en-AU", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
                {(!agentRuns || agentRuns.length === 0) && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No agent runs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────

function BillingTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-blue-600" />
          <CardTitle>Billing & Plan</CardTitle>
        </div>
        <CardDescription>Your current plan and usage details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Founding Dealer Plan</h3>
              <p className="text-sm text-blue-700 mt-1">Lifetime access · All 6 AI agents · Unlimited scans</p>
            </div>
            <Badge className="bg-blue-600 text-white">Active</Badge>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">AI Credits Used</div>
            <div className="text-xl font-bold mt-1">—</div>
            <div className="text-[10px] text-muted-foreground">of unlimited</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">SMS Sent</div>
            <div className="text-xl font-bold mt-1">—</div>
            <div className="text-[10px] text-muted-foreground">via your Twilio</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">Emails Sent</div>
            <div className="text-xl font-bold mt-1">—</div>
            <div className="text-[10px] text-muted-foreground">via your Resend</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
          <Settings className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your dealership, buy boxes, integrations, and agent schedules
          </p>
        </div>
      </div>

      <Tabs defaultValue="buyboxes">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="buyboxes">Buy Boxes</TabsTrigger>
          <TabsTrigger value="dealership">Dealership</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="activity">Activity & Costs</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="buyboxes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Buy Boxes</CardTitle>
              <CardDescription>
                Define what vehicles your agents should look for. Hunter scans listings matching these criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuyBoxEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dealership" className="mt-4">
          <DealershipTab />
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <SchedulesTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityTab />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
