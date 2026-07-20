import { auth } from "@/auth";
import type { WeekOneNutritionPlan } from "@/lib/nutrition/generator";
import { prisma } from "@/lib/prisma";
import { getRecoveryAnalysis } from "@/lib/actions/checkin";
import {
  getCompletedWorkoutDays,
  getCurrentStreak,
  getTotalExerciseCount,
  getWorkoutCalories,
  parseWorkoutPlan,
  percent,
} from "@/lib/workout/analytics";
import Link from "next/link";
import {
  Activity,
  Flame,
  Dumbbell,
  Target,
  TrendingUp,
  Salad,
  Clock,
  Zap,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
    select: { id: true, name: true, createdAt: true },
  });

  const workoutPlan = user
    ? await prisma.workoutPlan.findFirst({
      where: { userId: user.id },
      orderBy: [{ weekNumber: "desc" }, { createdAt: "desc" }],
    })
    : null;
  const [completedProgress, recoveryResult, nutritionPlan] = await Promise.all([
    workoutPlan && user
      ? prisma.workoutProgress.findMany({
        where: {
          workoutPlanId: workoutPlan.id,
          userId: user.id,
          completed: true,
        },
        select: {
          id: true,
          day: true,
          exerciseName: true,
          completedAt: true,
        },
        orderBy: { completedAt: "desc" },
      })
      : [],
    user ? getRecoveryAnalysis() : null,
    user ? prisma.nutritionPlan.findFirst({
      where: { userId: user.id },
      orderBy: [{ weekNumber: "desc" }, { createdAt: "desc" }],
    }) : null,
  ]);
  const recovery = recoveryResult?.data ?? null;

  const parsedNutritionPlan = nutritionPlan ? (JSON.parse(nutritionPlan.planJson) as WeekOneNutritionPlan) : null;
  const proteinTarget = parsedNutritionPlan?.proteinGoal ?? 1;
  const proteinConsumed = parsedNutritionPlan 
    ? parsedNutritionPlan.meals.reduce((total, meal) => total + meal.protein, 0)
    : 0;
  const proteinPct = percent(proteinConsumed, proteinTarget);

  const parsedPlan = workoutPlan ? parseWorkoutPlan(workoutPlan.planJson) : null;
  const completedDays = getCompletedWorkoutDays(parsedPlan, completedProgress);
  const workoutTarget = parsedPlan?.workoutDaysPerWeek ?? 5;
  const workoutsCompleted = completedDays.length;
  const caloriesBurned = getWorkoutCalories(parsedPlan, completedProgress);
  const workoutProgressPercent = percent(workoutsCompleted, workoutTarget);
  const currentStreak = getCurrentStreak(completedProgress);
  const latestCompleted = completedProgress
    .filter((item) => item.completedAt)
    .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
    .slice(0, 4);

  const firstName = user?.name?.split(" ")[0] ?? session?.user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  let aiCoachMessage = "Complete today's check-in to unlock adaptive coaching.";
  if (workoutsCompleted >= workoutTarget && workoutTarget > 0) {
    aiCoachMessage = "Excellent work! You've completed all planned workouts this week. Focus on hydration and recovery.";
  } else if (recovery?.hasCheckIn) {
    if (recovery.trainingReadiness === "Poor") {
      aiCoachMessage = "Recovery looks low today. Consider a lighter workout or active recovery.";
    } else if (recovery.trainingReadiness === "Excellent" || recovery.trainingReadiness === "Good") {
      aiCoachMessage = "You're primed and ready! It's a great day to push your limits.";
    } else {
      aiCoachMessage = "Recovery looks moderate today. Listen to your body during your workout.";
    }
  } else if (currentStreak >= 3) {
    aiCoachMessage = `You're on a ${currentStreak}-day streak! Keep the momentum going.`;
  }

  const stats = [
    {
      id: "calories",
      label: "Calories burned",
      value: caloriesBurned.toLocaleString(),
      change: caloriesBurned > 0 ? "Live" : "0",
      positive: caloriesBurned > 0,
      icon: Flame,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "workouts",
      label: "Workouts this week",
      value: `${workoutsCompleted}`,
      change: `${workoutsCompleted}/${workoutTarget}`,
      positive: workoutsCompleted > 0,
      icon: Dumbbell,
      color: "from-violet-500 to-purple-600",
    },
    {
      id: "nutrition",
      label: "Protein goal",
      value: parsedNutritionPlan ? `${proteinConsumed}g / ${proteinTarget}g` : "Not Logged",
      change: parsedNutritionPlan ? `${proteinPct}%` : "0%",
      positive: proteinPct >= 80,
      icon: Salad,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "streak",
      label: "Day streak",
      value: `${currentStreak}`,
      change: currentStreak > 0 ? "+1" : "0",
      positive: currentStreak > 0,
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const recentActivity =
    latestCompleted.length > 0
      ? latestCompleted.map((item) => ({
        id: item.id,
        title: item.exerciseName,
        subtitle: `${item.day} workout exercise completed`,
        time: item.completedAt
          ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(item.completedAt)
          : "Recently",
        icon: Dumbbell,
      }))
      : [
        {
          id: "empty-workout",
          title: "No workout completed yet",
          subtitle: parsedPlan
            ? "Start a session to see activity here"
            : "Create Week 1 from your profile",
          time: "Today",
          icon: parsedPlan ? Activity : Target,
        },
      ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your fitness journey today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ id, label, value, change, positive, icon: Icon, color }) => (
          <div
            key={id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`}
            />
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
                  }`}
              >
                {change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-bg shadow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Today&apos;s AI Coach</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {aiCoachMessage}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/check-in"
            className="inline-flex items-center justify-center gap-2 rounded-xl gradient-bg px-4 py-2 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            Check in
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Recovery Score", value: recovery?.hasCheckIn ? `${recovery.recoveryScore}%` : "Pending" },
            { label: "Fatigue Level", value: recovery?.hasCheckIn ? recovery.fatigueLevel : "Pending" },
            { label: "Readiness", value: recovery?.hasCheckIn ? recovery.trainingReadiness : "Pending" },
            { label: "Recovery Badge", value: recovery?.hasCheckIn ? recovery.recoveryBadge : "Check-in Required" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-medium text-muted-foreground">Adaptive Recommendation</p>
          <p className="mt-1 text-sm font-semibold">
            {recovery?.hasCheckIn 
              ? recovery.adaptiveWorkoutAdjustment 
              : "Complete today's check-in to receive personalized recovery guidance."}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <span className="text-xs text-muted-foreground">Live workout progress</span>
          </div>
          <div className="space-y-3">
            {recentActivity.map(({ id, title, subtitle, time, icon: Icon }) => (
              <div
                key={id}
                className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-bg shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Weekly Goals</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {[
              { label: "Workouts", current: workoutsCompleted, target: workoutTarget, unit: "workouts", color: "from-violet-500 to-purple-600" },
              { label: "Exercises", current: completedProgress.length, target: getTotalExerciseCount(parsedPlan) || 1, unit: "exercises", color: "from-blue-500 to-cyan-500" },
              { label: "Calories", current: caloriesBurned, target: Math.max(workoutTarget * 180, 1), unit: "kcal", color: "from-orange-500 to-red-500" },
              { label: "Protein", current: proteinConsumed, target: proteinTarget, unit: "g", color: "from-emerald-500 to-teal-500" },
            ].map(({ label, current, target, unit, color }) => {
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{current} / {target} {unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl gradient-bg p-4 text-white">
            <p className="text-xs font-medium opacity-80">AI Insight</p>
            <p className="mt-1 text-sm font-semibold">
              {workoutProgressPercent >= 80
                ? "Strong week. Keep recovery and hydration steady."
                : "Start or continue today's workout to move your weekly progress forward."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
