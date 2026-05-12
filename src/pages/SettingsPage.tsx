import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Key,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
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
// Available for future multi-select fields
// const TRANSMISSIONS = ["Automatic", "Manual"];
// const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];

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
        name: "",
        makes: "",
        models: "",
        yearMin: "2015",
        yearMax: "2025",
        priceMin: "5000",
        priceMax: "60000",
        kmMax: "150000",
        states: [],
        bodyTypes: [],
        transmissions: [],
        fuelTypes: [],
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
      {/* Existing buy boxes */}
      {buyBoxes && buyBoxes.length > 0 && (
        <div className="space-y-2">
          {buyBoxes.map((box: {
            _id: string;
            name: string;
            makes: string[];
            models: string[];
            yearMin: number;
            yearMax: number;
            priceMin: number;
            priceMax: number;
            kmMax: number;
            states: string[];
            isActive: boolean;
          }) => (
            <Card key={box._id}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{box.name}</span>
                    <Badge variant="outline" className={box.isActive ? "border-emerald-500/30 text-emerald-400 text-[10px]" : "border-white/10 text-[10px]"}>
                      {box.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {box.makes.join(", ")} · {box.models.join(", ")} · {box.yearMin}–{box.yearMax} · ${box.priceMin.toLocaleString()}–${box.priceMax.toLocaleString()} · &lt;{(box.kmMax / 1000).toFixed(0)}k km · {box.states.join(", ") || "All states"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await removeBuyBox({ id: box._id as any });
                    toast.success("Buy box removed");
                  }}
                  className="text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new */}
      {isAdding ? (
        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Buy Box</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g. Premium SUVs"
                  value={newBox.name}
                  onChange={(e) => setNewBox((f) => ({ ...f, name: e.target.value }))}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Makes * (comma-separated)</Label>
                <Input
                  placeholder="e.g. Toyota, Mazda, Hyundai"
                  value={newBox.makes}
                  onChange={(e) => setNewBox((f) => ({ ...f, makes: e.target.value }))}
                  className="bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Models (comma-separated, optional)</Label>
              <Input
                placeholder="e.g. RAV4, CX-5, Tucson"
                value={newBox.models}
                onChange={(e) => setNewBox((f) => ({ ...f, models: e.target.value }))}
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-2">
                <Label>Year Min</Label>
                <Input type="number" value={newBox.yearMin} onChange={(e) => setNewBox((f) => ({ ...f, yearMin: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Year Max</Label>
                <Input type="number" value={newBox.yearMax} onChange={(e) => setNewBox((f) => ({ ...f, yearMax: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Price Min ($)</Label>
                <Input type="number" value={newBox.priceMin} onChange={(e) => setNewBox((f) => ({ ...f, priceMin: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Price Max ($)</Label>
                <Input type="number" value={newBox.priceMax} onChange={(e) => setNewBox((f) => ({ ...f, priceMax: e.target.value }))} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>KM Max</Label>
                <Input type="number" value={newBox.kmMax} onChange={(e) => setNewBox((f) => ({ ...f, kmMax: e.target.value }))} className="bg-background" />
              </div>
            </div>

            {/* Multi-select chips */}
            <div className="space-y-2">
              <Label>States</Label>
              <div className="flex flex-wrap gap-1.5">
                {AUS_STATES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleArrayItem("states", s)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      newBox.states.includes(s)
                        ? "bg-blue-600 text-white"
                        : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Body Types</Label>
              <div className="flex flex-wrap gap-1.5">
                {BODY_TYPES.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => toggleArrayItem("bodyTypes", b)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      newBox.bodyTypes.includes(b)
                        ? "bg-blue-600 text-white"
                        : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Check className="size-4" />
                Create Buy Box
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="border-dashed border-white/10 hover:bg-white/5"
        >
          <Plus className="size-4" />
          Add Buy Box
        </Button>
      )}
    </div>
  );
}

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
            Configure your dealership, buy boxes, and integrations
          </p>
        </div>
      </div>

      <Tabs defaultValue="buyboxes">
        <TabsList className="bg-card border border-white/[0.06]">
          <TabsTrigger value="buyboxes">Buy Boxes</TabsTrigger>
          <TabsTrigger value="dealership">Dealership</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="buyboxes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Buy Boxes</CardTitle>
              <CardDescription>
                Define what vehicles your agents should look for. Hunter scans listings
                matching these criteria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BuyBoxEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dealership" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dealership Information</CardTitle>
              <CardDescription>Your dealership details used across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dealership Name</Label>
                  <Input placeholder="Your Dealer Pty Ltd" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Trading Name</Label>
                  <Input placeholder="YD Motors" className="bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input placeholder="sales@yourdealer.com.au" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input placeholder="(02) 1234 5678" className="bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Suburb</Label>
                  <Input placeholder="Parramatta" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AUS_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Postcode</Label>
                  <Input placeholder="2150" className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Carsales Dealer Page URL</Label>
                <Input placeholder="https://www.carsales.com.au/dealer/..." className="bg-background" />
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="size-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          {[
            { name: "Twilio SMS", desc: "Required for Closer's SMS outreach", fields: ["Account SID", "Auth Token", "Phone Number (+61...)"] },
            { name: "Resend Email", desc: "Required for Responder's email replies and Briefer delivery", fields: ["API Key", "From Email"] },
          ].map((integration) => (
            <Card key={integration.name}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </div>
                <CardDescription>{integration.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {integration.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label>{field}</Label>
                    <Input type="password" placeholder="••••••••" className="bg-background" />
                  </div>
                ))}
                <Button variant="outline" className="border-white/10">
                  <Save className="size-4" />
                  Save
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Schedules</CardTitle>
              <CardDescription>Configure when each agent runs automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { agent: "Hunter", schedule: "Every 4 hours (6am, 10am, 2pm, 6pm, 10pm AEST)", color: "text-emerald-400" },
                  { agent: "Briefer", schedule: "Daily at 6:00am AEST", color: "text-rose-400" },
                  { agent: "Lister", schedule: "Weekly on Monday at 7:00am AEST", color: "text-amber-400" },
                  { agent: "Responder", schedule: "Event-driven (on enquiry receipt)", color: "text-violet-400" },
                  { agent: "Scout", schedule: "On-demand only", color: "text-cyan-400" },
                  { agent: "Closer", schedule: "Event-driven + daily follow-up at 9:00am AEST", color: "text-pink-400" },
                ].map((item) => (
                  <div key={item.agent} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div>
                      <span className={`font-medium text-sm ${item.color}`}>{item.agent}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.schedule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
