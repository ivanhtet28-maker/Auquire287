import { BarChart3, Loader2, Play } from "lucide-react";
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
import { toast } from "sonner";

export function ListerPage() {
  const [carsalesUrl, setCarsalesUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = async () => {
    if (!carsalesUrl) {
      toast.error("Please enter a Carsales dealer page URL");
      return;
    }
    setIsRunning(true);
    toast.info("Lister is auditing your inventory...");
    // TODO: wire up the Lister action
    setTimeout(() => {
      setIsRunning(false);
      toast.success("Audit complete!");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
          <BarChart3 className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lister</h1>
          <p className="text-sm text-muted-foreground">
            Inventory audit agent — reprice, refresh, or hold
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Inventory Audit</CardTitle>
          <CardDescription>
            Enter your Carsales dealer page URL. Lister will audit every listing
            against live market comps and recommend actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carsales-url">Carsales Dealer Page URL</Label>
            <Input
              id="carsales-url"
              placeholder="https://www.carsales.com.au/dealer/your-dealer-name/"
              value={carsalesUrl}
              onChange={(e) => setCarsalesUrl(e.target.value)}
              className="bg-background"
            />
          </div>
          <Button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Run Audit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="size-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No audits run yet. Enter your Carsales URL above and hit "Run Audit."
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Weekly automatic audit runs every Monday at 7:00am AEST.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
