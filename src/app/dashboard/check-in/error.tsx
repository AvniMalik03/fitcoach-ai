"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function CheckInError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-3xl rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-destructive">Daily check-in failed to load</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {error.message || "Refresh this view to try loading your recovery dashboard again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex items-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
