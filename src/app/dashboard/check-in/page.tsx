import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DailyCheckInForm } from "@/components/dashboard/daily-check-in-form";
import { RecoveryDashboard } from "@/components/dashboard/recovery-dashboard";
import { getLatestCheckIn, getRecoveryAnalysis } from "@/lib/actions/checkin";

export const metadata: Metadata = { title: "Daily Check-in" };
export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [latestResult, recoveryResult] = await Promise.all([
    getLatestCheckIn(),
    getRecoveryAnalysis(),
  ]);

  if (latestResult.error || recoveryResult.error || !recoveryResult.data) {
    return (
      <div className="max-w-3xl rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {latestResult.error ?? recoveryResult.error ?? "We could not load your check-in dashboard right now."}
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Check-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log recovery signals so FitCoach AI can adapt today&apos;s training guidance.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Recovery badge</span>
          <span className="ml-2 font-bold gradient-text">{recoveryResult.data.recoveryBadge}</span>
        </div>
      </div>

      {!recoveryResult.data.hasCheckIn && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
          Complete today&apos;s check-in to generate your adaptive workout recommendation.
        </div>
      )}

      <DailyCheckInForm latestCheckIn={latestResult.data ?? null} />
      <RecoveryDashboard analysis={recoveryResult.data} />
    </div>
  );
}
