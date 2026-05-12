import { useQuery } from "convex/react";
import { Calendar, Clock, FileText, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../convex/_generated/api";

export function BrieferPage() {
  const todayBrief = useQuery(api.briefs.getToday, {});
  const allBriefs = useQuery(api.briefs.list, { limit: 14 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-rose-400/10 flex items-center justify-center">
          <FileText className="size-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Briefer</h1>
          <p className="text-sm text-muted-foreground">
            Daily executive brief — delivered at 6:00am AEST
          </p>
        </div>
      </div>

      {/* Schedule info */}
      <Card className="border-rose-400/20 bg-rose-400/[0.03]">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-rose-400" />
              <span>Runs daily at <strong>6:00am AEST</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-rose-400" />
              <span>Emailed at <strong>6:30am AEST</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Brief */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Today's Brief
            {todayBrief && (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
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
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {todayBrief.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="size-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No brief generated yet today. It will appear here after the 6am run.
              </p>
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
            allBriefs.map((brief: { _id: string; date: string; title: string; content: string }) => (
              <Card key={brief._id} className="cursor-pointer hover:bg-white/[0.02] transition-colors">
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{brief.title}</div>
                      <div className="text-xs text-muted-foreground">{brief.date}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {brief.content.length} chars
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No past briefs yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
