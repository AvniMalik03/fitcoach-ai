import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GenerateWorkoutForm } from "@/components/dashboard/generate-workout-form";
import { WorkoutTracker } from "@/components/dashboard/workout-tracker";
import type { WeekOneWorkoutPlan } from "@/lib/workout/generator";
import type { SerializedWorkoutProgress } from "@/lib/actions/workout-progress";

export const metadata: Metadata = { title: "Workouts" };

function parseWorkoutPlan(planJson: string): WeekOneWorkoutPlan | null {
  try {
    const plan = JSON.parse(planJson) as WeekOneWorkoutPlan;

    if (!Array.isArray(plan.days)) {
      return null;
    }

    return plan;
  } catch {
    return null;
  }
}

export default async function WorkoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [workoutPlan, profile] = await Promise.all([
    prisma.workoutPlan.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: 1,
        },
      },
    }),
    prisma.fitnessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  ]);

  const parsedPlan = workoutPlan ? parseWorkoutPlan(workoutPlan.planJson) : null;
  const progress: SerializedWorkoutProgress[] =
    workoutPlan && parsedPlan
      ? (
          await prisma.workoutProgress.findMany({
            where: {
              workoutPlanId: workoutPlan.id,
              userId: session.user.id,
            },
            orderBy: [{ day: "asc" }, { createdAt: "asc" }],
          })
        ).map((item) => ({
          ...item,
          completedAt: item.completedAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }))
      : [];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personalized weekly training plan
        </p>
      </div>

      {parsedPlan ? (
        <WorkoutTracker
          plan={parsedPlan}
          workoutPlanId={workoutPlan!.id}
          initialProgress={progress}
        />
      ) : (
        <div className="space-y-4">
          {workoutPlan && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              We found your workout plan, but could not read it. Please contact support before
              generating a new one.
            </div>
          )}
          {!profile && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
              Complete onboarding before generating your Week 1 workout plan.
            </div>
          )}
          {!workoutPlan && <GenerateWorkoutForm />}
        </div>
      )}
    </div>
  );
}
