"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard page error:", error);
  }, [error]);

  return (
    <div className="flex h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border/60 bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">Dashboard error</h2>
        <p className="text-sm text-muted-foreground">
          We could not load this dashboard section.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Retry</Button>
          <Button
            variant="outline"
            onClick={() => window.location.assign("/dashboard")}
          >
            Reload Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
