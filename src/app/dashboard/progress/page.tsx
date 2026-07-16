import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/dashboard/progress-dashboard";
import { getProgressAnalytics } from "@/lib/actions/progress";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const result = await getProgressAnalytics();

  if (result.error || !result.data) {
    return (
      <div className="max-w-3xl rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {result.error ?? "We could not load progress analytics right now."}
      </div>
    );
  }

  return <ProgressDashboard analytics={result.data} />;
}
