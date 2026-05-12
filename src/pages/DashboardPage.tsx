import { useQuery } from "convex/react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Clock,
  Crosshair,
  DollarSign,
  ExternalLink,
  FileText,
  Flame,
  MessageSquare,
  Search,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";

const agentCards = [
  {
    name: "Hunter",
    href: "/agents/hunter",
    icon: Crosshair,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    desc: "Acquisition",
  },
  {
    name: "Lister",
    href: "/agents/lister",
    icon: BarChart3,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    desc: "Inventory",
  },
  {
    name: "Responder",
    href: "/agents/responder",
    icon: MessageSquare,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    desc: "Leads",
  },
  {
    name: "Scout",
    href: "/agents/scout",
    icon: Search,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    desc: "Intelligence",
  },
  {
    name: "Briefer",
    href: "/agents/briefer",
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    desc: "Reports",
  },
  {
    name: "Closer",
    href: "/agents/closer",
    icon: Send,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    desc: "Outreach",
  },
];

function AgentStatusBadge({ agentName }: { agentName: string }) {
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName });
  if (!latestRun)
    return (
      <Badge variant="outline" className="text-[10px] border-border">
        Idle
      </Badge>
    );
  const statusColors: Record<string, string> = {
    running: "bg-blue-100 text-blue-600 border-blue-300",
    completed: "bg-emerald-100 text-emerald-600 border-emerald-300",
    failed: "bg-red-100 text-red-600 border-red-300",
    queued: "bg-amber-100 text-amber-600 border-amber-300",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${statusColors[latestRun.status] ?? "border-border"}`}
    >
      {latestRun.status === "running" && (
        <span className="mr-1 inline-block size-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {latestRun.status}
    </Badge>
  );
}

const pipelineStages = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-violet-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-amber-500" },
  { key: "purchased", label: "Won", color: "bg-emerald-500" },
  { key: "passed", label: "Passed", color: "bg-muted-foreground/40" },
] as const;

export function DashboardPage() {
  const user = useQuery(api.auth.currentUser);
  const listingStats = useQuery(api.listings.getStats, {});
  const todayStats = useQuery(api.agentRuns.getTodayStats, {});
  const todayBrief = useQuery(api.briefs.getToday, {});
  const recentActivity = useQuery(api.activityFeed.list, { limit: 8 });
  const hotListings = useQuery(api.listings.list, { limit: 10 });

  // Sort hot listings by deal score descending
  const topListings = hotListings
    ?.filter(
      (l: { dealScore?: number; status: string }) =>
        l.dealScore !== undefined && l.status !== "archived" && l.status !== "passed"
    )
    .sort(
      (a: { dealScore?: number }, b: { dealScore?: number }) =>
        (b.dealScore ?? 0) - (a.dealScore ?? 0)
    )
    .slice(0, 5);

  // Pipeline totals
  const pipelineTotals: Record<string, number> = {
    new: listingStats?.newCount ?? 0,
    contacted: listingStats?.contactedCount ?? 0,
    negotiating: listingStats?.negotiatingCount ?? 0,
    purchased: listingStats?.purchasedCount ?? 0,
    passed: 0,
  };
  const totalPipeline = Object.values(pipelineTotals).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what your AI team has been up to.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border hover:bg-accent"
          asChild
        >
          <Link to="/chat">
            <Bot className="size-4" />
            Ask AI
          </Link>
        </Button>
      </div>

      {/* Today's Brief */}
      {todayBrief ? (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-rose-600" />
              Today's Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {todayBrief.content.slice(0, 500)}
              {todayBrief.content.length > 500 && "..."}
            </p>
            <Button
              variant="link"
              className="px-0 mt-2 text-blue-600"
              asChild
            >
              <Link to="/agents/briefer">
                Read full brief
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 text-muted-foreground/50" />
            No morning brief yet today. Go to{" "}
            <Link to="/agents/briefer" className="text-blue-600 underline">
              Briefer
            </Link>{" "}
            to generate one.
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Listings Found
              </span>
              <div className="rounded-lg p-1.5 bg-emerald-50">
                <TrendingUp className="size-3.5 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-bold">
              {listingStats?.total ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {listingStats?.newCount ?? 0} new
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Avg Deal Score
              </span>
              <div className="rounded-lg p-1.5 bg-blue-50">
                <Zap className="size-3.5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold">
              {listingStats?.avgDealScore ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              out of 10
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                Agent Runs Today
              </span>
              <div className="rounded-lg p-1.5 bg-amber-50">
                <Activity className="size-3.5 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold">
              {todayStats?.totalRuns ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {todayStats?.completedRuns ?? 0} completed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                AI Spend Today
              </span>
              <div className="rounded-lg p-1.5 bg-violet-50">
                <DollarSign className="size-3.5 text-violet-600" />
              </div>
            </div>
            <div className="text-2xl font-bold">
              ${todayStats?.totalCostUsd?.toFixed(2) ?? "0.00"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {((todayStats?.totalTokens ?? 0) / 1000).toFixed(1)}k tokens
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Mini-Kanban */}
      {totalPipeline > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Pipeline
              <Badge variant="outline" className="text-[10px] border-border">
                {totalPipeline} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Visual bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-3">
              {pipelineStages.map((stage) => {
                const count = pipelineTotals[stage.key] ?? 0;
                if (count === 0) return null;
                const pct = (count / totalPipeline) * 100;
                return (
                  <div
                    key={stage.key}
                    className={`${stage.color} relative group`}
                    style={{ width: `${pct}%`, minWidth: count > 0 ? "8px" : 0 }}
                    title={`${stage.label}: ${count}`}
                  />
                );
              })}
            </div>
            {/* Labels */}
            <div className="flex flex-wrap gap-4">
              {pipelineStages.map((stage) => {
                const count = pipelineTotals[stage.key] ?? 0;
                return (
                  <div key={stage.key} className="flex items-center gap-1.5">
                    <span
                      className={`size-2.5 rounded-full ${stage.color}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hot Listings Carousel + Agent Grid + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Hot Listings + Agents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hot Listings */}
          {topListings && topListings.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <Flame className="size-3.5 text-orange-500" />
                Hot Listings
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {topListings.map(
                  (listing: {
                    _id: string;
                    title: string;
                    year: number;
                    make: string;
                    model: string;
                    price: number;
                    dealScore?: number;
                    source: string;
                    state?: string;
                    sourceUrl: string;
                    km?: number;
                  }) => (
                    <Card
                      key={listing._id}
                      className="min-w-[220px] max-w-[220px] flex-shrink-0 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              (listing.dealScore ?? 0) >= 8
                                ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                                : (listing.dealScore ?? 0) >= 6
                                  ? "border-blue-300 text-blue-600 bg-blue-50"
                                  : "border-amber-300 text-amber-600 bg-amber-50"
                            }`}
                          >
                            {listing.dealScore}/10
                          </Badge>
                          <a
                            href={listing.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                        <div className="text-sm font-semibold truncate">
                          {listing.year} {listing.make} {listing.model}
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                          ${listing.price.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          {listing.km && (
                            <span>
                              {(listing.km / 1000).toFixed(0)}k km
                            </span>
                          )}
                          {listing.state && <span>· {listing.state}</span>}
                          <span className="capitalize">· {listing.source}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </div>
          )}

          {/* Agent Grid */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Your Agents
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {agentCards.map((agent) => (
                <Link
                  key={agent.name}
                  to={agent.href}
                  className={`group rounded-xl border ${agent.border} bg-card p-4 hover:bg-accent transition-all hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`size-9 rounded-lg ${agent.bg} flex items-center justify-center`}
                    >
                      <agent.icon className={`size-4.5 ${agent.color}`} />
                    </div>
                    <AgentStatusBadge
                      agentName={agent.name.toLowerCase()}
                    />
                  </div>
                  <div className="font-semibold text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.desc}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Recent Activity
          </h2>
          <Card className="border-border">
            <CardContent className="p-0">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentActivity.map(
                    (item: {
                      _id: string;
                      _creationTime: number;
                      type: string;
                      title: string;
                      description?: string;
                    }) => (
                      <div key={item._id} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full ${
                              item.type.includes("completed")
                                ? "bg-emerald-500"
                                : item.type.includes("failed")
                                  ? "bg-red-500"
                                  : item.type.includes("started")
                                    ? "bg-blue-500"
                                    : item.type === "listing_found"
                                      ? "bg-emerald-400"
                                      : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-sm font-medium truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5 truncate">
                            {item.description}
                          </p>
                        )}
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 ml-3.5">
                          {new Date(item._creationTime).toLocaleTimeString(
                            "en-AU",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Clock className="size-6 mx-auto mb-2 text-muted-foreground/50" />
                  No activity yet. Run an agent to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
