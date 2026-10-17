import { Activity, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealth } from "@/features/health/hooks/useHealth";
import { cn } from "@/lib/utils";

const statusStyles = {
  loading: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  error: "bg-destructive/15 text-destructive",
} as const;

const statusLabels = {
  loading: "Checking…",
  success: "Healthy",
  error: "Unreachable",
} as const;

export function HealthStatus() {
  const { status, data, error, refresh } = useHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          Backend health
        </CardTitle>
        <CardDescription>
          Live status from <code className="font-mono">GET /api/v1/health</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusStyles[status],
            )}
          >
            {statusLabels[status]}
          </span>
          <Button variant="outline" size="sm" onClick={refresh} disabled={status === "loading"}>
            <RefreshCw className={cn("size-3.5", status === "loading" && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {data ? (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Status" value={data.status} />
            <Stat label="Uptime" value={`${Math.floor(data.uptime)}s`} />
            <Stat label="Version" value={data.version} />
            <Stat label="Env" value={data.environment} />
          </dl>
        ) : null}

        {status === "error" ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
