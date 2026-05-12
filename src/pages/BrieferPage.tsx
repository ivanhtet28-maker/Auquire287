import { useAction, useQuery } from "convex/react";
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  Play,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function BrieferPage() {
  const todayBrief = useQuery(api.briefs.getToday, {});
  const allBriefs = useQuery(api.briefs.list, { limit: 14 });
  const latestRun = useQuery(api.agentRuns.getLatestByAgent, {
    agentName: "briefer",
  });
  const runBriefer = useAction(api.agents.briefer.run);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedBriefId, setExpandedBriefId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.info("Briefer is generating your morning brief...");
    try {
      await runBriefer({ trigger: "manual" });
      toast.success("Morning brief generated!");
    } catch (err) {
      toast.error(
        `Briefer failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <FileText className="size-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Briefer</h1>
            <p className="text-sm text-muted-foreground">
              Daily executive brief — delivered at 6:00am AEST
            </p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-rose-600 hover:bg-rose-700"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          Generate Now
        </Button>
      </div>

      {/* Schedule info */}
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-rose-600" />
              <span>
                Runs daily at <strong>6:00am AEST</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-rose-600" />
              <span>
                Emailed at <strong>6:30am AEST</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Stream */}
      {latestRun?.status === "running" && latestRun.progressMessages && (
        <Card className="border-rose-200 bg-rose-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-rose-600" />
              Generating Brief...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              {(latestRun.progressMessages as string[]).map(
                (msg: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-rose-600/60">›</span>
                    {msg}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Brief */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Today's Brief
            {todayBrief && (
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-600 border-emerald-300 text-[10px]"
              >
                Generated
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayBrief ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {todayBrief.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-3">
                No brief generated yet today.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Generate Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Brief Archive
        </h2>
        <div className="space-y-2">
          {allBriefs && allBriefs.length > 0 ? (
            allBriefs.map(
              (brief: {
                _id: string;
                date: string;
                title: string;
                content: string;
              }) => (
                <Card
                  key={brief._id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() =>
                    setExpandedBriefId(
                      expandedBriefId === brief._id ? null : brief._id
                    )
                  }
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="size-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            {brief.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {brief.date}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {brief.content.length} chars
                      </div>
                    </div>
                    {expandedBriefId === brief._id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {brief.content}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            )
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No past briefs yet. Click "Generate Now" to create one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
