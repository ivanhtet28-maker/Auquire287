import { useAction, useQuery } from "convex/react";
import {
  BarChart3,
  Loader2,
  Play,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Camera,
  FileText,
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

import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const ACTION_ICONS: Record<string, typeof CheckCircle2> = {
  HOLD: CheckCircle2,
  REPRICE_DOWN: TrendingDown,
  REPRICE_UP: TrendingUp,
  REFRESH_PHOTOS: Camera,
  UPDATE_DESCRIPTION: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  HOLD: "text-emerald-600 bg-emerald-50 border-emerald-200",
  REPRICE_DOWN: "text-red-600 bg-red-50 border-red-200",
  REPRICE_UP: "text-blue-600 bg-blue-50 border-blue-200",
  REFRESH_PHOTOS: "text-amber-600 bg-amber-50 border-amber-200",
  UPDATE_DESCRIPTION: "text-violet-600 bg-violet-50 border-violet-200",
};

export function ListerPage() {
  const audits = useQuery(api.inventoryAudits.list, {});
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName: "lister" });
  const runLister = useAction(api.agents.lister.run);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = async () => {
    setIsRunning(true);
    toast.info("Lister is auditing your inventory...");
    try {
      await runLister({ trigger: "manual" });
      toast.success("Audit complete! Results below.");
    } catch (err) {
      toast.error(`Lister failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setIsRunning(false);
  };

  const latestAudit = audits?.[0] as {
    _id: string;
    _creationTime: number;
    totalListings: number;
    carsalesUrl?: string;
    recommendations: Array<{
      stockNumber?: string;
      title: string;
      currentPrice: number;
      daysOnMarket?: number;
      marketMedian?: number;
      action: string;
      suggestedPrice?: number;
      reasoning: string;
    }>;
  } | undefined;

  // Compute stats from latest audit
  const holdCount = latestAudit?.recommendations?.filter((r) => r.action === "HOLD").length ?? 0;
  const repriceDownCount = latestAudit?.recommendations?.filter((r) => r.action === "REPRICE_DOWN").length ?? 0;
  const repriceUpCount = latestAudit?.recommendations?.filter((r) => r.action === "REPRICE_UP").length ?? 0;
  const staleCount = latestAudit?.recommendations?.filter((r) => (r.daysOnMarket ?? 0) > 40).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <BarChart3 className="size-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lister</h1>
          <p className="text-sm text-muted-foreground">
            Inventory audit agent — reprice, refresh, or hold your listed stock
          </p>
        </div>
      </div>

      {/* Run audit */}
      <Card>
        <CardHeader>
          <CardTitle>Run Inventory Audit</CardTitle>
          <CardDescription>
            Lister audits your stock against live market data and recommends pricing actions. Runs automatically every Monday 7am AEST.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button onClick={handleRunAudit} disabled={isRunning} className="bg-amber-600 hover:bg-amber-700">
            {isRunning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Run Audit Now
          </Button>
          {latestRun && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Last run: {new Date(latestRun.startedAt).toLocaleString("en-AU")} —
              <Badge variant="outline" className={`text-[8px] ${
                latestRun.status === "completed" ? "border-emerald-300 text-emerald-600"
                : latestRun.status === "failed" ? "border-red-300 text-red-600"
                : latestRun.status === "running" ? "border-blue-300 text-blue-600"
                : ""
              }`}>{latestRun.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-amber-200 bg-amber-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-amber-600" /> Auditing Inventory...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-600/60">›</span>{msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {latestAudit && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground">Total Audited</div>
              <div className="text-xl font-bold text-amber-600">{latestAudit.totalListings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-600" /> Hold</div>
              <div className="text-xl font-bold text-emerald-600">{holdCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="size-3 text-red-600" /> Reprice Down</div>
              <div className="text-xl font-bold text-red-600">{repriceDownCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3 text-blue-600" /> Reprice Up</div>
              <div className="text-xl font-bold text-blue-600">{repriceUpCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="size-3 text-orange-600" /> Stale (&gt;40d)</div>
              <div className="text-xl font-bold text-orange-600">{staleCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit results table */}
      {latestAudit && latestAudit.recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Results</CardTitle>
            <CardDescription>
              {latestAudit.totalListings} listings audited on {new Date(latestAudit._creationTime).toLocaleDateString("en-AU")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Current</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Market</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Suggested</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Days</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Action</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {latestAudit.recommendations.map((rec, i) => {
                    const Icon = ACTION_ICONS[rec.action] ?? RefreshCw;
                    const colorClass = ACTION_COLORS[rec.action] ?? "";
                    const priceDiff = rec.marketMedian ? rec.currentPrice - rec.marketMedian : 0;
                    const isOverpriced = priceDiff > 0 && Math.abs(priceDiff / (rec.marketMedian || 1)) > 0.1;
                    const isUnderpriced = priceDiff < 0 && Math.abs(priceDiff / (rec.marketMedian || 1)) > 0.1;
                    const isStale = (rec.daysOnMarket ?? 0) > 40;

                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-accent/30">
                        <td className="py-2 px-3">
                          <div className="font-medium text-xs">{rec.title}</div>
                          {rec.stockNumber && <div className="text-[10px] text-muted-foreground">#{rec.stockNumber}</div>}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-xs">
                          ${rec.currentPrice.toLocaleString()}
                          {isOverpriced && <span className="ml-1 text-red-600">⬆ HIGH</span>}
                          {isUnderpriced && <span className="ml-1 text-blue-600">⬇ LOW</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                          {rec.marketMedian ? `$${rec.marketMedian.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-right text-xs">
                          {rec.suggestedPrice ? (
                            <span className={rec.suggestedPrice < rec.currentPrice ? "text-red-600 font-medium" : "text-blue-600 font-medium"}>
                              ${rec.suggestedPrice.toLocaleString()}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-3 text-center text-xs">
                          {rec.daysOnMarket != null ? (
                            <span className={isStale ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                              {rec.daysOnMarket}d {isStale && "⚠️"}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="outline" className={`text-[8px] ${colorClass} border`}>
                            <Icon className="size-2.5 mr-0.5" />
                            {rec.action.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground max-w-[200px] truncate">
                          {rec.reasoning}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !latestAudit && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No audits run yet. Click "Run Audit Now" to check your inventory pricing.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Automatic audit runs every Monday at 7:00am AEST.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Audit history */}
      {audits && audits.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {audits.slice(1, 6).map((audit: {
                _id: string; _creationTime: number; totalListings: number;
                recommendations: Array<{ action: string }>;
              }) => (
                <div key={audit._id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="text-sm">
                    <span className="font-medium">{audit.totalListings} listings</span>
                    <span className="text-muted-foreground ml-2">
                      {audit.recommendations.filter((r) => r.action !== "HOLD").length} actions recommended
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(audit._creationTime).toLocaleDateString("en-AU")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
