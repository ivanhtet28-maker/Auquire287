import { useQuery } from "convex/react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Clock,
  Crosshair,
  DollarSign,
  FileText,
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
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    desc: "Acquisition",
  },
  {
    name: "Lister",
    href: "/agents/lister",
    icon: BarChart3,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    desc: "Inventory",
  },
  {
    name: "Responder",
    href: "/agents/responder",
    icon: MessageSquare,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    desc: "Leads",
  },
  {
    name: "Scout",
    href: "/agents/scout",
    icon: Search,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    desc: "Intelligence",
  },
  {
    name: "Briefer",
    href: "/agents/briefer",
    icon: FileText,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    desc: "Reports",
  },
  {
    name: "Closer",
    href: "/agents/closer",
    icon: Send,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    border: "border-pink-400/20",
    desc: "Outreach",
  },
];

function AgentStatusBadge({ agentName }: { agentName: string }) {
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, { agentName });
  if (!latestRun) return <Badge variant="outline" className="text-[10px] border-white/10">Idle</Badge>;
  const statusColors: Record<string, string> = {
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    queued: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${statusColors[latestRun.status] ?? "border-white/10"}`}>
      {latestRun.status === "running" && <span className="mr-1 inline-block size-1.5 rounded-full bg-blue-400 animate-pulse" />}
      {latestRun.status}
    </Badge>
  );
}

export function DashboardPage() {
  const user = useQuery(api.auth.currentUser);
  const listingStats = useQuery(api.listings.getStats, {});
  const todayStats = useQuery(api.agentRuns.getTodayStats, {});
  const todayBrief = useQuery(api.briefs.getToday, {});
  const recentActivity = useQuery(api.activityFeed.list, { limit: 8 });
  // Running agents available for future use
  // const runningAgents = useQuery(api.agentRuns.getRunning, {});

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
        <Button variant="outline" className="border-white/10 hover:bg-white/5" asChild>
          <Link to="/chat">
            <Bot className="size-4" />
            Ask AI
          </Link>
        </Button>
      </div>

      {/* Today's Brief */}
      {todayBrief ? (
        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/[0.03] to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-rose-400" />
              Today's Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {todayBrief.content.slice(0, 500)}
              {todayBrief.content.length > 500 && "..."}
            </p>
            <Button variant="link" className="px-0 mt-2 text-blue-400" asChild>
              <Link to="/agents/briefer">
                Read full brief
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/[0.06] bg-card">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 text-muted-foreground/40" />
            No morning brief yet today. Briefer runs at 6:00am AEST.
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Listings Found</span>
              <div className="rounded-lg p-1.5 bg-emerald-400/10">
                <TrendingUp className="size-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{listingStats?.total ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {listingStats?.newCount ?? 0} new
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Avg Deal Score</span>
              <div className="rounded-lg p-1.5 bg-blue-400/10">
                <Zap className="size-3.5 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{listingStats?.avgDealScore ?? "—"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">out of 10</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Agent Runs Today</span>
              <div className="rounded-lg p-1.5 bg-amber-400/10">
                <Activity className="size-3.5 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold">{todayStats?.totalRuns ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {todayStats?.completedRuns ?? 0} completed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">AI Spend Today</span>
              <div className="rounded-lg p-1.5 bg-violet-400/10">
                <DollarSign className="size-3.5 text-violet-400" />
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

      {/* Agent Grid + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Agent Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Your Agents
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agentCards.map((agent) => (
              <Link
                key={agent.name}
                to={agent.href}
                className={`group rounded-xl border ${agent.border} bg-card p-4 hover:bg-white/[0.02] transition-all hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`size-9 rounded-lg ${agent.bg} flex items-center justify-center`}>
                    <agent.icon className={`size-4.5 ${agent.color}`} />
                  </div>
                  <AgentStatusBadge agentName={agent.name.toLowerCase()} />
                </div>
                <div className="font-semibold text-sm">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Recent Activity
          </h2>
          <Card className="border-white/[0.06]">
            <CardContent className="p-0">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {recentActivity.map((item: { _id: string; _creationTime: number; type: string; title: string; description?: string }) => (
                    <div key={item._id} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-1.5 rounded-full ${
                            item.type.includes("completed")
                              ? "bg-emerald-400"
                              : item.type.includes("failed")
                                ? "bg-red-400"
                                : item.type.includes("started")
                                  ? "bg-blue-400"
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
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5 ml-3.5">
                        {new Date(item._creationTime).toLocaleTimeString("en-AU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Clock className="size-6 mx-auto mb-2 text-muted-foreground/40" />
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
