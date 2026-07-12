import type { Metadata } from "next";
import { Dumbbell, Play, Calendar, Zap, TrendingUp, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Workouts" };

const workoutPlan = [
  {
    id: "1",
    day: "Monday",
    type: "Upper Body",
    exercises: 6,
    duration: "45 min",
    difficulty: "Moderate",
    status: "completed",
  },
  {
    id: "2",
    day: "Wednesday",
    type: "Lower Body",
    exercises: 5,
    duration: "50 min",
    difficulty: "Hard",
    status: "upcoming",
  },
  {
    id: "3",
    day: "Friday",
    type: "Full Body HIIT",
    exercises: 8,
    duration: "35 min",
    difficulty: "Hard",
    status: "upcoming",
  },
  {
    id: "4",
    day: "Saturday",
    type: "Active Recovery",
    exercises: 4,
    duration: "30 min",
    difficulty: "Easy",
    status: "upcoming",
  },
];

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-500",
  Moderate: "bg-yellow-500/10 text-yellow-500",
  Hard: "bg-red-500/10 text-red-500",
};

export default function WorkoutPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your AI-generated weekly training plan
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl gradient-bg px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity">
          <Zap className="h-4 w-4" />
          Generate new plan
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "This week", value: "4 sessions", icon: Calendar },
          { label: "Total time", value: "2h 40m", icon: Clock },
          { label: "Est. burn", value: "1,240 kcal", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow">
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Workout plan */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">This Week&apos;s Plan</h2>
        </div>
        <div className="divide-y divide-border">
          {workoutPlan.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-bg shadow-md">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{w.type}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[w.difficulty]}`}
                  >
                    {w.difficulty}
                  </span>
                  {w.status === "completed" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                      ✓ Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {w.day} · {w.exercises} exercises · {w.duration}
                </p>
              </div>
              {w.status === "upcoming" && (
                <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors shrink-0">
                  <Play className="h-3 w-3" />
                  Start
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
