import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GenerateNutritionForm } from "@/components/dashboard/generate-nutrition-form";
import { NutritionTracker } from "@/components/dashboard/nutrition-tracker";
import type { WeekOneNutritionPlan } from "@/lib/nutrition/generator";

export const metadata: Metadata = { title: "Nutrition" };

function parseNutritionPlan(planJson: string): WeekOneNutritionPlan | null {
  try {
    const plan = JSON.parse(planJson) as WeekOneNutritionPlan;

    if (!Array.isArray(plan.meals)) {
      return null;
    }

    return plan;
  } catch {
    return null;
  }
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = startOfDay(new Date());

  const [nutritionPlan, nutritionLog, profile] = await Promise.all([
    prisma.nutritionPlan.findUnique({
      where: {
        userId_weekNumber: {
          userId: session.user.id,
          weekNumber: 1,
        },
      },
    }),
    prisma.nutritionLog.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    }),
    prisma.fitnessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    }),
  ]);

  const parsedPlan = nutritionPlan ? parseNutritionPlan(nutritionPlan.planJson) : null;

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily meal planning, macro targets, and hydration tracking
        </p>
      </div>

      {parsedPlan ? (
        <NutritionTracker
          plan={parsedPlan}
          initialWaterIntakeMl={nutritionLog?.waterIntakeMl ?? 0}
          dateIso={today.toISOString()}
        />
      ) : (
        <div className="space-y-4">
          {nutritionPlan && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              We found your nutrition plan, but could not read it. Please contact support before
              generating a new one.
            </div>
          )}
          {!profile && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-500">
              Complete onboarding before generating your Week 1 nutrition plan.
            </div>
          )}
          {!nutritionPlan && <GenerateNutritionForm />}
        </div>
      )}
    </div>
  );
}
