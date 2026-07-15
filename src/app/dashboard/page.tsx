import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { WeekOneWorkoutPlan } from "@/lib/workout/generator";
import {
  Activity,
  Flame,
  Dumbbell,
  Target,
  TrendingUp,
  Salad,
  Clock,
  Zap,
} from "lucide-react";

function parseWorkoutPlan(planJson: string): WeekOneWorkoutPlan | null {
  try {
    const plan = JSON.parse(planJson) as WeekOneWorkoutPlan;
    return Array.isArray(plan.days) ? plan : null;
  } catch {
    return null;
  }
}

function progressKey(day: string, exerciseName: string) {
  return `${day}::${exerciseName}`;
}

function estimateCalories(difficulty: string, sets: number, reps: string) {
  const difficultyBonus = difficulty === "Hard" ? 8 : difficulty === "Moderate" ? 5 : 3;
  return sets * difficultyBonus + (reps.includes("sec") ? 8 : 5);
}

type DashboardProgressItem = {
  id: string;
  day: string;
  exerciseName: string;
  completedAt: Date | null;
};

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

  const parsedPlan = workoutPlan ? parseWorkoutPlan(workoutPlan.planJson) : null;
  const completedProgress: DashboardProgressItem[] = [];

  const completedExerciseKeys = new Set<string>();
  const completedDays =
    parsedPlan?.days.filter((day) =>
      day.exercises.every((exercise) =>
        completedExerciseKeys.has(progressKey(day.day, exercise.name))
      )
    ) ?? [];
  const workoutTarget = parsedPlan?.workoutDaysPerWeek ?? 5;
  const workoutsCompleted = completedDays.length;
  const caloriesBurned =
    parsedPlan?.days.reduce((total, day) => {
      return (
        total +
        day.exercises.reduce((dayTotal, exercise) => {
          if (!completedExerciseKeys.has(progressKey(day.day, exercise.name))) return dayTotal;
          return dayTotal + estimateCalories(day.difficulty, exercise.sets, exercise.reps);
        }, 0)
      );
    }, 0) ?? 0;
  const workoutProgressPercent = Math.min(
    100,
    Math.round((workoutsCompleted / Math.max(workoutTarget, 1)) * 100)
  );
  const latestCompleted = completedProgress
    .filter((item) => item.completedAt)
    .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
    .slice(0, 4);

  const firstName = user?.name?.split(" ")[0] ?? session?.user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
      value: "87%",
      change: "-5%",
      positive: false,
      icon: Salad,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "streak",
      label: "Day streak",
      value: `${workoutsCompleted}`,
      change: workoutsCompleted > 0 ? "+1" : "0",
      positive: workoutsCompleted > 0,
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
          title: parsedPlan ? "Workout plan ready" : "Generate your first workout",
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
              { label: "Workouts", current: workoutsCompleted, target: workoutTarget, color: "from-violet-500 to-purple-600" },
              { label: "Exercises", current: completedProgress.length, target: parsedPlan?.days.reduce((total, day) => total + day.exercises.length, 0) ?? 1, color: "from-blue-500 to-cyan-500" },
              { label: "Calories", current: caloriesBurned, target: Math.max(workoutTarget * 180, 1), color: "from-orange-500 to-red-500" },
              { label: "Protein (g)", current: 380, target: 490, color: "from-emerald-500 to-teal-500" },
            ].map(({ label, current, target, color }) => {
              const pct = Math.min(100, Math.round((current / target) * 100));
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{pct}%</span>
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
