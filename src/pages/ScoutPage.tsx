import { useAction, useQuery } from "convex/react";
import {
  Search,
  TrendingUp,
  Loader2,
  Play,
  DollarSign,
  BarChart3,
  Clock,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const AUS_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

/** Build histogram buckets from price stats */
function buildPriceDistribution(snap: {
  priceMin: number; priceMax: number; priceP25: number;
  priceP75: number; priceMedian: number; activeListings: number;
}) {
  const bucketCount = 8;
  const range = snap.priceMax - snap.priceMin || 1;
  const step = range / bucketCount;
  const total = snap.activeListings || 20;

  // Generate approximate normal-ish distribution centred on median
  const buckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const lo = snap.priceMin + i * step;
    const hi = lo + step;
    const mid = (lo + hi) / 2;
    // Weight: higher near median, drops off towards edges
    const distFromMedian = Math.abs(mid - snap.priceMedian) / range;
    const weight = Math.exp(-4 * distFromMedian * distFromMedian);
    const inIQR = mid >= snap.priceP25 && mid <= snap.priceP75;
    buckets.push({
      range: `$${Math.round(lo / 1000)}k–$${Math.round(hi / 1000)}k`,
      count: Math.max(1, Math.round(weight * total * 0.4)),
      lo,
      hi,
      mid,
      inIQR,
    });
  }
  return buckets;
}

export function ScoutPage() {
  const snapshots = useQuery(api.marketSnapshots.list, {});
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName: "scout" });
  const runScout = useAction(api.agents.scout.run);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [state, setState] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunScout = async () => {
    if (!make || !model) { toast.error("Please enter a make and model"); return; }
    setIsRunning(true);
    toast.info(`Scout is analysing the ${make} ${model} market...`);
    try {
      await runScout({ trigger: "manual", make, model, year: new Date().getFullYear(), state: state && state !== "all" ? state : undefined });
      toast.success("Market snapshot ready!");
    } catch (err) {
      toast.error(`Scout failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setIsRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-cyan-50 flex items-center justify-center">
          <Search className="size-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scout</h1>
          <p className="text-sm text-muted-foreground">Market intelligence agent — price data for any vehicle</p>
        </div>
      </div>

      {/* Progress */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-cyan-200 bg-cyan-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-cyan-600" /> Live Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-2"><span className="text-cyan-600/60">›</span>{msg}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Market Snapshot</CardTitle>
          <CardDescription>
            Enter a make, model, and optional state. Scout analyses active listings and builds a price distribution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Make</Label>
              <Input placeholder="e.g. Toyota" value={make} onChange={(e) => setMake(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input placeholder="e.g. Hilux" value={model} onChange={(e) => setModel(e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="All States" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {AUS_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleRunScout} disabled={isRunning} className="bg-cyan-600 hover:bg-cyan-700">
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Generate Snapshot
          </Button>
        </CardContent>
      </Card>

      {/* Market Snapshots */}
      {snapshots && snapshots.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Market Snapshots</h2>
          {snapshots.map((snap: {
            _id: string; _creationTime: number; make: string; model: string;
            state?: string; activeListings: number; priceMedian: number;
            priceP25: number; priceP75: number; priceMin: number; priceMax: number;
            avgDaysOnMarket?: number; trendAnalysis?: string;
            recommendedBuyBand?: string; insights?: string[];
          }) => {
            const chartData = buildPriceDistribution(snap);
            return (
              <Card key={snap._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {snap.make} {snap.model}
                      {snap.state && <Badge variant="outline" className="ml-2 text-[10px] border-border">{snap.state}</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {new Date(snap._creationTime).toLocaleDateString("en-AU")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Price Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="rounded-lg bg-cyan-50 p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Median</div>
                      <div className="text-lg font-bold text-cyan-700">${snap.priceMedian.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">P25</div>
                      <div className="text-lg font-bold">${snap.priceP25.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">P75</div>
                      <div className="text-lg font-bold">${snap.priceP75.toLocaleString()}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Listings</div>
                      <div className="text-lg font-bold flex items-center justify-center gap-1">
                        <BarChart3 className="size-3.5 text-muted-foreground" />{snap.activeListings}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase">Avg Days</div>
                      <div className="text-lg font-bold">{snap.avgDaysOnMarket ?? "—"}</div>
                    </div>
                  </div>

                  {/* Recharts Price Distribution */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <BarChart3 className="size-3" /> Price Distribution
                    </div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <XAxis
                            dataKey="range"
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              fontSize: "12px",
                              padding: "8px 12px",
                            }}
                            formatter={(value: number) => [`~${value} listings`, "Count"]}
                          />
                          <ReferenceLine
                            x={chartData.find((b) => b.mid >= snap.priceMedian && b.lo <= snap.priceMedian)?.range}
                            stroke="#0891b2"
                            strokeDasharray="4 4"
                            label={{ value: "Median", position: "top", fill: "#0891b2", fontSize: 10 }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={entry.inIQR ? "#06b6d4" : "#cbd5e1"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-cyan-500" /> IQR (P25-P75)</span>
                      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-300" /> Outside IQR</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-0 border-t border-dashed border-cyan-600" /> Median</span>
                    </div>
                  </div>

                  {/* Recommended Buy Band */}
                  {snap.recommendedBuyBand && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
                      <DollarSign className="size-4 text-emerald-600" />
                      <div>
                        <div className="text-xs font-medium text-emerald-700">Recommended Buy Band</div>
                        <div className="text-sm font-bold text-emerald-800">{snap.recommendedBuyBand}</div>
                      </div>
                    </div>
                  )}

                  {/* Trend Analysis */}
                  {snap.trendAnalysis && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                        <TrendingUp className="size-3" /> Trend Analysis
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{snap.trendAnalysis}</p>
                    </div>
                  )}

                  {/* Insights */}
                  {snap.insights && snap.insights.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">Key Insights</div>
                      <div className="space-y-1">
                        {snap.insights.map((insight: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-cyan-600 mt-0.5">•</span>{insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No market snapshots yet. Enter a vehicle above to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
