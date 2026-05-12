import { useAction, useQuery } from "convex/react";
import {
  Crosshair,
  ExternalLink,
  Filter,
  Loader2,
  MapPin,
  Play,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

function DealScoreBadge({ score }: { score?: number }) {
  if (score === undefined) return null;
  const color =
    score >= 8
      ? "bg-emerald-100 text-emerald-600 border-emerald-300"
      : score >= 6
        ? "bg-blue-100 text-blue-600 border-blue-300"
        : score >= 4
          ? "bg-amber-100 text-amber-600 border-amber-300"
          : "bg-red-100 text-red-600 border-red-300";
  return (
    <Badge variant="outline" className={`${color} text-xs font-bold`}>
      {score}/10
    </Badge>
  );
}

export function HunterPage() {
  const listings = useQuery(api.listings.list, { limit: 50 });
  const stats = useQuery(api.listings.getStats, {});
  const buyBoxes = useQuery(api.buyBoxes.list, {});
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName: "hunter" });
  const runHunter = useAction(api.agents.hunter.run);
  const [isRunning, setIsRunning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleRunHunter = async () => {
    setIsRunning(true);
    toast.info("Hunter is starting...");
    try {
      await runHunter({ trigger: "manual" });
      toast.success("Hunter run completed!");
    } catch (err) {
      toast.error(`Hunter failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const filteredListings = listings?.filter(
    (l: { status: string }) => statusFilter === "all" || l.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Crosshair className="size-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hunter</h1>
            <p className="text-sm text-muted-foreground">
              Acquisition agent — find private-party listings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestRun?.status === "running" && (
            <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-300">
              <Loader2 className="size-3 mr-1 animate-spin" />
              Running
            </Badge>
          )}
          <Button
            onClick={handleRunHunter}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run Hunter Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Found", value: stats?.total ?? 0, color: "text-emerald-600" },
          { label: "New", value: stats?.newCount ?? 0, color: "text-blue-600" },
          { label: "Contacted", value: stats?.contactedCount ?? 0, color: "text-violet-600" },
          { label: "Negotiating", value: stats?.negotiatingCount ?? 0, color: "text-amber-600" },
          { label: "Avg Score", value: stats?.avgDealScore ?? "—", color: "text-cyan-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Stream */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-blue-200 bg-blue-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-blue-600" />
              Live Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map((msg: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-600/60">›</span>
                  {msg}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buy Boxes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Buy Boxes</CardTitle>
              <CardDescription>Define what vehicles to look for</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-border hover:bg-accent" asChild>
              <a href="/settings">
                <Filter className="size-3.5" />
                Edit Buy Boxes
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {buyBoxes && buyBoxes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {buyBoxes.map((box: { _id: string; name: string; makes: string[]; isActive: boolean }) => (
                <Badge
                  key={box._id}
                  variant="outline"
                  className={`${box.isActive ? "border-emerald-300 text-emerald-600" : "border-border text-muted-foreground"}`}
                >
                  {box.isActive && <span className="mr-1 size-1.5 rounded-full bg-emerald-500 inline-block" />}
                  {box.name} — {box.makes.join(", ")}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No buy boxes configured. Go to Settings to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Listings</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="negotiating">Negotiating</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredListings?.length ?? 0} listings
        </span>
      </div>

      {/* Listings Table */}
      <Card>
        <CardContent className="p-0">
          {filteredListings && filteredListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">KM</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredListings.map((listing: {
                    _id: string;
                    title: string;
                    year: number;
                    make: string;
                    model: string;
                    price: number;
                    km?: number;
                    suburb?: string;
                    state?: string;
                    source: string;
                    dealScore?: number;
                    status: string;
                    sourceUrl: string;
                  }) => (
                    <tr key={listing._id} className="hover:bg-accent transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{listing.year} {listing.make} {listing.model}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {listing.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ${listing.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {listing.km ? `${(listing.km / 1000).toFixed(0)}k` : "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {listing.suburb && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="size-3" />
                            {listing.suburb}, {listing.state}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] border-border capitalize">
                          {listing.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DealScoreBadge score={listing.dealScore} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            listing.status === "new"
                              ? "border-blue-300 text-blue-600"
                              : listing.status === "contacted"
                                ? "border-violet-300 text-violet-600"
                                : "border-border"
                          }`}
                        >
                          {listing.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={listing.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Crosshair className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-4">
                No listings found yet. Run Hunter to scan the marketplaces.
              </p>
              <Button
                onClick={handleRunHunter}
                disabled={isRunning}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="size-4" />
                Run Hunter Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
