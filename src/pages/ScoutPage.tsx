import { Search, TrendingUp, Loader2, Play } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const AUS_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

export function ScoutPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [state, setState] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunScout = async () => {
    if (!make || !model) {
      toast.error("Please enter a make and model");
      return;
    }
    setIsRunning(true);
    toast.info(`Scout is analysing the ${make} ${model} market...`);
    setTimeout(() => {
      setIsRunning(false);
      toast.success("Market snapshot ready!");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
          <Search className="size-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scout</h1>
          <p className="text-sm text-muted-foreground">
            Market intelligence agent — price data for any vehicle
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Market Snapshot</CardTitle>
          <CardDescription>
            Enter a make, model, and optional state. Scout will find active listings
            and build a price distribution with trend analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Make</Label>
              <Input
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                placeholder="e.g. Hilux"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {AUS_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleRunScout}
            disabled={isRunning}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isRunning ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Generate Snapshot
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="size-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No market snapshots yet. Enter a vehicle above to get started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
